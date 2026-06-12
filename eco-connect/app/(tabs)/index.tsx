import { useState, useEffect, useRef } from "react";
import CourseDetailModal from "../components/CourseDetailModal";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Animated, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { getStoredUser, StoredUser } from "@/services/auth";
import { getPublicStats, getPublicChampions } from "@/services/api";
import HeroDemoCard from "@/components/HeroDemoCard";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Champion {
  user_id: string; name: string; role?: string | null;
  skills?: string[] | null; country?: string | null; rating?: number | null;
  color?: string;
}

// ── Design tokens — premium green/slate palette
const G   = "#059669";
const G2  = "#10b981";
const G3  = "#34d399";
const GD  = "#065f46";
const GL  = "#ecfdf5";
const SL  = "#0f172a";
const WHT = "#ffffff";
const N8  = "#1e293b";
const N7  = "#334155";
const N6  = "#475569";
const N5  = "#64748b";
const N4  = "#94a3b8";
const N3  = "#cbd5e1";
const N2  = "#e2e8f0";
const N1  = "#f1f5f9";
const N0  = "#f8fafc";

// ── Avatar colours cycled across champion cards
const AVATAR_COLORS = [GD, "#0e7490", "#7c3aed", "#b45309", "#be185d", "#d97706"];

const withColor = (champs: Champion[]): Champion[] =>
  champs.map((c, i) => ({ ...c, color: AVATAR_COLORS[i % AVATAR_COLORS.length] }));

const ini = (name: string) =>
  name.split(" ").map(x => x[0]).join("").toUpperCase().slice(0, 2);

// ── Hover-capable card wrapper
function HoverCard({ children, style, hoveredStyle, onPress }: {
  children: React.ReactNode; style: any; hoveredStyle: any; onPress?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <TouchableOpacity
      style={[style, hovered && hoveredStyle]}
      onPress={onPress}
      activeOpacity={0.92}
      // @ts-ignore
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </TouchableOpacity>
  );
}

// ── Animated Champion Card
function AnimatedChampCard({ c, index, shouldAnimate }: {
  c: Champion; index: number; shouldAnimate: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const translateX = useRef(new Animated.Value(60)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!shouldAnimate) return;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        delay: index * 180,
        useNativeDriver: true,
        tension: 60,
        friction: 11,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay: index * 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shouldAnimate]);

  const translateX2= useRef(new Animated.Value(shouldAnimate ? 60 : 0)).current;
  const opacity2   = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: hovered ? 1.03 : 1,
      useNativeDriver: true,
      tension: 280,
      friction: 14,
    }).start();
  }, [hovered]);

  return (
    <Animated.View style={{ transform: [{ translateX }, { scale }], opacity }}>
      <TouchableOpacity
        style={[
          s.champCard,
          hovered && s.champCardHovered,
          { borderTopWidth: 3, borderTopColor: c.color ?? GD },
        ]}
        activeOpacity={1}
        // @ts-ignore
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <View style={s.champCardTop}>
          <View style={[s.champAvatar, { backgroundColor: c.color ?? GD }]}>
            <Text style={s.champAvatarText}>{ini(c.name)}</Text>
          </View>
          <View style={s.champVerified}>
            <Text style={s.champVerifiedText}>✓ KYC</Text>
          </View>
        </View>
        <Text style={s.champName}>{c.name}</Text>
        {c.role && <Text style={s.champRole}>{c.role}</Text>}
        {(c.skills ?? []).length > 0 && (
          <View style={s.champSkills}>
            {(c.skills as string[]).slice(0, 3).map((sk: string, j: number) => (
              <View key={j} style={[
                s.champSkillPill,
                hovered && { borderColor: (c.color ?? GD) + "40", backgroundColor: (c.color ?? GD) + "08" },
              ]}>
                <Text style={[s.champSkillText, hovered && { color: c.color ?? GD }]}>{sk}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={s.champFooter}>
          {c.rating != null && (
            <View style={s.champRating}>
              <Text style={s.champRatingStar}>★</Text>
              <Text style={s.champRatingVal}>{Number(c.rating).toFixed(1)}</Text>
            </View>
          )}
          {hovered && (
            <Text style={{ fontSize: 11, color: c.color ?? GD, fontWeight: "600" }}>
              View Profile →
            </Text>
          )}
        </View>
        {hovered && <View style={[s.champAccentBar, { backgroundColor: c.color ?? GD }]} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Animated Testimonial Card
function AnimatedTestiCard({ t, index, shouldAnimate }: {
  t: { name: string; role: string; type: string; quote: string };
  index: number;
  shouldAnimate: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const [starsVisible, setStarsVisible] = useState(0);

  const isChampion = index === 1;

  useEffect(() => {
    if (!shouldAnimate) return;
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 150,
        useNativeDriver: true,
        tension: 55,
        friction: 11,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Sequential stars after card lands
      [0, 1, 2, 3, 4].forEach(i => {
        setTimeout(() => setStarsVisible(i + 1), i * 80);
      });
    });
  }, [shouldAnimate]);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: hovered ? 1.025 : 1,
      useNativeDriver: true,
      tension: 280,
      friction: 14,
    }).start();
  }, [hovered]);

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateY }, { scale }], opacity }}>
      <TouchableOpacity
        style={[
          s.testiCard,
          hovered && {
            borderColor: isChampion ? G + "60" : N3,
            shadowColor: isChampion ? G : SL,
            shadowOpacity: isChampion ? 0.18 : 0.10,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          },
        ]}

        
        activeOpacity={1}
        // @ts-ignore
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <View style={s.testiHeader}>
          <View style={[
            s.testiTypePill,
            {
              borderColor: isChampion ? G + "40" : N3,
              backgroundColor: isChampion ? GL : N1,
            },
          ]}>
            <Text style={[s.testiTypeText, { color: isChampion ? G : N6 }]}>{t.type}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 2 }}>
            {[1, 2, 3, 4, 5].map(j => (
              <Animated.Text
                key={j}
                style={{
                  color: "#d97706",
                  fontSize: 12,
                  opacity: starsVisible >= j ? 1 : 0,
                  transform: [{ scale: starsVisible >= j ? 1 : 0.4 }],
                }}
              >
                ★
              </Animated.Text>
            ))}
          </View>
        </View>

        {/* Animated quote mark */}
        <Text style={[
          s.testiQuoteMark,
          hovered && { color: isChampion ? G + "40" : N3, transform: [{ scale: 1.15 }] },
        ]}>
          "
        </Text>

        <Text style={s.testiQuote}>{t.quote}"</Text>

        <View style={s.testiAuthor}>
          <View style={[s.testiAvatar, { backgroundColor: isChampion ? G : N7 }]}>
            <Text style={s.testiAvatarText}>{ini(t.name)}</Text>
          </View>
          <View>
            <Text style={s.testiName}>{t.name}</Text>
            <Text style={s.testiRole}>{t.role}</Text>
          </View>
        </View>

        {/* Bottom accent bar on hover */}
        {hovered && (
          <View style={[s.testiAccentBar, { backgroundColor: isChampion ? G : N7 }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Course data
const courses = [
  {
    id: "gsdp",
    tag: "GOVERNMENT INITIATIVE",
    status: "COMPLETED",
    bannerImage: require("@/assets/images/gsdp-banner.jpg"),
    statusColor: "#059669",
    title: "Green Skill Development Programme",
    shortTitle: "GSDP",
    duration: "12 weeks",
    level: "Multi-tier",
    lessons: 36,
    location: "Pan-India",
    partners: ["Ministry of New & Renewable Energy", "NSDC", "NISE"],
    overview:
      "India's flagship green skilling initiative, delivered in partnership with MNRE and NSDC. Designed to build a workforce capable of executing India's 500 GW renewable energy target by 2030.",
    outcomes: [
      "Solar PV installation & maintenance certification",
      "Energy auditing fundamentals",
      "Green building compliance",
      "National Skills Qualification Framework (NSQF) aligned credential",
    ],
    initiative:
      "Part of the Government of India's Skill India Mission under the National Solar Mission framework.",
    visual: "solar",
  },
  {
    id: "fic",
    tag: "LEADERSHIP PROGRAMME",
    status: "ONGOING",
    statusColor: "#d97706",
    bannerImage: require("@/assets/images/fic-banner.jpg"),
    title: "Future-In-Charge",
    shortTitle: "FIC",
    duration: "45 days",
    level: "Advanced",
    lessons: 48,
    location: "Delhi",
    partners: ["Ecoconnect", "IIM Ahmedabad CEE", "CII-ITC CESD"],
    overview:
      "An invite-only leadership accelerator for mid-career sustainability professionals. Combines practitioner-led intensives with live project secondments at partner organisations.",
    outcomes: [
      "Strategic ESG integration at board level",
      "Transition finance & green bonds",
      "Climate disclosure under SEBI BRSR Core",
      "Peer cohort — 24 vetted sustainability leaders",
    ],
    initiative:
      "Ecoconnect's flagship leadership programme. Cohort 3 currently active. Applications for Cohort 4 open Q3 2026.",
    visual: "ev",
  },
];


const FEATURED_CHAMPIONS: Champion[] = withColor([
  {
    user_id: "a2e3d3bf-20c6-420f-b933-db495bfe2ae8",
    name: "Harish Kumar Pal",
    role: "Electrical Technician & Field Engineer",
    skills: ["Electrical maintenance", "Field troubleshooting", "Equipment servicing"],
    country: null, rating: null,
  },
  {
    user_id: "782070cd-bd93-498e-9257-a3e6db1892ff",
    name: "Nishtha Dhariwal",
    role: "Product & App Developer",
    skills: ["System operations", "AI understanding", "Deployment support"],
    country: null, rating: null,
  },
  {
    user_id: "dfc0180b-7ed1-4977-a2c6-d37ef4ea922d",
    name: "Harvansh Singh Pal",
    role: "Operations & Champion Relations Lead",
    skills: ["EV charger installation", "Network engineering", "Electrical maintenance"],
    country: null, rating: null,
  },
  {
    user_id: "c44def40-1e7e-4a37-ab8c-8da771d2852a",
    name: "Simran Singh",
    role: "Frontend & Data Engineer",
    skills: ["Data science", "Machine learning", "Python"],
    country: null, rating: null,
  },
]);

export default function Home() {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [user,       setUser]       = useState<StoredUser | null>(null);
  const [stats,      setStats]      = useState<any>(null);
  const [champions,  setChampions]  = useState<Champion[]>([]);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [menuOpen,   setMenuOpen]   = useState(false);

  // Scroll-triggered champion animation
  const champsRef      = useRef<View>(null);
  const [champsAnimated, setChampsAnimated] = useState(false);

  // Scroll-triggered testimonial animation
  const testiRef       = useRef<View>(null);
  const [testiAnimated, setTestiAnimated] = useState(false);


  useEffect(() => { 
    getStoredUser().then(setUser);
    getPublicStats().then(setStats).catch(() => {});
    setChampions(FEATURED_CHAMPIONS);
  }, []);

  const goPortal = () => {
    if (!user) return router.push("/login_1");
    if (user.role === "admin")      return router.push("/(tabs)/dashboard");
    if (user.role === "client")     return router.push("/client-portal");
    if (user.role === "freelancer") return router.push("/freelancer-portal");
  };

  const handleScroll = () => {
    if (menuOpen) setMenuOpen(false)

      if (champsAnimated && testiAnimated) return;

    if (!champsAnimated && champsRef.current) {
      (champsRef.current as any).measure(
        (_x: number, _y: number, _w: number, _h: number, _px: number, py: number) => {
          if (py < 700) setChampsAnimated(true);
        }
      );
    }

    if (!testiAnimated && testiRef.current) {
      (testiRef.current as any).measure(
        (_x: number, _y: number, _w: number, _h: number, _px: number, py: number) => {
          if (py < 750) setTestiAnimated(true);
        }
      );
    }
  };

  const pillars = [
    { icon: "◈", title: "Precision Matching",        desc: "Multi-dimensional scoring across skill depth, project fit, reputation index, and budget alignment — not keyword filters." },
    { icon: "◎", title: "Identity-Verified Network",  desc: "Every Champion completes KYC verification and credential review before accessing any client opportunity." },
    { icon: "◉", title: "Human-in-the-Loop",          desc: "No allocation is confirmed without admin review. AI suggests — experienced humans decide." },
    { icon: "◐", title: "48-Hour Shortlisting",       desc: "From project submission to a curated Champion shortlist in under two business days." },
  ];

  return (
    <>
    <ScrollView
      style={s.page}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={100}
    >

      {/* ── ANNOUNCEMENT STRIP ── */}
      {bannerOpen && (
        <View style={s.banner}>
          <View style={s.bannerDot} />
          <Text style={s.bannerText}>
            India's private sustainability talent network —{" "}
            <Text style={s.bannerCta} onPress={() => router.push("/register?role=champion" as any)}>
              Apply for membership →
            </Text>
          </Text>
          <TouchableOpacity onPress={() => setBannerOpen(false)} style={s.bannerClose}>
            <Text style={s.bannerCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── NAVIGATION ── */}
      <View style={[s.nav, isMobile && s.navMobile]}>
        <TouchableOpacity onPress={() => router.push("/")} style={{ flex: 1 }}>
          <Image source={require("@/assets/images/logo.png")} style={isMobile ? s.logoMobile : s.logo} resizeMode="cover" />
        </TouchableOpacity>

        {!isMobile && (
          <View style={s.navRight}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/courses")}>
              <Text style={s.navLink}>Courses</Text>
            </TouchableOpacity>
            {user && (
              <TouchableOpacity onPress={() => router.push("/(tabs)/projects")}>
                <Text style={s.navLink}>Projects</Text>
              </TouchableOpacity>
            )}
            <View style={s.navDivider} />
            <TouchableOpacity onPress={() => user ? goPortal() : router.push("/login_1")}>
              <Text style={s.navLinkAlt}>{user ? "My Portal" : "Sign In"}</Text>
            </TouchableOpacity>
            <View style={s.navDivider} />
            <TouchableOpacity style={s.navBtnOutline} onPress={() => router.push("/register?role=champion" as any)}>
              <Text style={s.navBtnOutlineText}>Apply as Champion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.navBtnPrimary} onPress={() => router.push("/register?role=client" as any)}>
              <Text style={s.navBtnPrimaryText}>Submit a Project</Text>
            </TouchableOpacity>
          </View>
        )}

        {isMobile && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {user ? (
              <TouchableOpacity style={s.avatarBtn} onPress={goPortal}>
                <Text style={s.avatarText}>{ini(user.name)}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.navBtnPrimary} onPress={() => router.push("/register?role=champion" as any)}>
                <Text style={s.navBtnPrimaryText}>Apply</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setMenuOpen(v => !v)} style={s.ham}>
              <View style={s.hamLine} />
              <View style={[s.hamLine, { width: menuOpen ? 20 : 13 }]} />
              <View style={s.hamLine} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isMobile && menuOpen && (
        <View style={s.mobileMenu}>
          {[
            { l: "Sign In",           r: "/login_1"                 as any },
            { l: "Apply as Champion", r: "/register?role=champion"   as any },
            { l: "Submit a Project",  r: "/register?role=client"     as any },
            { l: "Courses",           r: "/(tabs)/courses"           as any },
            ...(user ? [
              { l: "Projects", r: "/(tabs)/projects" as any },
            ] : []),
          ].map((lk, i) => (
            <TouchableOpacity key={i} style={s.mobileItem} onPress={() => { setMenuOpen(false); router.push(lk.r); }}>
              <Text style={s.mobileItemText}>{lk.l}</Text>
              <Text style={s.mobileItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── HERO ── */}
      <View style={[s.hero, isMobile && s.heroMobile]}>
        <View style={s.heroGrid} pointerEvents="none">
          {[0,1,2,3,4,5].map(i => <View key={i} style={[s.gridV, { left: `${i * 20}%` as any }]} />)}
        </View>
        <View style={s.heroGlow} pointerEvents="none"/>
        <View style={{ position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: G + "08", bottom: -80, left: -60, zIndex: 0 }} />
        <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: G + "05", top: 40, left: "30%", zIndex: 0 }} />

        <View style={s.heroConstrain}>
          <View style={[s.heroInner, isMobile && s.heroInnerMobile]}>

            {/* Left column */}
            <View style={[s.heroLeft, isMobile && s.heroLeftMobile]}>
              <View style={s.heroBadge}>
                <View style={s.heroBadgeDot} />
                <Text style={s.heroBadgeText}>Private · Curated · Verified</Text>
              </View>

              <Text style={[s.heroH1, isMobile && s.heroH1Mobile]}>
  The network where{"\n"}verified talent meets{"\n"}
  <Text style={s.heroAccent}>real opportunity.</Text>
</Text>

              <Text style={[s.heroSub, isMobile && s.heroSubMobile]}>
              A closed, invitation-eligible network connecting KYC-verified professionals with organisations that demand real expertise.</Text>

              <View style={[s.heroCtas, isMobile && s.heroCtasMobile]}>
                <TouchableOpacity style={s.heroBtnPrimary} onPress={() => router.push("/register?role=champion" as any)} activeOpacity={0.88}>
                  <Text style={s.heroBtnPrimaryText}>Apply for Membership</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.heroBtnGhost} onPress={() => router.push("/register?role=client" as any)} activeOpacity={0.8}>
                  <Text style={s.heroBtnGhostText}>Submit a Project →</Text>
                </TouchableOpacity>
              </View>

              <View style={s.heroProof}>
                {[
                  { val: stats?.total_champions  != null ? `${stats.total_champions}`   : "28",  lbl: "Verified Champions" },
                  { val: stats?.active_projects  != null ? `${stats.active_projects}`   : "12",  lbl: "Live Projects" },
                  { val: stats?.total_placements != null ? `${stats.total_placements}+` : "40+", lbl: "Placements" },
                ].map((p, i) => (
                  <View key={i} style={s.heroProofItem}>
                    {i > 0 && <View style={s.heroProofDiv} />}
                    <Text style={s.heroProofVal}>{p.val}</Text>
                    <Text style={s.heroProofLbl}>{p.lbl}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Right column — demo card */}
            {!isMobile && (
              <View style={s.heroRight}>
                <HeroDemoCard />
              </View>
            )}
          </View>

          {/* Mobile: card below text */}
          {isMobile && (
            <View style={s.heroRightMobile}>
              <HeroDemoCard />
            </View>
          )}
        </View>
      </View>

      {/* ── PLATFORM PILLARS ── */}
      <View style={[s.sectionWhite, isMobile && s.sectionMobile]}>
        <View style={[s.sectionRow, isMobile && { flexDirection: "column", gap: 40 }]}>
          <View style={s.sectionRowLeft}>
            <View style={s.eyebrowTag}>
              <Text style={s.eyebrowText}>WHY Ecoconnect</Text>
            </View>
            <Text style={[s.h2Left, isMobile && s.h2LeftMobile]}>
              Precision over{"\n"}volume. Always.
            </Text>
            <Text style={s.h2LeftSub}>
              Every decision is designed to protect network quality — for Champions and clients alike.
            </Text>
            <TouchableOpacity style={s.ghostLink} onPress={() => router.push("/register?role=champion" as any)}>
              <Text style={s.ghostLinkText}>How membership works →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.sectionRowRight}>
            <View style={s.pillarGrid}>
              {pillars.map((p, i) => (
                <View key={i} style={s.pillarCard}>
                  <Text style={s.pillarIcon}>{p.icon}</Text>
                  <Text style={s.pillarTitle}>{p.title}</Text>
                  <Text style={s.pillarDesc}>{p.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* ── MEMBERSHIP PATHS ── */}
      <View style={[s.sectionLight, isMobile && s.sectionMobile]}>
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View style={s.eyebrowTag}>
            <Text style={s.eyebrowText}>YOUR PATH IN</Text>
          </View>
          <Text style={[s.h2Center, isMobile && s.h2CenterMobile]}>
            Three ways to{" "}
            <Text style={{ color: G }}>join the network.</Text>
          </Text>
          <Text style={s.h2CenterSub}>
            Whether you're building credentials, bringing expertise, or sourcing talent — there's a clear path for you.
          </Text>
        </View>

        <View style={[s.memberGrid, isMobile && { flexDirection: "column" }]}>

          <HoverCard style={s.memberCard} hoveredStyle={s.memberCardHovered} onPress={() => router.push("/(tabs)/courses" as any)}>
            <View style={s.memberCardIcon}><Text style={s.memberCardIconText}>🌱</Text></View>
            <View style={[s.memberCardTag, { backgroundColor: "#f0fdf4", borderColor: G + "30" }]}>
              <Text style={[s.memberCardTagText, { color: G }]}>CERTIFICATION PATH</Text>
            </View>
            <Text style={s.memberCardTitle}>Learn, verify,{"\n"}unlock access.</Text>
            <Text style={s.memberCardDesc}>For students, early-career professionals, and career switchers entering sustainability.</Text>
            <View style={s.memberCardList}>
              {["Enrol in expert-led courses", "Earn recognised certifications", "Complete KYC verification", "Get matched to entry projects"].map((item, i) => (
                <View key={i} style={s.memberCardListItem}>
                  <View style={s.memberCardListDot} />
                  <Text style={s.memberCardListText}>{item}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.memberCardCta} onPress={() => router.push("/(tabs)/courses" as any)} activeOpacity={0.85}>
              <Text style={s.memberCardCtaText}>Browse Courses →</Text>
            </TouchableOpacity>
          </HoverCard>

          <HoverCard style={[s.memberCard, s.memberCardPrimary]} hoveredStyle={s.memberCardPrimaryHovered} onPress={() => router.push("/register?role=champion" as any)}>
            <View style={s.memberPrimaryBadge}><Text style={s.memberPrimaryBadgeText}>MOST POPULAR</Text></View>
            <View style={[s.memberCardIcon, { backgroundColor: G + "15" }]}><Text style={s.memberCardIconText}>🏅</Text></View>
            <View style={[s.memberCardTag, { backgroundColor: G + "12", borderColor: G + "40" }]}>
              <Text style={[s.memberCardTagText, { color: GD }]}>PROFESSIONAL MEMBERSHIP</Text>
            </View>
            <Text style={[s.memberCardTitle, { color: SL }]}>Direct access.{"\n"}Premium matching.</Text>
            <Text style={s.memberCardDesc}>For experienced ESG consultants, carbon specialists, and sustainability professionals.</Text>
            <View style={s.memberCardList}>
              {["Direct profile onboarding", "AI-matched to relevant projects", "No bidding — briefs come to you", "Reputation scoring & growth"].map((item, i) => (
                <View key={i} style={s.memberCardListItem}>
                  <View style={[s.memberCardListDot, { backgroundColor: G }]} />
                  <Text style={s.memberCardListText}>{item}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[s.memberCardCta, { backgroundColor: GD }]} onPress={() => router.push("/register?role=champion" as any)} activeOpacity={0.85}>
              <Text style={[s.memberCardCtaText, { color: WHT }]}>Apply for Membership →</Text>
            </TouchableOpacity>
          </HoverCard>

          <HoverCard style={[s.memberCard, { backgroundColor: N0 }]} hoveredStyle={s.memberCardEnterpriseHovered} onPress={() => router.push("/register?role=client" as any)}>
            <View style={[s.memberCardIcon, { backgroundColor: N2 }]}><Text style={s.memberCardIconText}>🏢</Text></View>
            <View style={[s.memberCardTag, { backgroundColor: N1, borderColor: N3 }]}>
              <Text style={[s.memberCardTagText, { color: N6 }]}>ENTERPRISE ACCESS</Text>
            </View>
            <Text style={s.memberCardTitle}>Confidential intake.{"\n"}Curated allocation.</Text>
            <Text style={s.memberCardDesc}>For organisations, ESG teams, and sustainability initiatives that need verified expertise.</Text>
            <View style={s.memberCardList}>
              {["Confidential project submission", "AI-scored Champion shortlist", "Admin-reviewed before delivery", "Milestone-based engagement"].map((item, i) => (
                <View key={i} style={s.memberCardListItem}>
                  <View style={s.memberCardListDot} />
                  <Text style={s.memberCardListText}>{item}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[s.memberCardCta, { backgroundColor: N8 }]} onPress={() => router.push("/register?role=client" as any)} activeOpacity={0.85}>
              <Text style={[s.memberCardCtaText, { color: WHT }]}>Submit a Confidential Brief →</Text>
            </TouchableOpacity>
          </HoverCard>

        </View>
      </View>

      {/* ── CHAMPIONS ── */}
      <View style={[s.sectionWhite, isMobile && s.sectionMobile]}>
        <View style={[s.sectionRow, isMobile && { flexDirection: "column", gap: 32 }, { alignItems: "flex-start" }]}>

          <View style={[s.sectionRowLeft, { paddingTop: 8 }]}>
            <View style={s.eyebrowTag}>
              <Text style={s.eyebrowText}>FEATURED CHAMPIONS</Text>
            </View>
            <Text style={[s.h2Left, isMobile && s.h2LeftMobile]}>
              The professionals{"\n"}behind the work.
            </Text>
            <Text style={s.h2LeftSub}>
              Verified sustainability professionals — identity-checked and credential-reviewed before joining.
            </Text>
            <View style={[s.eyebrowTag, { marginTop: 16, borderColor: G + "40", backgroundColor: G + "0c" }]}>
              <View style={[s.heroBadgeDot, { backgroundColor: G }]} />
              <Text style={[s.eyebrowText, { color: G }]}>Full directory for verified members only</Text>
            </View>
          </View>

          <View ref={champsRef} style={s.sectionRowRight}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.champScroll}
            >
              {champions.length > 0
                ? champions.map((c, index) => (
                    <AnimatedChampCard
                      key={c.user_id}
                      c={c}
                      index={index}
                      shouldAnimate={champsAnimated}
                    />
                  ))
                : [0,1,2,3].map(i => (
                    <View key={i} style={[s.champCard, { backgroundColor: N1, minHeight: 160 }]} />
                  ))
              }
            </ScrollView>
          </View>

        </View>
      </View>

      {/* ── CERTIFICATIONS ── */}
      <View style={[s.sectionWhite, isMobile && s.sectionMobile]}>
        <View style={[s.sectionRow, isMobile && { flexDirection: "column", gap: 32 }, { alignItems: "flex-start" }]}>

          {/* Course cards */}
          <View style={s.sectionRowRight}>
            <View style={[s.courseGrid2, isMobile && { flexDirection: "column" }]}>
              {courses.map((course) => {
                return (
                  <View key={course.id} style={[s.courseCardWrap, isMobile && { width: "100%" }]}>

                    {/* ── CINEMATIC CARD ── */}
                    <HoverCard
                      style={s.courseCard2}
                      hoveredStyle={s.courseCard2Hovered}
                      onPress={() => setSelectedCourseId(course.id)}
                    >
                      <View style={s.cinemaBg}>
                        <Image
                          source={course.bannerImage}
                          style={s.posterImage}
                          resizeMode="cover"
                           fadeDuration={0}
                        />
                        <View style={s.cinemaScrim} />
                        <View style={s.cinemaTopRow}>
                          <View style={s.cinemaMonogram}>
                            <Text style={s.cinemaMonogramText}>{course.shortTitle}</Text>
                          </View>
                          <View style={[s.cinemaStatusPill, { borderColor: course.statusColor + "90" }]}>
                            <View style={[s.cinemaStatusDot, { backgroundColor: course.statusColor }]} />
                            <Text style={s.cinemaStatusText}>{course.status}</Text>
                          </View>
                        </View>
                        <View style={[s.cinemaAccentLine, { backgroundColor: course.statusColor }]} />
                      </View>
                    </HoverCard>

                    {/* Expanded detail panel */}
                  

                  </View>
                );
              })}
            </View>
          </View>

          {/* Left label */}
          <View style={[s.sectionRowLeft, { paddingTop: 8 }]}>
            <View style={s.eyebrowTag}>
              <Text style={s.eyebrowText}>CERTIFICATION PATHWAYS</Text>
            </View>
            <Text style={[s.h2Left, isMobile && s.h2LeftMobile]}>
              Learn the discipline.{"\n"}Earn the credentials.
            </Text>
            <Text style={s.h2LeftSub}>
              Ecoconnect courses are designed to develop practitioner-grade expertise — and accelerate matching to relevant projects.
            </Text>
            <TouchableOpacity style={s.ghostLink} onPress={() => router.push("/(tabs)/courses")}>
              <Text style={s.ghostLinkText}>Browse all courses →</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* ── TESTIMONIALS ── */}
      <View style={[s.sectionLight, isMobile && s.sectionMobile]}>
        <View style={{ alignItems: "center", marginBottom: 44 }}>
          <View style={s.eyebrowTag}>
            <Text style={s.eyebrowText}>MEMBER PERSPECTIVES</Text>
          </View>
          <Text style={[s.h2Center, isMobile && s.h2CenterMobile]}>
            Outcomes that{" "}
            <Text style={{ color: G }}>speak for themselves.</Text>
          </Text>
        </View>

        <View ref={testiRef} style={[s.testiGrid, isMobile && { flexDirection: "column" }]}>
          {[
            {
              name: "Harvansh Singh Pal",
              role: "Operations & Champion Relations Lead",
              type: "CHAMPION",
              quote: "No bidding, no cold outreach, no competing on price. The projects that come to me are relevant — and clients arrive already trusting my credentials.",
            },
            {
              name: "Ankita",
              role: "Marketing Lead",
              type: "CHAMPION",
              quote: "Ecoconnect delivered a verified shortlist in under 48 hours. We engaged within the week and delivered two weeks ahead of schedule.",
            },
          ].map((t, i) => (
            <AnimatedTestiCard
              key={i}
              t={t}
              index={i}
              shouldAnimate={testiAnimated}
            />
          ))}
        </View>
      </View>

      {/* ── FINAL CTA ── */}
      <View style={[s.ctaSection, isMobile && s.sectionMobile]}>
        <View style={s.ctaGlow} />
        <View style={s.ctaGridOverlay}>
          {[0,1,2,3,4].map(i => <View key={i} style={[s.ctaGridV, { left: `${i * 25}%` as any }]} />)}
        </View>
        <View style={s.ctaInner}>
          <View style={[s.eyebrowTag, { borderColor: G + "40", backgroundColor: G + "0c", marginBottom: 20 }]}>
            <Text style={[s.eyebrowText, { color: G }]}>JOIN THE NETWORK</Text>
          </View>
          <Text style={[s.ctaH2, isMobile && s.ctaH2Mobile]}>
            Ready to be part{"\n"}of something different?
          </Text>
          <Text style={[s.ctaSub, isMobile && { fontSize: 14 }]}>
            A curated network for professionals and organisations{"\n"}who take sustainability seriously.
          </Text>
          <View style={[s.ctaBtns, isMobile && { flexDirection: "column", width: "100%", alignItems: "stretch" }]}>
            <TouchableOpacity style={s.ctaBtnPrimary} onPress={() => router.push("/register?role=champion" as any)} activeOpacity={0.88}>
              <Text style={s.ctaBtnPrimaryText}>Apply as a Champion →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ctaBtnSecondary} onPress={() => router.push("/register?role=client" as any)} activeOpacity={0.8}>
              <Text style={s.ctaBtnSecondaryText}>Submit a Project</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.ctaNote}>Membership is reviewed · All projects are confidential · No public bidding</Text>
        </View>
      </View>

      {/* ── FOOTER ── */}
      <View style={[s.footer, isMobile && s.footerMobile]}>
        <View style={[s.footerTop, isMobile && { flexDirection: "column", gap: 28 }]}>
          <View style={s.footerBrand}>
            <Image source={require("@/assets/images/logo.png")} style={s.footerLogo} resizeMode="cover" />
            <Text style={s.footerBrandText}>
              A private sustainability talent network connecting verified professionals with organisations building a credible green future.
            </Text>
          </View>
          <View style={[s.footerLinks, isMobile && { flexDirection: "row", flexWrap: "wrap", gap: 16 }]}>
            {[
              { l: "Sign In",           r: "/login_1"                as any },
              { l: "Apply as Champion", r: "/register?role=champion"  as any },
              { l: "Submit a Project",  r: "/register?role=client"    as any },
              ...(user ? [
                { l: "Projects", r: "/(tabs)/projects" as any },
                { l: "Courses",  r: "/(tabs)/courses"  as any },
              ] : []),
            ].map((lk, i) => (
              <TouchableOpacity key={i} onPress={() => router.push(lk.r)}>
                <Text style={s.footerLink}>{lk.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.footerDivider} />
        <View style={[s.footerBottom, isMobile && { flexDirection: "column", gap: 8, alignItems: "center" }]}>
          <Text style={s.footerCopy}>© {new Date().getFullYear()} Ecoconnect. All rights reserved.</Text>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Text style={s.footerCopy}>Privacy Policy</Text>
            <Text style={s.footerCopy}>Terms of Service</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push("/login_1")} style={s.adminLink}>
          <Text style={s.adminLinkText}>Admin Centre</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>

    {selectedCourseId && (
      <CourseDetailModal
        id={selectedCourseId}
        onClose={() => setSelectedCourseId(null)}
      />
    )}

  </>   
  );    
}       {/* closes export default function Home() */}
    

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f0fdf4" },

  // Banner
  banner:          { backgroundColor: GL, borderBottomWidth: 1, borderBottomColor: G + "25", paddingVertical: 10, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  bannerDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: G },
  bannerText:      { fontSize: 13, color: N6, textAlign: "center" },
  bannerCta:       { color: GD, fontWeight: "600" },
  bannerClose:     { position: "absolute", right: 16, padding: 4 },
  bannerCloseText: { fontSize: 13, color: N5 },

  // Nav
  nav:               { flexDirection: "row", alignItems: "center", paddingHorizontal: 28, paddingVertical: 16, backgroundColor: WHT, borderBottomWidth: 1, borderBottomColor: N2 },
  navMobile:         { paddingHorizontal: 18, paddingVertical: 12 },
  logo:              { width: 220, height: 50, borderRadius: 4 },
  logoMobile:        { width: 140, height: 38, borderRadius: 4 },
  navLinks:          { flexDirection: "row", gap: 32, flex: 1, justifyContent: "center" },
  navLink:           { fontSize: 14, color: N6, fontWeight: "500" },
  navLinkAlt:        { fontSize: 14, color: N7, fontWeight: "500" },
  navDivider:        { width: 1, height: 18, backgroundColor: N2, marginHorizontal: 6 },
  navRight:          { flexDirection: "row", alignItems: "center", gap: 10 },
  navBtnOutline:     { borderWidth: 1, borderColor: N3, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 7 },
  navBtnOutlineText: { fontSize: 13, color: N7, fontWeight: "600" },
  navBtnPrimary:     { backgroundColor: GD, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 7 },
  navBtnPrimaryText: { fontSize: 13, color: WHT, fontWeight: "600" },
  avatarBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: GD, justifyContent: "center", alignItems: "center" },
  avatarText:        { color: WHT, fontSize: 12, fontWeight: "700" },
  ham:               { padding: 6, gap: 5 },
  hamLine:           { width: 20, height: 2, backgroundColor: SL, borderRadius: 2 },
  mobileMenu:        { backgroundColor: WHT, borderBottomWidth: 1, borderBottomColor: N2 },
  mobileItem:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 15, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: N1 },
  mobileItemText:    { fontSize: 15, color: SL, fontWeight: "500" },
  mobileItemArrow:   { fontSize: 20, color: N4 },

  // Hero
  hero:            { backgroundColor: WHT, paddingTop: 72, paddingBottom: 72, paddingHorizontal: 28, position: "relative", borderBottomWidth: 1, borderBottomColor: N2, alignItems: "center" },
  heroMobile:      { paddingTop: 40, paddingBottom: 40, paddingHorizontal: 20 },
  heroGrid:        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  gridV:           { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: N2 + "30" },
  heroGlow:        { position: "absolute", width: 500, height: 400, borderRadius: 300, backgroundColor: G + "07", top: -80, right: 0, zIndex: 0 },
  heroConstrain:   { width: "100%" as any, maxWidth: 1200, zIndex: 1 },
  heroInner:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 40 },
  heroInnerMobile: { flexDirection: "column", gap: 0 },
  heroLeft:        { flex: 1, maxWidth: 520, zIndex:2, position: "relative" as any},
  heroLeftMobile:  { width: "100%" as any },
  heroRight: { flex: 1, alignItems: "center", justifyContent: "flex-start", maxWidth: 480, paddingTop: 8, zIndex: 0, pointerEvents: "none"},
  heroRightMobile: { width: "100%" as any, marginTop: 32, alignItems: "center" },

  heroBadge:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: WHT, borderWidth: 1, borderColor: N2, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, marginBottom: 24, alignSelf: "flex-start" },
  heroBadgeDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: G },
  heroBadgeText:  { fontSize: 12, color: N6, fontWeight: "500", letterSpacing: 0.3 },
  heroH1:         { fontSize: 50, fontWeight: "700", color: SL, lineHeight: 60, letterSpacing: -1.8, marginBottom: 16 },
  heroH1Mobile:   { fontSize: 32, lineHeight: 41, letterSpacing: -1 },
  heroAccent:     { color: G },
  heroSub:        { fontSize: 16, color: N5, lineHeight: 27, marginBottom: 28, maxWidth: 460, fontWeight: "400" },
  heroSubMobile:  { fontSize: 15, lineHeight: 25, marginBottom: 24 },
  heroCtas:       { flexDirection: "row", gap: 12, marginBottom: 40 },
  heroCtasMobile: { flexDirection: "column", alignItems: "stretch", gap: 10, marginBottom: 32 },
  heroBtnPrimary:     { backgroundColor: GD, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 8 },
  heroBtnPrimaryText: { color: WHT, fontWeight: "600", fontSize: 14, textAlign: "center" },
  heroBtnGhost:       { borderWidth: 1, borderColor: N3, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 8, backgroundColor: WHT },
  heroBtnGhostText:   { color: N7, fontWeight: "500", fontSize: 14, textAlign: "center" },
  heroProof:      { flexDirection: "row", alignItems: "center", gap: 0 },
  heroProofItem:  { alignItems: "flex-start", paddingHorizontal: 20, position: "relative" },
  heroProofDiv:   { position: "absolute", left: 0, top: "10%" as any, width: 1, height: "80%" as any, backgroundColor: N2 },
  heroProofVal:   { fontSize: 22, fontWeight: "700", color: SL, letterSpacing: -0.5, marginBottom: 2 },
  heroProofLbl:   { fontSize: 11, color: N4, fontWeight: "400" },

  // Sections
  sectionLight:  { paddingVertical: 72, paddingHorizontal: 40, backgroundColor: "#f0fdf4", borderTopWidth: 1, borderTopColor: N2 },
  sectionWhite:  { paddingVertical: 72, paddingHorizontal: 40, backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: N2 },
  sectionMobile: { paddingVertical: 48, paddingHorizontal: 20 },
  sectionRow:      { flexDirection: "row", gap: 48, alignItems: "center" },
  sectionRowLeft:  { flex: 1, minWidth: 220, maxWidth: 320 },
  sectionRowRight: { flex: 1.4 },

  eyebrowTag:    { borderWidth: 1, borderColor: N3, backgroundColor: WHT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5, alignSelf: "flex-start", marginBottom: 16 },
  eyebrowText:   { fontSize: 10, fontWeight: "700", color: N5, letterSpacing: 1.5 },
  h2Left:        { fontSize: 36, fontWeight: "700", color: SL, letterSpacing: -1, lineHeight: 46, marginBottom: 14 },
  h2LeftMobile:  { fontSize: 26, lineHeight: 34 },
  h2LeftSub:     { fontSize: 14, color: N5, lineHeight: 24, marginBottom: 20, fontWeight: "400" },
  ghostLink:     { alignSelf: "flex-start" },
  ghostLinkText: { fontSize: 13, color: G, fontWeight: "600" },
  h2Center:        { fontSize: 38, fontWeight: "700", color: SL, letterSpacing: -1, lineHeight: 48, marginBottom: 12, textAlign: "center" },
  h2CenterMobile:  { fontSize: 26, lineHeight: 34 },
  h2CenterSub:     { fontSize: 14, color: N5, lineHeight: 24, textAlign: "center", maxWidth: 480, marginBottom: 4, fontWeight: "400" },

  // Pillars
  pillarGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  pillarCard:  { width: "48%" as any, backgroundColor: N0, borderRadius: 12, borderWidth: 1, borderColor: N2, padding: 20, borderTopWidth: 3, borderTopColor: G + "30",shadowColor: G, shadowOpacity: 0.08, shadowRadius: 12 },
  pillarIcon:  { fontSize: 18, color: G, marginBottom: 10 },
  pillarTitle: { fontSize: 14, fontWeight: "700", color: SL, marginBottom: 5, lineHeight: 20 },
  pillarDesc:  { fontSize: 12, color: N5, lineHeight: 19, fontWeight: "400" },

  // Member cards
  memberGrid:             { flexDirection: "row", gap: 16, alignItems: "stretch" },
  memberCard:             { flex: 1, backgroundColor: WHT, borderRadius: 16, borderWidth: 1, borderColor: N2, padding: 24, shadowColor: G, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 1 },
  memberCardPrimary:      { borderColor: G + "50", borderWidth: 1.5, shadowOpacity: 0.08 },
  memberPrimaryBadge:     { position: "absolute" as any, top: -1, right: 20, backgroundColor: G, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  memberPrimaryBadgeText: { fontSize: 9, fontWeight: "700", color: WHT, letterSpacing: 1 },
  memberCardIcon:         { width: 44, height: 44, borderRadius: 12, backgroundColor: N1, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  memberCardIconText:     { fontSize: 22 },
  memberCardTag:          { borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 4, alignSelf: "flex-start", marginBottom: 12 },
  memberCardTagText:      { fontSize: 9, fontWeight: "700", letterSpacing: 1.2 },
  memberCardTitle:        { fontSize: 18, fontWeight: "700", color: SL, lineHeight: 26, marginBottom: 8, letterSpacing: -0.3 },
  memberCardDesc:         { fontSize: 13, color: N5, lineHeight: 21, marginBottom: 18, fontWeight: "400" },
  memberCardList:         { gap: 8, marginBottom: 20 },
  memberCardListItem:     { flexDirection: "row", alignItems: "center", gap: 10 },
  memberCardListDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: N4, flexShrink: 0 },
  memberCardListText:     { fontSize: 13, color: N6, lineHeight: 19 },
  memberCardCta:          { paddingVertical: 12, borderRadius: 8, alignItems: "center", backgroundColor: N1, borderWidth: 1, borderColor: N2, marginTop: "auto" as any },
  memberCardCtaText:      { fontSize: 13, fontWeight: "600", color: N7 },
  memberCardHovered: {
    borderColor: N3,
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    transform: [{ translateY: -4 }],
    backgroundColor: N0,
  },
  memberCardPrimaryHovered: {
    borderColor: G,
    shadowColor: G,
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    transform: [{ translateY: -4 }],
  },
  memberCardEnterpriseHovered: {
    borderColor: N7,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    transform: [{ translateY: -4 }],
  },

  // Champions
  champScroll:      { gap: 12, paddingRight: 8 },
  champCard:        { width: 210, backgroundColor: WHT, borderRadius: 12, borderWidth: 1, borderColor: N2, padding: 16, shadowColor: G, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1, position: "relative" as any, overflow: "hidden" },
  champCardHovered: { borderColor: N3, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  champAccentBar:   { position: "absolute" as any, bottom: 0, left: 0, right: 0, height: 2 },
  champCardTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  champAvatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: N8, justifyContent: "center", alignItems: "center" },
  champAvatarText:  { fontSize: 14, fontWeight: "700", color: WHT },
  champVerified:    { backgroundColor: G + "0f", borderWidth: 1, borderColor: G + "30", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  champVerifiedText:{ fontSize: 10, color: G, fontWeight: "700" },
  champName:        { fontSize: 14, fontWeight: "700", color: SL, marginBottom: 3 },
  champRole:        { fontSize: 11, color: N5, lineHeight: 17, marginBottom: 10 },
  champSkills:      { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 12 },
  champSkillPill:   { backgroundColor: N1, borderWidth: 1, borderColor: N2, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  champSkillText:   { fontSize: 10, color: N6, fontWeight: "500" },
  champFooter:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: N1 },
  champRating:      { flexDirection: "row", alignItems: "center", gap: 4 },
  champRatingStar:  { fontSize: 11, color: "#d97706" },
  champRatingVal:   { fontSize: 12, fontWeight: "600", color: SL },
  champCountry:     { fontSize: 10, color: N4 },

  // Course cards
  courseGrid2:        { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  courseCardWrap:     { flex:1 },
  courseCard2:        { borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  courseCard2Hovered: { shadowOpacity: 0.5, shadowRadius: 32, elevation: 16, transform: [{ translateY: -4 }] },
  cinemaBg:           { width: "100%" as any, aspectRatio:1, backgroundColor: "#f8fafc", position: "relative", overflow: "hidden" },
  posterImage:        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%" as any, height: "100%" as any },
  cinemaScrim:        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.08)", resizeMode: "cover"},
  cinemaGlow:         { position: "absolute", bottom: 0, left: 0, right: 0, height: 180, opacity: 0.08 },
  cinemaAccentLine:   { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },
  cinemaTopRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16, zIndex: 2 },
  cinemaMonogram:     { borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.40)" },
  cinemaMonogramText: { fontSize: 12, fontWeight: "800", color: WHT, letterSpacing: 2 },
  cinemaStatusPill:   { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.45)" },
  cinemaStatusDot:    { width: 5, height: 5, borderRadius: 3 },
  cinemaStatusText:   { fontSize: 9, fontWeight: "700", color: WHT, letterSpacing: 0.8 },
  cinemaContent:      { padding: 20, paddingBottom: 22, zIndex: 2 },
  cinemaTagPill:      { borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 4, alignSelf: "flex-start", marginBottom: 10 },
  cinemaTagText:      { fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  cinemaTitle:        { fontSize: 20, fontWeight: "700", color: WHT, lineHeight: 28, marginBottom: 8, letterSpacing: -0.4 },
  cinemaMeta:         { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" },
  cinemaMetaDot:      { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" },
  cinemaMetaText:     { fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: "500" },
  cinemaPartners:     { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 14 },
  cinemaPartnerPill:  { backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.20)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  cinemaPartnerText:  { fontSize: 9, color: "rgba(255,255,255,0.75)", fontWeight: "500" },
  cinemaExpandRow:    { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", paddingTop: 12, marginTop: 2 },
  cinemaExpandCta:    { fontSize: 12, fontWeight: "700" },
  courseDetail:               { borderRadius: 12, borderWidth: 1, borderColor: N2, backgroundColor: N0, marginTop: 6, overflow: "hidden", shadowColor: SL, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  courseDetailBar:            { height: 3, width: "100%" as any },
  courseDetailInner:          { padding: 20, gap: 20 },
  courseDetailBlock:          { gap: 8 },
  courseDetailLabel:          { fontSize: 9, fontWeight: "800", color: N4, letterSpacing: 1.6, marginBottom: 6 },
  courseDetailBody:           { fontSize: 13, color: N6, lineHeight: 22, fontWeight: "400" },
  courseDetailRow:            { flexDirection: "row", gap: 20 },
  courseDetailCol:            { flex: 1, gap: 8 },
  courseDetailOutcomeRow:     { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 4 },
  courseDetailOutcomeDot:     { fontSize: 7, marginTop: 5, flexShrink: 0 },
  courseDetailOutcome:        { fontSize: 12, color: N6, lineHeight: 20, flex: 1 },
  courseDetailMetaRow:        { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: N2, paddingVertical: 6 },
  courseDetailMetaKey:        { fontSize: 11, color: N5, fontWeight: "500" },
  courseDetailMetaVal:        { fontSize: 11, color: SL, fontWeight: "600" },
  courseDetailPartner:        { fontSize: 11, color: N6, lineHeight: 20 },
  courseDetailInitiative:     { backgroundColor: WHT, borderRadius: 8, borderWidth: 1, borderColor: N2, padding: 14 },
  courseDetailInitiativeText: { fontSize: 11, color: N5, lineHeight: 19, fontStyle: "italic" },

  // Testimonials
  testiGrid:        { flexDirection: "row", gap: 16 },
  testiCard:        { flex: 1, backgroundColor: WHT, borderWidth: 1, borderColor: N2, borderRadius: 14, padding: 24, shadowColor: SL, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 1, overflow: "hidden", position: "relative" as any },
  testiHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  testiTypePill:    { borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 4 },
  testiTypeText:    { fontSize: 9, fontWeight: "700", letterSpacing: 1.2 },
  testiQuoteMark:   { fontSize: 56, color: N2, fontWeight: "800", lineHeight: 44, marginBottom: 2 },
  testiQuote:       { fontSize: 14, color: N6, lineHeight: 23, fontStyle: "italic", marginBottom: 20 },
  testiAuthor:      { flexDirection: "row", alignItems: "center", gap: 12 },
  testiAvatar:      { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  testiAvatarText:  { color: WHT, fontSize: 11, fontWeight: "700" },
  testiName:        { fontSize: 13, fontWeight: "600", color: SL },
  testiRole:        { fontSize: 11, color: N4, marginTop: 1 },
  testiAccentBar:   { position: "absolute" as any, bottom: 0, left: 0, right: 0, height: 2 },

  // CTA
  ctaSection:          { backgroundColor: N0, paddingVertical: 88, paddingHorizontal: 28, overflow: "hidden", position: "relative", borderTopWidth: 1, borderTopColor: N2, alignItems: "center" },
  ctaGlow:             { position: "absolute", width: 500, height: 300, borderRadius: 250, backgroundColor: G + "07", top: 0, alignSelf: "center" },
  ctaGridOverlay:      { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  ctaGridV:            { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: N2 + "30" },
  ctaInner:            { zIndex: 1, alignItems: "center", maxWidth: 600 },
  ctaH2:               { fontSize: 44, fontWeight: "700", color: SL, textAlign: "center", letterSpacing: -1.5, lineHeight: 54, marginBottom: 14 },
  ctaH2Mobile:         { fontSize: 28, lineHeight: 36 },
  ctaSub:              { fontSize: 15, color: N5, textAlign: "center", lineHeight: 26, marginBottom: 32, fontWeight: "400" },
  ctaBtns:             { flexDirection: "row", gap: 12, marginBottom: 20 },
  ctaBtnPrimary:       { backgroundColor: GD, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 8 },
  ctaBtnPrimaryText:   { color: WHT, fontWeight: "600", fontSize: 14, textAlign: "center" },
  ctaBtnSecondary:     { borderWidth: 1, borderColor: N3, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 8, backgroundColor: WHT },
  ctaBtnSecondaryText: { color: N7, fontWeight: "500", fontSize: 14, textAlign: "center" },
  ctaNote:             { fontSize: 11, color: N4, letterSpacing: 0.3 },

  // Footer
  footer:          { backgroundColor: SL, paddingVertical: 56, paddingHorizontal: 40 },
  footerMobile:    { paddingHorizontal: 18 },
  footerTop:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36, gap: 32 },
  footerBrand:     { flex: 1 },
  footerBrandText: { fontSize: 14, color: N3, lineHeight: 24, maxWidth: 300, fontWeight: "400" },
  footerLogo: { width: 180, height: 44, marginBottom: 16, opacity: 1, marginLeft: -8 },
  footerLinks:     { flexDirection: "column", gap: 16, alignItems: "flex-end" },
  footerLink:      { fontSize: 14, color: N3, fontWeight: "500" },
  footerDivider:   { height: 1, backgroundColor: N7, marginBottom: 24 },
  footerBottom:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerCopy:      { fontSize: 13, color: N5 },
  adminLink:       { marginTop: 20, alignSelf: "center" },
  adminLinkText:   { fontSize: 11, color: "#1e293b", fontWeight: "400" },
});



