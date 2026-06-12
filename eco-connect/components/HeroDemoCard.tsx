// @ts-nocheck
/**
 * HeroDemoCard.tsx
 * Narrative flow animation that explains the EcoConnect platform to
 * a first-time visitor. Uses plain, jargon-free labels so any new
 * user can follow along immediately.
 *
 * Flow (loops ~11 s):
 *   STEP 1 — Client submits a private project brief
 *   STEP 2 — EcoConnect AI scans the verified expert network
 *   STEP 3 — Human review confirms the shortlist
 *   STEP 4 — Expert shortlist delivered <48 h
 */

import { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Animated, Easing, Platform,
} from "react-native";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const G   = "#059669";
const G2  = "#10b981";
const G3  = "#34d399";
const GD  = "#065f46";
const GL  = "#ecfdf5";
const SL  = "#0f172a";
const N8  = "#1e293b";
const N7  = "#334155";
const N6  = "#475569";
const N5  = "#64748b";
const N4  = "#94a3b8";
const N3  = "#cbd5e1";
const N2  = "#e2e8f0";
const N1  = "#f1f5f9";
const N0  = "#f8fafc";
const WHT = "#ffffff";

// ─── Step timing (ms) ──────────────────────────────────────────────────────────
const T = { s1: 2400, s2: 2600, s3: 2400, s4: 2800 };
const TOTAL = T.s1 + T.s2 + T.s3 + T.s4;

type Step = 1 | 2 | 3 | 4;

// ─── Simplified expert nodes — plain English, no jargon ───────────────────────
const EXPERTS = [
  { id: 0, sym: "PM",  label: "Project Manager",  sub: "Leads end-to-end delivery",    color: GD        },
  { id: 1, sym: "DA",  label: "Data Analyst",      sub: "Handles reports & insights",   color: "#0369a1" },
  { id: 2, sym: "STR", label: "Strategy Advisor",  sub: "Builds your action roadmap",   color: "#7c3aed" },
];

// ─── Plain-language brief tags ─────────────────────────────────────────────────
const BRIEF_TAGS = ["Project Management", "Data & Reporting", "Strategy Planning", "Team Coordination"];
// ─── Helpers ───────────────────────────────────────────────────────────────────
function useFadeIn(trigger: boolean, delay = 0, duration = 380) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty      = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(ty,      { toValue: 0, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      opacity.setValue(0);
      ty.setValue(8);
    }
  }, [trigger]);
  return { opacity, transform: [{ translateY: ty }] };
}

// ─── Animated tag chip ─────────────────────────────────────────────────────────
function TagChip({ label, delay, active }: { label: string; delay: number; active: boolean }) {
  const style = useFadeIn(active, delay);
  return (
    <Animated.View style={[st.tagChip, style]}>
      <Text style={st.tagChipText}>{label}</Text>
    </Animated.View>
  );
}

// ─── Animated expert card ──────────────────────────────────────────────────────
function ExpertCard({ expert, delay, active }: { expert: typeof EXPERTS[0]; delay: number; active: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const tx      = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    if (active) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(tx,      { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      opacity.setValue(0);
      tx.setValue(16);
    }
  }, [active]);
  return (
    <Animated.View style={[st.expertCard, { opacity, transform: [{ translateX: tx }] }]}>
      <View style={[st.expertAvatar, { backgroundColor: expert.color }]}>
        <Text style={st.expertAvatarText}>{expert.sym}</Text>
      </View>
      <View style={st.expertInfo}>
        <Text style={st.expertName}>{expert.label}</Text>
        <Text style={st.expertSub}>{expert.sub}</Text>
        <View style={st.kycBadge}><Text style={st.kycBadgeText}>✓ ID Verified</Text></View>
      </View>
    </Animated.View>
  );
}

// ─── Animated flow connector line ──────────────────────────────────────────────
function FlowLine({ active, delay = 0 }: { active: boolean; delay?: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (active) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scale, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0);
    }
  }, [active]);
  return (
    <Animated.View style={[
      st.flowLineH,
      { transform: [{ scaleX: scale }], transformOrigin: "0% 50%" } as any,
    ]} />
  );
}

// ─── Pulsing travel dot on flow lines ─────────────────────────────────────────
function TravelDot({ active, delay = 0 }: { active: boolean; delay?: number }) {
  const pos = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(pos, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pos, { toValue: 0, duration: 0,   useNativeDriver: true }),
        ])
      ).start();
    } else {
      pos.setValue(0);
    }
  }, [active]);
  const translateX = pos.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });
  return (
    <Animated.View style={[st.travelDot, { transform: [{ translateX }] }]} />
  );
}

// ─── Center engine node ────────────────────────────────────────────────────────
function EngineNode({ step }: { step: Step }) {
  const active = step >= 2;
  const scale  = useRef(new Animated.Value(0.7)).current;
  const glow   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
        Animated.timing(glow, { toValue: 1, duration: 600, useNativeDriver: false }),
      ]).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.05, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.00, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else {
      scale.setValue(0.7);
      glow.setValue(0);
    }
  }, [active]);

  const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: [N2, G] });
  const bgColor     = glow.interpolate({ inputRange: [0, 1], outputRange: [N0, GL] });

  const lines: { label: string; step: Step }[] = [
    { label: "Smart matching",  step: 2 },
    { label: "Expert vetting",  step: 3 },
    { label: "Final delivery",  step: 4 },
  ];

  return (
    <Animated.View style={[st.engineOuter, { transform: [{ scale }], borderColor, backgroundColor: bgColor } as any]}>
      <Text style={[st.engineTitle, active && { color: GD }]}>EcoConnect</Text>
      <Text style={[st.engineSub, active && { color: G }]}>Smart Match</Text>
      <View style={st.engineDivider} />
      {lines.map((l, i) => (
        <View key={i} style={st.engineLine}>
          <View style={[st.engineDot, step >= l.step && { backgroundColor: G }]} />
          <Text style={[st.engineLineText, step >= l.step && { color: GD, fontWeight: "600" }]}>{l.label}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function HeroDemoCard() {
  const [step, setStep]   = useState<Step>(1);
  const [key,  setKey]    = useState(0);
  const [score, setScore] = useState(0);

  // ── Phase sequencer ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const run = (k: number) => {
      if (cancelled) return;
      setStep(1); setKey(k); setScore(0);

      timers.push(setTimeout(() => { if (!cancelled) setStep(2); }, T.s1));
      timers.push(setTimeout(() => { if (!cancelled) setStep(3); }, T.s1 + T.s2));
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setStep(4);
        let s = 0;
        const inc = setInterval(() => {
          s = Math.min(s + 3, 97);
          setScore(s);
          if (s >= 97) clearInterval(inc);
        }, 24);
        timers.push(inc as any);
      }, T.s1 + T.s2 + T.s3));

      timers.push(setTimeout(() => run(k + 1), TOTAL));
    };

    run(0);
    return () => { cancelled = true; timers.forEach(t => clearTimeout(t)); };
  }, []);

  // ── Status bar config ──────────────────────────────────────────────────────
  const statusMap: Record<Step, { dot: string; msg: string }> = {
    1: { dot: N4, msg: "Your project brief received — finding the right experts…" },
    2: { dot: G2, msg: "Our AI is scanning the verified expert network…" },
    3: { dot: G,  msg: "Experts shortlisted — a human is confirming credentials…" },
    4: { dot: G3, msg: "Your expert shortlist is ready — delivered in under 48 h ✓" },
  };
  const sc = statusMap[step];

  // ── Pill config ────────────────────────────────────────────────────────────
  const pillMap: Record<Step, { label: string; bg: string; border: string; dot: string; text: string }> = {
    1: { label: "RECEIVING",  bg: N1, border: N2,         dot: N4, text: N5 },
    2: { label: "MATCHING",   bg: N1, border: G2 + "55",  dot: G2, text: N6 },
    3: { label: "REVIEWING",  bg: GL, border: G  + "55",  dot: G,  text: GD },
    4: { label: "MATCHED",    bg: GL, border: G  + "88",  dot: G,  text: GD },
  };
  const pc = pillMap[step];

  return (
    <View style={st.card}>

      {/* ── Browser chrome header ── */}
      <View style={st.header}>
        <View style={st.trafficLights}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c, i) => (
            <View key={i} style={[st.dot, { backgroundColor: c }]} />
          ))}
          <Text style={st.headerLabel}>EcoConnect · How It Works</Text>
        </View>
        <View style={[st.pill, { backgroundColor: pc.bg, borderColor: pc.border }]}>
          <View style={[st.pillDot, { backgroundColor: pc.dot }]} />
          <Text style={[st.pillText, { color: pc.text }]}>{pc.label}</Text>
        </View>
      </View>

      {/* ── Step progress pills ── */}
      <View style={st.stepRow}>
        {(["Submit", "AI Match", "Review", "Done"] as const).map((lbl, i) => {
          const s = (i + 1) as Step;
          const done    = step >  s;
          const current = step === s;
          return (
            <View key={i} style={st.stepItem}>
              <View style={[
                st.stepBubble,
                done    && { backgroundColor: G, borderColor: G },
                current && { borderColor: G },
              ]}>
                {done
                  ? <Text style={[st.stepNum, { color: WHT }]}>✓</Text>
                  : <Text style={[st.stepNum, current && { color: GD, fontWeight: "700" }]}>{s}</Text>
                }
              </View>
              <Text style={[st.stepLabel, (current || done) && { color: current ? GD : G }]}>{lbl}</Text>
              {i < 3 && <View style={[st.stepConnector, done && { backgroundColor: G }]} />}
            </View>
          );
        })}
      </View>

      {/* ── Main 3-column flow canvas ── */}
      <View style={st.canvas}>

        {/* ── LEFT: Client brief ── */}
        <View style={st.colLeft}>
          <View style={[st.briefCard, step > 1 && { borderColor: G + "44" }]}>
            <View style={st.briefTop}>
              <View style={st.lockBadge}><Text style={st.lockText}>🔒</Text></View>
              <View>
                <Text style={st.briefTitle}>Your Request</Text>
                <Text style={st.briefPrivate}>Private · Secure</Text>
              </View>
            </View>
            <View style={st.briefTags}>
              {BRIEF_TAGS.map((t, i) => (
                <TagChip key={`${key}-t${i}`} label={t} delay={i * 100 + 150} active={step >= 1} />
              ))}
            </View>
          </View>
        </View>

        {/* ── CENTER-LEFT: flow line → engine ── */}
        <View style={st.colConnector}>
          <View style={st.connectorWrap}>
            <FlowLine active={step >= 2} />
            <TravelDot active={step >= 2} />
          </View>
        </View>

        {/* ── CENTER: engine ── */}
        <View style={st.colCenter}>
          <EngineNode step={step} />
        </View>

        {/* ── CENTER-RIGHT: flow line → experts ── */}
        <View style={st.colConnector}>
          <View style={st.connectorWrap}>
            <FlowLine active={step >= 3} />
            <TravelDot active={step >= 3} />
          </View>
        </View>

        {/* ── RIGHT: expert shortlist ── */}
        <View style={st.colRight}>
          <View style={st.expertsWrap}>
            {EXPERTS.map((e, i) => (
              <ExpertCard
                key={`${key}-e${i}`}
                expert={e}
                delay={i * 200 + 100}
                active={step >= 3}
              />
            ))}
          </View>
        </View>

      </View>{/* /canvas */}

      {/* ── Step 4 completion banner ── */}
      {step === 4 && (
        <View style={st.completeBanner}>
          <View style={st.completeBadge}><Text style={st.completeBadgeText}>✓</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={st.completeTitle}>Experts Matched & Delivered</Text>
            <Text style={st.completeSub}>Reviewed & approved · Ready in under 48 hours</Text>
          </View>
          <View style={st.scoreChip}>
            <Text style={st.scoreVal}>{score}%</Text>
            <Text style={st.scoreLbl}>fit score</Text>
          </View>
        </View>
      )}

      {/* ── Stats strip ── */}
      <View style={st.statsRow}>
        <View style={[st.statCell, step === 4 && { backgroundColor: GL }]}>
          <Text style={[st.statVal, step === 4 && { color: GD }]}>
            {step === 4 ? `${score}%` : "—"}
          </Text>
          <Text style={st.statLbl}>FIT SCORE</Text>
        </View>
        <View style={[st.statCell, st.statCellMid]}>
          <Text style={st.statVal}>&lt;48h</Text>
          <Text style={st.statLbl}>DELIVERY TIME</Text>
        </View>
        <View style={st.statCell}>
          <Text style={[st.statVal, { color: G }]}>ID ✓</Text>
          <Text style={st.statLbl}>ALL VERIFIED</Text>
        </View>
      </View>

      {/* ── Status bar ── */}
      <View style={[st.statusBar, step === 4 && { backgroundColor: GD, borderTopColor: GD }]}>
        <View style={[st.statusDot, { backgroundColor: sc.dot }]} />
        <Text style={[st.statusMsg, step === 4 && { color: GL }]} numberOfLines={1}>
          {sc.msg}
        </Text>
      </View>

    </View>
  );
}

// ─── Easing polyfill (older RN builds) ────────────────────────────────────────
if (!Easing.sin) {
  (Easing as any).sin = (t: number) => 1 - Math.cos(t * Math.PI / 2);
}
if (!Easing.cubic) {
  (Easing as any).cubic = (t: number) => t * t * t;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  card: {
    width: 460,                          // enlarged for more breathing room
    backgroundColor: WHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: N2,
    overflow: "hidden",
    pointerEvents: "none",
    ...Platform.select({
      web:     { boxShadow: "0px 12px 36px rgba(15,23,42,0.10)" },
      ios:     { shadowColor: SL, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.10, shadowRadius: 32 },
      default: { elevation: 8 },
    }),
  },

  // ── Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: N0, borderBottomWidth: 1, borderBottomColor: N2,
    paddingHorizontal: 18, paddingVertical: 12,
  },
  trafficLights: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot:           { width: 9, height: 9, borderRadius: 5 },
  headerLabel:   { fontSize: 11, color: N5, fontWeight: "500", marginLeft: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  pillDot:  { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },

  // ── Step progress
  stepRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: N1,
    backgroundColor: WHT,
  },
  stepItem:      { flex: 1, alignItems: "center", position: "relative" },
  stepBubble: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: N3,
    backgroundColor: WHT,
    justifyContent: "center", alignItems: "center",
    marginBottom: 5,
  },
  stepNum:       { fontSize: 11, fontWeight: "600", color: N4 },
  stepLabel:     { fontSize: 10, color: N4, fontWeight: "500", textAlign: "center" },
  stepConnector: {
    position: "absolute", top: 13,
    left: "55%", right: "-55%",
    height: 1.5, backgroundColor: N2, zIndex: -1,
  },

  // ── Main canvas
  canvas: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 20,
    minHeight: 230,
    backgroundColor: N0,
    borderBottomWidth: 1,
    borderBottomColor: N1,
  },

  colLeft:      { flex: 1.1, alignItems: "flex-end",   paddingRight: 2  },
  colConnector: { width: 36, alignItems: "center", justifyContent: "center" },
  colCenter:    { flex: 1.2, alignItems: "center" },
  colRight:     { flex: 1.4, alignItems: "flex-start",  paddingLeft: 2   },

  // ── Flow lines
  connectorWrap: { width: 36, height: 60, alignItems: "flex-start", justifyContent: "center", position: "relative" },
  flowLineH: {
    position: "absolute",
    left: 0, top: "50%",
    width: 36, height: 1.5,
    backgroundColor: G + "55",
  },
  travelDot: {
    position: "absolute",
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: G,
    top: "50%",
    marginTop: -3.5,
    left: 0,
  },

  // ── Client brief card
  briefCard: {
    backgroundColor: WHT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: N2,
    padding: 11,
    width: 118,
    ...Platform.select({
      web:     { boxShadow: "0px 2px 8px rgba(15,23,42,0.06)" },
      ios:     { shadowColor: SL, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      default: { elevation: 2 },
    }),
  },
  briefTop:    { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  lockBadge: {
    width: 22, height: 22, borderRadius: 5,
    backgroundColor: GL, justifyContent: "center", alignItems: "center",
  },
  lockText:    { fontSize: 11 },
  briefTitle:  { fontSize: 10, fontWeight: "700", color: N8 },
  briefPrivate:{ fontSize: 8.5, color: N4 },
  briefTags:   { gap: 4 },

  // ── Tag chip
  tagChip: {
    backgroundColor: GL,
    borderRadius: 20,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: G + "30",
    alignSelf: "flex-start",
  },
  tagChipText: { fontSize: 8.5, color: GD, fontWeight: "600" },

  // ── Engine node
  engineOuter: {
    width: 104, height: 104, borderRadius: 52,
    borderWidth: 1.5, borderColor: N2,
    backgroundColor: N0,
    justifyContent: "center", alignItems: "center",
    ...Platform.select({
      web:     { boxShadow: "0px 4px 16px rgba(5,150,105,0.08)" },
      ios:     { shadowColor: G, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12 },
      default: { elevation: 4 },
    }),
  },
  engineTitle:    { fontSize: 9, fontWeight: "800", color: N7, letterSpacing: 0.3, textAlign: "center" },
  engineSub:      { fontSize: 8, color: N5, textAlign: "center", marginBottom: 5 },
  engineDivider:  { width: 44, height: 1, backgroundColor: N2, marginBottom: 4 },
  engineLine:     { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 },
  engineDot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: N3 },
  engineLineText: { fontSize: 7.5, color: N5 },

  // ── Expert cards
  expertsWrap: { gap: 6 },
  expertCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: WHT,
    borderRadius: 9, borderWidth: 1, borderColor: N2,
    paddingHorizontal: 9, paddingVertical: 8,
    width: 144,
    ...Platform.select({
      web:     { boxShadow: "0px 2px 6px rgba(15,23,42,0.06)" },
      ios:     { shadowColor: SL, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      default: { elevation: 2 },
    }),
  },
  expertAvatar: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  expertAvatarText: { fontSize: 8.5, fontWeight: "700", color: WHT },
  expertInfo:       { flex: 1 },
  expertName:       { fontSize: 9, fontWeight: "700", color: N8, marginBottom: 1 },
  expertSub:        { fontSize: 8, color: N5, marginBottom: 3 },
  kycBadge: {
    backgroundColor: G + "14",
    borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
    alignSelf: "flex-start",
    borderWidth: 1, borderColor: G + "30",
  },
  kycBadgeText: { fontSize: 7, color: GD, fontWeight: "700" },

  // ── Completion banner
  completeBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: GL,
    borderBottomWidth: 1, borderBottomColor: G + "30",
    paddingHorizontal: 18, paddingVertical: 11,
  },
  completeBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: G,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  completeBadgeText: { color: WHT, fontSize: 14, fontWeight: "700" },
  completeTitle:     { fontSize: 11, fontWeight: "700", color: GD },
  completeSub:       { fontSize: 9, color: G, marginTop: 1 },
  scoreChip: {
    alignItems: "center",
    backgroundColor: WHT,
    borderRadius: 8, borderWidth: 1, borderColor: G + "40",
    paddingHorizontal: 10, paddingVertical: 5,
    flexShrink: 0,
  },
  scoreVal: { fontSize: 14, fontWeight: "700", color: GD },
  scoreLbl: { fontSize: 8, color: G },

  // ── Stats strip
  statsRow:    { flexDirection: "row", borderTopWidth: 1, borderTopColor: N2 },
  statCell:    { flex: 1, paddingVertical: 11, alignItems: "center", backgroundColor: WHT },
  statCellMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: N2 },
  statVal:     { fontSize: 13, fontWeight: "700", color: SL, letterSpacing: -0.3 },
  statLbl:     { fontSize: 8.5, color: N4, marginTop: 2, fontWeight: "600", letterSpacing: 0.4 },

  // ── Status bar
  statusBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 18, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: N2,
    backgroundColor: N0, minHeight: 40,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
  statusMsg: { fontSize: 11, fontWeight: "500", color: N6, flex: 1 },
});
