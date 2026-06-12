import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Image,
  Animated,
  Modal,
  Platform,
  StatusBar,
} from "react-native";

// ─── Brand tokens ──────────────────────────────────────────────────────────────
const G900      = "#052e16";
const G800      = "#065f46";
const G700      = "#047857";
const G600      = "#059669";
const G500      = "#10b981";
const G400      = "#34d399";
const G300      = "#6ee7b7";
const G200      = "#a7f3d0";
const G100      = "#d1fae5";
const G50       = "#ecfdf5";
const WHITE     = "#ffffff";
const OFF_WHITE = "#f8fffe";
const BORDER    = "#d1fae5";
const BORDER_MD = "#a7f3d0";
const TEXT_1    = "#052e16";
const TEXT_2    = "#065f46";
const TEXT_3    = "#6b9e85";

// Hero image
const HERO_IMAGE =
  "https://media.base44.com/images/public/6a13eb740ec97a8a055cc1b0/f2017ae80_generated_905d5ec1.png";

// ─── Data ─────────────────────────────────────────────────────────────────────
const COURSES = [
  {
    id: "fic",
    type: "Workshop",
    status: "ongoing",
    title: "Future-In-Charge: Skilling Programme for India's Charging Infrastructure",
    skills: ["EV Charging", "Infrastructure", "Renewable Energy"],
    duration: "1st May – 15th June 2026",
    location: "Gurugram, Haryana",
    organizer: "Ministry of Environment, Forest and Climate Change, Govt. of India",
    knowledgePartners: ["FITT", "EVI Technologies"],
    trainingPartner: "EcoConnect",
    accentColor: "#3b82f6",
    bannerColor: "#0c2340",
  },
  {
    id: "gsdp",
    type: "Course",
    status: "completed",
    title: "Green Skill Development Programme (GSDP) on EV Charging Installation Technician",
    skills: ["EV Charging", "Installation", "Green Skills"],
    location: "EcoConnect COE & Infrastructure Lab, Gurugram",
    organizer: "TERI EIACP RP on Renewable Energy and Climate Change",
    knowledgePartners: ["TERI"],
    trainingPartner: "EcoConnect",
    accentColor: G600,
    bannerColor: G900,
  },
];

const FILTERS = ["All", "Workshop", "Course"];

const GALLERIES: Record<string, any[]> = {
  gsdp: [
    require("../../assets/images/gsdpimg1.jpeg"),
    require("../../assets/images/gsdpimg2.jpeg"),
    require("../../assets/images/gsdpimg3.jpeg"),
    require("../../assets/images/gsdpimg4.jpeg"),
    require("../../assets/images/gsdpimg5.jpeg"),
  ],
  fic: [
    require("../../assets/images/fic1.jpg"),
    require("../../assets/images/fic2.jpg"),
    require("../../assets/images/fic3.jpg"),
    require("../../assets/images/fic4.jpg"),
    require("../../assets/images/fic5.jpg"),
  ],
};

const GALLERY_CAPTIONS: Record<string, string[]> = {
  gsdp: ["Certification Day", "First Site Visit", "First Training Day", "Sessions", "Fun Day"],
  fic: ["Programme Banner", "Session 2", "Lab Day", "Workshop", "Closing"],
};

const COURSE_SLIDES: Record<string, {
  bannerColor: string; accentColor: string; primaryColor: string;
  slides: { tag: string; headline: string[]; headlineAccentIndex: number; sub: string; visual: "gallery" | "highlights" | "details" | "skills" | "cta"; }[];
}> = {
  gsdp: {
    bannerColor: G900, accentColor: "#4ade80", primaryColor: "#16a34a",
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

const COURSE_DATA: Record<string, {
  type: string; status: string; title: string; duration?: string;
  location: string; organizer: string; skills: string[];
  knowledgePartners: string[]; trainingPartner: string; highlights: string[];
}> = {
  gsdp: {
    type: "Course", status: "completed",
    title: "Green Skill Development Programme (GSDP) on EV Charging Installation Technician",
    location: "EcoConnect COE & Infrastructure Lab, Gurugram",
    organizer: "TERI EIACP RP on Renewable Energy and Climate Change",
    skills: ["EV Charging", "Installation", "Green Skills"],
    knowledgePartners: ["TERI"], trainingPartner: "EcoConnect",
    highlights: [
      "Live installation training at EcoConnect's COE",
      "Certified by TERI under Govt. of India's GSDP",
      "Safety, wiring & commissioning modules",
      "Site visits to real charging infrastructure",
    ],
  },
  fic: {
    type: "Workshop", status: "ongoing",
    title: "Future-In-Charge: Skilling Programme for India's Charging Infrastructure",
    duration: "1st May – 15th June 2026",
    location: "Gurugram, Haryana",
    organizer: "Ministry of Environment, Forest and Climate Change, Govt. of India",
    skills: ["EV Charging", "Infrastructure", "Renewable Energy"],
    knowledgePartners: ["FITT", "EVI Technologies", "TERI"], trainingPartner: "EcoConnect",
    highlights: [
      "Industry-led curriculum by FITT & EVI Technologies",
      "Hands-on infrastructure lab sessions",
      "Government certification on completion",
      "Placement support through EcoConnect network",
    ],
  },
};

const TICKER_ITEMS = [
  "🌿  Government-Certified Green Skill Training",
  "⚡  EV Charging Infrastructure",
  "🏛️  Ministry of Environment, Forest & Climate Change",
  "🎓  TERI Knowledge Partnership",
  "🔋  Renewable Energy Careers",
  "🇮🇳  Govt. of India Backed Programmes",
  "🚗  India's EV Revolution",
  "🌱  Sustainable Future Skills",
];

// ─── Floating particle ────────────────────────────────────────────────────────
function FloatingParticle({ delay, x, size, bottom }: { delay: number; x: string; size: number; bottom: number }) {

const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity,    { toValue: 0.5, duration: 800,  useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -40, duration: 3000, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start(() => { translateY.setValue(0); loop(); });
    };
    loop();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute", bottom, left: x as any,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: G300, opacity, transform: [{ translateY }],
      }}
    />
  );
}

// ─── Pulse dot ────────────────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.35, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, transform: [{ scale }], marginRight: 5 }}
    />
  );
}

// ─── Marquee ticker ───────────────────────────────────────────────────────────
function MarqueeTicker() {
  const translateX = useRef(new Animated.Value(0)).current;
  const ITEM_W = 360;
  const total  = TICKER_ITEMS.length * ITEM_W;

  useEffect(() => {
    translateX.setValue(0);
    Animated.loop(
      Animated.timing(translateX, { toValue: -total, duration: total * 30, useNativeDriver: true })
    ).start();
  }, []);

  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <View style={tk.wrap}>
      <Animated.View style={[tk.row, { transform: [{ translateX }] }]}>
        {repeated.map((item, i) => (
          <View key={i} style={tk.item}>
            <Text style={tk.text}>{item}</Text>
            <View style={tk.divider} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { num: "2",    label: "Programmes"   },
    { num: "3+",   label: "Partners"     },
    { num: "GOI",  label: "Certified"    },
    { num: "100%", label: "Govt. Backed" },
  ];
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[sb.wrap, { opacity }]}>
      {stats.map((s, i) => (
        <View key={i} style={[sb.item, i < stats.length - 1 && sb.itemBorder]}>
          <Text style={sb.num}>{s.num}</Text>
          <Text style={sb.label}>{s.label}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Hero section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(24)).current;
  const subOpacity   = useRef(new Animated.Value(0)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(logoOpacity,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(titleY,       { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(subOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const { width } = useWindowDimensions();
  const isMobile  = width < 768;

  return (
    <View style={hs.container}>
      {/* Hero image background */}
      <Image
        source={{ uri: HERO_IMAGE }}
        style={[
          StyleSheet.absoluteFillObject,
          Platform.OS === "web"
            ? ({ filter: "blur(2px)", transform: "scale(1.04)" } as any)
            : {},
        ]}
        resizeMode="cover"
      />

      {/* Deep green overlay — gives the green-hero feel */}
      <View style={hs.overlay} />
      <View style={hs.overlayBottom} />

      {/* Subtle dot pattern overlay */}
      {Platform.OS === "web" && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: 0.18,
            } as any,
          ]}
          // @ts-ignore
          pointerEvents="none"
        />
      )}

      {/* Floating particles */}
      {[
  { delay: 0,    x: "8%",  size: 5, bottom: 20  },
  { delay: 800,  x: "22%", size: 3, bottom: 60  },
  { delay: 1500, x: "40%", size: 4, bottom: 100 },
  { delay: 400,  x: "60%", size: 6, bottom: 40  },
  { delay: 1100, x: "75%", size: 3, bottom: 80  },
  { delay: 200,  x: "88%", size: 5, bottom: 30  },
].map((p, i) => (
  <FloatingParticle key={i} delay={p.delay} x={p.x} size={p.size} bottom={p.bottom} />
))}

      {/* ── LOGO — top-left, exactly as original ── */}
      <Animated.View style={[hs.logoBar, { opacity: logoOpacity }]}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={hs.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Decorative ring — top right */}
      <View style={hs.ringOuter} />
      <View style={hs.ringInner} />

      {/* Text content at the bottom */}
      <View style={[hs.content, isMobile && hs.contentMobile]}>
        <View style={hs.eyebrowRow}>
          <View style={hs.eyebrowLine} />
          <Text style={hs.eyebrow}>Our Programmes</Text>
        </View>
        <Animated.Text
          style={[hs.title, isMobile && hs.titleMobile, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
        >
          Green Futures,{"\n"}
          <Text style={hs.titleItalic}>Certified</Text> Careers
        </Animated.Text>
        <Animated.Text style={[hs.subtitle, { opacity: subOpacity }]}>
          Sustainability and green energy training certified by the Government of India
        </Animated.Text>
      </View>

      {/* Bottom accent line */}
      <View style={hs.bottomLine} />
    </View>
  );
}

// ─── Gallery visual ────────────────────────────────────────────────────────────
function GalleryVisual({ images, captions, accentColor, paused, onTogglePause }: {
  images: any[]; captions: string[]; accentColor: string; paused: boolean; onTogglePause: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const fadeAnims = useRef(images.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

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
    <View>
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
            <View style={vs.pauseIconCircle}>
              <Text style={vs.pauseIconText}>⏸</Text>
            </View>
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
    <View style={{ gap: 5 }}>
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
    { icon: "📍", label: "Location",        value: data.location        },
    { icon: "🏛️", label: "Organised by",    value: data.organizer       },
    { icon: "🎓", label: "Training Partner", value: data.trainingPartner },
  ];
  return (
    <View style={{ gap: 5 }}>
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
    <View style={{ gap: 7 }}>
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
    <Animated.View style={{ transform: [{ scale }] }}>
      <View style={[vs.ctaCard, { borderColor: accentColor + "38" }]}>
        <Text style={{ fontSize: 30, marginBottom: 6 }}>{isOngoing ? "🚀" : "✅"}</Text>
        <Text style={[vs.ctaTitle, { color: accentColor }]}>{isOngoing ? "Enrol Now" : "Programme Completed"}</Text>
        <Text style={vs.ctaSub}>
          {isOngoing ? "Register your interest and join India's green energy workforce." : "This programme has concluded. Stay tuned for upcoming batches."}
        </Text>
        {isOngoing && (
          <View style={[vs.ctaBtn, { backgroundColor: primaryColor }]}>
            <Text style={vs.ctaBtnText}>Register Interest →</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Course Detail Modal ──────────────────────────────────────────────────────
function CourseDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const isMobile          = width < 768;
  const courseSlideData   = COURSE_SLIDES[id];
  const courseData        = COURSE_DATA[id];
  const images            = GALLERIES[id] ?? [];
  const captions          = GALLERY_CAPTIONS[id] ?? [];

  const [current,      setCurrent]      = useState(0);
  const [textVisible,  setTextVisible]  = useState(true);
  const [globalPaused, setGlobalPaused] = useState(false);

  const progressAnim    = useRef(new Animated.Value(0)).current;
  const progressValRef  = useRef(0);
  const globalPausedRef = useRef(false);

  useEffect(() => {
    const lid = progressAnim.addListener(({ value }) => { progressValRef.current = value; });
    return () => progressAnim.removeListener(lid);
  }, [progressAnim]);

  if (!courseSlideData || !courseData) return null;

  const { slides, accentColor, bannerColor, primaryColor } = courseSlideData;
  const slide   = slides[current];
  const isLast  = current === slides.length - 1;
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
    progressAnim.stopAnimation(); progressValRef.current = 0;
    setGlobalPaused(false); globalPausedRef.current = false; setCurrent(i);
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const textOpacity = useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const textY = useRef(new Animated.Value(12)).current;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!textVisible) { textOpacity.setValue(0); textY.setValue(12); return; }
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(textY,       { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [textVisible]);

  const cardW   = isMobile ? width - 28  : Math.min(width - 80, 820);
  const cardH   = isMobile ? height - 80 : Math.min(height - 80, 500);
  const visualW = isMobile ? cardW - 32  : Math.floor((cardW - 80) * 0.46);

  const visualForSlide: Record<string, React.ReactNode> = {
    highlights: <HighlightsVisual highlights={courseData.highlights} accentColor={accentColor} />,
    details:    <DetailsVisual    data={courseData}                  accentColor={accentColor} />,
    skills:     <SkillsVisual     skills={courseData.skills} partners={courseData.knowledgePartners} accentColor={accentColor} />,
    cta:        <CtaVisual        status={courseData.status} accentColor={accentColor} primaryColor={primaryColor} />,
  };

  const gallery = (
    <GalleryVisual images={images} captions={captions} accentColor={accentColor}
      paused={globalPaused} onTogglePause={() => setGlobalPaused(p => !p)} />
  );

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {Platform.OS !== "web" && <StatusBar backgroundColor="rgba(0,0,0,0.55)" barStyle="light-content" translucent />}
      <View style={[md.backdrop,
        Platform.OS === "web"
          ? ({ backdropFilter: "blur(16px) brightness(0.42)", WebkitBackdropFilter: "blur(16px) brightness(0.42)", backgroundColor: "rgba(0,0,0,0.38)" } as any)
          : { backgroundColor: "rgba(0,0,0,0.72)" },
      ]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={[md.card, { backgroundColor: bannerColor, width: cardW, height: cardH },
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
            <TouchableOpacity style={[md.pausedBanner, { borderColor: accentColor + "30" }]} onPress={() => setGlobalPaused(false)}>
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
                    md.headline, isMobile && md.headlineMobile,
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
            <Animated.View style={[md.visualCol, isMobile ? md.visualColMobile : { width: visualW }, { opacity: textOpacity }]}>
              {images.length > 0 && gallery}
              {slide.visual !== "gallery" && visualForSlide[slide.visual] && (
                <View style={{ marginTop: images.length > 0 ? 7 : 0 }}>
                  {visualForSlide[slide.visual]}
                </View>
              )}
            </Animated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Programme card ───────────────────────────────────────────────────────────
function ProgrammeCard({
  course, index, onPress,
}: { course: typeof COURSES[number]; index: number; onPress: () => void }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const scale      = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 600, delay: index * 160 + 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 160 + 300, useNativeDriver: true, friction: 8, tension: 60 }),
    ]).start();
  }, []);

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.972, useNativeDriver: true, friction: 8 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, friction: 6 }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
        activeOpacity={1} style={pc.card}
      >
        {/* Coloured banner header */}
        <View style={[pc.stripe, { backgroundColor: course.bannerColor }]}>
          {/* Subtle dot pattern */}
          <View style={pc.stripeDots} />
          {/* Decorative corner circle */}
          <View style={[pc.stripeCorner, { borderColor: course.accentColor + "25" }]} />

          <View style={pc.badgeRow}>
            <View style={[pc.typeBadge, { borderColor: course.accentColor + "60" }]}>
              <Text style={[pc.typeBadgeText, { color: course.accentColor }]}>{course.type}</Text>
            </View>
            <View style={[pc.statusBadge, course.status === "ongoing" ? pc.ongoingBadge : pc.completedBadge]}>
              {course.status === "ongoing" && <PulseDot color="#22c55e" />}
              <Text style={[pc.statusText, course.status === "ongoing" ? pc.ongoingText : pc.completedText]}>
                {course.status === "ongoing" ? "Ongoing" : "Completed"}
              </Text>
            </View>
          </View>

          <Text style={pc.stripeTitle} numberOfLines={3}>{course.title}</Text>
          <View style={[pc.accentLine, { backgroundColor: course.accentColor }]} />
        </View>

        {/* White card body */}
        <View style={pc.body}>
          {/* Skill pills */}
          <View style={pc.pillRow}>
            {course.skills.map((sk, i) => (
              <View key={i} style={pc.skillPill}>
                <Text style={pc.skillPillText}>{sk}</Text>
              </View>
            ))}
          </View>

          {/* Meta rows */}
          {course.duration && (
            <View style={pc.metaRow}>
              <Text style={pc.metaIcon}>📅</Text>
              <Text style={pc.metaValue}>{course.duration}</Text>
            </View>
          )}
          <View style={pc.metaRow}>
            <Text style={pc.metaIcon}>📍</Text>
            <Text style={pc.metaValue}>{course.location}</Text>
          </View>
          <View style={pc.metaRow}>
            <Text style={pc.metaIcon}>🏛️</Text>
            <Text style={pc.metaValue} numberOfLines={2}>{course.organizer}</Text>
          </View>

          {/* Partner chips */}
          <View style={pc.partnerRow}>
            {course.knowledgePartners.map((p, i) => (
              <View key={i} style={pc.partnerChip}>
                <Text style={pc.partnerChipText}>{p}</Text>
              </View>
            ))}
            <View style={[pc.partnerChip, pc.ecoChip]}>
              <Text style={[pc.partnerChipText, pc.ecoChipText]}>EcoConnect</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={pc.footer}>
            <Text style={[pc.viewDetails, { color: course.accentColor }]}>View Details →</Text>
            {/* Status indicator dot */}
            <View style={[pc.statusDot, { backgroundColor: course.status === "ongoing" ? G500 : G200 }]} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
function FilterTabs({ active, onChange, count }: { active: string; onChange: (f: string) => void; count: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[ft.wrap, { opacity }]}>
      <View style={ft.row}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[ft.tab, active === f && ft.tabActive]} onPress={() => onChange(f)} activeOpacity={0.75}>
            <Text style={[ft.tabText, active === f && ft.tabTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={ft.count}>{count} programme{count !== 1 ? "s" : ""}</Text>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Courses() {
  const { width }  = useWindowDimensions();
  const isMobile   = width < 768;
  const [filter, setFilter]         = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = COURSES.filter((c) => filter === "All" || c.type === filter);

  return (
    <>
      <ScrollView
        style={s.page}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 64 }}
      >
        <HeroSection />
        <StatsBar />
        <MarqueeTicker />

        <View style={[s.section, isMobile && s.sectionMobile]}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionEyebrow}>Currently Enrolling</Text>
            <Text style={s.sectionTitle}>Active Programmes</Text>
          </View>

          <FilterTabs active={filter} onChange={setFilter} count={filtered.length} />

          <View style={[s.grid, isMobile && s.gridMobile]}>
            {filtered.map((c, i) => (
              <View key={c.id} style={isMobile ? {} : s.gridItem}>
                <ProgrammeCard course={c} index={i} onPress={() => setSelectedId(c.id)} />
              </View>
            ))}
          </View>
        </View>

        <View style={s.bottomLine} />
      </ScrollView>

      {selectedId && (
        <CourseDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}

// ─── Hero styles ──────────────────────────────────────────────────────────────
const hs = StyleSheet.create({
  container: {
    height: 310,                 // taller so logo + text both fit
    position: "relative",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,46,22,0.78)",
  },
  overlayBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 100,
    backgroundColor: "rgba(5,46,22,0.55)",
  },
  ringOuter: {
    position: "absolute", top: -80, right: -80,
    width: 300, height: 300, borderRadius: 150,
    borderWidth: 1, borderColor: "rgba(110,231,183,0.12)",
  },
  ringInner: {
    position: "absolute", top: -30, right: -30,
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 1, borderColor: "rgba(110,231,183,0.08)",
  },
  // ── LOGO: absolute top-left — scaled down so it fits comfortably ──
  // ─── Hero styles (logo section only — replace these two keys) ─────────────────
logoBar: {
  position: "absolute",
  top: -35,
  left: -29,
  right: 50,
  zIndex: 10,
  paddingHorizontal: 0,
  paddingVertical: 0,
  borderRadius: 0,
  backgroundColor: "transparent",
  borderWidth: 0,
},
logo: {
  width: 300, 
  height: 220, 
  borderRadius: 4 ,
  tintColor: "#ffffff",
},
  // Text content sits at the bottom of the taller hero
  content: {
    position: "relative",
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 56,
  },
  contentMobile: { paddingHorizontal: 18 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  eyebrowLine: { width: 20, height: 1.5, backgroundColor: G300, borderRadius: 1, marginRight: 10 },
  eyebrow: {
    fontSize: 10.5, fontWeight: "700", letterSpacing: 2.5,
    color: G300, textTransform: "uppercase",
  },
  title: {
    fontSize: 34, fontWeight: "800", color: WHITE,
    letterSpacing: -0.8, lineHeight: 42, marginBottom: 10,
  },
  titleMobile: { fontSize: 26, lineHeight: 34 },
  titleItalic: { fontStyle: "italic", color: G300 },
 subtitle: {
  fontSize: 13.5, color: "rgba(209,250,229,0.92)",
  lineHeight: 22, maxWidth: 500,
},
  bottomLine: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
    backgroundColor: G400, opacity: 0.4,
  },
});

// ─── Stats bar styles ─────────────────────────────────────────────────────────
const sb = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: WHITE,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 2px 16px rgba(5,150,105,0.07)" }
      : { shadowColor: G600, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }),
  },
  item: { flex: 1, alignItems: "center", paddingVertical: 22 },
  itemBorder: { borderRightWidth: 1, borderRightColor: BORDER },
  num: {
    fontSize: 24, fontWeight: "800", color: G700,
    letterSpacing: -0.5, marginBottom: 3,
  },
  label: { fontSize: 10.5, color: TEXT_3, fontWeight: "500", letterSpacing: 0.1, textTransform: "uppercase" },
});

// ─── Ticker styles ────────────────────────────────────────────────────────────
const tk = StyleSheet.create({
  wrap: {
    height: 40,
    backgroundColor: G50,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
    overflow: "hidden",
    justifyContent: "center",
  },
  row:  { flexDirection: "row", alignItems: "center" },
  item: { flexDirection: "row", alignItems: "center", width: 360},
  text: { fontSize: 11, color: G800, fontWeight: "600", letterSpacing: 0.1 },
  divider: { width: 1, height: 14, backgroundColor: BORDER_MD, marginHorizontal: 18 },
});

// ─── Filter tab styles ────────────────────────────────────────────────────────
const ft = StyleSheet.create({
  wrap: { marginBottom: 8 },
  row:  { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  tab: {
    paddingHorizontal: 22, paddingVertical: 10, borderRadius: 99,
    borderWidth: 1.5, borderColor: BORDER_MD, backgroundColor: WHITE,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 6px rgba(5,150,105,0.08)" }
      : { shadowColor: G600, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }),
  },
  tabActive: {
    backgroundColor: G700, borderColor: G700,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 18px rgba(4,120,87,0.28)" }
      : { elevation: 5 }),
  },
  tabText:       { fontSize: 13, color: TEXT_2, fontWeight: "500" },
  tabTextActive: { color: WHITE, fontWeight: "700" },
  count:         { fontSize: 12, color: TEXT_3, fontWeight: "500", marginBottom: 6 },
});

// ─── Programme card styles ────────────────────────────────────────────────────
const pc = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 16,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 24px rgba(5,150,105,0.08), 0 1px 4px rgba(5,150,105,0.05)" }
      : { shadowColor: G600, shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 5 }),
  },
  // Banner (dark coloured header, same colours as before)
  stripe: {
    padding: 24, paddingBottom: 22,
    position: "relative", overflow: "hidden",
  },
  stripeDots: {
    position: "absolute", inset: 0 as any,
    opacity: 0.08,
    // On web we can use backgroundImage; native ignores it gracefully
    ...(Platform.OS === "web"
      ? ({
          backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        } as any)
      : {}),
  },
  stripeCorner: {
    position: "absolute", bottom: -50, right: -50,
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 1,
  },
  accentLine: { height: 2.5, borderRadius: 2, width: 36, marginTop: 16 },
  badgeRow:   { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  typeBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 11, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1,
  },
  typeBadgeText:  { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.3 },
  statusBadge:    { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 99, flexDirection: "row", alignItems: "center" },
  ongoingBadge:   { backgroundColor: "#dcfce7" },
  completedBadge: { backgroundColor: "rgba(255,255,255,0.15)" },
  statusText:     { fontSize: 10.5, fontWeight: "600" },
  ongoingText:    { color: "#166534" },
  completedText:  { color: "rgba(255,255,255,0.85)" },
  stripeTitle:    { fontSize: 16, fontWeight: "800", color: WHITE, lineHeight: 24, letterSpacing: -0.2 },
  // Body — white
  body:     { padding: 20, backgroundColor: WHITE },
  pillRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  skillPill: {
    backgroundColor: G50, borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1.5, borderColor: BORDER_MD,
  },
  skillPillText: { fontSize: 11, color: G800, fontWeight: "600" },
  metaRow:  { flexDirection: "row", alignItems: "flex-start", gap: 9, marginBottom: 9 },
  metaIcon: { fontSize: 13, width: 18 },
  metaValue: { fontSize: 12.5, color: TEXT_2, flex: 1, lineHeight: 18 },
  partnerRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    marginTop: 14, marginBottom: 14,
    paddingTop: 14, borderTopWidth: 1.5, borderTopColor: BORDER,
  },
  partnerChip: {
    backgroundColor: OFF_WHITE, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: BORDER,
  },
  partnerChipText: { fontSize: 11, color: TEXT_2, fontWeight: "500" },
  ecoChip:     { backgroundColor: G50, borderColor: BORDER_MD },
  ecoChipText: { color: G700, fontWeight: "700" },
  footer: {
    borderTopWidth: 1.5, borderTopColor: BORDER,
    paddingTop: 13, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },
  viewDetails: { fontSize: 13, fontWeight: "700", letterSpacing: 0.1 },
  statusDot: {
    width: 9, height: 9, borderRadius: 5,
  },
});

// ─── Modal / visual styles ────────────────────────────────────────────────────
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
  hlCard: { flexDirection: "row", alignItems: "flex-start", gap: 7, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderWidth: 1, backgroundColor: GLASS },
  hlDot: { width: 6, height: 6, borderRadius: 99, borderWidth: 1.5, marginTop: 3, flexShrink: 0 },
  hlText: { fontSize: 10.5, color: "rgba(255,255,255,0.82)", lineHeight: 15, flex: 1, fontWeight: "500" },
  detailCard: { flexDirection: "row", gap: 7, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, backgroundColor: GLASS, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", alignItems: "flex-start" },
  detailIcon: { fontSize: 12, width: 17 },
  detailLabel: { fontSize: 8.5, fontWeight: "700", letterSpacing: 0.8, marginBottom: 1, textTransform: "uppercase" },
  detailValue: { fontSize: 10.5, color: "rgba(255,255,255,0.82)", fontWeight: "500", lineHeight: 14 },
  pillSection: { backgroundColor: GLASS, borderRadius: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", padding: 8 },
  miniLabel: { fontSize: 8.5, fontWeight: "800", letterSpacing: 1.1, marginBottom: 5 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skillPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  skillPillText: { fontSize: 9.5, fontWeight: "700" },
  partnerPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  partnerPillText: { fontSize: 9.5, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  ctaCard: { alignItems: "center", padding: 16, borderRadius: 12, borderWidth: 1, backgroundColor: GLASS },
  ctaTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4, letterSpacing: -0.3 },
  ctaSub: { fontSize: 10.5, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 15, marginBottom: 10 },
  ctaBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  ctaBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
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
  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4, overflow: "hidden" },
  bodyMobile: { flexDirection: "column", gap: 10 },
  bodyDesktop: { flexDirection: "row", gap: 20, alignItems: "center" },
  textCol: { flex: 1, justifyContent: "center" },
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
  visualCol: { flexShrink: 0 },
  visualColMobile: { width: "100%", flexShrink: 1 },
});

// ─── Page styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: WHITE },
  section: { maxWidth: 1120, alignSelf: "center", width: "100%", paddingHorizontal: 24, paddingVertical: 36 },
  sectionMobile: { paddingHorizontal: 14, paddingVertical: 22 },
  sectionHeader: { marginBottom: 28 },
  sectionEyebrow: {
    fontSize: 10, fontWeight: "700", letterSpacing: 2.2,
    color: G600, textTransform: "uppercase", marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 28, fontWeight: "800", color: G900,
    letterSpacing: -0.5,
  },
  grid:       { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  gridMobile: { flexDirection: "column" },
  gridItem:   { flex: 1, minWidth: 300 },
  bottomLine: {
    height: 1.5, marginHorizontal: 24,
    backgroundColor: G400, opacity: 0.3,
  },
});
