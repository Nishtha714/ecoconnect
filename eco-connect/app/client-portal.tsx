import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, TextInput,
  Modal, KeyboardAvoidingView, Platform, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { getClientProjects, addProject, suggestUsers } from "@/services/api";
import { getStoredUser, logout, StoredUser } from "@/services/auth";

const G = "#059669";

// ─── AI Recommendations Modal ─────────────────────────────────────────────────
function AIRecommendationsModal({
  visible, onClose, project,
}: {
  visible: boolean;
  onClose: () => void;
  project: any | null;
}) {
  const [loading,   setLoading]   = useState(false);
  const [champions, setChampions] = useState<any[]>([]);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (visible && project) {
      setChampions([]); setError(""); setLoading(true);
      suggestUsers(project.project_id ?? project._id)
        .then((data: any[]) => setChampions(data || []))
        .catch(() => setError("Could not load recommendations. Please try again."))
        .finally(() => setLoading(false));
    }
  }, [visible, project]);

  const nameInitials = (name: string) =>
    name?.split(" ").map((x: string) => x[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <TouchableOpacity style={s.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalTitle}>🤖 AI Recommendations</Text>
              {project && (
                <Text style={s.modalSubtitle} numberOfLines={1}>For: {project.title}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
              <Text style={s.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={s.modalDivider} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={s.aiLoadingBox}>
                <ActivityIndicator color={G} size="large" />
                <Text style={s.aiLoadingText}>Finding best matches…</Text>
              </View>
            ) : error ? (
              <View style={s.aiErrorBox}><Text style={s.aiErrorText}>{error}</Text></View>
            ) : champions.length === 0 ? (
              <View style={s.aiEmptyBox}>
                <Text style={s.aiEmptyIcon}>🔍</Text>
                <Text style={s.aiEmptyTitle}>No matches found</Text>
                <Text style={s.aiEmptyText}>
                  No champions were shortlisted for this project yet.
                  Check back after adding more skill requirements.
                </Text>
              </View>
            ) : (
              <>
                <Text style={s.aiResultCount}>
                  {champions.length} champion{champions.length !== 1 ? "s" : ""} matched
                </Text>
                {champions.map((c: any, i: number) => (
                  <View key={i} style={s.champRow}>
                    <View style={[s.rankBadge, i === 0 && s.rankBadgeTop]}>
                      <Text style={[s.rankText, i === 0 && s.rankTextTop]}>#{i + 1}</Text>
                    </View>
                    <View style={s.champAvatar}>
                      <Text style={s.champAvatarText}>{nameInitials(c.name ?? "?")}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.champName}>{c.name ?? "—"}</Text>
                      {c.occupation != null && <Text style={s.champRole}>{c.occupation}</Text>}
                      {(c.skills ?? []).length > 0 && (
                        <View style={s.champSkillRow}>
                          {(c.skills as string[]).slice(0, 3).map((sk, j) => (
                            <View key={j} style={s.champSkillPill}>
                              <Text style={s.champSkillText}>{sk}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <View style={s.champMetaRow}>
                        {c.country  != null && <Text style={s.champMeta}>📍 {c.country}</Text>}
                        {c.rating   != null && <Text style={s.champMeta}>⭐ {Number(c.rating).toFixed(1)}</Text>}
                        {c.projects != null && <Text style={s.champMeta}>{c.projects} projects</Text>}
                      </View>
                    </View>
                    {c.score != null && (
                      <View style={[
                        s.scorePill,
                        c.score >= 70 ? s.scorePillHigh : c.score >= 40 ? s.scorePillMid : s.scorePillLow,
                      ]}>
                        <Text style={[
                          s.scoreText,
                          c.score >= 70 ? s.scoreTextHigh : c.score >= 40 ? s.scoreTextMid : s.scoreTextLow,
                        ]}>
                          {Math.round(c.score)}
                        </Text>
                        <Text style={s.scoreLabel}>score</Text>
                      </View>
                    )}
                  </View>
                ))}
                <View style={s.aiNote}>
                  <Text style={s.aiNoteText}>ℹ️ Final allocation is approved by an EcoConnect admin.</Text>
                </View>
              </>
            )}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Post Project Modal ───────────────────────────────────────────────────────
function PostProjectModal({
  visible, onClose, onSuccess, clientEmail, companyName,
}: {
  visible:     boolean;
  onClose:     () => void;
  onSuccess:   () => void;
  clientEmail: string;
  companyName: string;
}) {
  const [title,    setTitle]    = useState("");
  const [skills,   setSkills]   = useState("");
  const [budget,   setBudget]   = useState("");
  const [timeline, setTimeline] = useState("");
  const [scope,    setScope]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [message,  setMessage]  = useState("");

  const reset = () => {
    setTitle(""); setSkills(""); setBudget("");
    setTimeline(""); setScope(""); setErrors({});
    setMessage(""); setLoading(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim())    e.title    = "Required";
    if (!skills.trim())   e.skills   = "Add at least one skill";
    if (!budget.trim())   e.budget   = "Required";
    else if (isNaN(Number(budget))) e.budget = "Must be a number";
    if (!timeline.trim()) e.timeline = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setMessage("");
    try {
      const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const budgetNum = parseFloat(budget);
      await addProject({
        title:           title.trim(),
        required_skills: skillList,
        skills:          skillList,
        budget:          budgetNum,
        budget_min:      budgetNum,
        timeline:        timeline.trim(),
        duration:        timeline.trim(),
        scope:           scope.trim() || undefined,
        client_email:    clientEmail,
        company_name:    companyName || undefined,
        applicants:      0,
      });
      setMessage("Project posted successfully!");
      setTimeout(() => { reset(); onSuccess(); }, 1200);
    } catch (err: any) {
      setMessage(err.message || "Failed to post project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={s.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={s.modalSheet}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Post a Project</Text>
              <TouchableOpacity onPress={() => { reset(); onClose(); }} style={s.modalCloseBtn}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.modalDivider} />

            <Text style={s.label}>Project Title <Text style={s.req}>*</Text></Text>
            <TextInput
              style={[s.input, errors.title && s.inputErr]}
              placeholder="e.g. Carbon Neutrality Roadmap"
              value={title} onChangeText={setTitle}
              placeholderTextColor="#9ca3af"
            />
            {errors.title && <Text style={s.err}>{errors.title}</Text>}

            <Text style={[s.label, { marginTop: 16 }]}>
              Required Skills <Text style={s.req}>*</Text>
              <Text style={s.labelHint}> (comma separated)</Text>
            </Text>
            <TextInput
              style={[s.input, errors.skills && s.inputErr]}
              placeholder="e.g. Carbon Accounting, ESG Reporting, Net Zero"
              value={skills} onChangeText={setSkills}
              multiline placeholderTextColor="#9ca3af"
            />
            {errors.skills && <Text style={s.err}>{errors.skills}</Text>}
            {parsedSkills.length > 0 && (
              <View style={s.skillChips}>
                {parsedSkills.map((sk, i) => (
                  <View key={i} style={s.skillChip}>
                    <Text style={s.skillChipText}>{sk}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[s.label, { marginTop: 16 }]}>
              Budget (₹) <Text style={s.req}>*</Text>
            </Text>
            <TextInput
              style={[s.input, errors.budget && s.inputErr]}
              placeholder="e.g. 50000"
              value={budget} onChangeText={setBudget}
              keyboardType="numeric" placeholderTextColor="#9ca3af"
            />
            {errors.budget && <Text style={s.err}>{errors.budget}</Text>}

            <Text style={[s.label, { marginTop: 16 }]}>
              Timeline <Text style={s.req}>*</Text>
            </Text>
            <TextInput
              style={[s.input, errors.timeline && s.inputErr]}
              placeholder="e.g. 3 months"
              value={timeline} onChangeText={setTimeline}
              placeholderTextColor="#9ca3af"
            />
            {errors.timeline && <Text style={s.err}>{errors.timeline}</Text>}

            <Text style={[s.label, { marginTop: 16 }]}>
              Project Scope <Text style={s.labelHint}>(optional)</Text>
            </Text>
            <TextInput
              style={[s.input, s.inputTall]}
              placeholder="Describe what the project involves, deliverables, and goals..."
              value={scope} onChangeText={setScope}
              multiline placeholderTextColor="#9ca3af"
            />

            {message ? (
              <View style={[s.msgBox, message.includes("successfully") && s.msgBoxSuccess]}>
                <Text style={[s.msgText, message.includes("successfully") && s.msgTextSuccess]}>
                  {message}
                </Text>
              </View>
            ) : null}

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit} disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.submitBtnText}>Post Project</Text>
                }
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ClientPortal() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [user,        setUser]        = useState<StoredUser | null>(null);
  const [projects,    setProjects]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [aiProject,   setAiProject]   = useState<any | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  const loadData = async (u: StoredUser) => {
    try {
      const projs = await getClientProjects(u.email);
      setProjects(projs || []);
    } catch {
      setProjects([]);
    }
  };

  useEffect(() => {
    getStoredUser().then(async (u) => {
      setUser(u);
      if (!u) { router.replace("/login_1"); return; }
      await loadData(u);
      setLoading(false);
    });
  }, []);

  const handlePostSuccess = async () => {
    setShowModal(false);
    if (user) await loadData(user);
  };

  const openAiModal = (project: any) => {
    setAiProject(project); setShowAiModal(true);
  };

  if (loading) return (
    <View style={s.centered}><ActivityIndicator color={G} size="large" /></View>
  );

  const active    = projects.filter(p => ["active", "approved"].includes(p.status)).length;
  const pending   = projects.filter(p => ["pending", "open"].includes(p.status)).length;
  const completed = projects.filter(p => p.status === "completed").length;

  const statCards = [
    { val: projects.length.toString(), lbl: "Total Projects",   color: G,         bg: "#d1fae5" },
    { val: active.toString(),          lbl: "Active Projects",  color: "#3b82f6", bg: "#dbeafe" },
    { val: pending.toString(),         lbl: "Pending Approval", color: "#f59e0b", bg: "#fef3c7" },
    { val: completed.toString(),       lbl: "Completed",        color: "#8b5cf6", bg: "#ede9fe" },
  ];

  const userAny = user as any;

  return (
    <>
      <ScrollView style={s.page} showsVerticalScrollIndicator={false}>

        {/* ── Nav ── */}
        <View style={s.nav}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={isMobile ? s.logoImgMobile : s.logoImg}
            resizeMode="cover"
          />
          {isMobile ? (
            <View style={s.navRight}>
              <TouchableOpacity
                style={s.postBtnCompact}
                onPress={() => setShowModal(true)}
              >
                <Text style={s.postBtnCompactText}>+ Post</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMenuOpen(o => !o)} style={s.hamburger}>
                <Text style={s.hamburgerIcon}>{menuOpen ? "✕" : "☰"}</Text>
              </TouchableOpacity>
            </View>
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
            <TouchableOpacity
              style={s.mobileMenuItem}
              onPress={() => { setMenuOpen(false); router.push("/champions" as any); }}
            >
              <Text style={s.mobileMenuText}>Browse Champions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.mobileMenuItem}
              onPress={() => { setMenuOpen(false); router.push("/(tabs)/courses"); }}
            >
              <Text style={s.mobileMenuText}>Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.mobileMenuItem}
              onPress={() => { setMenuOpen(false); router.push("/(tabs)/profile"); }}
            >
              <Text style={s.mobileMenuText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.mobileMenuItem, s.mobileMenuDanger]}
              onPress={async () => { setMenuOpen(false); await logout(); router.replace("/(tabs)/"); }}
            >
              <Text style={s.mobileMenuDangerText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[s.body, isMobile && s.bodyMobile]}>
          <Text style={[s.pageTitle, isMobile && s.pageTitleMobile]}>
            Welcome, {user?.name.split(" ")[0]}!
          </Text>
          <Text style={s.pageSub}>Manage your sustainability projects</Text>

          {/* Stats grid — 2×2 on both desktop and mobile, tighter on mobile */}
          <View style={[s.statsGrid, isMobile && s.statsGridMobile]}>
            {statCards.map((st, i) => (
              <View key={i} style={[s.statCard, isMobile && s.statCardMobile]}>
                <View style={[s.statIconBox, { backgroundColor: st.bg }]}>
                  <View style={[s.statDot, { backgroundColor: st.color }]} />
                </View>
                <Text style={[s.statVal, isMobile && s.statValMobile]}>{st.val}</Text>
                <Text style={s.statLbl}>{st.lbl}</Text>
              </View>
            ))}
          </View>

          {/* Projects card */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardHeaderTitle}>My Projects</Text>
              {!isMobile && (
                <TouchableOpacity style={s.primaryBtn} onPress={() => setShowModal(true)}>
                  <Text style={s.primaryBtnText}>+ Post Project</Text>
                </TouchableOpacity>
              )}
            </View>

            {projects.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyTitle}>No projects yet</Text>
                <Text style={s.emptySubText}>
                  Post your first project and our AI will match the right champions.
                </Text>
                <TouchableOpacity style={s.primaryBtn} onPress={() => setShowModal(true)}>
                  <Text style={s.primaryBtnText}>Post Your First Project</Text>
                </TouchableOpacity>
              </View>
            ) : (
              projects.map((p, i) => (
                <View key={i} style={s.projItem}>
                  <View style={s.projTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.projTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={s.projMeta}>
                        ₹{p.budget?.toLocaleString()} · {p.timeline ?? p.duration ?? "—"}
                      </Text>
                    </View>
                    <View style={[
                      s.badge,
                      ["active", "approved"].includes(p.status) ? s.badgeGreen :
                      p.status === "completed" ? s.badgePurple : s.badgeYellow,
                    ]}>
                      <Text style={[
                        s.badgeText,
                        ["active", "approved"].includes(p.status) ? { color: "#065f46" } :
                        p.status === "completed" ? { color: "#5b21b6" } : { color: "#92400e" },
                      ]}>
                        {p.status === "active"    ? "Active"    :
                         p.status === "approved"  ? "Approved"  :
                         p.status === "completed" ? "Completed" : "Pending"}
                      </Text>
                    </View>
                  </View>

                  {(p.required_skills ?? p.skills ?? []).length > 0 && (
                    <View style={s.projSkillRow}>
                      {(p.required_skills ?? p.skills).slice(0, 3).map((sk: string, j: number) => (
                        <View key={j} style={s.projSkillPill}>
                          <Text style={s.projSkillText}>{sk}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {(p.assigned_users ?? []).length > 0 && (
                    <Text style={s.assignedText}>⚡ Champion: {p.assigned_users[0]}</Text>
                  )}

                  <TouchableOpacity
                    style={s.aiBtn}
                    onPress={() => openAiModal(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.aiBtnText}>🤖 See AI Matches</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Quick actions — hidden on mobile (moved to hamburger menu) */}
          {!isMobile && (
            <View style={[s.card, { marginTop: 14 }]}>
              <Text style={s.cardTitle}>Quick Actions</Text>
              <View style={s.actionsGrid}>
                {[
                  { label: "Browse Champions", action: () => router.push("/champions" as any) },
                  { label: "Post a Project",   action: () => setShowModal(true) },
                  { label: "Browse Courses",   action: () => router.push("/(tabs)/courses") },
                  { label: "Edit Profile",     action: () => router.push("/(tabs)/profile") },
                ].map((btn, i) => (
                  <TouchableOpacity key={i} style={s.actionBtn} onPress={btn.action}>
                    <Text style={s.actionBtnText}>{btn.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Mobile logout button */}
          {isMobile && (
            <TouchableOpacity
              style={s.logoutBtnMobile}
              onPress={async () => { await logout(); router.replace("/(tabs)/"); }}
            >
              <Text style={s.logoutBtnMobileText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <PostProjectModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handlePostSuccess}
        clientEmail={user?.email ?? ""}
        companyName={userAny?.company ?? userAny?.company_name ?? ""}
      />

      <AIRecommendationsModal
        visible={showAiModal}
        onClose={() => { setShowAiModal(false); setAiProject(null); }}
        project={aiProject}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:     { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // ── Nav ──
  nav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 48, paddingBottom: 14,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  logoImg:        { width: 220, height: 50, borderRadius: 4 },
  logoImgMobile:  { width: 140, height: 38, borderRadius: 4 },
  navRight:       { flexDirection: "row", alignItems: "center", gap: 10 },
  logoutBtn:      { borderWidth: 1, borderColor: "#d1d5db", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  logoutText:     { fontSize: 14, color: "#374151", fontWeight: "500" },

  // ── Hamburger ──
  hamburger:     { padding: 8 },
  hamburgerIcon: { fontSize: 22, color: "#111827" },

  // ── Mobile compact post button ──
  postBtnCompact:     { backgroundColor: G, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  postBtnCompactText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  // ── Mobile dropdown ──
  mobileMenu:          { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 8 },
  mobileMenuItem:      { paddingHorizontal: 20, paddingVertical: 14 },
  mobileMenuText:      { fontSize: 15, color: "#374151", fontWeight: "500" },
  mobileMenuDanger:    { borderTopWidth: 1, borderTopColor: "#f3f4f6", marginTop: 4 },
  mobileMenuDangerText:{ fontSize: 15, color: "#dc2626", fontWeight: "500" },

  // ── Body ──
  body:           { padding: 20 },
  bodyMobile:     { padding: 16 },
  pageTitle:      { fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 4 },
  pageTitleMobile:{ fontSize: 22 },
  pageSub:        { fontSize: 14, color: "#4b5563", marginBottom: 24 },

  // ── Stats ──
  statsGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statsGridMobile: { gap: 10 },
  statCard:        { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 18, borderWidth: 1, borderColor: "#e5e7eb" },
  statCardMobile:  { padding: 14 },
  statIconBox:     { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  statDot:         { width: 16, height: 16, borderRadius: 8 },
  statVal:         { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 3 },
  statValMobile:   { fontSize: 20 },
  statLbl:         { fontSize: 12, color: "#4b5563" },

  // ── Cards ──
  card:            { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },
  cardHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  cardHeaderTitle: { fontSize: 17, fontWeight: "600", color: "#111827" },
  cardTitle:       { fontSize: 17, fontWeight: "600", color: "#111827", paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  emptyBox:        { padding: 28, alignItems: "center", gap: 10 },
  emptyTitle:      { fontSize: 16, fontWeight: "600", color: "#111827" },
  emptySubText:    { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 20 },

  // ── Project rows ──
  projItem:      { padding: 18, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  projTop:       { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  projTitle:     { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 2 },
  projMeta:      { fontSize: 12, color: "#6b7280" },
  projSkillRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  projSkillPill: { backgroundColor: "#f0fdf4", borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: "#d1fae5" },
  projSkillText: { fontSize: 11, color: "#065f46", fontWeight: "500" },
  assignedText:  { fontSize: 12, color: G, fontWeight: "500", marginBottom: 10 },
  aiBtn:         { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginTop: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: "#d1fae5", backgroundColor: "#f0fdf4" },
  aiBtnText:     { fontSize: 13, color: "#065f46", fontWeight: "600" },

  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexShrink: 0 },
  badgeGreen:  { backgroundColor: "#d1fae5" },
  badgeYellow: { backgroundColor: "#fef3c7" },
  badgePurple: { backgroundColor: "#ede9fe" },
  badgeText:   { fontSize: 11, fontWeight: "600" },

  // ── Quick actions ──
  actionsGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 18, paddingBottom: 18 },
  actionBtn:      { borderWidth: 1, borderColor: "#d1d5db", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  actionBtnText:  { fontSize: 13, color: "#374151", fontWeight: "500" },
  primaryBtn:     { backgroundColor: G, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  // ── Mobile logout ──
  logoutBtnMobile:     { marginTop: 16, borderWidth: 1, borderColor: "#d1d5db", padding: 14, borderRadius: 10, alignItems: "center" },
  logoutBtnMobileText: { fontSize: 15, color: "#374151", fontWeight: "500" },

  // ── Modals ──
  modalOverlay:   { flex: 1, justifyContent: "flex-end" },
  modalBackdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet:     { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 6, maxHeight: "92%", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20 },
  modalHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18 },
  modalTitle:     { fontSize: 20, fontWeight: "700", color: "#111827" },
  modalSubtitle:  { fontSize: 13, color: "#6b7280", marginTop: 2 },
  modalCloseBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  modalCloseText: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  modalDivider:   { height: 1, backgroundColor: "#f3f4f6", marginBottom: 18 },

  // ── AI modal ──
  aiLoadingBox:  { alignItems: "center", paddingVertical: 48, gap: 14 },
  aiLoadingText: { fontSize: 14, color: "#6b7280" },
  aiErrorBox:    { padding: 24, alignItems: "center" },
  aiErrorText:   { fontSize: 14, color: "#dc2626", textAlign: "center" },
  aiEmptyBox:    { padding: 32, alignItems: "center", gap: 10 },
  aiEmptyIcon:   { fontSize: 36 },
  aiEmptyTitle:  { fontSize: 16, fontWeight: "600", color: "#111827" },
  aiEmptyText:   { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 20 },
  aiResultCount: { fontSize: 13, color: "#6b7280", marginBottom: 12 },
  aiNote:        { marginTop: 16, marginBottom: 4, padding: 12, backgroundColor: "#f0fdf4", borderRadius: 8, borderWidth: 1, borderColor: "#d1fae5" },
  aiNoteText:    { fontSize: 12, color: "#065f46", textAlign: "center" },
  champRow:      { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rankBadge:     { width: 28, height: 28, borderRadius: 14, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center", flexShrink: 0, marginTop: 2 },
  rankBadgeTop:  { backgroundColor: "#fef3c7" },
  rankText:      { fontSize: 11, fontWeight: "700", color: "#6b7280" },
  rankTextTop:   { color: "#92400e" },
  champAvatar:   { width: 42, height: 42, borderRadius: 21, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", flexShrink: 0, borderWidth: 1.5, borderColor: "#a7f3d0" },
  champAvatarText:{ fontSize: 14, fontWeight: "700", color: "#065f46" },
  champName:     { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 2 },
  champRole:     { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  champSkillRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 5 },
  champSkillPill:{ backgroundColor: "#f0fdf4", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#d1fae5" },
  champSkillText:{ fontSize: 11, color: "#065f46", fontWeight: "500" },
  champMetaRow:  { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  champMeta:     { fontSize: 11, color: "#9ca3af" },
  scorePill:     { alignItems: "center", justifyContent: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, minWidth: 46, flexShrink: 0 },
  scorePillHigh: { backgroundColor: "#d1fae5", borderWidth: 1, borderColor: "#a7f3d0" },
  scorePillMid:  { backgroundColor: "#fef3c7", borderWidth: 1, borderColor: "#fde68a" },
  scorePillLow:  { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  scoreText:     { fontSize: 16, fontWeight: "700" },
  scoreTextHigh: { color: "#065f46" },
  scoreTextMid:  { color: "#92400e" },
  scoreTextLow:  { color: "#374151" },
  scoreLabel:    { fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 },

  // ── Post Project inputs ──
  label:         { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 7 },
  labelHint:     { fontSize: 13, fontWeight: "400", color: "#9ca3af" },
  req:           { color: "#ef4444" },
  input:         { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827", backgroundColor: "#fff" },
  inputTall:     { minHeight: 90, textAlignVertical: "top" },
  inputErr:      { borderColor: "#dc2626" },
  err:           { fontSize: 12, color: "#dc2626", marginTop: 4 },
  skillChips:    { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  skillChip:     { backgroundColor: "#d1fae5", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#a7f3d0" },
  skillChipText: { fontSize: 12, color: "#065f46", fontWeight: "500" },
  msgBox:        { backgroundColor: "#fef2f2", borderRadius: 8, padding: 12, marginTop: 14, borderWidth: 1, borderColor: "#fecaca" },
  msgBoxSuccess: { backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" },
  msgText:       { fontSize: 14, color: "#dc2626", textAlign: "center" },
  msgTextSuccess:{ color: "#065f46" },
  modalBtns:     { flexDirection: "row", gap: 12, marginTop: 22 },
  cancelBtn:     { flex: 1, borderWidth: 1, borderColor: "#d1d5db", padding: 14, borderRadius: 10, alignItems: "center" },
  cancelBtnText: { color: "#374151", fontWeight: "600", fontSize: 15 },
  submitBtn:     { flex: 1, backgroundColor: G, padding: 14, borderRadius: 10, alignItems: "center" },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
