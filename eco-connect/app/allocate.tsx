import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, TextInput, Modal, useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getProjectById, suggestUsers, adminDecision, getProjectAllocationHistory,
} from "@/services/api";
import { useGuard } from "@/services/auth";

const G = "#059669";

type Candidate      = { user_id: string; name: string; skills: string[]; score: number; earnings: number; };
type AllocationRecord = { allocation_id: string; user_name: string; decision: string; notes?: string; decided_at: string; };
type Project        = { project_id: string; title: string; required_skills?: string[]; budget: number; timeline?: string; assigned_users?: string[]; status: string; };

export default function Allocate() {
  const { project_id } = useLocalSearchParams<{ project_id: string }>();
  const router = useRouter();
  const { ready } = useGuard("admin");
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [project,       setProject]       = useState<Project | null>(null);
  const [candidates,    setCandidates]    = useState<Candidate[]>([]);
  const [history,       setHistory]       = useState<AllocationRecord[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [acting,        setActing]        = useState<string | null>(null);
  const [toast,         setToast]         = useState("");
  const [notesModal,    setNotesModal]    = useState(false);
  const [pendingUser,   setPendingUser]   = useState<Candidate | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "reshortlist" | null>(null);
  const [notes,         setNotes]         = useState("");

  useEffect(() => { if (project_id && ready) loadAll(); }, [project_id, ready]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const loadAll = async () => {
    try {
      const [proj, allocs] = await Promise.all([
        getProjectById(project_id),
        getProjectAllocationHistory(project_id),
      ]);
      setProject(proj);
      setHistory(allocs);
      await loadCandidates(proj.required_skills ?? []);
    } catch (e) {
      console.log("LOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async (skills: string[]) => {
    try {
      const data = await suggestUsers(skills);
      setCandidates(data);
    } catch (e) {
      console.log("SUGGEST ERROR:", e);
    }
  };

  const openDecision = (user: Candidate, action: "approve" | "reshortlist") => {
    setPendingUser(user); setPendingAction(action); setNotes(""); setNotesModal(true);
  };

  const confirmDecision = async () => {
    if (!pendingUser || !pendingAction) return;
    setNotesModal(false);
    setActing(pendingUser.user_id);
    try {
      const res = await adminDecision(project_id, pendingUser.user_id, pendingAction, notes.trim() || undefined);
      showToast(res.message);
      loadAll();
    } catch (err: any) {
      showToast(err.message || "Action failed");
    } finally {
      setActing(null); setPendingUser(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-IN")} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const initials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  if (!ready) return null;

  if (loading) return (
    <View style={s.centered}><ActivityIndicator size="large" color={G} /></View>
  );

  if (!project) return (
    <View style={s.centered}>
      <Text style={s.emptyText}>Project not found.</Text>
      <TouchableOpacity style={s.backBtnAlt} onPress={() => router.back()}>
        <Text style={s.backBtnAltText}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.page} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>← Back to Dashboard</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Decision Gate</Text>
          <Text style={s.headerSub} numberOfLines={2}>{project.title}</Text>
        </View>

        <View style={[s.body, isMobile && s.bodyMobile]}>

          {/* ── Project summary card ── */}
          <View style={s.summaryCard}>
            {[
              { label: "Budget",   val: `₹${project.budget?.toLocaleString()}` },
              { label: "Timeline", val: project.timeline ?? "—" },
              { label: "Status",   val: project.status },
              { label: "Skills",   val: (project.required_skills ?? []).join(", ") || "—" },
              ...(project.assigned_users?.length
                ? [{ label: "Assigned", val: project.assigned_users.join(", ") }]
                : []),
            ].map((r) => (
              <View key={r.label} style={s.summaryRow}>
                <Text style={s.summaryLabel}>{r.label}</Text>
                <Text style={s.summaryValue} numberOfLines={2}>{r.val}</Text>
              </View>
            ))}
          </View>

          {/* ── AI Suggested Candidates ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              🤖 AI-Suggested Candidates ({candidates.length})
            </Text>

            {candidates.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>🔍</Text>
                <Text style={s.emptyTitle}>No candidates found</Text>
                <Text style={s.emptyText}>
                  No champions matched the required skills yet.
                </Text>
              </View>
            ) : (
              candidates.map((c) => (
                <View key={c.user_id} style={s.candidateCard}>
                  {/* Candidate header */}
                  <View style={s.candidateHeader}>
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>{initials(c.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.candidateName}>{c.name}</Text>
                      <Text style={s.candidateSkills} numberOfLines={2}>
                        {(c.skills ?? []).join(", ") || "No skills listed"}
                      </Text>
                      {c.earnings > 0 && (
                        <Text style={s.candidateEarnings}>
                          ₹{c.earnings.toLocaleString()} earned
                        </Text>
                      )}
                    </View>
                    <View style={[
                      s.scoreChip,
                      c.score >= 70 ? s.scoreHigh : c.score >= 40 ? s.scoreMid : s.scoreLow,
                    ]}>
                      <Text style={[
                        s.scoreText,
                        c.score >= 70 ? s.scoreTextHigh : c.score >= 40 ? s.scoreTextMid : s.scoreTextLow,
                      ]}>
                        {Math.round(c.score)}
                      </Text>
                      <Text style={s.scoreLabel}>score</Text>
                    </View>
                  </View>

                  {/* Score bar */}
                  <View style={s.barTrack}>
                    <View style={[s.barFill, {
                      width: `${Math.min(c.score * 20, 100)}%` as any,
                      backgroundColor: c.score >= 70 ? G : c.score >= 40 ? "#f59e0b" : "#d1d5db",
                    }]} />
                  </View>

                  {/* Action buttons */}
                  <View style={s.decisionRow}>
                    <TouchableOpacity
                      style={[s.approveBtn, acting === c.user_id && { opacity: 0.5 }]}
                      onPress={() => openDecision(c, "approve")}
                      disabled={acting === c.user_id}
                    >
                      {acting === c.user_id
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={s.approveBtnText}>✓ Approve</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.reshortlistBtn, acting === c.user_id && { opacity: 0.5 }]}
                      onPress={() => openDecision(c, "reshortlist")}
                      disabled={acting === c.user_id}
                    >
                      <Text style={s.reshortlistBtnText}>↺ Re-shortlist</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* ── Decision History ── */}
          {history.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>📋 Decision History</Text>
              <View style={s.historyCard}>
                {history.map((h, i) => (
                  <View key={h.allocation_id} style={[
                    s.historyRow,
                    i === history.length - 1 && { borderBottomWidth: 0 },
                  ]}>
                    <View style={[
                      s.historyBadge,
                      h.decision === "approve" ? s.historyBadgeGreen : s.historyBadgeAmber,
                    ]}>
                      <Text style={[
                        s.historyBadgeText,
                        { color: h.decision === "approve" ? "#065f46" : "#92400e" },
                      ]}>
                        {h.decision === "approve" ? "✓ Approved" : "↺ Reshortlisted"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.historyName}>{h.user_name}</Text>
                      {h.notes ? (
                        <Text style={s.historyNotes}>"{h.notes}"</Text>
                      ) : null}
                      <Text style={s.historyDate}>{formatDate(h.decided_at)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Toast — outside ScrollView so it floats correctly ── */}
      {toast ? (
        <View style={s.toast} pointerEvents="none">
          <Text style={s.toastText}>{toast}</Text>
        </View>
      ) : null}

      {/* ── Notes modal ── */}
      <Modal visible={notesModal} transparent animationType="fade" onRequestClose={() => setNotesModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>
              {pendingAction === "approve" ? "✓ Approve candidate?" : "↺ Re-shortlist candidate?"}
            </Text>
            {pendingUser && (
              <Text style={s.modalSub}>{pendingUser.name}</Text>
            )}

            <Text style={s.label}>Notes <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(optional)</Text></Text>
            <TextInput
              style={s.input}
              placeholder="Add a reason or note..."
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor="#9ca3af"
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[
                  s.modalConfirmBtn,
                  pendingAction === "reshortlist" && { backgroundColor: "#f59e0b" },
                ]}
                onPress={confirmDecision}
              >
                <Text style={s.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setNotesModal(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: "#f9fafb" },
  centered:{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },

  // Header
  header:      { backgroundColor: "#065f46", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  backBtn:     { marginBottom: 12 },
  backText:    { color: "#a7f3d0", fontSize: 13, fontWeight: "500" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 4 },
  headerSub:   { color: "#6ee7b7", fontSize: 14 },

  body:       { padding: 16 },
  bodyMobile: { padding: 12 },

  // Summary card
  summaryCard:  { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  summaryRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  summaryLabel: { fontSize: 13, color: "#6b7280", flex: 1 },
  summaryValue: { fontSize: 13, color: "#111827", fontWeight: "500", flex: 2, textAlign: "right" },

  // Section
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 },

  // Empty state
  emptyBox:   { backgroundColor: "#fff", borderRadius: 12, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", gap: 8 },
  emptyIcon:  { fontSize: 32 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  emptyText:  { fontSize: 13, color: "#6b7280", textAlign: "center" },

  // Candidate card
  candidateCard:   { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  candidateHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  avatar:          { width: 44, height: 44, borderRadius: 22, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", flexShrink: 0, borderWidth: 1.5, borderColor: "#a7f3d0" },
  avatarText:      { fontSize: 14, fontWeight: "700", color: "#065f46" },
  candidateName:   { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 3 },
  candidateSkills: { fontSize: 12, color: "#6b7280", lineHeight: 17 },
  candidateEarnings:{ fontSize: 12, color: G, fontWeight: "500", marginTop: 3 },

  // Score chip
  scoreChip:     { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexShrink: 0, minWidth: 48 },
  scoreHigh:     { backgroundColor: "#d1fae5", borderWidth: 1, borderColor: "#a7f3d0" },
  scoreMid:      { backgroundColor: "#fef3c7", borderWidth: 1, borderColor: "#fde68a" },
  scoreLow:      { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  scoreText:     { fontSize: 18, fontWeight: "700" },
  scoreTextHigh: { color: "#065f46" },
  scoreTextMid:  { color: "#92400e" },
  scoreTextLow:  { color: "#374151" },
  scoreLabel:    { fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 },

  // Score bar
  barTrack: { height: 4, backgroundColor: "#f3f4f6", borderRadius: 2, marginBottom: 14 },
  barFill:  { height: 4, borderRadius: 2 },

  // Decision buttons
  decisionRow:        { flexDirection: "row", gap: 10 },
  approveBtn:         { flex: 1, backgroundColor: G, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  approveBtnText:     { color: "#fff", fontWeight: "600", fontSize: 14 },
  reshortlistBtn:     { flex: 1, backgroundColor: "#fef3c7", paddingVertical: 10, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#fde68a" },
  reshortlistBtnText: { color: "#92400e", fontWeight: "600", fontSize: 14 },

  // History
  historyCard:        { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },
  historyRow:         { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  historyBadge:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexShrink: 0 },
  historyBadgeGreen:  { backgroundColor: "#d1fae5" },
  historyBadgeAmber:  { backgroundColor: "#fef3c7" },
  historyBadgeText:   { fontSize: 11, fontWeight: "600" },
  historyName:        { fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 2 },
  historyNotes:       { fontSize: 12, color: "#6b7280", fontStyle: "italic", marginBottom: 3 },
  historyDate:        { fontSize: 11, color: "#9ca3af" },

  // Toast — floats over content
  toast:     { position: "absolute", bottom: 24, alignSelf: "center", backgroundColor: "#065f46", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "500" },

  // Modal
  modalOverlay:    { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 24 },
  modalBox:        { backgroundColor: "#fff", borderRadius: 16, padding: 24 },
  modalTitle:      { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 4 },
  modalSub:        { fontSize: 14, color: "#6b7280", marginBottom: 16 },
  label:           { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 7 },
  input:           { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, fontSize: 15, minHeight: 80, textAlignVertical: "top", color: "#111827", backgroundColor: "#fff" },
  modalActions:    { flexDirection: "row", gap: 10, marginTop: 20 },
  modalConfirmBtn: { flex: 1, backgroundColor: G, padding: 13, borderRadius: 10, alignItems: "center" },
  modalConfirmText:{ color: "#fff", fontWeight: "700", fontSize: 15 },
  modalCancelBtn:  { flex: 1, padding: 13, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#d1d5db" },
  modalCancelText: { color: "#374151", fontWeight: "500", fontSize: 15 },

  // Fallback buttons
  backBtnAlt:     { marginTop: 16, borderWidth: 1, borderColor: "#d1d5db", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnAltText: { color: "#374151", fontWeight: "500" },
});
