import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getProjects, getEarnings, getUserAllocationHistory, getUserProfile,
} from "@/services/api";
import { getStoredUser, logout, StoredUser } from "@/services/auth";

const G = "#059669";

export default function FreelancerPortal() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [user,        setUser]        = useState<StoredUser | null>(null);
  const [projects,    setProjects]    = useState<any[]>([]);
  const [earnings,    setEarnings]    = useState(0);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [menuOpen,    setMenuOpen]    = useState(false);

  useEffect(() => {
    getStoredUser().then(async (u) => {
      setUser(u);
      if (!u) { router.replace("/login_1"); return; }
      try {
        const [projs, earn, allocs, freshProfile] = await Promise.all([
          getProjects(),
          getEarnings(u.user_id),
          getUserAllocationHistory(u.user_id),
          getUserProfile(u.user_id),
        ]);
        setProjects(projs  || []);
        setEarnings(earn?.earnings || 0);
        setAllocations(allocs || []);
        // Merge fresh profile so KYC status is always live
        if (freshProfile) setUser((prev) => ({ ...prev!, ...freshProfile }));
      } catch {}
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <View style={s.centered}><ActivityIndicator color={G} size="large" /></View>
  );

  const userDoc = user as any;

  const isOnboardingComplete = !!userDoc?.onboarding_complete;
  const missingFields: string[] = [];
  if (!userDoc?.occupation)     missingFields.push("job title");
  if (!userDoc?.country)        missingFields.push("location");
  if (!userDoc?.skills?.length) missingFields.push("skills");

  const profileFields = [
    !!userDoc?.occupation,
    !!userDoc?.country,
    !!userDoc?.skills?.length,
    !!userDoc?.bio,
    !!userDoc?.experience_years,
    !!userDoc?.portfolio,
  ];
  const completionPct = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  const openProjects = projects.filter(p => p.status === "active" || p.status === "open");
  const myApprovals  = allocations.filter(a => a.decision === "approve");

  const stats = [
    { val: `₹${earnings.toLocaleString()}`, lbl: "Total Earnings",  change: earnings > 0 ? "From approved projects" : "No earnings yet", color: "#8b5cf6", bg: "#ede9fe" },
    { val: openProjects.length.toString(),  lbl: "Open Projects",   change: "Available now",                                              color: G,         bg: "#d1fae5" },
    { val: userDoc?.rating != null ? userDoc.rating.toFixed(1) : "–", lbl: "Average Rating", change: userDoc?.reviews ? `${userDoc.reviews} reviews` : "No reviews yet", color: "#f59e0b", bg: "#fef3c7" },
    {
      val:    myApprovals.length > 0 ? myApprovals.length.toString() : (userDoc?.projects ?? "0").toString(),
      lbl:    "Projects Done",
      change: myApprovals.length > 0 ? `${myApprovals.length} approved` : "Complete projects to earn",
      color:  "#3b82f6", bg: "#dbeafe",
    },
  ];

  const kycStatus = userDoc?.kyc_status ?? "pending";
  const kycDone   = kycStatus === "verified";
  const kycLabel  = kycStatus === "verified" ? "✓ Verified"
                  : kycStatus === "rejected"  ? "Rejected" : "Pending";

  const profileItems = [
    { label: "Profile Complete", status: `${completionPct}%`,                              done: completionPct === 100 },
    { label: "KYC Verified",     status: kycLabel,                                          done: kycDone },
    { label: "Top Rated",        status: userDoc?.rating >= 4.5 ? "Elite" : "Building",    done: userDoc?.rating >= 4.5 },
  ];

  const recentAllocations = allocations.slice(0, 4);

  const tasks = [
    { title: kycDone ? "KYC Complete ✓" : "Complete profile KYC", project: "EcoConnect", date: kycDone ? "Done" : "Due today" },
    { title: "Browse open projects", project: "Platform", date: "Anytime" },
    { title: "Submit availability",  project: "Profile",  date: "This week" },
  ];

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>

      {/* ── Nav ── */}
      <View style={s.nav}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={isMobile ? s.logoImgMobile : s.logoImg}
          resizeMode="cover"
        />
        {isMobile ? (
          <TouchableOpacity onPress={() => setMenuOpen(o => !o)} style={s.hamburger}>
            <Text style={s.hamburgerIcon}>{menuOpen ? "✕" : "☰"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.logoutBtn}
            onPress={async () => { await logout(); router.replace("/(tabs)/"); }}
          >
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <View style={s.mobileMenu}>
          <TouchableOpacity style={s.mobileMenuItem} onPress={() => { setMenuOpen(false); router.push("/(tabs)/projects"); }}>
            <Text style={s.mobileMenuText}>Browse Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.mobileMenuItem} onPress={() => { setMenuOpen(false); router.push("/(tabs)/courses"); }}>
            <Text style={s.mobileMenuText}>Courses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.mobileMenuItem} onPress={() => { setMenuOpen(false); router.push("/(tabs)/profile"); }}>
            <Text style={s.mobileMenuText}>My Profile</Text>
          </TouchableOpacity>
          {!isOnboardingComplete && (
            <TouchableOpacity style={s.mobileMenuItem} onPress={() => { setMenuOpen(false); router.push("/champion-onboarding" as any); }}>
              <Text style={[s.mobileMenuText, { color: G }]}>Complete Onboarding →</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.mobileMenuItem, s.mobileMenuDanger]} onPress={async () => { setMenuOpen(false); await logout(); router.replace("/(tabs)/"); }}>
            <Text style={s.mobileMenuDangerText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[s.body, isMobile && s.bodyMobile]}>
        <Text style={[s.pageTitle, isMobile && s.pageTitleMobile]}>
          Welcome back, {user?.name.split(" ")[0]}!
        </Text>
        <Text style={s.pageSub}>Here's an overview of your sustainability work</Text>

        {/* ── Onboarding banner ── */}
        {!isOnboardingComplete && (
          <TouchableOpacity
            style={s.onboardingBanner}
            onPress={() => router.push("/champion-onboarding" as any)}
            activeOpacity={0.85}
          >
            <View style={s.bannerProgressTrack}>
              <View style={[s.bannerProgressFill, { width: `${completionPct}%` as any }]} />
            </View>
            <View style={s.bannerRow}>
              <View style={s.bannerIconWrap}>
                <Text style={{ fontSize: 24 }}>📋</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.bannerTitle}>Complete your profile</Text>
                <Text style={s.bannerSub}>
                  {missingFields.length > 0
                    ? `Missing: ${missingFields.join(", ")}. Complete your profile to appear in AI matching.`
                    : "Submit your KYC documents to get verified and matched to projects."}
                </Text>
                <View style={s.bannerMeta}>
                  <View style={s.bannerPctBadge}>
                    <Text style={s.bannerPctText}>{completionPct}% complete</Text>
                  </View>
                  <Text style={s.bannerCta}>Complete now →</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* KYC verified banner */}
        {kycDone && (
          <View style={s.kycVerifiedBanner}>
            <Text style={s.kycPendingIcon}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.kycVerifiedTitle}>KYC Verified</Text>
              <Text style={s.kycVerifiedSub}>
                Your profile is verified and visible to clients in AI matching.
              </Text>
            </View>
          </View>
        )}

        {/* KYC pending */}
        {isOnboardingComplete && !kycDone && kycStatus !== "rejected" && (
          <View style={s.kycPendingBanner}>
            <Text style={s.kycPendingIcon}>⏳</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.kycPendingTitle}>KYC Verification Pending</Text>
              <Text style={s.kycPendingSub}>
                Your profile is under review. Usually 1–2 business days.
              </Text>
            </View>
          </View>
        )}

        {/* KYC rejected */}
        {kycStatus === "rejected" && (
          <TouchableOpacity
            style={s.kycRejectedBanner}
            onPress={() => router.push("/champion-onboarding" as any)}
            activeOpacity={0.85}
          >
            <Text style={s.kycPendingIcon}>❌</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.kycPendingTitle, { color: "#991b1b" }]}>KYC Rejected</Text>
              <Text style={[s.kycPendingSub, { color: "#b91c1c" }]}>
                Tap to resubmit with correct documents.
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: "#dc2626" }}>→</Text>
          </TouchableOpacity>
        )}

        {/* ── Stats ── */}
        <View style={[s.statsGrid, isMobile && s.statsGridMobile]}>
          {stats.map((st, i) => (
            <View key={i} style={[s.statCard, isMobile && s.statCardMobile]}>
              <View style={[s.statIconBox, { backgroundColor: st.bg }]}>
                <View style={[s.statDot, { backgroundColor: st.color }]} />
              </View>
              <Text style={[s.statVal, isMobile && s.statValMobile]}>{st.val}</Text>
              <Text style={s.statLbl}>{st.lbl}</Text>
              <Text style={[s.statChange, { color: st.color }]} numberOfLines={2}>
                {st.change}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.mainCol}>

          {/* ── Allocations ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardHeaderTitle}>My Allocations</Text>
              <TouchableOpacity style={s.outlineBtn} onPress={() => router.push("/(tabs)/projects")}>
                <Text style={s.outlineBtnText}>Browse Projects</Text>
              </TouchableOpacity>
            </View>
            {recentAllocations.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>No allocations yet</Text>
                <Text style={s.emptySubText}>
                  Once an admin assigns you to a project, it will appear here.
                </Text>
                <TouchableOpacity style={s.primaryBtn} onPress={() => router.push("/(tabs)/projects")}>
                  <Text style={s.primaryBtnText}>Browse Open Projects</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentAllocations.map((alloc, i) => {
                const approved = alloc.decision === "approve";
                return (
                  <View key={i} style={s.appItem}>
                    <View style={s.appTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.appTitle}>{alloc.project_title}</Text>
                        <Text style={s.appCompany}>
                          {new Date(alloc.decided_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </Text>
                      </View>
                      <View style={[s.pendingBadge, { backgroundColor: approved ? "#d1fae5" : "#fef3c7" }]}>
                        <Text style={[s.pendingBadgeText, { color: approved ? "#065f46" : "#92400e" }]}>
                          {approved ? "✓ Approved" : "Reshortlisted"}
                        </Text>
                      </View>
                    </View>
                    {alloc.notes && (
                      <Text style={s.allocNotes}>"{alloc.notes}"</Text>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* ── Profile status ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Profile Status</Text>
            <View style={s.statusList}>
              {profileItems.map((item, i) => (
                <View key={i} style={s.statusRow}>
                  <View style={s.statusLeft}>
                    <View style={[s.statusDot, { backgroundColor: item.done ? G : "#f59e0b" }]} />
                    <Text style={s.statusLabel}>{item.label}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: item.done ? "#d1fae5" : "#fef3c7" }]}>
                    <Text style={[s.statusBadgeText, { color: item.done ? "#065f46" : "#92400e" }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              ))}
              {!isOnboardingComplete ? (
                <TouchableOpacity style={[s.primaryBtn, { marginTop: 12 }]} onPress={() => router.push("/champion-onboarding" as any)}>
                  <Text style={s.primaryBtnText}>Complete Profile →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[s.outlineBtn, { marginTop: 12 }]} onPress={() => router.push("/(tabs)/profile")}>
                  <Text style={s.outlineBtnText}>View Public Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Tasks ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Upcoming Tasks</Text>
            {tasks.map((t, i) => (
              <View key={i} style={s.taskItem}>
                <Text style={s.taskTitle}>{t.title}</Text>
                <Text style={s.taskProject}>{t.project}</Text>
                <Text style={s.taskDate}>{t.date}</Text>
              </View>
            ))}
          </View>

          {/* ── Skills ── */}
          {userDoc?.skills?.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Your Skills</Text>
              <View style={s.skillsWrap}>
                {userDoc.skills.map((sk: string, i: number) => (
                  <View key={i} style={s.skillPill}>
                    <Text style={s.skillPillText}>{sk}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Course promo ── */}
          <View style={s.promoCard}>
            <View style={s.promoIconBox} />
            <Text style={s.promoTitle}>Complete a Course</Text>
            <Text style={s.promoSub}>
              Enhance your skills with our sustainability certification programs
            </Text>
            <TouchableOpacity style={s.promoBtn} onPress={() => router.push("/(tabs)/courses")}>
              <Text style={s.promoBtnText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>

          {/* Mobile logout */}
          {isMobile && (
            <TouchableOpacity
              style={s.logoutBtnMobile}
              onPress={async () => { await logout(); router.replace("/(tabs)/"); }}
            >
              <Text style={s.logoutBtnMobileText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page:     { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  nav:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 48, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  logoImg:       { width: 220, height: 50, borderRadius: 4 },
  logoImgMobile: { width: 140, height: 38, borderRadius: 4 },
  logoutBtn:     { borderWidth: 1, borderColor: "#d1d5db", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  logoutText:    { fontSize: 14, color: "#374151", fontWeight: "500" },

  hamburger:     { padding: 8 },
  hamburgerIcon: { fontSize: 22, color: "#111827" },

  mobileMenu:          { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 8 },
  mobileMenuItem:      { paddingHorizontal: 20, paddingVertical: 14 },
  mobileMenuText:      { fontSize: 15, color: "#374151", fontWeight: "500" },
  mobileMenuDanger:    { borderTopWidth: 1, borderTopColor: "#f3f4f6", marginTop: 4 },
  mobileMenuDangerText:{ fontSize: 15, color: "#dc2626", fontWeight: "500" },

  body:            { padding: 20 },
  bodyMobile:      { padding: 16 },
  pageTitle:       { fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 4 },
  pageTitleMobile: { fontSize: 22 },
  pageSub:         { fontSize: 14, color: "#4b5563", marginBottom: 16 },

  onboardingBanner:    { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 14, marginBottom: 16, overflow: "hidden" },
  bannerProgressTrack: { height: 4, backgroundColor: "#fde68a" },
  bannerProgressFill:  { height: 4, backgroundColor: G },
  bannerRow:           { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 16 },
  bannerIconWrap:      { width: 44, height: 44, borderRadius: 12, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  bannerTitle:         { fontSize: 15, fontWeight: "700", color: "#92400e", marginBottom: 4 },
  bannerSub:           { fontSize: 13, color: "#b45309", lineHeight: 19, marginBottom: 8 },
  bannerMeta:          { flexDirection: "row", alignItems: "center", gap: 12 },
  bannerPctBadge:      { backgroundColor: "#fef3c7", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#fde68a" },
  bannerPctText:       { fontSize: 12, color: "#92400e", fontWeight: "600" },
  bannerCta:           { fontSize: 13, color: G, fontWeight: "600" },

  kycVerifiedBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#a7f3d0", borderRadius: 14, padding: 16, marginBottom: 16 },
  kycVerifiedTitle:  { fontSize: 14, fontWeight: "600", color: "#065f46", marginBottom: 3 },
  kycVerifiedSub:    { fontSize: 13, color: "#059669", lineHeight: 19 },
  kycPendingBanner:  { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 14, padding: 16, marginBottom: 16 },
  kycRejectedBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 14, padding: 16, marginBottom: 16 },
  kycPendingIcon:    { fontSize: 22 },
  kycPendingTitle:   { fontSize: 14, fontWeight: "600", color: "#1e40af", marginBottom: 3 },
  kycPendingSub:     { fontSize: 13, color: "#3b82f6", lineHeight: 19 },

  statsGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statsGridMobile: { gap: 10 },
  statCard:        { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 18, borderWidth: 1, borderColor: "#e5e7eb" },
  statCardMobile:  { padding: 14 },
  statIconBox:     { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  statDot:         { width: 16, height: 16, borderRadius: 8 },
  statVal:         { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 3 },
  statValMobile:   { fontSize: 18 },
  statLbl:         { fontSize: 12, color: "#4b5563", marginBottom: 3 },
  statChange:      { fontSize: 11, fontWeight: "500" },

  mainCol:          { gap: 14 },
  card:             { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },
  cardHeader:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  cardHeaderTitle:  { fontSize: 17, fontWeight: "600", color: "#111827" },
  cardTitle:        { fontSize: 17, fontWeight: "600", color: "#111827", paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  emptyBox:         { padding: 28, alignItems: "center", gap: 10 },
  emptyText:        { fontSize: 15, fontWeight: "600", color: "#111827" },
  emptySubText:     { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 20 },

  appItem:          { padding: 18, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  appTop:           { flexDirection: "row", alignItems: "flex-start", marginBottom: 6, gap: 10 },
  appTitle:         { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 3 },
  appCompany:       { fontSize: 12, color: "#6b7280" },
  pendingBadge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexShrink: 0 },
  pendingBadgeText: { fontSize: 11, fontWeight: "600" },
  allocNotes:       { fontSize: 13, color: "#6b7280", fontStyle: "italic", marginTop: 6, paddingLeft: 4, borderLeftWidth: 2, borderLeftColor: "#e5e7eb" },

  statusList:      { paddingHorizontal: 18, paddingBottom: 18 },
  statusRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  statusLeft:      { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot:       { width: 10, height: 10, borderRadius: 5 },
  statusLabel:     { fontSize: 13, color: "#374151" },
  statusBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: "600" },

  taskItem:    { padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  taskTitle:   { fontSize: 13, fontWeight: "500", color: "#111827", marginBottom: 2 },
  taskProject: { fontSize: 12, color: "#4b5563", marginBottom: 4 },
  taskDate:    { fontSize: 11, color: "#9ca3af" },

  skillsWrap:    { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 18, paddingBottom: 18 },
  skillPill:     { backgroundColor: "#d1fae5", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "#a7f3d0" },
  skillPillText: { fontSize: 12, color: "#065f46", fontWeight: "500" },

  promoCard:    { backgroundColor: G, borderRadius: 14, padding: 22 },
  promoIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 12 },
  promoTitle:   { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 6 },
  promoSub:     { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 19, marginBottom: 16 },
  promoBtn:     { backgroundColor: "#fff", padding: 10, borderRadius: 8, alignItems: "center" },
  promoBtnText: { color: G, fontWeight: "600", fontSize: 14 },

  primaryBtn:    { backgroundColor: G, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 8, marginTop: 4, alignItems: "center" },
  primaryBtnText:{ color: "#fff", fontWeight: "600", fontSize: 14 },
  outlineBtn:    { borderWidth: 1, borderColor: "#d1d5db", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  outlineBtnText:{ color: "#374151", fontSize: 13, fontWeight: "500" },

  logoutBtnMobile:     { marginTop: 4, borderWidth: 1, borderColor: "#d1d5db", padding: 14, borderRadius: 10, alignItems: "center" },
  logoutBtnMobileText: { fontSize: 15, color: "#374151", fontWeight: "500" },

  sideCol: { gap: 0 },
});
