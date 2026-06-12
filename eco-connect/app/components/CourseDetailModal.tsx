import { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  useWindowDimensions, Image, Animated, Modal, Platform, StatusBar,
} from "react-native";

const G = "#059669";
const DARK = "#064e3b";

const COURSES = [
  { id: "fic", type: "Workshop", status: "ongoing", title: "Future-In-Charge: Skilling Programme for India's Charging Infrastructure", skills: ["EV Charging", "Infrastructure", "Renewable Energy"], duration: "1st May – 15th June 2026", location: "Gurugram, Haryana", organizer: "Ministry of Environment, Forest and Climate Change, Govt. of India", knowledgePartners: ["FITT", "EVI Technologies"], trainingPartner: "EcoConnect", accentColor: "#3b82f6", bannerColor: "#0c2340" },
  { id: "gsdp", type: "Course", status: "completed", title: "Green Skill Development Programme (GSDP) on EV Charging Installation Technician", skills: ["EV Charging", "Installation", "Green Skills"], location: "EcoConnect COE & Infrastructure Lab, Gurugram", organizer: "TERI EIACP RP on Renewable Energy and Climate Change", knowledgePartners: ["TERI"], trainingPartner: "EcoConnect", accentColor: G, bannerColor: DARK },
];

const FILTERS = ["All", "Workshop", "Course"];

const GALLERIES: Record<string, any[]> = {
  gsdp: [require("../../assets/images/gsdpimg1.jpeg"), require("../../assets/images/gsdpimg2.jpeg"), require("../../assets/images/gsdpimg3.jpeg"), require("../../assets/images/gsdpimg4.jpeg"), require("../../assets/images/gsdpimg5.jpeg")],
  fic: [require("../../assets/images/fic1.jpg"), require("../../assets/images/fic2.jpg"), require("../../assets/images/fic3.jpg"), require("../../assets/images/fic4.jpg"), require("../../assets/images/fic5.jpg")],
};

const GALLERY_CAPTIONS: Record<string, string[]> = {
  gsdp: ["Certification Day", "First Site Visit", "First Training Day", "Sessions", "Fun Day"],
  fic: ["Inagural Session", "Lab Training", "Group Activity", "Site Visit", "Workshop Highlights"],
};

const COURSE_SLIDES: Record<string, { bannerColor: string; accentColor: string; primaryColor: string; slides: { tag: string; headline: string[]; headlineAccentIndex: number; sub: string; visual: "gallery" | "highlights" | "details" | "skills" | "cta" }[] }> = {
  gsdp: {
    bannerColor: "#052e16", accentColor: "#4ade80", primaryColor: "#16a34a",
    slides: [
      { tag: "GREEN SKILL DEVELOPMENT PROGRAMME", headline: ["Hands-On", "EV Charging", "Training"], headlineAccentIndex: 1, sub: "A government-certified programme training candidates as EV Charging Installation Technicians at EcoConnect's Centre of Excellence, Gurugram.", visual: "gallery" },
      { tag: "PROGRAMME HIGHLIGHTS", headline: ["What You'll", "Learn &", "Experience"], headlineAccentIndex: 2, sub: "Live installation training · TERI certification · Safety modules · Real site visits", visual: "highlights" },
      { tag: "PROGRAMME DETAILS", headline: ["Location,", "Duration &", "Partners"], headlineAccentIndex: 0, sub: "Conducted at EcoConnect COE & Infrastructure Lab, Gurugram under Govt. of India's GSDP.", visual: "details" },
      { tag: "SKILLS COVERED", headline: ["Skills You", "Walk Away", "With"], headlineAccentIndex: 1, sub: "EV Charging · Installation · Green Skills — certified by TERI under Govt. of India.", visual: "skills" },
      { tag: "PROGRAMME COMPLETED", headline: ["Successfully", "Concluded.", ""], headlineAccentIndex: 0, sub: "This programme has been successfully concluded. Stay tuned for upcoming batches.", visual: "cta" },
    ],
  },
  fic: {
    bannerColor: "#0c2340", accentColor: "#60a5fa", primaryColor: "#1d4ed8",
    slides: [
      { tag: "FUTURE-IN-CHARGE", headline: ["India's EV", "Charging", "Revolution"], headlineAccentIndex: 2, sub: "A Ministry of Environment, Forest and Climate Change initiative skilling professionals for India's rapidly growing EV charging infrastructure sector.", visual: "gallery" },
      { tag: "PROGRAMME HIGHLIGHTS", headline: ["Industry-Led", "World-Class", "Curriculum"], headlineAccentIndex: 1, sub: "FITT & EVI Technologies · Hands-on labs · Government certification · Placement support", visual: "highlights" },
      { tag: "PROGRAMME DETAILS", headline: ["Duration,", "Location &", "Organiser"], headlineAccentIndex: 0, sub: "1st May – 15th June 2026 · Gurugram, Haryana · Organised by MoEFCC, Govt. of India.", visual: "details" },
      { tag: "SKILLS COVERED", headline: ["Future-Proof", "Skills For", "You"], headlineAccentIndex: 2, sub: "EV Charging · Infrastructure · Renewable Energy — backed by Mercedes-Benz, FITT & TERI.", visual: "skills" },
      { tag: "ENROL NOW", headline: ["Be Part Of", "India's Green", "Future"], headlineAccentIndex: 1, sub: "Register your interest today and take the first step towards a career in EV infrastructure.", visual: "cta" },
    ],
  },
};

const COURSE_DATA: Record<string, { type: string; status: string; title: string; duration?: string; location: string; organizer: string; skills: string[]; knowledgePartners: string[]; trainingPartner: string; highlights: string[] }> = {
  gsdp: {
    type: "Course", status: "completed", title: "Green Skill Development Programme (GSDP) on EV Charging Installation Technician",
    location: "EcoConnect COE & Infrastructure Lab, Gurugram", organizer: "TERI EIACP RP on Renewable Energy and Climate Change",
    skills: ["EV Charging", "Installation", "Green Skills"], knowledgePartners: ["TERI"], trainingPartner: "EcoConnect",
    highlights: ["Live installation training at EcoConnect's COE", "Certified by TERI under Govt. of India's GSDP", "Safety, wiring & commissioning modules", "Site visits to real charging infrastructure"],
  },
  fic: {
    type: "Workshop", status: "ongoing", title: "Future-In-Charge: Skilling Programme for India's Charging Infrastructure",
    duration: "1st May – 15th June 2026", location: "Gurugram, Haryana", organizer: "Ministry of Environment, Forest and Climate Change, Govt. of India",
    skills: ["EV Charging", "Infrastructure", "Renewable Energy"], knowledgePartners: ["FITT", "EVI Technologies", "TERI"], trainingPartner: "EcoConnect",
    highlights: ["Industry-led curriculum by FITT & EVI Technologies", "Hands-on infrastructure lab sessions", "Government certification on completion", "Placement support through EcoConnect network"],
  },
};

function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, transform: [{ scale }], marginRight: 5 }} />;
}

function GalleryVisual({ images, captions, accentColor, paused, onTogglePause }: {
  images: any[]; captions: string[]; accentColor: string; paused: boolean; onTogglePause: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const fadeAnims = useRef(images.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const jumpTo = useCallback((next: number) => {
    const prev = activeIdx;
    Animated.parallel([
      Animated.timing(fadeAnims[prev], { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeAnims[next], { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    setActiveIdx(next);
  }, [activeIdx, fadeAnims]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (images.length <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => {
        const next = (prev + 1) % images.length;
        Animated.parallel([
          Animated.timing(fadeAnims[prev], { toValue: 0, duration: 600, useNativeDriver: true }),
          Animated.timing(fadeAnims[next], { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
        return next;
      });
    }, 2500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length, paused]);

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={onTogglePause} style={vs.pauseBadge}>
        <Text style={vs.pauseBadgeText}>{paused ? "▶  Resume" : "⏸  Pause"}</Text>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.95} onPress={onTogglePause} style={vs.galleryWrap}>
        {images.map((src, i) => (
          <Animated.View key={i} style={[StyleSheet.absoluteFillObject, { opacity: fadeAnims[i] }]}>
            <Image source={src} style={vs.galleryImg} resizeMode="cover" />
          </Animated.View>
        ))}
        {paused && (
          <View style={vs.pauseOverlay}>
            <View style={vs.pauseIconCircle}><Text style={vs.pauseIconText}>⏸</Text></View>
          </View>
        )}
        <View style={vs.galleryBottom}>
          <Text style={vs.captionText} numberOfLines={1}>{captions[activeIdx] ?? ""}</Text>
          <View style={vs.dotsRow}>
            {images.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => jumpTo(i)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
                <View style={[vs.dot, { backgroundColor: i === activeIdx ? "#fff" : "rgba(255,255,255,0.3)", width: i === activeIdx ? 14 : 5 }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
      <Text style={[vs.imgCounter, { color: accentColor }]}>{activeIdx + 1} / {images.length}</Text>
    </View>
  );
}

function HighlightsVisual({ highlights, accentColor }: { highlights: string[]; accentColor: string }) {
  return (
    <View style={{ gap: 8, flex: 1, justifyContent: "center" }}>
      {highlights.map((h, i) => (
        <View key={i} style={[vs.hlCard, { borderColor: accentColor + "30" }]}>
          <View style={[vs.hlDot, { borderColor: accentColor, backgroundColor: accentColor + "20" }]} />
          <Text style={vs.hlText}>{h}</Text>
        </View>
      ))}
    </View>
  );
}

function DetailsVisual({ data, accentColor }: { data: typeof COURSE_DATA[string]; accentColor: string }) {
  const rows = [
    ...(data.duration ? [{ icon: "📅", label: "Duration", value: data.duration }] : []),
    { icon: "📍", label: "Location", value: data.location },
    { icon: "🏛️", label: "Organised by", value: data.organizer },
    { icon: "🎓", label: "Training Partner", value: data.trainingPartner },
  ];
  return (
    <View style={{ gap: 8, flex: 1, justifyContent: "center" }}>
      {rows.map((r, i) => (
        <View key={i} style={vs.detailCard}>
          <Text style={vs.detailIcon}>{r.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[vs.detailLabel, { color: accentColor }]}>{r.label}</Text>
            <Text style={vs.detailValue} numberOfLines={2}>{r.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function SkillsVisual({ skills, partners, accentColor }: { skills: string[]; partners: string[]; accentColor: string }) {
  return (
    <View style={{ gap: 10, flex: 1, justifyContent: "center" }}>
      <View style={vs.pillSection}>
        <Text style={[vs.miniLabel, { color: accentColor }]}>SKILLS</Text>
        <View style={vs.pillRow}>
          {skills.map((s, i) => (
            <View key={i} style={[vs.skillPill, { borderColor: accentColor + "50", backgroundColor: accentColor + "15" }]}>
              <Text style={[vs.skillPillText, { color: accentColor }]}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={vs.pillSection}>
        <Text style={[vs.miniLabel, { color: accentColor }]}>KNOWLEDGE PARTNERS</Text>
        <View style={vs.pillRow}>
          {partners.map((p, i) => (
            <View key={i} style={vs.partnerPill}>
              <Text style={vs.partnerPillText}>{p}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function CtaVisual({ status, accentColor, primaryColor }: { status: string; accentColor: string; primaryColor: string }) {
  const scale = useRef(new Animated.Value(0.88)).current;
  useEffect(() => { Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start(); }, []);
  const isOngoing = status === "ongoing";
  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1, justifyContent: "center" }}>
      <View style={[vs.ctaCard, { borderColor: accentColor + "38" }]}>
        <Text style={{ fontSize: 30, marginBottom: 6 }}>{isOngoing ? "🚀" : "✅"}</Text>
        <Text style={[vs.ctaTitle, { color: accentColor }]}>{isOngoing ? "Enrol Now" : "Programme Completed"}</Text>
        <Text style={vs.ctaSub}>{isOngoing ? "Register your interest and join India's green energy workforce." : "This programme has concluded. Stay tuned for upcoming batches."}</Text>
        {isOngoing && (
          <View style={[vs.ctaBtn, { backgroundColor: primaryColor }]}>
            <Text style={vs.ctaBtnText}>Register Interest →</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function CourseDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;

  const courseSlideData = COURSE_SLIDES[id];
  const courseData = COURSE_DATA[id];
  const images = GALLERIES[id] ?? [];
  const captions = GALLERY_CAPTIONS[id] ?? [];

  const [current, setCurrent] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const [globalPaused, setGlobalPaused] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressValRef = useRef(0);
  const globalPausedRef = useRef(false);

  useEffect(() => {
    const lid = progressAnim.addListener(({ value }) => { progressValRef.current = value; });
    return () => progressAnim.removeListener(lid);
  }, [progressAnim]);

  if (!courseSlideData || !courseData) return null;

  const { slides, accentColor, bannerColor, primaryColor } = courseSlideData;
  const slide = slides[current];
  const isLast = current === slides.length - 1;
  const isFirst = current === 0;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isLast) return;
    progressValRef.current = 0;
    progressAnim.setValue(0);
    setTextVisible(false);
    const t = setTimeout(() => setTextVisible(true), 80);
    if (!globalPausedRef.current) {
      Animated.timing(progressAnim, { toValue: 1, duration: 5000, useNativeDriver: false })
        .start(({ finished }) => {
          if (finished && !globalPausedRef.current) setCurrent(c => Math.min(c + 1, slides.length - 1));
        });
    }
    return () => { clearTimeout(t); progressAnim.stopAnimation(); };
  }, [current]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    globalPausedRef.current = globalPaused;
    if (isLast) return;
    if (globalPaused) {
      progressAnim.stopAnimation();
    } else {
      const remaining = Math.max(5000 * (1 - progressValRef.current), 200);
      Animated.timing(progressAnim, { toValue: 1, duration: remaining, useNativeDriver: false })
        .start(({ finished }) => {
          if (finished && !globalPausedRef.current) setCurrent(c => Math.min(c + 1, slides.length - 1));
        });
    }
  }, [globalPaused]);

  const goTo = (i: number) => {
    progressAnim.stopAnimation();
    progressValRef.current = 0;
    setGlobalPaused(false);
    globalPausedRef.current = false;
    setCurrent(i);
  };

  const handleTogglePause = () => setGlobalPaused(p => !p);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const textOpacity = useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const textY = useRef(new Animated.Value(12)).current;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!textVisible) { textOpacity.setValue(0); textY.setValue(12); return; }
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(textY, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [textVisible]);

  const cardW = isMobile ? width - 28 : Math.min(width - 80, 820);
  const cardH = isMobile ? height - 80 : Math.min(height - 80, 400);
  const visualW = isMobile ? cardW - 32 : Math.floor((cardW - 80) * 0.46);

  // ── KEY FIX: each slide renders ONLY its own visual ──
  const visualForSlide: Record<string, React.ReactNode> = {
    gallery: <GalleryVisual images={images} captions={captions} accentColor={accentColor} paused={globalPaused} onTogglePause={handleTogglePause} />,
    highlights: <HighlightsVisual highlights={courseData.highlights} accentColor={accentColor} />,
    details: <DetailsVisual data={courseData} accentColor={accentColor} />,
    skills: <SkillsVisual skills={courseData.skills} partners={courseData.knowledgePartners} accentColor={accentColor} />,
    cta: <CtaVisual status={courseData.status} accentColor={accentColor} primaryColor={primaryColor} />,
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {Platform.OS !== "web" && <StatusBar backgroundColor="rgba(0,0,0,0.55)" barStyle="light-content" translucent />}

      <View style={[
        md.backdrop,
        Platform.OS === "web"
          ? ({ backdropFilter: "blur(16px) brightness(0.42)", WebkitBackdropFilter: "blur(16px) brightness(0.42)", backgroundColor: "rgba(0,0,0,0.38)" } as any)
          : { backgroundColor: "rgba(0,0,0,0.72)" },
      ]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={[
          md.card,
          { backgroundColor: bannerColor, width: cardW, height: cardH },
          Platform.OS === "web"
            ? ({ boxShadow: "0 32px 100px rgba(0,0,0,0.72), 0 4px 24px rgba(0,0,0,0.4)" } as any)
            : { shadowColor: "#000", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.65, shadowRadius: 40, elevation: 30 },
        ]}>

          <View style={md.progressRow}>
            {slides.map((_, i) => (
              <TouchableOpacity key={i} style={md.progressTrack} onPress={() => goTo(i)}>
                <Animated.View style={[md.progressFill, {
                  backgroundColor: accentColor,
                  width: i < current ? "100%" : i === current
                    ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })
                    : "0%",
                }]} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={md.topBar}>
            <View style={[md.typeBadge, { borderColor: accentColor + "55" }]}>
              <Text style={[md.typeBadgeText, { color: accentColor }]}>{courseData.type}</Text>
            </View>
            <View style={[md.statusBadge, courseData.status === "ongoing" ? md.ongoingBadge : md.completedBadge]}>
              {courseData.status === "ongoing" && <PulseDot color="#22c55e" />}
              <Text style={[md.statusText, courseData.status === "ongoing" ? md.ongoingText : md.completedText]}>
                {courseData.status === "ongoing" ? "Ongoing" : "Completed"}
              </Text>
            </View>
            <TouchableOpacity style={md.closeBtn} onPress={onClose}>
              <Text style={md.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {globalPaused && (
            <TouchableOpacity style={[md.pausedBanner, { borderColor: accentColor + "30" }]} onPress={handleTogglePause}>
              <Text style={[md.pausedBannerText, { color: accentColor }]}>⏸ Paused — tap to resume</Text>
            </TouchableOpacity>
          )}

          <View style={[md.body, isMobile ? md.bodyMobile : md.bodyDesktop]}>

            <Animated.View style={[md.textCol, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
              <View style={[md.tag, { borderColor: accentColor + "40", backgroundColor: accentColor + "15" }]}>
                <Text style={[md.tagText, { color: accentColor }]} numberOfLines={1}>{slide.tag}</Text>
              </View>
              <View style={{ marginBottom: 5 }}>
                {slide.headline.filter(Boolean).map((line, i) => (
                  <Text key={i} numberOfLines={1} style={[
                    md.headline,
                    isMobile && md.headlineMobile,
                    i === slide.headlineAccentIndex && { color: accentColor },
                  ]}>{line}</Text>
                ))}
              </View>
              <Text style={md.sub} numberOfLines={2}>{slide.sub}</Text>
              <View style={md.navRow}>
                {!isFirst && (
                  <TouchableOpacity style={md.navBtnSecondary} onPress={() => goTo(current - 1)}>
                    <Text style={md.navBtnSecondaryText}>← Back</Text>
                  </TouchableOpacity>
                )}
                {!isLast && (
                  <TouchableOpacity
                    style={[md.navBtnPrimary, { backgroundColor: primaryColor },
                      Platform.OS === "web" ? ({ boxShadow: `0 4px 18px ${primaryColor}55` } as any) : {}]}
                    onPress={() => goTo(current + 1)}
                  >
                    <Text style={md.navBtnPrimaryText}>{current === slides.length - 2 ? "Finish →" : "Next →"}</Text>
                  </TouchableOpacity>
                )}
                {!isLast && (
                  <TouchableOpacity onPress={onClose}>
                    <Text style={md.skipText}>Skip</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={md.dotNav}>
                {slides.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => goTo(i)}>
                    <View style={[md.dotNavItem, {
                      backgroundColor: i === current ? accentColor : "rgba(255,255,255,0.2)",
                      width: i === current ? 18 : 5,
                    }]} />
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* RIGHT — only the current slide's visual, nothing else */}
            <Animated.View style={[
              md.visualCol,
              isMobile ? md.visualColMobile : { width: visualW },
              { opacity: textOpacity },
            ]}>
              {visualForSlide[slide.visual] ?? null}
            </Animated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const GLASS = "rgba(4,20,12,0.55)";

const vs = StyleSheet.create({
  galleryWrap: { width: "100%", aspectRatio: 16 / 9, borderRadius: 10, overflow: "hidden", position: "relative", backgroundColor: "#0a2e18" },
  galleryImg: { width: "100%", height: "100%" },
  galleryBottom: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  captionText: { color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", flex: 1 },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 8 },
  dot: { height: 4, borderRadius: 99 },
  imgCounter: { fontSize: 9, fontWeight: "600", textAlign: "right", marginTop: 3, opacity: 0.7 },
  pauseBadge: { alignSelf: "flex-end", marginBottom: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.4)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  pauseBadgeText: { fontSize: 9, color: "rgba(255,255,255,0.62)", fontWeight: "600", letterSpacing: 0.3 },
  pauseOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: "rgba(0,0,0,0.38)", alignItems: "center", justifyContent: "center" },
  pauseIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.58)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  pauseIconText: { fontSize: 14 },
  hlCard: { flexDirection: "row", alignItems: "flex-start", gap: 7, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 9, borderWidth: 1, backgroundColor: GLASS },
  hlDot: { width: 6, height: 6, borderRadius: 99, borderWidth: 1.5, marginTop: 4, flexShrink: 0 },
  hlText: { fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 16, flex: 1, fontWeight: "500" },
  detailCard: { flexDirection: "row", gap: 7, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 9, backgroundColor: GLASS, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", alignItems: "flex-start" },
  detailIcon: { fontSize: 13, width: 18 },
  detailLabel: { fontSize: 8.5, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2, textTransform: "uppercase" },
  detailValue: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "500", lineHeight: 15 },
  pillSection: { backgroundColor: GLASS, borderRadius: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", padding: 10 },
  miniLabel: { fontSize: 8.5, fontWeight: "800", letterSpacing: 1.1, marginBottom: 7 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  skillPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  skillPillText: { fontSize: 10, fontWeight: "700" },
  partnerPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  partnerPillText: { fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  ctaCard: { alignItems: "center", padding: 20, borderRadius: 12, borderWidth: 1, backgroundColor: GLASS },
  ctaTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6, letterSpacing: -0.3 },
  ctaSub: { fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 16, marginBottom: 12 },
  ctaBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  ctaBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});

const md = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  progressRow: { flexDirection: "row", gap: 4, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 2 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 7 },
  typeBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  typeBadgeText: { fontSize: 9.5, fontWeight: "700", letterSpacing: 0.3 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, flexDirection: "row", alignItems: "center" },
  ongoingBadge: { backgroundColor: "#dcfce7" },
  completedBadge: { backgroundColor: "rgba(255,255,255,0.09)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  statusText: { fontSize: 9.5, fontWeight: "700" },
  ongoingText: { color: "#15803d" },
  completedText: { color: "rgba(255,255,255,0.78)" },
  closeBtn: { marginLeft: "auto" as any, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700" },
  pausedBanner: { marginHorizontal: 14, marginBottom: 3, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 7, borderWidth: 1, backgroundColor: "rgba(74,222,128,0.07)", alignItems: "center" },
  pausedBannerText: { fontSize: 9.5, fontWeight: "600", letterSpacing: 0.3 },
  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 10, paddingTop: 6, overflow: "hidden" },
  bodyMobile: { flexDirection: "column", gap: 10 },
  bodyDesktop: { flexDirection: "row", gap: 20, alignItems: "center" },
  textCol: { flex: 1, justifyContent: "center", paddingVertical: 4 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, borderWidth: 1, marginBottom: 9 },
  tagText: { fontSize: 8, fontWeight: "800", letterSpacing: 1.3 },
  headline: { fontSize: 26, fontWeight: "900", color: "#fff", lineHeight: 30, letterSpacing: -0.5 },
  headlineMobile: { fontSize: 21, lineHeight: 25 },
  sub: { fontSize: 11, color: "rgba(255,255,255,0.52)", lineHeight: 16, marginTop: 6, marginBottom: 12 },
  navRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 10 },
  navBtnPrimary: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  navBtnPrimaryText: { color: "#fff", fontSize: 11.5, fontWeight: "800" },
  navBtnSecondary: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(255,255,255,0.07)" },
  navBtnSecondaryText: { color: "rgba(255,255,255,0.68)", fontSize: 11.5, fontWeight: "600" },
  skipText: { fontSize: 10.5, color: "rgba(255,255,255,0.32)", paddingHorizontal: 4 },
  dotNav: { flexDirection: "row", gap: 5, alignItems: "center" },
  dotNavItem: { height: 5, borderRadius: 99 },
  visualCol: { flexShrink: 0, justifyContent: "center" },
  visualColMobile: { width: "100%", flexShrink: 1 },
});

export default CourseDetailModal;
