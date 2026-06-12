import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, TextInput, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getStoredUser, logout, StoredUser, getToken } from "@/services/auth";
import { getEarnings } from "@/services/api";

const G       = "#059669";
const BASE    = "http://localhost:8000";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const initials = (n: string) =>
  n.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);

const DetailRow = ({
  label, value,
}: { label: string; value: string }) => (
  <View style={s.detailRow}>
    <Text style={s.detailLabel}>{label}</Text>
    <Text style={s.detailVal} numberOfLines={2}>{value || "—"}</Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Profile() {
  const router = useRouter();
  const [user,      setUser]      = useState<StoredUser | null>(null);
  const [profile,   setProfile]   = useState<any>(null);  // full profile from backend
  const [earnings,  setEarnings]  = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [editMode,  setEditMode]  = useState(false);
  const [saving,    setSaving]    = useState(false);

  // Editable fields
  const [occupation,  setOccupation]  = useState("");
  const [country,     setCountry]     = useState("");
  const [bio,         setBio]         = useState("");
  const [skills,      setSkills]      = useState("");
  const [portfolio,   setPortfolio]   = useState("");
  const [employer,    setEmployer]    = useState("");
  const [certifications, setCertifications] = useState("");

  useEffect(() => {
    getStoredUser().then(async (u) => {
      setUser(u);
      if (!u) { setLoading(false); return; }
      try {
        const token = await getToken();
        // Fetch full profile (has occupation, country, bio etc.)
        const [profileRes, earnData] = await Promise.all([
          fetch(`${BASE}/get-user/${u.user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          getEarnings(u.user_id),
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
          // Pre-fill edit fields
          setOccupation(data.occupation  || "");
          setCountry(   data.country     || "");
          setBio(       data.bio         || "");
          setSkills((   data.skills      || []).join(", "));
          setPortfolio( data.portfolio   || "");
          setEmployer(  data.employer    || "");
          setCertifications(data.certifications || "");
        }
        setEarnings(earnData?.earnings || 0);
      } catch {}
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = await getToken();
      const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const payload: Record<string, any> = {
        occupation:     occupation.trim()     || undefined,
        country:        country.trim()        || undefined,
        bio:            bio.trim()            || undefined,
        skills:         skillList.length > 0  ? skillList : undefined,
        portfolio:      portfolio.trim()      || undefined,
        employer:       employer.trim()       || undefined,
        certifications: certifications.trim() || undefined,
      };
      Object.keys(payload).forEach(
        (k) => payload[k] === undefined && delete payload[k]
      );
      const res = await fetch(`${BASE}/update-user/${user.user_id}`, {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      // Refresh profile
      setProfile((p: any) => ({ ...p, ...payload, skills: skillList }));
      setEditMode(false);
      Alert.alert("✅ Saved", "Your profile has been updated.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={s.centered}><ActivityIndicator color={G} size="large" /></View>
  );

  if (!user) return (
    <View style={s.centered}>
      <Text style={s.emptyText}>Please log in to view your profile.</Text>
      <TouchableOpacity style={s.loginBtn} onPress={() => router.push("/login_1")}>
        <Text style={s.loginBtnText}>Sign in</Text>
      </TouchableOpacity>
    </View>
  );

  const kycStatus  = profile?.kyc_status ?? "pending";
  const kycColor   = kycStatus === "verified" ? "#065f46"
                   : kycStatus === "rejected"  ? "#991b1b" : "#854F0B";
  const kycBg      = kycStatus === "verified" ? "#d1fae5"
                   : kycStatus === "rejected"  ? "#fee2e2" : "#fef3c7";
  const kycLabel   = kycStatus === "verified" ? "✓ Verified"
                   : kycStatus === "rejected"  ? "✗ Rejected" : "⏳ Pending";

  const parsedSkills = (profile?.skills || []) as string[];
  const completionPct = [
    !!profile?.occupation, !!profile?.country,
    !!profile?.skills?.length, !!profile?.bio,
    !!profile?.experience_years, !!profile?.portfolio,
  ].filter(Boolean).length / 6 * 100;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
        <Text style={s.headerSub}>EcoConnect</Text>
      </View>

      {/* Avatar card */}
      <View style={s.avatarCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials(user.name)}</Text>
        </View>
        <Text style={s.userName}>{user.name}</Text>
        {profile?.occupation && (
          <Text style={s.userOccupation}>{profile.occupation}</Text>
        )}
        <Text style={s.userEmail}>{user.email}</Text>
        {profile?.country && (
          <Text style={s.userCountry}>📍 {profile.country}</Text>
        )}
        <View style={[s.roleBadge,
          user.role === "admin"      ? s.roleAdmin :
          user.role === "client"     ? s.roleClient : s.roleFreelancer]}>
          <Text style={[s.roleBadgeText,
            user.role === "admin"  ? { color: "#fff" } :
            user.role === "client" ? { color: "#0C447C" } : { color: "#27500A" }]}>
            {user.role === "admin"      ? "Admin" :
             user.role === "client"     ? "Client" : "Champion"}
          </Text>
        </View>
      </View>

      {/* ── CHAMPION profile ─────────────────────────────────────────────── */}
      {user.role === "freelancer" && (
        <>
          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statVal}>₹{earnings.toLocaleString()}</Text>
              <Text style={s.statLbl}>Total Earnings</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: kycColor, fontSize: 16 }]}>
                {kycLabel}
              </Text>
              <Text style={s.statLbl}>KYC Status</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { fontSize: 18 }]}>
                {Math.round(completionPct)}%
              </Text>
              <Text style={s.statLbl}>Profile</Text>
            </View>
          </View>

          {/* Profile completion bar */}
          {completionPct < 100 && (
            <TouchableOpacity
              style={s.completionBanner}
              onPress={() => router.push("/champion-onboarding" as any)}
              activeOpacity={0.85}
            >
              <View style={s.completionTrack}>
                <View style={[s.completionFill, { width: `${completionPct}%` as any }]} />
              </View>
              <Text style={s.completionText}>
                Profile {Math.round(completionPct)}% complete — tap to finish
              </Text>
            </TouchableOpacity>
          )}

          {/* View / Edit toggle */}
          {!editMode ? (

            // ── VIEW MODE ─────────────────────────────────────────────────
            <>
              <View style={s.section}>
                <View style={s.secHeaderRow}>
                  <Text style={s.secTitle}>Profile Details</Text>
                  <TouchableOpacity
                    style={s.editToggleBtn}
                    onPress={() => setEditMode(true)}
                  >
                    <Text style={s.editToggleBtnText}>✏ Edit</Text>
                  </TouchableOpacity>
                </View>
                <DetailRow label="Full Name"    value={user.name} />
                <DetailRow label="Email"        value={user.email} />
                <DetailRow label="Occupation"   value={profile?.occupation} />
                <DetailRow label="Country"      value={profile?.country} />
                <DetailRow label="Experience"   value={profile?.experience_years} />
                <DetailRow label="Employer"     value={profile?.employer} />
                <DetailRow label="Portfolio"    value={profile?.portfolio} />
                <DetailRow label="Certifications" value={profile?.certifications} />
                {profile?.bio && (
                  <View style={s.bioBox}>
                    <Text style={s.detailLabel}>About</Text>
                    <Text style={s.bioText}>{profile.bio}</Text>
                  </View>
                )}
              </View>

              {/* Skills */}
              {parsedSkills.length > 0 && (
                <View style={s.section}>
                  <Text style={s.secTitle}>Skills</Text>
                  <View style={s.skillsWrap}>
                    {parsedSkills.map((sk, i) => (
                      <View key={i} style={s.skillPill}>
                        <Text style={s.skillPillText}>{sk}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Domains */}
              {profile?.domains?.length > 0 && (
                <View style={s.section}>
                  <Text style={s.secTitle}>Domain Specialisation</Text>
                  <View style={s.skillsWrap}>
                    {(profile.domains as string[]).map((d, i) => (
                      <View key={i} style={[s.skillPill, { backgroundColor: "#ede9fe", borderColor: "#c4b5fd" }]}>
                        <Text style={[s.skillPillText, { color: "#5b21b6" }]}>{d}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* KYC card */}
              {kycStatus !== "verified" && (
                <TouchableOpacity
                  style={[s.kycCard, kycStatus === "rejected" && { backgroundColor: "#7f1d1d" }]}
                  onPress={() => router.push("/champion-onboarding" as any)}
                  activeOpacity={0.85}
                >
                  <Text style={s.kycTitle}>
                    {kycStatus === "rejected"
                      ? "KYC Rejected — Resubmit"
                      : "Complete your KYC"}
                  </Text>
                  <Text style={s.kycSub}>
                    {kycStatus === "rejected"
                      ? "Your documents were rejected. Tap to resubmit with correct documents."
                      : "Verified profiles get priority in AI matching and appear higher in search results."}
                  </Text>
                  <View style={s.kycBtn}>
                    <Text style={s.kycBtnText}>
                      {kycStatus === "rejected"
                        ? "Resubmit Documents →"
                        : "Submit KYC Documents →"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </>

          ) : (

            // ── EDIT MODE ─────────────────────────────────────────────────
            <View style={s.section}>
              <View style={s.secHeaderRow}>
                <Text style={s.secTitle}>Edit Profile</Text>
                <TouchableOpacity
                  onPress={() => setEditMode(false)}
                  style={s.cancelBtn}
                >
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {[
                { label: "Job Title / Occupation", value: occupation, setter: setOccupation, placeholder: "e.g. Carbon Reduction Specialist" },
                { label: "Country",                value: country,    setter: setCountry,    placeholder: "e.g. India" },
                { label: "Current Employer",       value: employer,   setter: setEmployer,   placeholder: "e.g. Tata Consultancy Services" },
                { label: "Portfolio / LinkedIn",   value: portfolio,  setter: setPortfolio,  placeholder: "https://linkedin.com/in/yourname" },
                { label: "Certifications",         value: certifications, setter: setCertifications, placeholder: "e.g. GRI Certified, LEED Green Associate" },
              ].map((field) => (
                <View key={field.label} style={s.editField}>
                  <Text style={s.editLabel}>{field.label}</Text>
                  <TextInput
                    style={s.editInput}
                    value={field.value}
                    onChangeText={field.setter}
                    placeholder={field.placeholder}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              ))}

              {/* Skills */}
              <View style={s.editField}>
                <Text style={s.editLabel}>Skills <Text style={s.editHint}>(comma separated)</Text></Text>
                <TextInput
                  style={[s.editInput, { minHeight: 72, textAlignVertical: "top" }]}
                  value={skills}
                  onChangeText={setSkills}
                  placeholder="e.g. Carbon Accounting, ESG Reporting"
                  placeholderTextColor="#9ca3af"
                  multiline
                />
                {skills.trim().length > 0 && (
                  <View style={[s.skillsWrap, { marginTop: 8 }]}>
                    {skills.split(",").map((sk, i) =>
                      sk.trim() ? (
                        <View key={i} style={s.skillPill}>
                          <Text style={s.skillPillText}>{sk.trim()}</Text>
                        </View>
                      ) : null
                    )}
                  </View>
                )}
              </View>

              {/* Bio */}
              <View style={s.editField}>
                <Text style={s.editLabel}>About You</Text>
                <TextInput
                  style={[s.editInput, { minHeight: 90, textAlignVertical: "top" }]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Brief introduction about your background and expertise..."
                  placeholderTextColor="#9ca3af"
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.saveBtnText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* ── CLIENT profile ───────────────────────────────────────────────── */}
      {user.role === "client" && (
        <View style={s.section}>
          <Text style={s.secTitle}>Company Details</Text>
          <DetailRow label="Contact Name" value={user.name} />
          <DetailRow label="Email"        value={user.email} />
          <DetailRow label="Company"      value={profile?.company || "Not set"} />
          <DetailRow label="Budget Range" value={profile?.budget_range || "Not set"} />
        </View>
      )}

      {/* ── ADMIN profile ────────────────────────────────────────────────── */}
      {user.role === "admin" && (
        <View style={s.section}>
          <Text style={s.secTitle}>Admin Account</Text>
          <DetailRow label="Name"  value={user.name} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Role"  value="Platform Administrator" />
        </View>
      )}

      {/* Actions */}
      <View style={s.section}>
        {user.role === "freelancer" && !editMode && (
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => setEditMode(true)}
          >
            <Text style={s.editBtnText}>✏ Edit Profile</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={async () => { await logout(); router.replace("/(tabs)/"); }}
        >
          <Text style={s.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#f0f4ee" },
  centered:        { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  emptyText:       { fontSize: 15, color: "#666" },

  header:          { backgroundColor: "#1a3d0a", padding: 20, paddingTop: 52 },
  headerTitle:     { color: "#fff", fontSize: 24, fontWeight: "700" },
  headerSub:       { color: "#7ec850", fontSize: 13, marginTop: 2 },

  avatarCard:      { backgroundColor: "#fff", margin: 16, borderRadius: 14, padding: 24,
                     alignItems: "center", borderWidth: 0.5, borderColor: "#e0e8d8",
                     shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar:          { width: 72, height: 72, borderRadius: 36, backgroundColor: "#EAF3DE",
                     justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText:      { fontSize: 26, fontWeight: "700", color: "#27500A" },
  userName:        { fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 2 },
  userOccupation:  { fontSize: 14, color: G, fontWeight: "500", marginBottom: 4 },
  userEmail:       { fontSize: 13, color: "#888", marginBottom: 4 },
  userCountry:     { fontSize: 13, color: "#666", marginBottom: 10 },
  roleBadge:       { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  roleFreelancer:  { backgroundColor: "#EAF3DE" },
  roleClient:      { backgroundColor: "#E6F1FB" },
  roleAdmin:       { backgroundColor: "#1a3d0a" },
  roleBadgeText:   { fontSize: 13, fontWeight: "600" },

  statsRow:        { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statCard:        { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 14,
                     alignItems: "center", borderWidth: 0.5, borderColor: "#e0e8d8" },
  statVal:         { fontSize: 20, fontWeight: "700", color: "#27500A" },
  statLbl:         { fontSize: 11, color: "#888", marginTop: 3, textAlign: "center" },

  completionBanner:{ marginHorizontal: 16, marginBottom: 8, backgroundColor: "#fff",
                     borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#e0e8d8",
                     overflow: "hidden" },
  completionTrack: { height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, marginBottom: 8, overflow: "hidden" },
  completionFill:  { height: "100%", backgroundColor: G, borderRadius: 2 },
  completionText:  { fontSize: 13, color: G, fontWeight: "500" },

  section:         { paddingHorizontal: 16, marginBottom: 16 },
  secHeaderRow:    { flexDirection: "row", justifyContent: "space-between",
                     alignItems: "center", marginBottom: 12 },
  secTitle:        { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  editToggleBtn:   { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#a7f3d0",
                     paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  editToggleBtnText:{ fontSize: 13, color: G, fontWeight: "600" },
  cancelBtn:       { paddingHorizontal: 14, paddingVertical: 6 },
  cancelBtnText:   { fontSize: 13, color: "#6b7280" },

  detailRow:       { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12,
                     borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
  detailLabel:     { fontSize: 13, color: "#888", flex: 0.45 },
  detailVal:       { fontSize: 13, color: "#1a1a1a", fontWeight: "500", flex: 0.55, textAlign: "right" },
  bioBox:          { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
  bioText:         { fontSize: 13, color: "#374151", lineHeight: 20, marginTop: 6 },

  skillsWrap:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillPill:       { backgroundColor: "#d1fae5", borderRadius: 99, paddingHorizontal: 12,
                     paddingVertical: 5, borderWidth: 1, borderColor: "#a7f3d0" },
  skillPillText:   { fontSize: 12, color: "#065f46", fontWeight: "500" },

  kycCard:         { backgroundColor: "#1a3d0a", margin: 16, borderRadius: 12, padding: 18, gap: 6 },
  kycTitle:        { color: "#fff", fontSize: 16, fontWeight: "700" },
  kycSub:          { color: "#a8c090", fontSize: 13, lineHeight: 18 },
  kycBtn:          { alignSelf: "flex-start", backgroundColor: G,
                     paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, marginTop: 4 },
  kycBtnText:      { color: "#fff", fontWeight: "600", fontSize: 14 },

  // Edit form
  editField:       { marginBottom: 18 },
  editLabel:       { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 7 },
  editHint:        { fontSize: 12, fontWeight: "400", color: "#9ca3af" },
  editInput:       { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10,
                     paddingHorizontal: 14, paddingVertical: 11,
                     fontSize: 14, color: "#111827", backgroundColor: "#fff" },
  saveBtn:         { backgroundColor: G, padding: 14, borderRadius: 10,
                     alignItems: "center", marginTop: 8 },
  saveBtnText:     { color: "#fff", fontWeight: "700", fontSize: 15 },

  loginBtn:        { backgroundColor: G, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  loginBtnText:    { color: "#fff", fontWeight: "600", fontSize: 15 },
  editBtn:         { backgroundColor: "#fff", padding: 14, borderRadius: 10, alignItems: "center",
                     borderWidth: 1, borderColor: G, marginBottom: 10 },
  editBtnText:     { color: "#27500A", fontWeight: "600", fontSize: 15 },
  logoutBtn:       { backgroundColor: "#FCEBEB", padding: 14, borderRadius: 10, alignItems: "center" },
  logoutBtnText:   { color: "#A32D2D", fontWeight: "600", fontSize: 15 },
});
