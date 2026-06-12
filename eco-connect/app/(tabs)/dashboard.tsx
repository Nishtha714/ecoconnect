import { useState, useCallback, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl, Image, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getDashboard, getProjects, getFreelancers,
  getAllocations, suggestUsers, adminDecision, verifyKYC,
} from "@/services/api";
import { useGuard, logout } from "@/services/auth";

const G = "#059669";
type Tab = "approvals" | "kyc" | "projects";

export default function Dashboard() {
  const router   = useRouter();
  const { ready } = useGuard("admin");

  const [tab,         setTab]         = useState<Tab>("approvals");
  const [stats,       setStats]       = useState<any>(null);
  const [projects,    setProjects]    = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // Per-project suggested candidates { project_id: Champion[] }
  const [suggestions,  setSuggestions]  = useState<Record<string, any[]>>({});
  const [suggesting,   setSuggesting]   = useState<Record<string, boolean>>({});
  // Decision loading state per project
  const [decisions,    setDecisions]    = useState<Record<string, string>>({});
  // KYC loading per user
  const [kycLoading,   setKycLoading]   = useState<Record<string, boolean>>({});

  const loadAll = useCallback(async () => {
    try {
      const [dash, projs, users] = await Promise.all([
        getDashboard(),
        getProjects(),
        getFreelancers(),
      ]);
      setStats(dash);
      setProjects(projs   || []);
      setFreelancers(users || []);
    } catch (e) {
      console.log("DASHBOARD ERROR:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (ready) loadAll(); }, [ready]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(tabs)/");
  };

  // ── Suggest candidates for a project ─────────────────────────────────────
  const handleSuggest = async (project: any) => {
    setSuggesting((s) => ({ ...s, [project.project_id]: true }));
    try {
      const skills = project.required_skills ?? project.skills ?? [];
      const results = await suggestUsers(skills);
      setSuggestions((s) => ({ ...s, [project.project_id]: results }));
    } catch {
      Alert.alert("Error", "Could not fetch suggestions. Try again.");
    } finally {
      setSuggesting((s) => ({ ...s, [project.project_id]: false }));
    }
  };

  // ── Approve or reshortlist a candidate ───────────────────────────────────
  const handleDecision = async (
    projectId: string,
    userId: string,
    decision: "approve" | "reshortlist",
  ) => {
    const key = `${projectId}-${userId}`;
    setDecisions((d) => ({ ...d, [key]: "loading" }));
    try {
      const res = await adminDecision(projectId, userId, decision);
      setDecisions((d) => ({ ...d, [key]: decision }));
      Alert.alert(
        decision === "approve" ? "✅ Approved" : "🔄 Reshortlisted",
        res.message,
      );
      // Remove from suggestions list after decision
      setSuggestions((s) => ({
        ...s,
        [projectId]: (s[projectId] ?? []).filter((u) => u.user_id !== userId),
      }));
      // Refresh stats
      setTimeout(loadAll, 800);
    } catch (e: any) {
      setDecisions((d) => ({ ...d, [key]: "" }));
      Alert.alert("Error", e.message || "Decision failed");
    }
  };

  // ── KYC verify / reject ───────────────────────────────────────────────────
  const handleKYC = async (userId: string, status: "verified" | "rejected") => {
    setKycLoading((k) => ({ ...k, [userId]: true }));
    try {
      await verifyKYC(userId, status);
      Alert.alert(
        status === "verified" ? "✅ KYC Verified" : "❌ KYC Rejected",
        `Champion has been ${status}.`,
      );
      // Update local state so badge reflects change immediately
      setFreelancers((fl) =>
        fl.map((u) => u.user_id === userId ? { ...u, kyc_status: status } : u)
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "KYC update failed");
    } finally {
      setKycLoading((k) => ({ ...k, [userId]: false }));
    }
  };

  if (!ready) return null;

  const initials = (n: string) =>
    n.split(" ").map((x: string) => x[0]).join("").toUpperCase().slice(0, 2);

  // Real counts from data
  const pendingProjects  = projects.filter(p => p.status === "active" || p.status === "open");
  const pendingKYC       = freelancers.filter(u => u.kyc_status === "pending" || !u.kyc_status);
  const topEarners       = [...freelancers].sort((a, b) => (b.earnings ?? 0) - (a.earnings ?? 0)).slice(0, 3);

  const statCards = [
    {
      label: "Pending Approvals",
      // Real count from projects needing assignment
      value: pendingProjects.length.toString(),
      color: "#f59e0b", bg: "#fef3c7",
    },
    {
      label: "Active Projects",
      value: (stats?.active_projects ?? projects.filter(p => p.status === "active").length).toString(),
      color: G, bg: "#d1fae5",
    },
    {
      label: "KYC Pending",
      value: pendingKYC.length.toString(),
      color: "#3b82f6", bg: "#dbeafe",
    },
    {
      label: "Total Champions",
      value: (stats?.total_champions ?? freelancers.length).toString(),
      color: "#8b5cf6", bg: "#ede9fe",
    },
  ];

  return (
    <ScrollView
      style={s.page}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadAll(); }}
          tintColor={G}
        />
      }
    >
      {/* Nav */}
      <View style={s.nav}>
        <Image source={require("@/assets/images/logo.png")} style={s.logoImg} resizeMode="cover" />
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <Text style={s.pageTitle}>Admin Dashboard</Text>
        <Text style={s.pageSub}>Manage approvals, KYC verifications, and platform operations</Text>

        {/* Stat cards */}
        {loading ? (
          <View style={s.centered}><ActivityIndicator color={G} /></View>
        ) : (
          <View style={s.statsGrid}>
            {statCards.map((st, i) => (
              <View key={i} style={s.statCard}>
                <View style={[s.statIconBox, { backgroundColor: st.bg }]}>
                  <View style={[s.statIconDot, { backgroundColor: st.color }]} />
                </View>
                <Text style={s.statVal}>{st.value}</Text>
                <Text style={s.statLbl}>{st.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Alert banner — real counts */}
        {(pendingProjects.length > 0 || pendingKYC.length > 0) && (
          <View style={s.alertBanner}>
            <View style={s.alertDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>Action Required</Text>
              <Text style={s.alertSub}>
                {pendingProjects.length > 0
                  ? `${pendingProjects.length} project${pendingProjects.length > 1 ? "s" : ""} need champion assignment. `
                  : ""}
                {pendingKYC.length > 0
                  ? `${pendingKYC.length} champion${pendingKYC.length > 1 ? "s" : ""} awaiting KYC verification.`
                  : ""}
              </Text>
            </View>
          </View>
        )}

        {/* Tabbed card */}
        <View style={s.card}>
          {/* Tab bar — real counts */}
          <View style={s.tabBar}>
            {(["approvals", "kyc", "projects"] as Tab[]).map((t) => (
              <TouchableOpacity key={t} style={s.tabBtn} onPress={() => setTab(t)}>
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t === "approvals"
                    ? `Approvals (${pendingProjects.length})`
                    : t === "kyc"
                    ? `KYC (${pendingKYC.length})`
                    : `All Projects`}
                </Text>
                {tab === t && <View style={s.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* ── APPROVALS TAB ──────────────────────────────────────────────── */}
          {tab === "approvals" && (
            loading ? (
              <View style={s.centered}><ActivityIndicator color={G} /></View>
            ) : pendingProjects.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyTitle}>✅ All caught up</Text>
                <Text style={s.emptySub}>No projects pending assignment.</Text>
              </View>
            ) : (
              pendingProjects.map((p, i) => {
                const proj_suggestions = suggestions[p.project_id] ?? [];
                const isSuggesting    = suggesting[p.project_id] ?? false;

                return (
                  <View key={i} style={s.listItem}>
                    {/* Project header */}
                    <View style={s.listItemHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={s.warningBadge}>
                          <Text style={s.warningBadgeText}>Needs Assignment</Text>
                        </View>
                        <Text style={s.listTitle}>{p.title}</Text>
                        <Text style={s.listSub}>
                          ₹{p.budget?.toLocaleString()} · {p.timeline ?? p.duration ?? "—"}
                        </Text>
                      </View>
                    </View>

                    {/* Skills */}
                    {(p.required_skills ?? p.skills ?? []).length > 0 && (
                      <View style={s.skillRow}>
                        {(p.required_skills ?? p.skills).slice(0, 4).map((sk: string, si: number) => (
                          <View key={si} style={s.skillPill}>
                            <Text style={s.skillPillText}>{sk}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Already assigned */}
                    {(p.assigned_users ?? []).length > 0 && (
                      <View style={s.assignedBox}>
                        <Text style={s.assignedLabel}>Currently Assigned:</Text>
                        {p.assigned_users.map((name: string, ai: number) => (
                          <View key={ai} style={s.assignedRow}>
                            <View style={s.assignedAvatar}>
                              <Text style={s.assignedAvatarText}>{initials(name)}</Text>
                            </View>
                            <Text style={s.assignedName}>{name}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Suggested candidates */}
                    {proj_suggestions.length > 0 && (
                      <View style={s.suggestionsBox}>
                        <Text style={s.assignedLabel}>AI Suggested Candidates:</Text>
                        {proj_suggestions.map((candidate, ci) => {
                          const key      = `${p.project_id}-${candidate.user_id}`;
                          const decided  = decisions[key];
                          const isLoading = decided === "loading";
                          return (
                            <View key={ci} style={s.candidateRow}>
                              <View style={s.assignedAvatar}>
                                <Text style={s.assignedAvatarText}>{initials(candidate.name)}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={s.assignedName}>{candidate.name}</Text>
                                <Text style={s.candidateScore}>
                                  Skill score: {candidate.score} · ₹{(candidate.earnings ?? 0).toLocaleString()} earned
                                </Text>
                              </View>
                              {decided && decided !== "loading" ? (
                                <View style={[s.decidedBadge, decided === "approve" ? s.decidedApprove : s.decidedReshortlist]}>
                                  <Text style={s.decidedBadgeText}>
                                    {decided === "approve" ? "✓ Approved" : "↺ Reshortlisted"}
                                  </Text>
                                </View>
                              ) : (
                                <View style={s.candidateActions}>
                                  <TouchableOpacity
                                    style={[s.miniApproveBtn, isLoading && { opacity: 0.6 }]}
                                    disabled={isLoading}
                                    onPress={() => handleDecision(p.project_id, candidate.user_id, "approve")}
                                  >
                                    {isLoading
                                      ? <ActivityIndicator color="#fff" size="small" />
                                      : <Text style={s.miniApproveBtnText}>Approve</Text>
                                    }
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[s.miniRejectBtn, isLoading && { opacity: 0.6 }]}
                                    disabled={isLoading}
                                    onPress={() => handleDecision(p.project_id, candidate.user_id, "reshortlist")}
                                  >
                                    <Text style={s.miniRejectBtnText}>Skip</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Action row */}
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={[s.approveBtn, isSuggesting && { opacity: 0.7 }]}
                        disabled={isSuggesting}
                        onPress={() => handleSuggest(p)}
                      >
                        {isSuggesting
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={s.approveBtnText}>
                              {proj_suggestions.length > 0 ? "🔄 Re-suggest" : "🤖 Suggest Champions"}
                            </Text>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.ghostBtn}
                        onPress={() => router.push(`/allocate?project_id=${p.project_id}` as any)}
                      >
                        <Text style={s.ghostBtnText}>Full View</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )
          )}

          {/* ── KYC TAB ───────────────────────────────────────────────────── */}
          {tab === "kyc" && (
            loading ? (
              <View style={s.centered}><ActivityIndicator color={G} /></View>
            ) : freelancers.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyTitle}>No champions yet</Text>
                <Text style={s.emptySub}>Champions will appear here once they register.</Text>
              </View>
            ) : (
              freelancers.map((u, i) => {
                const kycStatus  = u.kyc_status ?? "pending";
                const isPending  = kycStatus === "pending";
                const isLoading  = kycLoading[u.user_id] ?? false;
                return (
                  <View key={i} style={s.listItem}>
                    <View style={s.listItemHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={s.kycNameRow}>
                          <Text style={s.listTitle}>{u.name}</Text>
                          <View style={[
                            s.infoBadge,
                            kycStatus === "verified" ? s.kycVerifiedBadge :
                            kycStatus === "rejected" ? s.kycRejectedBadge : {},
                          ]}>
                            <Text style={[
                              s.infoBadgeText,
                              kycStatus === "verified" ? { color: "#065f46" } :
                              kycStatus === "rejected" ? { color: "#991b1b" } : {},
                            ]}>
                              {kycStatus === "verified" ? "✓ Verified" :
                               kycStatus === "rejected" ? "✗ Rejected" : "Pending KYC"}
                            </Text>
                          </View>
                        </View>
                        <Text style={s.listSub}>{u.email}</Text>
                        {u.skills?.length > 0 && (
                          <Text style={s.listSub} numberOfLines={1}>
                            Skills: {u.skills.slice(0, 3).join(", ")}
                          </Text>
                        )}
                      </View>
                    </View>

                    {isPending && (
                      <View style={s.actionRow}>
                        <TouchableOpacity
                          style={[s.approveBtn, isLoading && { opacity: 0.7 }]}
                          disabled={isLoading}
                          onPress={() => handleKYC(u.user_id, "verified")}
                        >
                          {isLoading
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={s.approveBtnText}>✓ Verify KYC</Text>
                          }
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.rejectBtn, isLoading && { opacity: 0.7 }]}
                          disabled={isLoading}
                          onPress={() => handleKYC(u.user_id, "rejected")}
                        >
                          <Text style={s.rejectBtnText}>✗ Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )
          )}

          {/* ── PROJECTS TAB ──────────────────────────────────────────────── */}
          {tab === "projects" && (
            loading ? (
              <View style={s.centered}><ActivityIndicator color={G} /></View>
            ) : projects.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyTitle}>No projects yet</Text>
                <Text style={s.emptySub}>Projects posted by clients will appear here.</Text>
              </View>
            ) : (
              projects.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.listItem}
                  onPress={() => router.push(`/allocate?project_id=${p.project_id}` as any)}
                >
                  <View style={s.projRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.listTitle}>{p.title}</Text>
                      <Text style={s.listSub}>
                        ₹{p.budget?.toLocaleString()} · {p.timeline ?? p.duration ?? "—"}
                      </Text>
                      {(p.assigned_users ?? []).length > 0 && (
                        <Text style={[s.listSub, { color: G, marginTop: 3 }]}>
                          ⚡ {p.assigned_users.length} champion{p.assigned_users.length > 1 ? "s" : ""} assigned
                        </Text>
                      )}
                      <View style={s.projMeta}>
                        <View style={p.status === "active" ? s.successBadge : s.warningBadge}>
                          <Text style={p.status === "active" ? s.successBadgeText : s.warningBadgeText}>
                            {p.status === "active" ? "Active" :
                             p.status === "completed" ? "Completed" : "Pending"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={s.ghostBtn}>
                      <Text style={s.ghostBtnText}>View →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )
          )}
        </View>

        {/* Top earners */}
        {topEarners.length > 0 && (
          <View style={[s.card, { marginTop: 16 }]}>
            <Text style={s.cardTitle}>Top Earners</Text>
            {topEarners.map((u, i) => (
              <View key={i} style={[s.listItem, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
                <View style={s.assignedAvatar}>
                  <Text style={s.assignedAvatarText}>{initials(u.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.assignedName}>{u.name}</Text>
                  <Text style={s.listSub}>{(u.skills ?? []).slice(0, 2).join(", ") || "—"}</Text>
                </View>
                <Text style={[s.statVal, { fontSize: 16, color: G }]}>
                  ₹{(u.earnings ?? 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page:              { flex: 1, backgroundColor: "#f9fafb" },
  centered:          { paddingVertical: 28, alignItems: "center" },
  nav:               { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                       paddingHorizontal: 20, paddingTop: 48, paddingBottom: 14,
                       backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  logoImg:           { width: 220, height: 50, borderRadius: 4, overflow: "hidden" },
  logoutBtn:         { borderWidth: 1, borderColor: "#d1d5db", paddingHorizontal: 14,
                       paddingVertical: 7, borderRadius: 8 },
  logoutText:        { fontSize: 14, color: "#374151", fontWeight: "500" },

  body:              { padding: 20 },
  pageTitle:         { fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 4 },
  pageSub:           { fontSize: 14, color: "#4b5563", marginBottom: 24 },

  statsGrid:         { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statCard:          { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 18,
                       borderWidth: 1, borderColor: "#e5e7eb" },
  statIconBox:       { width: 42, height: 42, borderRadius: 10, justifyContent: "center",
                       alignItems: "center", marginBottom: 14 },
  statIconDot:       { width: 16, height: 16, borderRadius: 8 },
  statVal:           { fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 4 },
  statLbl:           { fontSize: 13, color: "#4b5563" },

  alertBanner:       { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a",
                       borderRadius: 12, padding: 16, flexDirection: "row", gap: 12,
                       alignItems: "flex-start", marginBottom: 20 },
  alertDot:          { width: 10, height: 10, borderRadius: 5, backgroundColor: "#f59e0b", marginTop: 4 },
  alertTitle:        { fontSize: 14, fontWeight: "600", color: "#92400e", marginBottom: 2 },
  alertSub:          { fontSize: 13, color: "#b45309", lineHeight: 19 },

  card:              { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1,
                       borderColor: "#e5e7eb", overflow: "hidden" },
  cardTitle:         { fontSize: 17, fontWeight: "600", color: "#111827",
                       paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  tabBar:            { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
                       paddingHorizontal: 16 },
  tabBtn:            { paddingVertical: 14, paddingHorizontal: 4, marginRight: 20, position: "relative" },
  tabText:           { fontSize: 13, color: "#4b5563", fontWeight: "500" },
  tabTextActive:     { color: G, fontWeight: "600" },
  tabIndicator:      { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: G },

  emptyState:        { padding: 36, alignItems: "center" },
  emptyTitle:        { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 6 },
  emptySub:          { fontSize: 13, color: "#6b7280", textAlign: "center" },

  listItem:          { padding: 20, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  listItemHeader:    { flexDirection: "row", justifyContent: "space-between",
                       alignItems: "flex-start", marginBottom: 12 },
  listTitle:         { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 3, marginTop: 6 },
  listSub:           { fontSize: 13, color: "#4b5563" },
  listDate:          { fontSize: 12, color: "#9ca3af" },

  skillRow:          { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  skillPill:         { backgroundColor: "#f0fdf4", borderRadius: 99, paddingHorizontal: 9,
                       paddingVertical: 3, borderWidth: 1, borderColor: "#d1fae5" },
  skillPillText:     { fontSize: 11, color: "#065f46", fontWeight: "500" },

  warningBadge:      { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a",
                       paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  warningBadgeText:  { fontSize: 11, color: "#92400e", fontWeight: "600" },
  successBadge:      { backgroundColor: "#d1fae5", paddingHorizontal: 8, paddingVertical: 3,
                       borderRadius: 6, alignSelf: "flex-start" },
  successBadgeText:  { fontSize: 11, color: "#065f46", fontWeight: "600" },
  infoBadge:         { backgroundColor: "#dbeafe", paddingHorizontal: 8, paddingVertical: 3,
                       borderRadius: 6, alignSelf: "flex-start" },
  infoBadgeText:     { fontSize: 11, color: "#1e40af", fontWeight: "600" },
  kycVerifiedBadge:  { backgroundColor: "#d1fae5" },
  kycRejectedBadge:  { backgroundColor: "#fee2e2" },

  kycNameRow:        { flexDirection: "row", alignItems: "center", gap: 8 },
  assignedBox:       { backgroundColor: "#f9fafb", borderRadius: 10, padding: 14, marginBottom: 14 },
  assignedLabel:     { fontSize: 13, color: "#4b5563", marginBottom: 8, fontWeight: "500" },
  assignedRow:       { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  assignedAvatar:    { width: 40, height: 40, borderRadius: 20, backgroundColor: "#d1fae5",
                       justifyContent: "center", alignItems: "center", flexShrink: 0 },
  assignedAvatarText:{ fontSize: 14, fontWeight: "600", color: "#065f46" },
  assignedName:      { fontSize: 14, fontWeight: "500", color: "#111827" },

  suggestionsBox:    { backgroundColor: "#f0fdf4", borderRadius: 10, padding: 14,
                       marginBottom: 14, borderWidth: 1, borderColor: "#d1fae5" },
  candidateRow:      { flexDirection: "row", alignItems: "center", gap: 10,
                       paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#d1fae5" },
  candidateScore:    { fontSize: 12, color: "#4b5563", marginTop: 2 },
  candidateActions:  { flexDirection: "row", gap: 6 },
  miniApproveBtn:    { backgroundColor: G, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  miniApproveBtnText:{ color: "#fff", fontSize: 12, fontWeight: "600" },
  miniRejectBtn:     { borderWidth: 1, borderColor: "#d1d5db", paddingHorizontal: 10,
                       paddingVertical: 6, borderRadius: 6 },
  miniRejectBtnText: { color: "#374151", fontSize: 12 },
  decidedBadge:      { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  decidedApprove:    { backgroundColor: "#d1fae5" },
  decidedReshortlist:{ backgroundColor: "#fef3c7" },
  decidedBadgeText:  { fontSize: 11, fontWeight: "600", color: "#374151" },

  actionRow:         { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  approveBtn:        { backgroundColor: G, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  approveBtnText:    { color: "#fff", fontSize: 14, fontWeight: "600" },
  rejectBtn:         { borderWidth: 1, borderColor: "#fca5a5", paddingHorizontal: 16,
                       paddingVertical: 9, borderRadius: 8 },
  rejectBtnText:     { color: "#dc2626", fontSize: 14, fontWeight: "500" },
  ghostBtn:          { borderWidth: 1, borderColor: "#d1d5db", paddingHorizontal: 14,
                       paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  ghostBtnText:      { color: "#374151", fontSize: 13, fontWeight: "500" },

  projRow:           { flexDirection: "row", alignItems: "flex-start",
                       justifyContent: "space-between", gap: 10 },
  projMeta:          { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
});
