import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Image,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { loginUser } from "@/services/api";
import { saveToken, saveUser } from "@/services/auth";

const G    = "#059669";
const BASE = "https://ecoconnect-backend-7qov.onrender.com";
export default function Login() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [remember,    setRemember]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [showPass,    setShowPass]    = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await loginUser(email.trim(), password);
      await saveToken(res.access_token);
      await saveUser(res.user);

      if (res.user.role === "admin")  { router.replace("/(tabs)/dashboard"); return; }
      if (res.user.role === "client") { router.replace("/client-portal");    return; }

      try {
        const profileRes = await fetch(
          `${BASE}/get-user/${res.user.user_id}`,
          { headers: { Authorization: `Bearer ${res.access_token}` } }
        );
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (!profile.onboarding_complete) {
            router.replace("/champion-onboarding" as any);
            return;
          }
        }
      } catch { /* fall through */ }

      router.replace("/freelancer-portal");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Nav ── */}
      <View style={s.nav}>
        <View style={s.navLogo}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={isMobile ? s.logoImgMobile : s.logoImg}
            resizeMode="cover"
          />
        </View>
        {isMobile ? (
          <TouchableOpacity onPress={() => setMenuOpen(o => !o)} style={s.hamburger}>
            <Text style={s.hamburgerIcon}>{menuOpen ? "✕" : "☰"}</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.navRight}>
            <TouchableOpacity style={s.getStartedBtn} onPress={() => router.push("/register")}>
              <Text style={s.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <View style={s.mobileMenu}>
          <TouchableOpacity style={[s.mobileMenuItem, s.mobileMenuCTA]} onPress={() => { setMenuOpen(false); router.push("/register"); }}>
            <Text style={s.mobileMenuCTAText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Center ── */}
      <View style={[s.center, isMobile && s.centerMobile]}>
        {!isMobile && (
          <View style={s.brandRow}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={s.brandLogoImg}
              resizeMode="cover"
            />
          </View>
        )}

        <Text style={[s.pageTitle, isMobile && s.pageTitleMobile]}>Welcome back</Text>
        <Text style={s.pageSub}>Sign in to your account to continue</Text>

        {/* Card */}
        <View style={[s.card, isMobile && s.cardMobile]}>
          {/* Email */}
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9ca3af"
          />

          {/* Password + eye toggle */}
          <Text style={[s.label, { marginTop: 20 }]}>Password</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.inputFlex}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(v => !v)}>
              <Text style={s.eyeIcon}>{showPass ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.rememberRow}>
            <TouchableOpacity style={s.checkRow} onPress={() => setRemember(!remember)}>
              <View style={[s.checkbox, remember && s.checkboxOn]}>
                {remember && <Text style={s.checkTick}>✓</Text>}
              </View>
              <Text style={s.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={s.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitText}>Sign In</Text>
            }
          </TouchableOpacity>

          <Text style={s.switchRow}>
            Don't have an account?{" "}
            <Text style={s.switchLink} onPress={() => router.push("/register" as any)}>
              Sign up
            </Text>
          </Text>
        </View>

        <Text style={s.termsNote}>
          By signing in, you agree to our{" "}
          <Text style={s.termsLink}>Terms of Service</Text> and{" "}
          <Text style={s.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: "#f9fafb" },

  // Nav
  nav:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 48, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  navLogo:        { flex: 1 },
  logoImg:        { width: 220, height: 50, borderRadius: 4 },
  logoImgMobile:  { width: 140, height: 38, borderRadius: 4 },
  navRight:       { flexDirection: "row", alignItems: "center", gap: 16 },
  navLink:        { fontSize: 14, color: "#4b5563", fontWeight: "500" },
  getStartedBtn:  { backgroundColor: G, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  getStartedText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  hamburger:     { padding: 8 },
  hamburgerIcon: { fontSize: 22, color: "#111827" },

  mobileMenu:        { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingVertical: 8 },
  mobileMenuItem:    { paddingHorizontal: 20, paddingVertical: 14 },
  mobileMenuText:    { fontSize: 15, color: "#374151", fontWeight: "500" },
  mobileMenuCTA:     { marginHorizontal: 20, marginTop: 4, marginBottom: 8, backgroundColor: G, borderRadius: 8, alignItems: "center" },
  mobileMenuCTAText: { color: "#fff", fontWeight: "600", fontSize: 15 },

  // Center
  center:          { flex: 1, alignItems: "center", paddingHorizontal: 20, paddingTop: 48, paddingBottom: 40 },
  centerMobile:    { paddingTop: 28 },
  brandRow:        { alignItems: "center", marginBottom: 16 },
  brandLogoImg:    { width: 320, height: 80, borderRadius: 4 },
  pageTitle:       { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 6, textAlign: "center" },
  pageTitleMobile: { fontSize: 22 },
  pageSub:         { fontSize: 15, color: "#4b5563", marginBottom: 28, textAlign: "center" },

  // Card
  card:       { width: "100%", maxWidth: 440, backgroundColor: "#fff", borderRadius: 14, padding: 28, borderWidth: 1, borderColor: "#e5e7eb", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  cardMobile: { padding: 20, borderRadius: 12 },

  label:       { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 7 },
  input:       { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 13, fontSize: 15, backgroundColor: "#fff", color: "#111827" },

  // Password row with eye
  inputRow:  { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, backgroundColor: "#fff" },
  inputFlex: { flex: 1, padding: 13, fontSize: 15, color: "#111827" },
  eyeBtn:    { paddingHorizontal: 14, paddingVertical: 13 },
  eyeIcon:   { fontSize: 16 },

  rememberRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 8 },
  checkRow:     { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox:     { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: "#d1d5db", justifyContent: "center", alignItems: "center" },
  checkboxOn:   { backgroundColor: G, borderColor: G },
  checkTick:    { color: "#fff", fontSize: 10, fontWeight: "700" },
  rememberText: { fontSize: 14, color: "#374151" },
  forgotLink:   { fontSize: 14, color: G, fontWeight: "500" },
  errorText:    { color: "#dc2626", fontSize: 13, marginTop: 8, textAlign: "center" },
  submitBtn:    { backgroundColor: G, padding: 15, borderRadius: 10, alignItems: "center", marginTop: 20 },
  submitText:   { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchRow:    { textAlign: "center", marginTop: 18, fontSize: 14, color: "#4b5563" },
  switchLink:   { color: G, fontWeight: "600" },
  termsNote:    { marginTop: 20, fontSize: 13, color: "#6b7280", textAlign: "center", maxWidth: 400 },
  termsLink:    { color: G },
});
