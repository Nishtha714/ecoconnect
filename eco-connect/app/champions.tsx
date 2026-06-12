/**
 * app/champions.tsx
 * Full champions directory — search, filter by skill/country, grid layout.
 * Data: GET /public/champions  (no auth required)
 */

import { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Image, Platform, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { getPublicChampions, PublicChampion } from "@/services/api";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  g800: "#064e3b", g700: "#065f46", g600: "#059669",
  g500: "#10b981", g400: "#34d399", g200: "#a7f3d0",
  g100: "#d1fae5", g50:  "#f0fdf4",
  n900: "#0f172a", n800: "#1e293b", n700: "#334155",
  n600: "#475569", n400: "#94a3b8", n200: "#e2e8f0",
  n100: "#f1f5f9", n50:  "#f8fafc", white: "#ffffff",
  amber: "#f59e0b",
};

const F = {
  regular:   "Inter_400Regular",
  medium:    "Inter_500Medium",
  semibold:  "Inter_600SemiBold",
  bold:      "Inter_700Bold",
  extrabold: "Inter_800ExtraBold",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name: string) =>
  name.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);

// ─── Sub-components ───────────────────────────────────────────────────────────
const Stars = ({ rating }: { rating?: number | null }) => {
  const r = rating ?? 0;
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={{ fontSize: 11, color: C.amber }}>
          {i < Math.floor(r) ? "★" : r % 1 >= 0.5 && i === Math.floor(r) ? "⭑" : "☆"}
        </Text>
      ))}
    </View>
  );
};

const Chip = ({ label, active, onPress }: {
  label: string; active?: boolean; onPress?: () => void;
}) => (
  <TouchableOpacity
    style={[st.chip, active && st.chipActive]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Text style={[st.chipText, active && st.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Champion Card ────────────────────────────────────────────────────────────
const ChampionCard = ({
  c, index,
}: { c: PublicChampion; index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400,
        delay: index * 60, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 400,
        delay: index * 60, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const skills = c.skills ?? [];

  return (
    <Animated.View style={[
      st.card,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      {/* Verified badge */}
      <View style={st.verifiedBadge}>
        <Text style={st.verifiedText}>✓</Text>
      </View>

      {/* Avatar */}
      <View style={st.avatar}>
        <Text style={st.avatarText}>{initials(c.name)}</Text>
      </View>

      {/* Name + role */}
      <Text style={st.cardName}>{c.name}</Text>
      {c.role != null && c.role.trim() !== "" && (
        <Text style={st.cardRole} numberOfLines={1}>{c.role}</Text>
      )}

      {/* Rating */}
      {c.rating != null && (
        <View style={st.ratingRow}>
          <Stars rating={c.rating} />
          <Text style={st.ratingVal}>{c.rating.toFixed(1)}</Text>
          {c.reviews != null && (
            <Text style={st.ratingCount}>({c.reviews})</Text>
          )}
        </View>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <View style={st.skillRow}>
          {skills.slice(0, 2).map((s, i) => (
            <View key={i} style={st.skillPill}>
              <Text style={st.skillPillText} numberOfLines={1}>{s}</Text>
            </View>
          ))}
          {skills.length > 2 && (
            <View style={[st.skillPill, st.skillPillMuted]}>
              <Text style={[st.skillPillText, { color: C.n600 }]}>
                +{skills.length - 2}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={st.cardFooter}>
        {c.country != null && (
          <Text style={st.footerText}>📍 {c.country}</Text>
        )}
        {c.projects != null && (
          <Text style={st.footerText}>{c.projects} projects</Text>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ query }: { query: string }) => (
  <View style={st.emptyWrap}>
    <Text style={st.emptyEmoji}>🔍</Text>
    <Text style={st.emptyTitle}>No champions found</Text>
    <Text style={st.emptySub}>
      {query
        ? `No results for "${query}". Try a different skill or keyword.`
        : "No champions match the selected filters."}
    </Text>
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ChampionsScreen() {
  const router = useRouter();

  const [champions,      setChampions]      = useState<PublicChampion[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [activeSkill,    setActiveSkill]    = useState<string | null>(null);
  const [activeCountry,  setActiveCountry]  = useState<string | null>(null);
  const [showFilters,    setShowFilters]    = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getPublicChampions()
      .then((data) => {
        setChampions(data);
        setLoading(false);
        Animated.timing(headerFade, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }).start();
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Derived filter options ─────────────────────────────────────────────────
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    champions.forEach((c) => (c.skills ?? []).forEach((s) => set.add(s)));
    return Array.from(set).slice(0, 20);
  }, [champions]);

  const allCountries = useMemo(() => {
    const set = new Set<string>();
    champions.forEach((c) => { if (c.country) set.add(c.country); });
    return Array.from(set);
  }, [champions]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return champions.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.role ?? "").toLowerCase().includes(q) ||
        (c.skills ?? []).some((s) => s.toLowerCase().includes(q)) ||
        (c.country ?? "").toLowerCase().includes(q);

      const matchSkill =
        !activeSkill ||
        (c.skills ?? []).some((s) =>
          s.toLowerCase() === activeSkill.toLowerCase()
        );

      const matchCountry =
        !activeCountry ||
        (c.country ?? "").toLowerCase() === activeCountry.toLowerCase();

      return matchSearch && matchSkill && matchCountry;
    });
  }, [champions, searchQuery, activeSkill, activeCountry]);

  const hasFilters = !!activeSkill || !!activeCountry;
  const clearFilters = () => {
    setActiveSkill(null);
    setActiveCountry(null);
    setSearchQuery("");
  };

  return (
    <ScrollView
      style={st.page}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
    >
      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <View style={st.stickyHeader}>
        {/* Nav row */}
        <View style={st.nav}>
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
            <Text style={st.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={st.navTitle}>Champions</Text>
          <View style={{ width: 64 }} />
        </View>

        {/* Search bar */}
        <View style={st.searchWrap}>
          <Text style={st.searchIcon}>🔍</Text>
          <TextInput
            style={st.searchInput}
            placeholder="Search by name, skill or country..."
            placeholderTextColor={C.n400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={st.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter toggle row */}
        <View style={st.filterToggleRow}>
          <TouchableOpacity
            style={[st.filterToggleBtn, showFilters && st.filterToggleBtnActive]}
            onPress={() => setShowFilters((v) => !v)}
          >
            <Text style={[st.filterToggleText, showFilters && { color: C.white }]}>
              ⚙ Filters {hasFilters ? `(${(activeSkill ? 1 : 0) + (activeCountry ? 1 : 0)})` : ""}
            </Text>
          </TouchableOpacity>

          {hasFilters && (
            <TouchableOpacity style={st.clearBtn} onPress={clearFilters}>
              <Text style={st.clearBtnText}>Clear all</Text>
            </TouchableOpacity>
          )}

          <Text style={st.resultCount}>
            {loading ? "Loading…" : `${filtered.length} champion${filtered.length !== 1 ? "s" : ""}`}
          </Text>
        </View>

        {/* Filter panels */}
        {showFilters && (
          <View style={st.filterPanel}>
            {/* Skills */}
            {allSkills.length > 0 && (
              <>
                <Text style={st.filterLabel}>Filter by Skill</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                >
                  {allSkills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      active={activeSkill === skill}
                      onPress={() =>
                        setActiveSkill(activeSkill === skill ? null : skill)
                      }
                    />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Countries */}
            {allCountries.length > 0 && (
              <>
                <Text style={[st.filterLabel, { marginTop: 12 }]}>Filter by Country</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                >
                  {allCountries.map((country) => (
                    <Chip
                      key={country}
                      label={`📍 ${country}`}
                      active={activeCountry === country}
                      onPress={() =>
                        setActiveCountry(activeCountry === country ? null : country)
                      }
                    />
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}
      </View>

      {/* ── Hero banner ────────────────────────────────────────────────────── */}
      <Animated.View style={[st.heroBanner, { opacity: headerFade }]}>
        <View style={st.heroCircle1} />
        <View style={st.heroCircle2} />
        <View style={{ zIndex: 1, alignItems: "center" }}>
          <Text style={st.heroEyebrow}>OUR EXPERTS</Text>
          <Text style={st.heroTitle}>EcoConnect Certified{"\n"}Champions</Text>
          <Text style={st.heroSub}>
            {loading
              ? "Loading champions..."
              : `${champions.length} verified sustainability experts ready to work`}
          </Text>
        </View>
      </Animated.View>

      {/* ── Active filter pills ────────────────────────────────────────────── */}
      {hasFilters && (
        <View style={st.activeFiltersRow}>
          {activeSkill && (
            <TouchableOpacity
              style={st.activeFilterPill}
              onPress={() => setActiveSkill(null)}
            >
              <Text style={st.activeFilterPillText}>{activeSkill} ✕</Text>
            </TouchableOpacity>
          )}
          {activeCountry && (
            <TouchableOpacity
              style={st.activeFilterPill}
              onPress={() => setActiveCountry(null)}
            >
              <Text style={st.activeFilterPillText}>📍 {activeCountry} ✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <View style={st.content}>
        {loading ? (
          // Skeleton grid
          <View style={st.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={st.skeleton} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState query={searchQuery} />
        ) : (
          <View style={st.grid}>
            {filtered.map((c, i) => (
              <ChampionCard key={c.user_id} c={c} index={i} />
            ))}
          </View>
        )}
      </View>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      {!loading && (
        <View style={st.bottomCta}>
          <Text style={st.bottomCtaTitle}>Are you a sustainability expert?</Text>
          <Text style={st.bottomCtaSub}>
            Join our growing network of certified champions.
          </Text>
          <TouchableOpacity
            style={st.bottomCtaBtn}
            onPress={() => router.push("/register")}
            activeOpacity={0.85}
          >
            <Text style={st.bottomCtaBtnText}>Become a Champion →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_MIN = 260;

const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.n50 },

  // ── STICKY HEADER ──
  stickyHeader: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.n200,
    paddingBottom: 4,
    // iOS shadow
    shadowColor: C.n900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 12,
  },
  backBtn:     { paddingVertical: 6, paddingHorizontal: 4, minWidth: 64 },
  backBtnText: { fontSize: 15, fontFamily: F.medium, color: C.g600 },
  navTitle:    { fontSize: 17, fontFamily: F.bold, color: C.n900 },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: C.n50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.n200,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 10,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: {
    flex: 1, fontSize: 15,
    fontFamily: F.regular, color: C.n900,
  },
  searchClear: { fontSize: 14, color: C.n400, padding: 4 },

  // Filter toggle
  filterToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  filterToggleBtn: {
    borderWidth: 1, borderColor: C.n200,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  filterToggleBtnActive: { backgroundColor: C.g600, borderColor: C.g600 },
  filterToggleText:      { fontSize: 13, fontFamily: F.medium, color: C.n700 },
  clearBtn:              { paddingHorizontal: 10, paddingVertical: 7 },
  clearBtnText:          { fontSize: 13, fontFamily: F.medium, color: C.g600 },
  resultCount:           { marginLeft: "auto", fontSize: 13, fontFamily: F.regular, color: C.n400 },

  // Filter panel
  filterPanel: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: C.n100,
    paddingTop: 14,
  },
  filterLabel: { fontSize: 12, fontFamily: F.bold, color: C.n600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },

  // Chips
  chip:          { backgroundColor: C.n100, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: C.n200 },
  chipActive:    { backgroundColor: C.g600, borderColor: C.g600 },
  chipText:      { fontSize: 13, fontFamily: F.medium, color: C.n700 },
  chipTextActive:{ color: C.white },

  // ── HERO BANNER ──
  heroBanner: {
    backgroundColor: C.g700,
    paddingVertical: 52,
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  heroCircle1: {
    position: "absolute", width: 300, height: 300, borderRadius: 150,
    backgroundColor: C.g600, opacity: 0.25, top: -80, right: -80,
  },
  heroCircle2: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.g500, opacity: 0.15, bottom: -60, left: -40,
  },
  heroEyebrow: { fontSize: 11, fontFamily: F.bold, color: C.g200, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 },
  heroTitle:   { fontSize: 34, fontFamily: F.extrabold, color: C.white, textAlign: "center", letterSpacing: -1, lineHeight: 42, marginBottom: 12 },
  heroSub:     { fontSize: 15, fontFamily: F.regular, color: C.g200, textAlign: "center", lineHeight: 24 },

  // Active filter pills
  activeFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.n100,
  },
  activeFilterPill:     { backgroundColor: C.g50, borderWidth: 1, borderColor: C.g200, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  activeFilterPillText: { fontSize: 13, fontFamily: F.medium, color: C.g700 },

  // ── CONTENT ──
  content: { padding: 20 },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  // Champion card
  card: {
    flex: 1,
    minWidth: CARD_MIN,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: C.n200,
    shadowColor: C.n900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    position: "relative",
  },
  verifiedBadge: {
    position: "absolute", top: 14, right: 14,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.g600,
    justifyContent: "center", alignItems: "center",
  },
  verifiedText:  { color: C.white, fontSize: 12, fontFamily: F.bold },
  avatar:        { width: 56, height: 56, borderRadius: 28, backgroundColor: C.g100, justifyContent: "center", alignItems: "center", marginBottom: 14, borderWidth: 2, borderColor: C.g200 },
  avatarText:    { fontSize: 20, fontFamily: F.bold, color: C.g700 },
  cardName:      { fontSize: 17, fontFamily: F.bold,    color: C.n900, marginBottom: 3 },
  cardRole:      { fontSize: 13, fontFamily: F.regular, color: C.n600, marginBottom: 10 },
  ratingRow:     { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 12 },
  ratingVal:     { fontSize: 13, fontFamily: F.semibold, color: C.n800 },
  ratingCount:   { fontSize: 12, fontFamily: F.regular,  color: C.n400 },

  skillRow:      { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  skillPill:     { backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  skillPillMuted:{ backgroundColor: C.n100, borderColor: C.n200 },
  skillPillText: { fontSize: 12, fontFamily: F.medium, color: C.g700 },

  cardFooter:    { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: C.n100 },
  footerText:    { fontSize: 12, fontFamily: F.regular, color: C.n600 },

  // Skeleton
  skeleton: {
    flex: 1, minWidth: CARD_MIN, height: 260,
    borderRadius: 20, backgroundColor: C.n100,
  },

  // Empty state
  emptyWrap:  { alignItems: "center", paddingVertical: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: F.bold,    color: C.n800, marginBottom: 8 },
  emptySub:   { fontSize: 15, fontFamily: F.regular, color: C.n400, textAlign: "center", maxWidth: 300, lineHeight: 24 },

  // Bottom CTA
  bottomCta: {
    margin: 20,
    backgroundColor: C.g700,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    overflow: "hidden",
  },
  bottomCtaTitle: { fontSize: 22, fontFamily: F.extrabold, color: C.white, textAlign: "center", marginBottom: 8 },
  bottomCtaSub:   { fontSize: 14, fontFamily: F.regular,   color: C.g200, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  bottomCtaBtn:   { backgroundColor: C.g500, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  bottomCtaBtnText: { color: C.white, fontFamily: F.bold, fontSize: 15 },
});
