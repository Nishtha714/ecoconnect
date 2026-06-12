import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Image,
  useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { addClient, loginUser, sendOtp, verifyOtp } from "@/services/api";
import { storeToken, storeUser } from "@/services/auth";

const G = "#059669";
type Role = "freelancer" | "client";

export default function Register() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const params = useLocalSearchParams<{ role?: string }>();

  const [step,     setStep]     = useState<"role" | "details" | "otp">("role");
  const [role,     setRole]     = useState<Role | null>(null);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [skills,   setSkills]   = useState("");
  const [company,  setCompany]  = useState("");
  const [agreed,   setAgreed]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState("");
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  useEffect(() => {
    if (params.role === "champion") { setRole("freelancer"); setStep("details"); }
    else if (params.role === "client") { setRole("client"); setStep("details"); }
  }, [params.role]);

  const roles = [
    { id: "freelancer" as Role, label: "Champion", icon: "⚡", desc: "Share your sustainability expertise and work on impactful projects" },
    { id: "client"     as Role, label: "Company",  icon: "📋", desc: "Post projects and hire expert sustainability professionals" },
  ];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())     e.name     = "Required";
    if (!email.trim())    e.email    = "Required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password.trim()) e.password = "Required";
    else if (password.length < 6)         e.password = "Min 6 characters";
    if (role === "freelancer" && !skills.trim())  e.skills  = "Add at least one skill";
    if (role === "client"     && !company.trim()) e.company = "Required";
    if (!agreed) e.agreed = "You must agree to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setMessage("");
    try {
      if (role === "freelancer") {
        await sendOtp({
          name: name.trim(),
          email: email.trim(),
          password,
          skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          role: "freelancer",
        });
        setStep("otp");
      } else {
        await addClient({
          name: name.trim(),
          email: email.trim(),
          password,
          company: company.trim(),
          role: "client",
        });
        const { access_token, user } = await loginUser(email.trim(), password);
        await storeToken(access_token);
        await storeUser(user);
        router.replace("/client-portal" as any);
      }
    } catch (err: any) {
      setMessage(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true); setMessage("");
    try {
      await verifyOtp(email.trim(), otpValue);
      const { access_token, user } = await loginUser(email.trim(), password);
      await storeToken(access_token);
      await storeUser(user);
      router.replace("/champion-onboarding" as any);
    } catch (err: any) {
      setMessage(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">

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
            <TouchableOpacity onPress={() => router.push("/login_1" as any)}>
              <Text style={s.navLink}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.getStartedBtn} onPress={() => setStep("role")}>
              <Text style={s.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <View style={s.mobileMenu}>
          <TouchableOpacity style={s.mobileMenuItem} onPress={() => { setMenuOpen(false); router.push("/login_1" as any); }}>
            <Text style={s.mobileMenuText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.mobileMenuItem, s.mobileMenuCTA]} onPress={() => { setMenuOpen(false); setStep("role"); }}>
            <Text style={s.mobileMenuCTAText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Center ── */}
      <View style={[s.center, isMobile && s.centerMobile]}>
        {!isMobile && (
          <View style={s.brandRow}>
            <Image source={require("@/assets/images/logo.png")} style={s.brandLogoImg} resizeMode="cover" />
          </View>
        )}

        <Text style={[s.pageTitle, isMobile && s.pageTitleMobile]}>
          {step === "role" ? "Join EcoConnect" : step === "otp" ? "Verify Email" : "Create your account"}
        </Text>
        <Text style={s.pageSub}>
          {step === "role"
            ? "Choose how you want to participate"
            : step === "otp"
            ? "Check your inbox for the OTP"
            : "Fill in your details to get started"}
        </Text>

        {/* ── STEP 1: Role selection ── */}
        {step === "role" && (
          <View style={[s.rolesGrid, isMobile && s.rolesGridMobile]}>
            {roles.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[s.roleCard, isMobile && s.roleCardMobile]}
                onPress={() => { setRole(r.id); setStep("details"); }}
                activeOpacity={0.85}
              >
                <View style={s.roleIconBox}>
                  <Text style={s.roleIconEmoji}>{r.icon}</Text>
                </View>
                <Text style={s.roleTitle}>{r.label}</Text>
                <Text style={s.roleDesc}>{r.desc}</Text>
                <View style={s.roleBtn}>
                  <Text style={s.roleBtnText}>Join as {r.label} →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── STEP 2: Details form ── */}
        {step === "details" && (
          <View style={[s.card, isMobile && s.cardMobile]}>

            {/* Role indicator */}
            <View style={s.roleIndicator}>
              <View>
                <Text style={s.roleIndicatorLabel}>Signing up as</Text>
                <View style={s.roleIndicatorRow}>
                  <View style={s.roleIndicatorDot} />
                  <Text style={s.roleIndicatorName}>
                    {role === "freelancer" ? "⚡ Champion" : "📋 Company"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => { setStep("role"); setErrors({}); setMessage(""); }}>
                <Text style={s.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>
            <View style={s.divider} />

            {/* Full name */}
            <Text style={s.label}>Full Name</Text>
            <TextInput style={[s.input, errors.name && s.inputErr]} placeholder="John Doe" value={name} onChangeText={setName} placeholderTextColor="#9ca3af" />
            {errors.name && <Text style={s.err}>{errors.name}</Text>}

            {/* Email */}
            <Text style={[s.label, { marginTop: 18 }]}>Email</Text>
            <TextInput style={[s.input, errors.email && s.inputErr]} placeholder="your.email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9ca3af" />
            {errors.email && <Text style={s.err}>{errors.email}</Text>}

            {/* Password + eye toggle */}
            <Text style={[s.label, { marginTop: 18 }]}>Password</Text>
            <View style={[s.inputRow, errors.password && s.inputRowErr]}>
              <TextInput
                style={s.inputFlex}
                placeholder="Min 6 characters"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(v => !v)}>
                <Text style={s.eyeIcon}>{showPass ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={s.err}>{errors.password}</Text>}

            {/* Champion: Skills */}
            {role === "freelancer" && (
              <>
                <Text style={[s.label, { marginTop: 18 }]}>
                  Skills <Text style={s.labelHint}>(comma separated)</Text>
                </Text>
                <TextInput style={[s.input, s.inputTall, errors.skills && s.inputErr]} placeholder="e.g. Python, Data Analysis, ESG Reporting" value={skills} onChangeText={setSkills} multiline placeholderTextColor="#9ca3af" />
                {errors.skills && <Text style={s.err}>{errors.skills}</Text>}
                {skills.trim().length > 0 && (
                  <View style={s.skillChips}>
                    {skills.split(",").map(s => s.trim()).filter(Boolean).map((sk, i) => (
                      <View key={i} style={s.skillChip}><Text style={s.skillChipText}>{sk}</Text></View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Client: Company */}
            {role === "client" && (
              <>
                <Text style={[s.label, { marginTop: 18 }]}>Company Name</Text>
                <TextInput style={[s.input, errors.company && s.inputErr]} placeholder="Your company name" value={company} onChangeText={setCompany} placeholderTextColor="#9ca3af" />
                {errors.company && <Text style={s.err}>{errors.company}</Text>}
              </>
            )}

            {/* Terms */}
            <TouchableOpacity style={s.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
              <View style={[s.checkbox, agreed && s.checkboxOn]}>
                {agreed && <Text style={s.checkTick}>✓</Text>}
              </View>
              <Text style={s.termsText}>
                I agree to the <Text style={s.termsLink}>Terms of Service</Text> and <Text style={s.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {errors.agreed && <Text style={s.err}>{errors.agreed}</Text>}

            {/* Feedback */}
            {message ? (
              <View style={[s.msgBox, message.includes("Taking") && s.msgBoxSuccess]}>
                <Text style={[s.msgText, message.includes("Taking") && s.msgTextSuccess]}>{message}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitText}>Create {role === "freelancer" ? "Champion" : "Company"} Account</Text>
              }
            </TouchableOpacity>

            <Text style={s.switchRow}>
              Already have an account?{" "}
              <Text style={s.switchLink} onPress={() => router.push("/login_1" as any)}>Sign in</Text>
            </Text>
          </View>
        )}

        {/* ── STEP 3: OTP Verification ── */}
        {step === "otp" && (
          <View style={[s.card, isMobile && s.cardMobile]}>
            <Text style={[s.pageTitle, isMobile && s.pageTitleMobile]}>
              Verify your Email
            </Text>
            <Text style={s.pageSub}>
              OTP sent to{"\n"}
              <Text style={{ color: "#059669" }}>{email}</Text> par
            </Text>

            <Text style={s.label}>Enter OTP</Text>
            <TextInput
              style={[s.input, { letterSpacing: 8, fontSize: 22, textAlign: "center" }]}
              placeholder="000000"
              value={otpValue}
              onChangeText={setOtpValue}
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor="#9ca3af"
            />

            {message ? (
              <View style={s.msgBox}>
                <Text style={s.msgText}>{message}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitText}>Verify & Create Account</Text>
              }
            </TouchableOpacity>

            <Text style={s.switchRow}>
              Wrong email?{" "}
              <Text style={s.switchLink} onPress={() => { setStep("details"); setMessage(""); }}>
                Go back
              </Text>
            </Text>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: "#f9fafb" },

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

  center:          { alignItems: "center", paddingHorizontal: 20, paddingTop: 40, paddingBottom: 60 },
  centerMobile:    { paddingTop: 24, paddingBottom: 40 },
  brandRow:        { alignItems: "center", marginBottom: 16 },
  brandLogoImg:    { width: 320, height: 80, borderRadius: 4 },
  pageTitle:       { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 6, textAlign: "center" },
  pageTitleMobile: { fontSize: 22 },
  pageSub:         { fontSize: 15, color: "#4b5563", marginBottom: 32, textAlign: "center" },

  rolesGrid:       { flexDirection: "row", gap: 16, flexWrap: "wrap", justifyContent: "center", width: "100%" },
  rolesGridMobile: { flexDirection: "column", gap: 12 },
  roleCard:        { width: "47%", minWidth: 200, backgroundColor: "#fff", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", gap: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  roleCardMobile:  { width: "100%", minWidth: 0, padding: 20 },
  roleIconBox:     { width: 68, height: 68, borderRadius: 20, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", marginBottom: 4, borderWidth: 1, borderColor: "#a7f3d0" },
  roleIconEmoji:   { fontSize: 32 },
  roleTitle:       { fontSize: 18, fontWeight: "700", color: "#111827" },
  roleDesc:        { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 19 },
  roleBtn:         { borderWidth: 1.5, borderColor: G, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, width: "100%", alignItems: "center", marginTop: 4 },
  roleBtnText:     { fontSize: 13, color: G, fontWeight: "600" },

  card:       { width: "100%", maxWidth: 440, backgroundColor: "#fff", borderRadius: 16, padding: 28, borderWidth: 1, borderColor: "#e5e7eb", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  cardMobile: { padding: 20, borderRadius: 12 },

  roleIndicator:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  roleIndicatorLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  roleIndicatorRow:   { flexDirection: "row", alignItems: "center", gap: 7 },
  roleIndicatorDot:   { width: 9, height: 9, borderRadius: 5, backgroundColor: G },
  roleIndicatorName:  { fontSize: 15, fontWeight: "700", color: "#111827" },
  changeLink:         { fontSize: 14, color: G, fontWeight: "600" },
  divider:            { height: 1, backgroundColor: "#f3f4f6", marginVertical: 20 },

  label:     { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 7 },
  labelHint: { fontSize: 13, fontWeight: "400", color: "#9ca3af" },
  input:     { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, backgroundColor: "#fff", color: "#111827" },
  inputTall: { minHeight: 80, textAlignVertical: "top" },
  inputErr:  { borderColor: "#dc2626" },
  err:       { fontSize: 12, color: "#dc2626", marginTop: 5 },

  inputRow:    { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, backgroundColor: "#fff" },
  inputRowErr: { borderColor: "#dc2626" },
  inputFlex:   { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: "#111827" },
  eyeBtn:      { paddingHorizontal: 14, paddingVertical: 13 },
  eyeIcon:     { fontSize: 16 },

  skillChips:    { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  skillChip:     { backgroundColor: "#d1fae5", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#a7f3d0" },
  skillChipText: { fontSize: 12, color: "#065f46", fontWeight: "500" },

  termsRow:  { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 22 },
  checkbox:  { width: 19, height: 19, borderRadius: 5, borderWidth: 1.5, borderColor: "#d1d5db", justifyContent: "center", alignItems: "center", flexShrink: 0, marginTop: 2 },
  checkboxOn:{ backgroundColor: G, borderColor: G },
  checkTick: { color: "#fff", fontSize: 11, fontWeight: "700" },
  termsText: { fontSize: 14, color: "#4b5563", flex: 1, lineHeight: 21 },
  termsLink: { color: G, fontWeight: "500" },

  msgBox:        { backgroundColor: "#fef2f2", borderRadius: 8, padding: 12, marginTop: 14, borderWidth: 1, borderColor: "#fecaca" },
  msgBoxSuccess: { backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" },
  msgText:       { fontSize: 14, color: "#dc2626", textAlign: "center" },
  msgTextSuccess:{ color: "#065f46" },

  submitBtn:  { backgroundColor: G, padding: 15, borderRadius: 10, alignItems: "center", marginTop: 22 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchRow:  { textAlign: "center", marginTop: 20, fontSize: 14, color: "#4b5563" },
  switchLink: { color: G, fontWeight: "600" },
});
