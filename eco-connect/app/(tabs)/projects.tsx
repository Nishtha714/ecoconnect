import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, ActivityIndicator, Image, Platform,
  useWindowDimensions, Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { addProject, getPublicProjects, updateProjectStatus, applyToProject } from "@/services/api";
import { getStoredUser, StoredUser } from "@/services/auth";



// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  g800: "#064e3b", g700: "#065f46", g600: "#059669",
  g500: "#10b981", g400: "#34d399", g200: "#a7f3d0",
  g100: "#d1fae5", g50:  "#f0fdf4",
  n900: "#0f172a", n800: "#1e293b", n700: "#334155",
  n600: "#475569", n400: "#94a3b8", n200: "#e2e8f0",
  n100: "#f1f5f9", n50:  "#f8fafc", white: "#ffffff",
  amber: "#f59e0b", blue: "#3b82f6", blue50: "#eff6ff",
  blue100: "#dbeafe", red50: "#fef2f2",
  purple: "#7c3aed", purple50: "#f5f3ff", purple100: "#ede9fe",
};
const F = {
  regular:   "Inter_400Regular",  medium:    "Inter_500Medium",
  semibold:  "Inter_600SemiBold", bold:      "Inter_700Bold",
  extrabold: "Inter_800ExtraBold",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Project = {
  project_id: string; title: string;
  required_skills?: string[]; budget?: number;
  timeline?: string; status: string;
  assigned_users?: string[]; scope?: string;
  client_email?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const SKILL_FILTERS = [
  "Solar Energy","Carbon Footprint","Waste Management",
  "Green Building","Supply Chain","Environmental Impact",
  "Renewable Energy","Climate Strategy",
];
const STATUS_TABS = [
  { key: "all",       label: "All Projects" },
  { key: "active",    label: "Open"         },
  { key: "completed", label: "Assigned"     },
];

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[sk.card, { opacity: anim }]}>
      <View style={sk.title} />
      <View style={sk.sub} />
      <View style={sk.row}>
        {[60, 90, 70].map((w, i) => <View key={i} style={[sk.chip, { width: w }]} />)}
      </View>
      <View style={sk.row}>
        {[80, 60, 80, 70].map((w, i) => <View key={i} style={[sk.meta, { width: w }]} />)}
      </View>
      <View style={sk.footer} />
    </Animated.View>
  );
};
const sk = StyleSheet.create({
  card:   { backgroundColor: C.white, borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: C.n200 },
  title:  { height: 18, backgroundColor: C.n100, borderRadius: 6, width: "65%", marginBottom: 10 },
  sub:    { height: 13, backgroundColor: C.n100, borderRadius: 6, width: "40%", marginBottom: 14 },
  row:    { flexDirection: "row", gap: 8, marginBottom: 14 },
  chip:   { height: 26, backgroundColor: C.n100, borderRadius: 6 },
  meta:   { height: 13, backgroundColor: C.n100, borderRadius: 6 },
  footer: { height: 36, backgroundColor: C.n100, borderRadius: 8, marginTop: 8 },
});

// ─── Project Detail Modal ─────────────────────────────────────────────────────
const DetailModal = ({
  project, visible, onClose, isChampion, isAdmin,
  hasApplied, applying, onApply, onAllocate,
}: {
  project: Project | null; visible: boolean; onClose: () => void;
  isChampion: boolean; isAdmin: boolean; hasApplied: boolean;
  applying: boolean; onApply: () => void; onAllocate: () => void;
}) => {
  if (!project) return null;
  const isOpen   = project.status === "active";
  const skills   = project.required_skills ?? [];
  const assigned = project.assigned_users  ?? [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={dm.overlay}>
        <TouchableOpacity style={dm.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={dm.sheet}>
          <View style={dm.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={dm.header}>
              <View style={{ flex: 1 }}>
                <View style={[dm.statusBadge, isOpen ? dm.statusOpen : dm.statusDone]}>
                  <View style={[dm.statusDot, { backgroundColor: isOpen ? C.g500 : C.n400 }]} />
                  <Text style={[dm.statusText, isOpen ? dm.statusTextOpen : dm.statusTextDone]}>
                    {isOpen ? "Open for Applications" : "Champion Assigned"}
                  </Text>
                </View>
                <Text style={dm.title}>{project.title}</Text>
                <Text style={dm.company}>EcoConnect Project</Text>
              </View>
              <TouchableOpacity style={dm.closeBtn} onPress={onClose}>
                <Text style={dm.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Key info cards */}
            <View style={dm.infoRow}>
              {project.budget != null && (
                <View style={dm.infoCard}>
                  <Text style={dm.infoIcon}>💰</Text>
                  <Text style={dm.infoVal}>₹{project.budget.toLocaleString()}</Text>
                  <Text style={dm.infoLbl}>Budget</Text>
                </View>
              )}
              {project.timeline ? (
                <View style={dm.infoCard}>
                  <Text style={dm.infoIcon}>⏱</Text>
                  <Text style={dm.infoVal}>{project.timeline}</Text>
                  <Text style={dm.infoLbl}>Timeline</Text>
                </View>
              ) : null}
              <View style={dm.infoCard}>
                <Text style={dm.infoIcon}>📍</Text>
                <Text style={dm.infoVal}>Remote</Text>
                <Text style={dm.infoLbl}>Location</Text>
              </View>
              <View style={dm.infoCard}>
                <Text style={dm.infoIcon}>👥</Text>
                <Text style={dm.infoVal}>{assigned.length}</Text>
                <Text style={dm.infoLbl}>Assigned</Text>
              </View>
            </View>

            {/* Description */}
            {project.scope ? (
              <View style={dm.section}>
                <Text style={dm.sectionTitle}>Project Description</Text>
                <Text style={dm.sectionBody}>{project.scope}</Text>
              </View>
            ) : null}

            {/* Skills */}
            {skills.length > 0 && (
              <View style={dm.section}>
                <Text style={dm.sectionTitle}>Required Skills</Text>
                <View style={dm.skillWrap}>
                  {skills.map((sk, i) => (
                    <View key={i} style={dm.skillChip}>
                      <Text style={dm.skillText}>{sk}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* What to expect — champions only */}
            {isChampion && (
              <View style={dm.expectBox}>
                <Text style={dm.expectTitle}>💡 How it works</Text>
                <Text style={dm.expectBody}>
                  Express your interest and our admin team will review your profile against this project.
                  If shortlisted, you'll be notified and onboarded within 2–3 business days.
                </Text>
              </View>
            )}

            {/* Assigned champions — admin only */}
            {isAdmin && assigned.length > 0 && (
              <View style={dm.section}>
                <Text style={dm.sectionTitle}>Assigned Champions</Text>
                {assigned.map((name, i) => (
                  <View key={i} style={dm.assignedRow}>
                    <View style={dm.assignedAvatar}>
                      <Text style={dm.assignedAvatarText}>
                        {String(name).split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={dm.assignedName}>{name}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* CTA */}
            <View style={dm.ctaArea}>
              {isChampion && isOpen && (
                hasApplied ? (
                  <View style={dm.appliedBadge}>
                    <Text style={dm.appliedText}>✅ You've expressed interest in this project</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[dm.applyBtn, applying && { opacity: 0.6 }]}
                    onPress={onApply}
                    disabled={applying}
                  >
                    {applying
                      ? <ActivityIndicator color={C.white} />
                      : <Text style={dm.applyBtnText}>Express Interest →</Text>}
                  </TouchableOpacity>
                )
              )}
              {isChampion && !isOpen && (
                <View style={[dm.appliedBadge, { backgroundColor: C.n100 }]}>
                  <Text style={[dm.appliedText, { color: C.n600 }]}>
                    This project has already been filled
                  </Text>
                </View>
              )}
              {isAdmin && (
                <TouchableOpacity style={dm.applyBtn} onPress={onAllocate}>
                  <Text style={dm.applyBtnText}>Go to Allocation →</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
const dm = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet:    { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, maxHeight: "90%" },
  handle:   { width: 40, height: 4, backgroundColor: C.n200, borderRadius: 2, alignSelf: "center", marginBottom: 20 },

  header:         { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 20 },
  statusBadge:    { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 10 },
  statusOpen:     { backgroundColor: C.g50 },
  statusDone:     { backgroundColor: C.n100 },
  statusDot:      { width: 7, height: 7, borderRadius: 4 },
  statusText:     { fontSize: 12, fontFamily: F.semibold },
  statusTextOpen: { color: C.g700 },
  statusTextDone: { color: C.n600 },
  title:          { fontSize: 22, fontFamily: F.extrabold, color: C.n900, lineHeight: 30, marginBottom: 4 },
  company:        { fontSize: 13, fontFamily: F.regular, color: C.n600 },
  closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: C.n100, justifyContent: "center", alignItems: "center" },
  closeBtnText:   { fontSize: 14, color: C.n600 },

  infoRow:  { flexDirection: "row", gap: 10, marginBottom: 24 },
  infoCard: { flex: 1, backgroundColor: C.n50, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: C.n200 },
  infoIcon: { fontSize: 20, marginBottom: 4 },
  infoVal:  { fontSize: 13, fontFamily: F.bold, color: C.n900, textAlign: "center" },
  infoLbl:  { fontSize: 11, fontFamily: F.regular, color: C.n600, marginTop: 2 },

  section:      { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontFamily: F.semibold, color: C.n800, marginBottom: 12 },
  sectionBody:  { fontSize: 14, fontFamily: F.regular, color: C.n600, lineHeight: 24 },

  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: { backgroundColor: C.blue50, borderWidth: 1, borderColor: C.blue100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  skillText: { fontSize: 13, fontFamily: F.medium, color: C.blue },

  expectBox:  { backgroundColor: C.purple50, borderWidth: 1, borderColor: C.purple100, borderRadius: 12, padding: 16, marginBottom: 22 },
  expectTitle:{ fontSize: 14, fontFamily: F.semibold, color: C.purple, marginBottom: 8 },
  expectBody: { fontSize: 13, fontFamily: F.regular, color: "#5b21b6", lineHeight: 22 },

  assignedRow:        { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.n100 },
  assignedAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: C.g100, justifyContent: "center", alignItems: "center" },
  assignedAvatarText: { fontSize: 13, fontFamily: F.bold, color: C.g700 },
  assignedName:       { fontSize: 14, fontFamily: F.medium, color: C.n800 },

  ctaArea:     { marginTop: 8, marginBottom: 8 },
  applyBtn:    { backgroundColor: C.g600, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  applyBtnText:{ color: C.white, fontFamily: F.bold, fontSize: 16 },
  appliedBadge:{ backgroundColor: C.g50, borderWidth: 1, borderColor: C.g200, padding: 16, borderRadius: 12, alignItems: "center" },
  appliedText: { fontSize: 14, fontFamily: F.medium, color: C.g700 },
});

// ─── Project Card ─────────────────────────────────────────────────────────────
const ProjectCard = ({
  p, isAdmin, isChampion, isGuest, hasApplied,
  onViewDetails, onAllocate, onMarkDone, onLoginPrompt,
}: {
  p: Project; isAdmin: boolean; isChampion: boolean;
  isGuest: boolean; hasApplied: boolean;
  onViewDetails: () => void; onAllocate: () => void;
  onMarkDone: () => void; onLoginPrompt: () => void;
}) => {
  const skills = p.required_skills ?? [];
  const isOpen = p.status === "active";

  return (
    <View style={pc.card}>
      <View style={pc.topRow}>
        <View style={[pc.statusDot, { backgroundColor: isOpen ? C.g500 : C.n400 }]} />
        <View style={{ flex: 1 }}>
          <Text style={pc.title} numberOfLines={2}>{p.title}</Text>
          <Text style={pc.company}>EcoConnect Project</Text>
        </View>
        <View style={[pc.badge, isOpen ? pc.badgeOpen : pc.badgeDone]}>
          <Text style={[pc.badgeText, isOpen ? pc.badgeTextOpen : pc.badgeTextDone]}>
            {isOpen ? "Open" : "Assigned"}
          </Text>
        </View>
      </View>

      {skills.length > 0 && (
        <View style={pc.skillRow}>
          {skills.slice(0, 3).map((sk, i) => (
            <View key={i} style={pc.skillChip}>
              <Text style={pc.skillText}>{sk}</Text>
            </View>
          ))}
          {skills.length > 3 && (
            <View style={pc.skillChipMuted}>
              <Text style={pc.skillTextMuted}>+{skills.length - 3} more</Text>
            </View>
          )}
        </View>
      )}

      {p.scope ? <Text style={pc.scopeText} numberOfLines={2}>{p.scope}</Text> : null}

      <View style={pc.metaRow}>
        <View style={pc.metaItem}>
          <Text style={pc.metaIcon}>📍</Text>
          <Text style={pc.metaText}>Remote</Text>
        </View>
        {p.budget != null && (
          <View style={pc.metaItem}>
            <Text style={pc.metaIcon}>💰</Text>
            <Text style={pc.metaText}>₹{p.budget.toLocaleString()}</Text>
          </View>
        )}
        {p.timeline ? (
          <View style={pc.metaItem}>
            <Text style={pc.metaIcon}>⏱</Text>
            <Text style={pc.metaText}>{p.timeline}</Text>
          </View>
        ) : null}
      </View>

      <View style={pc.divider} />

      <View style={pc.actions}>
        <Text style={pc.postedText}>Posted recently</Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>

          {/* Guest */}
          {isGuest && (
            <TouchableOpacity style={pc.lockBtn} onPress={onLoginPrompt}>
              <Text style={pc.lockText}>🔒 Sign in to view</Text>
            </TouchableOpacity>
          )}

          {/* Champion */}
          {isChampion && (
            hasApplied ? (
              <View style={pc.appliedTag}>
                <Text style={pc.appliedTagText}>✓ Applied</Text>
              </View>
            ) : (
              <TouchableOpacity style={pc.btnPrimary} onPress={onViewDetails}>
                <Text style={pc.btnPrimaryText}>View Details</Text>
              </TouchableOpacity>
            )
          )}

          {/* Admin */}
          {isAdmin && (
            <>
              <TouchableOpacity style={pc.btnPrimary} onPress={onViewDetails}>
                <Text style={pc.btnPrimaryText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={pc.btnGreen} onPress={onAllocate}>
                <Text style={pc.btnPrimaryText}>Allocate →</Text>
              </TouchableOpacity>
              {isOpen && (
                <TouchableOpacity style={pc.btnOutline} onPress={onMarkDone}>
                  <Text style={pc.btnOutlineText}>Done</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Client — no action */}
        </View>
      </View>
    </View>
  );
};
const pc = StyleSheet.create({
  card:           { backgroundColor: C.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.n200, marginBottom: 14, shadowColor: C.n900, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  topRow:         { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 14 },
  statusDot:      { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  title:          { fontSize: 16, fontFamily: F.bold, color: C.n900, marginBottom: 3 },
  company:        { fontSize: 13, fontFamily: F.regular, color: C.n600 },
  badge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeOpen:      { backgroundColor: C.g100 },
  badgeDone:      { backgroundColor: C.n100 },
  badgeText:      { fontSize: 12, fontFamily: F.semibold },
  badgeTextOpen:  { color: C.g700 },
  badgeTextDone:  { color: C.n600 },
  skillRow:       { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  skillChip:      { backgroundColor: C.blue50, borderWidth: 1, borderColor: C.blue100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  skillText:      { fontSize: 12, fontFamily: F.medium, color: C.blue },
  skillChipMuted: { backgroundColor: C.n100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  skillTextMuted: { fontSize: 12, fontFamily: F.medium, color: C.n600 },
  scopeText:      { fontSize: 13, fontFamily: F.regular, color: C.n600, lineHeight: 20, marginBottom: 12 },
  metaRow:        { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  metaItem:       { flexDirection: "row", alignItems: "center", gap: 4 },
  metaIcon:       { fontSize: 13 },
  metaText:       { fontSize: 13, fontFamily: F.regular, color: C.n600 },
  divider:        { height: 1, backgroundColor: C.n100, marginBottom: 14 },
  actions:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  postedText:     { fontSize: 12, fontFamily: F.regular, color: C.n400 },
  btnPrimary:     { backgroundColor: C.g600, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  btnGreen:       { backgroundColor: C.g800, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  btnPrimaryText: { color: C.white, fontSize: 13, fontFamily: F.semibold },
  btnOutline:     { borderWidth: 1, borderColor: C.n200, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8 },
  btnOutlineText: { fontSize: 13, fontFamily: F.medium, color: C.n700 },
  lockBtn:        { borderWidth: 1, borderColor: C.n200, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: C.n50 },
  lockText:       { fontSize: 13, fontFamily: F.medium, color: C.n600 },
  appliedTag:     { backgroundColor: C.g50, borderWidth: 1, borderColor: C.g200, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  appliedTagText: { fontSize: 13, fontFamily: F.semibold, color: C.g700 },
});

// ─── Post Project Modal ───────────────────────────────────────────────────────
const PostModal = ({
  visible, onClose, onSuccess,
}: { visible: boolean; onClose: () => void; onSuccess: () => void }) => {
  const [title, setTitle]       = useState("");
  const [skills, setSkills]     = useState("");
  const [budget, setBudget]     = useState("");
  const [timeline, setTimeline] = useState("");
  const [scope, setScope]       = useState("");
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]           = useState("");

  const reset = () => { setTitle(""); setSkills(""); setBudget(""); setTimeline(""); setScope(""); setErrors({}); setMsg(""); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim())  e.title    = "Project title is required";
    if (!skills.trim()) e.skills   = "At least one skill is required";
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0) e.budget = "Enter a valid budget amount";
    if (!timeline.trim()) e.timeline = "Timeline is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePost = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await addProject({
        title: title.trim(),
        required_skills: skills.split(",").map(s => s.trim()).filter(Boolean),
        budget: Number(budget), timeline: timeline.trim(),
        scope: scope.trim() || undefined,
      });
      reset(); onSuccess();
    } catch (err: any) {
      setMsg(err.message || "Something went wrong. Please try again.");
    } finally { setSubmitting(false); }
  };

  const fields = [
    { key: "title",    label: "Project Title",   value: title,    set: setTitle,    ph: "e.g. Solar Panel Installation",     numeric: false },
    { key: "skills",   label: "Required Skills", value: skills,   set: setSkills,   ph: "Solar Energy, Carbon Footprint...", numeric: false },
    { key: "budget",   label: "Budget (₹)",      value: budget,   set: setBudget,   ph: "e.g. 50000",                        numeric: true  },
    { key: "timeline", label: "Timeline",         value: timeline, set: setTimeline, ph: "e.g. 3 months",                     numeric: false },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <TouchableOpacity style={pm.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={pm.sheet}>
          <View style={pm.handle} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={pm.header}>
              <View>
                <Text style={pm.title}>Post a Project</Text>
                <Text style={pm.subtitle}>Fill in the details to find the right champion</Text>
              </View>
              <TouchableOpacity style={pm.closeBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={pm.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            {fields.map(f => (
              <View key={f.key} style={pm.fieldGroup}>
                <Text style={pm.label}>{f.label}</Text>
                <TextInput
                  style={[pm.input, errors[f.key] ? pm.inputErr : null]}
                  placeholder={f.ph} value={f.value} onChangeText={f.set}
                  keyboardType={f.numeric ? "numeric" : "default"}
                  placeholderTextColor={C.n400}
                />
                {errors[f.key] ? <Text style={pm.errText}>⚠ {errors[f.key]}</Text> : null}
              </View>
            ))}
            <View style={pm.fieldGroup}>
              <Text style={pm.label}>Description <Text style={pm.optional}>(optional)</Text></Text>
              <TextInput
                style={[pm.input, { height: 100, textAlignVertical: "top", paddingTop: 12 }]}
                placeholder="Describe what you're looking to achieve..."
                value={scope} onChangeText={setScope} multiline placeholderTextColor={C.n400}
              />
            </View>
            {msg ? <Text style={pm.errMsg}>{msg}</Text> : null}
            <TouchableOpacity
              style={[pm.submitBtn, submitting && pm.submitDisabled]}
              onPress={handlePost} disabled={submitting}
            >
              {submitting ? <ActivityIndicator color={C.white} /> : <Text style={pm.submitText}>Post Project</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={pm.cancelBtn} onPress={() => { reset(); onClose(); }}>
              <Text style={pm.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
const pm = StyleSheet.create({
  overlay:        { flex: 1, justifyContent: "flex-end" },
  backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet:          { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, maxHeight: "90%" },
  handle:         { width: 40, height: 4, backgroundColor: C.n200, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title:          { fontSize: 22, fontFamily: F.extrabold, color: C.n900 },
  subtitle:       { fontSize: 13, fontFamily: F.regular, color: C.n600, marginTop: 4 },
  closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: C.n100, justifyContent: "center", alignItems: "center" },
  closeBtnText:   { fontSize: 14, color: C.n600 },
  fieldGroup:     { marginBottom: 4 },
  label:          { fontSize: 13, fontFamily: F.semibold, color: C.n700, marginBottom: 8, marginTop: 16 },
  optional:       { fontFamily: F.regular, color: C.n400 },
  input:          { borderWidth: 1.5, borderColor: C.n200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: F.regular, color: C.n900, backgroundColor: C.n50 },
  inputErr:       { borderColor: "#ef4444" },
  errText:        { fontSize: 12, fontFamily: F.regular, color: "#ef4444", marginTop: 5 },
  errMsg:         { fontSize: 13, fontFamily: F.medium, color: "#ef4444", textAlign: "center", marginVertical: 12, backgroundColor: C.red50, padding: 12, borderRadius: 8 },
  submitBtn:      { backgroundColor: C.g600, paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 24 },
  submitDisabled: { opacity: 0.6 },
  submitText:     { color: C.white, fontFamily: F.bold, fontSize: 16 },
  cancelBtn:      { paddingVertical: 14, alignItems: "center" },
  cancelText:     { fontSize: 14, fontFamily: F.medium, color: C.n600 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Projects() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [user,          setUser]          = useState<StoredUser | null>(null);
  const [projects,      setProjects]      = useState<Project[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [selSkills,     setSelSkills]     = useState<string[]>([]);
  const [selStatus,     setSelStatus]     = useState("all");
  const [showPostModal, setShowPostModal] = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);
  const [toast,         setToast]         = useState("");
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [applying,      setApplying]      = useState(false);
  const [appliedIds,    setAppliedIds]    = useState<Set<string>>(new Set());

  useEffect(() => { 
  getStoredUser().then((u) => {
    setUser(u);
    // ✅ Yahan add karo
    if (u?.role !== "admin") {
      router.replace("/(tabs)/");
    }
  }); 
  fetchProjects(); 
}, []);
  const fetchProjects = async () => {
    setLoading(true);
    try { const d = await getPublicProjects(); setProjects(d ?? []); }
    catch { showToast("Failed to load projects"); }
    finally { setLoading(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleMarkDone = async (id: string) => {
    try { await updateProjectStatus(id, "completed"); fetchProjects(); showToast("✅ Project marked as done"); }
    catch { showToast("Failed to update status"); }
  };

  const handleApply = async () => {
    if (!detailProject || !user) return;
    setApplying(true);
    try {
      await applyToProject(detailProject.project_id);
      setAppliedIds(prev => new Set([...prev, detailProject.project_id]));
      setDetailProject(null);
      showToast("✅ Interest expressed! Admin will review your profile.");
    } catch (err: any) {
      showToast(err.message || "Failed to apply. Please try again.");
    } finally { setApplying(false); }
  };

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q)
      || (p.required_skills ?? []).some(s => s.toLowerCase().includes(q));
    const matchSkills = selSkills.length === 0
      || selSkills.some(sk => (p.required_skills ?? []).some(rs => rs.toLowerCase().includes(sk.toLowerCase())));
    const matchStatus = selStatus === "all" || p.status === selStatus;
    return matchSearch && matchSkills && matchStatus;
  });

  const isAdmin    = user?.role === "admin";
  const isChampion = user?.role === "freelancer";
  const isClient   = user?.role === "client";
  const isGuest    = !user;
  const canPost    = isAdmin || isClient;

  const openCount   = projects.filter(p => p.status === "active").length;
  const closedCount = projects.filter(p => p.status !== "active").length;

  return (
    <View style={{ flex: 1, backgroundColor: C.n50 }}>
      <ScrollView style={s.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* NAV */}
        <View style={[s.nav, isMobile && s.navMobile]}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/")}>
            <Image source={require("@/assets/images/logo.png")} style={isMobile ? s.logoMobile : s.logo} resizeMode="cover" />
          </TouchableOpacity>
          <View style={s.navRight}>
            {!isMobile && (
              <>
                <TouchableOpacity onPress={() => router.push("/(tabs)/")}><Text style={s.navLink}>Home</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/(tabs)/courses")}><Text style={s.navLink}>Courses</Text></TouchableOpacity>
              </>
            )}
            {canPost && (
              <TouchableOpacity style={s.postBtn} onPress={() => setShowPostModal(true)}>
                <Text style={s.postBtnText}>+ Post Project</Text>
              </TouchableOpacity>
            )}
            {isGuest && (
              <TouchableOpacity style={s.loginBtn} onPress={() => router.push("/login_1")}>
                <Text style={s.loginBtnText}>Log in</Text>
              </TouchableOpacity>
            )}
            {user && (
              <View style={s.avatarBtn}>
                <Text style={s.avatarText}>
                  {user.name.split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* PAGE HEADER */}
        <View style={[s.pageHeader, isMobile && s.pageHeaderMobile]}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>OPPORTUNITIES</Text>
            <Text style={[s.pageTitle, isMobile && s.pageTitleMobile]}>Browse Projects</Text>
            <Text style={s.pageSub}>
              {isGuest       ? "Sign in to view full details and express interest" :
               isChampion    ? "Find sustainability projects that match your expertise" :
               "Manage and allocate sustainability projects"}
            </Text>
          </View>
          {!isMobile && (
            <View style={s.statsPills}>
              <View style={s.statPill}><View style={[s.statDot, { backgroundColor: C.g500 }]} /><Text style={s.statPillText}>{openCount} Open</Text></View>
              <View style={s.statPill}><View style={[s.statDot, { backgroundColor: C.n400 }]} /><Text style={s.statPillText}>{closedCount} Assigned</Text></View>
              <View style={s.statPill}><Text style={s.statPillText}>{projects.length} Total</Text></View>
            </View>
          )}
        </View>

        {/* GUEST BANNER */}
        {isGuest && (
          <TouchableOpacity style={s.guestBanner} onPress={() => router.push("/login_1")}>
            <Text style={s.guestBannerIcon}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.guestBannerTitle}>Sign in to unlock full access</Text>
              <Text style={s.guestBannerSub}>Champions can view full details and express interest</Text>
            </View>
            <Text style={s.guestBannerArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={[s.body, isMobile && s.bodyMobile]}>

          {/* Mobile stats */}
          {isMobile && (
            <View style={s.mobileStatsRow}>
              <View style={s.mobileStatCard}><Text style={s.mobileStatVal}>{openCount}</Text><Text style={s.mobileStatLbl}>Open</Text></View>
              <View style={s.mobileStatCard}><Text style={s.mobileStatVal}>{closedCount}</Text><Text style={s.mobileStatLbl}>Assigned</Text></View>
              <View style={s.mobileStatCard}><Text style={s.mobileStatVal}>{projects.length}</Text><Text style={s.mobileStatLbl}>Total</Text></View>
            </View>
          )}

          {/* SEARCH */}
          <View style={s.searchRow}>
            <View style={s.searchBox}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput style={s.searchInput} placeholder="Search by title or skill..." value={search} onChangeText={setSearch} placeholderTextColor={C.n400} />
              {search !== "" && <TouchableOpacity onPress={() => setSearch("")}><Text style={{ color: C.n400, fontSize: 16, paddingRight: 4 }}>✕</Text></TouchableOpacity>}
            </View>
            {isMobile && (
              <TouchableOpacity
                style={[s.filterToggleBtn, (selSkills.length > 0 || selStatus !== "all") && s.filterToggleBtnActive]}
                onPress={() => setShowFilters(v => !v)}
              >
                <Text style={[s.filterToggleText, (selSkills.length > 0 || selStatus !== "all") && s.filterToggleTextActive]}>
                  ⚙ {selSkills.length + (selStatus !== "all" ? 1 : 0) > 0 ? `${selSkills.length + (selStatus !== "all" ? 1 : 0)}` : "Filter"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* STATUS TABS */}
          <View style={s.tabRow}>
            {STATUS_TABS.map(t => (
              <TouchableOpacity key={t.key} style={[s.tab, selStatus === t.key && s.tabActive]} onPress={() => setSelStatus(t.key)}>
                <Text style={[s.tabText, selStatus === t.key && s.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SKILL FILTERS */}
          {(!isMobile || showFilters) && (
            <View style={s.filtersCard}>
              <View style={s.filtersHeader}>
                <Text style={s.filterTitle}>Filter by Skill</Text>
                {selSkills.length > 0 && <TouchableOpacity onPress={() => setSelSkills([])}><Text style={s.clearText}>Clear</Text></TouchableOpacity>}
              </View>
              <View style={s.filterChipRow}>
                {SKILL_FILTERS.map(sk => {
                  const on = selSkills.includes(sk);
                  return (
                    <TouchableOpacity key={sk} style={[s.filterChip, on && s.filterChipOn]}
                      onPress={() => setSelSkills(prev => on ? prev.filter(s => s !== sk) : [...prev, sk])}>
                      <Text style={[s.filterChipText, on && s.filterChipTextOn]}>{sk}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* RESULTS HEADER */}
          <View style={s.resultsHeader}>
            <Text style={s.resultCount}>{loading ? "Loading..." : `${filtered.length} project${filtered.length !== 1 ? "s" : ""} found`}</Text>
            {(selSkills.length > 0 || selStatus !== "all" || search !== "") && (
              <TouchableOpacity onPress={() => { setSelSkills([]); setSelStatus("all"); setSearch(""); }}>
                <Text style={s.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* LIST */}
          {loading ? (
            [1, 2, 3].map(k => <SkeletonCard key={k} />)
          ) : filtered.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyEmoji}>🌿</Text>
              <Text style={s.emptyTitle}>No projects found</Text>
              <Text style={s.emptySub}>
                {search || selSkills.length > 0 || selStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "No projects have been posted yet"}
              </Text>
              {canPost && (
                <TouchableOpacity style={s.emptyPostBtn} onPress={() => setShowPostModal(true)}>
                  <Text style={s.emptyPostBtnText}>Post the first project →</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map(p => (
              <ProjectCard
                key={p.project_id} p={p}
                isAdmin={isAdmin} isChampion={isChampion}
                isGuest={isGuest} hasApplied={appliedIds.has(p.project_id)}
                onViewDetails={() => setDetailProject(p)}
                onAllocate={() => router.push(`/allocate?project_id=${p.project_id}` as any)}
                onMarkDone={() => handleMarkDone(p.project_id)}
                onLoginPrompt={() => router.push("/login_1")}
              />
            ))
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* DETAIL MODAL */}
      <DetailModal
        project={detailProject}
        visible={detailProject !== null}
        onClose={() => setDetailProject(null)}
        isChampion={isChampion}
        isAdmin={isAdmin}
        hasApplied={detailProject ? appliedIds.has(detailProject.project_id) : false}
        applying={applying}
        onApply={handleApply}
        onAllocate={() => {
          if (detailProject) { setDetailProject(null); router.push(`/allocate?project_id=${detailProject.project_id}` as any); }
        }}
      />

      {/* POST MODAL */}
      <PostModal
        visible={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSuccess={() => { setShowPostModal(false); fetchProjects(); showToast("✅ Project posted successfully!"); }}
      />

      {/* TOAST */}
      {toast !== "" && (
        <View style={s.toast}><Text style={s.toastText}>{toast}</Text></View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.n50 },

  nav:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: Platform.OS === "ios" ? 56 : 36, paddingBottom: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.n200 },
  navMobile:   { paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 52 : 28, paddingBottom: 12 },
  logo:        { width: 220, height: 50, borderRadius: 4 },
  logoMobile:  { width: 130, height: 36, borderRadius: 4 },
  navRight:    { flexDirection: "row", alignItems: "center", gap: 12 },
  navLink:     { fontSize: 14, fontFamily: F.medium, color: C.n600 },
  postBtn:     { backgroundColor: C.g600, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  postBtnText: { color: C.white, fontFamily: F.semibold, fontSize: 14 },
  loginBtn:    { borderWidth: 1.5, borderColor: C.n200, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  loginBtnText:{ fontSize: 14, fontFamily: F.medium, color: C.n700 },
  avatarBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: C.g600, justifyContent: "center", alignItems: "center" },
  avatarText:  { color: C.white, fontSize: 13, fontFamily: F.semibold },

  pageHeader:       { backgroundColor: C.white, paddingHorizontal: 24, paddingVertical: 28, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.n200 },
  pageHeaderMobile: { paddingHorizontal: 16, paddingVertical: 20, flexDirection: "column", alignItems: "flex-start" },
  eyebrow:          { fontSize: 11, fontFamily: F.bold, color: C.g600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  pageTitle:        { fontSize: 30, fontFamily: F.extrabold, color: C.n900, letterSpacing: -0.8, marginBottom: 6 },
  pageTitleMobile:  { fontSize: 24 },
  pageSub:          { fontSize: 14, fontFamily: F.regular, color: C.n600 },

  statsPills:   { flexDirection: "row", gap: 8 },
  statPill:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.n50, borderWidth: 1, borderColor: C.n200, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statDot:      { width: 7, height: 7, borderRadius: 4 },
  statPillText: { fontSize: 13, fontFamily: F.medium, color: C.n700 },

  guestBanner:      { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.g50, borderBottomWidth: 1, borderBottomColor: C.g100, paddingHorizontal: 20, paddingVertical: 14 },
  guestBannerIcon:  { fontSize: 20 },
  guestBannerTitle: { fontSize: 14, fontFamily: F.semibold, color: C.g800, marginBottom: 2 },
  guestBannerSub:   { fontSize: 12, fontFamily: F.regular, color: C.g700 },
  guestBannerArrow: { fontSize: 18, color: C.g600, fontFamily: F.bold },

  body:       { padding: 20 },
  bodyMobile: { padding: 14 },

  mobileStatsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  mobileStatCard: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: C.n200 },
  mobileStatVal:  { fontSize: 22, fontFamily: F.extrabold, color: C.g600 },
  mobileStatLbl:  { fontSize: 12, fontFamily: F.medium, color: C.n600, marginTop: 2 },

  searchRow:             { flexDirection: "row", gap: 10, marginBottom: 14 },
  searchBox:             { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderWidth: 1.5, borderColor: C.n200, borderRadius: 10, paddingHorizontal: 14 },
  searchIcon:            { fontSize: 16, marginRight: 8 },
  searchInput:           { flex: 1, paddingVertical: 13, fontSize: 14, fontFamily: F.regular, color: C.n900 },
  filterToggleBtn:       { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.n200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, justifyContent: "center" },
  filterToggleBtnActive: { borderColor: C.g600, backgroundColor: C.g50 },
  filterToggleText:      { fontSize: 13, fontFamily: F.medium, color: C.n600 },
  filterToggleTextActive:{ color: C.g700 },

  tabRow:        { flexDirection: "row", backgroundColor: C.white, borderRadius: 10, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: C.n200 },
  tab:           { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 7 },
  tabActive:     { backgroundColor: C.g600 },
  tabText:       { fontSize: 13, fontFamily: F.medium, color: C.n600 },
  tabTextActive: { color: C.white, fontFamily: F.semibold },

  filtersCard:       { backgroundColor: C.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.n200, marginBottom: 14 },
  filtersHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  filterTitle:       { fontSize: 13, fontFamily: F.semibold, color: C.n700 },
  clearText:         { fontSize: 13, fontFamily: F.medium, color: C.g600 },
  filterChipRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: C.n50, borderWidth: 1, borderColor: C.n200 },
  filterChipOn:      { backgroundColor: C.g50, borderColor: C.g200 },
  filterChipText:    { fontSize: 13, fontFamily: F.medium, color: C.n700 },
  filterChipTextOn:  { color: C.g700, fontFamily: F.semibold },

  resultsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  resultCount:   { fontSize: 13, fontFamily: F.medium, color: C.n600 },
  clearAllText:  { fontSize: 13, fontFamily: F.medium, color: C.g600 },

  emptyCard:        { backgroundColor: C.white, borderRadius: 16, padding: 48, alignItems: "center", borderWidth: 1, borderColor: C.n200 },
  emptyEmoji:       { fontSize: 44, marginBottom: 16 },
  emptyTitle:       { fontSize: 18, fontFamily: F.bold, color: C.n800, marginBottom: 8 },
  emptySub:         { fontSize: 14, fontFamily: F.regular, color: C.n600, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  emptyPostBtn:     { backgroundColor: C.g600, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  emptyPostBtnText: { color: C.white, fontFamily: F.semibold, fontSize: 14 },

  toast:     { position: "absolute", bottom: 24, alignSelf: "center", backgroundColor: C.n900, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 },
  toastText: { color: C.white, fontFamily: F.medium, fontSize: 14 },
});
