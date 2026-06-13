/**
 * app/champion-onboarding.tsx
 *
 * 3-step onboarding form shown immediately after champion registration.
 * Collects: personal info → experience & skills → documents
 *
 * Backend calls:
 *   PATCH /update-user/{user_id}   — saves profile fields
 *   POST  /upload-resume/{user_id} — saves resume file
 */

import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, Platform,
  Animated, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getStoredUser, StoredUser } from "@/services/auth";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  g700: "#065f46", g600: "#059669", g500: "#10b981",
  g200: "#a7f3d0", g100: "#d1fae5", g50:  "#f0fdf4",
  n900: "#0f172a", n800: "#1e293b", n700: "#334155",
  n600: "#475569", n400: "#94a3b8", n200: "#e2e8f0",
  n100: "#f1f5f9", n50:  "#f8fafc", white: "#ffffff",
  red:  "#dc2626", amber: "#f59e0b",
};
const BASE_URL = "https://ecoconnect-backend-7qov.onrender.com";

// ─── Static options ───────────────────────────────────────────────────────────
const EXPERIENCE_OPTIONS = [
  "Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years",
];

const DOMAIN_OPTIONS = [
  // Tech & Engineering
  "Python", "Java", "JavaScript", "SQL", "React", "Node.js",
  "Data Analysis", "Machine Learning", "Cloud Computing",
  "Cybersecurity", "DevOps", "Mobile Development",
  // Business & Management
  "Marketing", "Sales", "Project Management", "Finance",
  "Accounting", "Business Strategy", "Operations Management",
  "Human Resources", "Supply Chain", "Consulting",
  // Creative & Communication
  "Content Writing", "Graphic Design", "UI/UX Design",
  "Social Media", "SEO", "Video Production",
  // Research & Legal
  "Research & Analysis", "Legal & Compliance", "Policy & Advocacy",
  // Sustainability (kept but reduced)
  "ESG Reporting", "Renewable Energy", "Climate Strategy", "Other",
];

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepBar = ({ current, total }: { current: number; total: number }) => (
  <View style={s.stepBarWrap}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={s.stepBarItem}>
        <View style={[
          s.stepDot,
          i < current   && s.stepDotDone,
          i === current && s.stepDotActive,
        ]}>
          {i < current
            ? <Text style={s.stepDotTick}>✓</Text>
            : <Text style={[s.stepDotNum, i === current && { color: C.white }]}>
                {i + 1}
              </Text>
          }
        </View>
        {i < total - 1 && (
          <View style={[s.stepLine, i < current && s.stepLineDone]} />
        )}
      </View>
    ))}
  </View>
);

const STEP_LABELS = ["Personal Info", "Experience", "Documents"];

// ─── Reusable field components ────────────────────────────────────────────────
const Field = ({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
  <View style={s.fieldWrap}>
    <Text style={s.label}>
      {label}{required && <Text style={{ color: C.red }}> *</Text>}
      {hint && <Text style={s.labelHint}> {hint}</Text>}
    </Text>
    {children}
  </View>
);

const Input = ({
  value, onChangeText, placeholder, multiline, keyboardType, error,
}: {
  value: string; onChangeText: (t: string) => void;
  placeholder?: string; multiline?: boolean;
  keyboardType?: any; error?: string;
}) => (
  <>
    <TextInput
      style={[s.input, multiline && s.inputTall, error && s.inputErr]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.n400}
      multiline={multiline}
      keyboardType={keyboardType}
      autoCapitalize="none"
    />
    {error && <Text style={s.errText}>{error}</Text>}
  </>
);

const PillSelect = ({
  options, selected, onToggle, multi = false,
}: {
  options: string[]; selected: string | string[];
  onToggle: (v: string) => void; multi?: boolean;
}) => (
  <View style={s.pillRow}>
    {options.map((opt) => {
      const active = multi
        ? (selected as string[]).includes(opt)
        : selected === opt;
      return (
        <TouchableOpacity
          key={opt}
          style={[s.pill, active && s.pillActive]}
          onPress={() => onToggle(opt)}
          activeOpacity={0.75}
        >
          <Text style={[s.pillText, active && s.pillTextActive]}>{opt}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function ChampionOnboarding() {
  const router = useRouter();
  const [user,    setUser]    = useState<StoredUser | null>(null);
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Step 1
  const [occupation,  setOccupation]  = useState("");
  const [country,     setCountry]     = useState("");
  const [experience,  setExperience]  = useState("");
  const [bio,         setBio]         = useState("");

  // Step 2
  const [skills,         setSkills]         = useState("");
  const [domains,        setDomains]        = useState<string[]>([]);
  const [employer,       setEmployer]       = useState("");
  const [internships,    setInternships]    = useState("");
  const [portfolio,      setPortfolio]      = useState("");
  const [certifications, setCertifications] = useState("");

  // Step 3
  const [resumeName, setResumeName] = useState("");
  const [resumeFile, setResumeFile] = useState<any>(null);
  const [idProof,    setIdProof]    = useState("");
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(() => {
    getStoredUser().then((u) => {
      if (!u) { router.replace("/login_1"); return; }
      setUser(u);
      if ((u as any).skills?.length) {
        setSkills(((u as any).skills as string[]).join(", "));
      }
    });
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: ((step + 1) / 3) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  // ── File picker ───────────────────────────────────────────────────────────
  const pickResume = async () => {
    if (Platform.OS === "web") {
      // Web — use native browser file input
      const input = document.createElement("input");
      input.type   = "file";
      input.accept = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          setResumeName(file.name);
          setResumeFile(file);   // native File object — works with FormData
        }
      };
      input.click();
    } else {
      // Mobile — use expo-document-picker
      try {
        const DocumentPicker = await import("expo-document-picker");
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ],
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          setResumeName(asset.name);
          setResumeFile(asset);  // { uri, name, mimeType, size }
        }
      } catch {
        Alert.alert(
          "Install required",
          "Run: npx expo install expo-document-picker\nthen restart the app.",
        );
      }
    }
  };

  const removeResume = () => {
    setResumeName("");
    setResumeFile(null);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!occupation.trim()) e.occupation = "Required";
      if (!country.trim())    e.country    = "Required";
      if (!experience)        e.experience = "Please select your experience level";
    }
    if (step === 1) {
      if (!skills.trim())       e.skills  = "Add at least one skill";
      if (domains.length === 0) e.domains = "Select at least one domain";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
    setErrors({});
  };

  const handleBack = () => {
    setStep((s) => s - 1);
    setErrors({});
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await (await import("@/services/auth")).getToken();

      const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const profilePayload: Record<string, any> = {
        occupation:          occupation.trim()      || undefined,
        country:             country.trim()         || undefined,
        bio:                 bio.trim()             || undefined,
        skills:              skillList.length > 0   ? skillList : undefined,
        experience_years:    experience             || undefined,
        employer:            employer.trim()        || undefined,
        internships:         internships.trim()     || undefined,
        portfolio:           portfolio.trim()       || undefined,
        certifications:      certifications.trim()  || undefined,
        id_proof:            idProof.trim()         || undefined,
        domains:             domains.length > 0     ? domains : undefined,
        kyc_status:          "pending",
        onboarding_complete: true,
      };

      Object.keys(profilePayload).forEach(
        (k) => profilePayload[k] === undefined && delete profilePayload[k]
      );

      await fetch(`${BASE_URL}/update-user/${user.user_id}`, {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(profilePayload),
      });

      // Upload resume if selected
      if (resumeFile) {
        const fd = new FormData();

        if (Platform.OS === "web") {
          // Web — resumeFile is a native File object
          fd.append("file", resumeFile, resumeFile.name);
        } else {
          // Mobile — resumeFile is a DocumentPicker asset { uri, name, mimeType }
          fd.append("file", {
            uri:  resumeFile.uri,
            name: resumeFile.name,
            type: resumeFile.mimeType || "application/octet-stream",
          } as any);
        }

        await fetch(`${BASE_URL}/upload-resume/${user.user_id}`, {
          method:  "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body:    fd,
        });
      }

      setSubmitted(true);
      setTimeout(() => router.replace("/freelancer-portal"), 2000);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => router.replace("/freelancer-portal");

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={s.successWrap}>
        <View style={s.successCircle}>
          <Text style={{ fontSize: 48 }}>🎉</Text>
        </View>
        <Text style={s.successTitle}>Profile Submitted!</Text>
        <Text style={s.successSub}>
          Our team will review your profile and verify your KYC documents.
          You'll be notified once approved and matched to projects.
        </Text>
        <ActivityIndicator color={C.g600} style={{ marginTop: 24 }} />
        <Text style={s.successNote}>Taking you to your portal...</Text>
      </View>
    );
  }

  const parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <ScrollView
      style={s.page}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={s.header}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={s.logoImg}
          resizeMode="cover"
        />
        <TouchableOpacity onPress={handleSkip}>
          <Text style={s.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        {/* Progress bar */}
        <View style={s.progressTrack}>
          <Animated.View
            style={[
              s.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange:  [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {/* Step indicator */}
        <StepBar current={step} total={3} />

        {/* Step label */}
        <View style={s.stepLabelWrap}>
          <Text style={s.stepLabel}>{STEP_LABELS[step]}</Text>
          <Text style={s.stepCounter}>Step {step + 1} of 3</Text>
        </View>

        {/* Welcome */}
        {step === 0 && (
          <View style={s.welcomeBox}>
            <Text style={s.welcomeTitle}>Welcome, {user?.name.split(" ")[0]}! 👋</Text>
            <Text style={s.welcomeSub}>
              Complete your profile so clients and our AI matching engine can find
              the right projects for you. Takes about 3 minutes.
            </Text>
          </View>
        )}

        {/* ── STEP 1: Personal Info ─────────────────────────────────────── */}
        {step === 0 && (
          <View style={s.formCard}>
            <Field label="Expertise Area" required>
              <Input
                value={occupation}
                onChangeText={setOccupation}
                placeholder="e.g. Data Analyst, Project Manager, ESG Consultant"
                error={errors.occupation}
              />
            </Field>
            <Field label="Country / Location" required>
              <Input
                value={country}
                onChangeText={setCountry}
                placeholder="e.g. India, Singapore, USA"
                error={errors.country}
              />
            </Field>
            <Field label="Years of Experience" required>
              <PillSelect
                options={EXPERIENCE_OPTIONS}
                selected={experience}
                onToggle={(v) => setExperience(v)}
              />
              {errors.experience && <Text style={s.errText}>{errors.experience}</Text>}
            </Field>
            <Field label="About You" hint="(optional)">
              <Input
                value={bio}
                onChangeText={setBio}
                placeholder="Brief introduction — your background, what you're passionate about..."
                multiline
              />
            </Field>
          </View>
        )}

        {/* ── STEP 2: Experience & Skills ──────────────────────────────── */}
        {step === 1 && (
          <View style={s.formCard}>
            <Field label="Skills" required hint="(comma separated)">
              <Input
                value={skills}
                onChangeText={setSkills}
                placeholder="e.g. Carbon Accounting, ESG Reporting, Net Zero Strategy"
                multiline
                error={errors.skills}
              />
              {parsedSkills.length > 0 && (
                <View style={s.chipPreview}>
                  {parsedSkills.map((sk, i) => (
                    <View key={i} style={s.chip}>
                      <Text style={s.chipText}>{sk}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Field>
            <Field label="Domain Specialisation" required>
              <PillSelect
                options={DOMAIN_OPTIONS}
                selected={domains}
                onToggle={(v) =>
                  setDomains((d) =>
                    d.includes(v) ? d.filter((x) => x !== v) : [...d, v]
                  )
                }
                multi
              />
              {errors.domains && <Text style={s.errText}>{errors.domains}</Text>}
            </Field>
            <Field label="Current / Previous Employer" hint="(optional)">
              <Input value={employer} onChangeText={setEmployer} placeholder="e.g. Tata Consultancy Services" />
            </Field>
            <Field label="Internships" hint="(optional)">
              <Input value={internships} onChangeText={setInternships} placeholder="e.g. Climate Policy Intern at WWF India (6 months)" multiline />
            </Field>
            <Field label="Portfolio / LinkedIn / Links" hint="(optional)">
              <Input value={portfolio} onChangeText={setPortfolio} placeholder="https://linkedin.com/in/yourname" keyboardType="url" />
            </Field>
            <Field label="Certifications" hint="(optional)">
              <Input value={certifications} onChangeText={setCertifications} placeholder="e.g. GRI Certified, ISO 14001 Lead Auditor" multiline />
            </Field>
          </View>
        )}

        {/* ── STEP 3: Documents ────────────────────────────────────────── */}
        {step === 2 && (
          <View style={s.formCard}>
            <View style={s.kycInfoBox}>
              <Text style={s.kycInfoTitle}>📋 KYC Verification</Text>
              <Text style={s.kycInfoText}>
                Your documents are reviewed by our admin team and never shared
                with clients. Verification usually takes 1–2 business days.
              </Text>
            </View>

            {/* Resume upload — FIXED: opens file manager */}
            <Field label="Resume / CV" hint="(PDF or DOC)">
              {resumeName ? (
                // File selected — show file name with remove button
                <View style={s.uploadBoxDone}>
                  <Text style={s.uploadIcon}>📄</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.uploadFileName} numberOfLines={1}>
                      {resumeName}
                    </Text>
                    <Text style={s.uploadFileSub}>Tap ✕ to remove and choose another</Text>
                  </View>
                  <TouchableOpacity onPress={removeResume} style={s.uploadRemoveBtn}>
                    <Text style={s.uploadRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // No file — show upload button
                <TouchableOpacity
                  style={s.uploadBox}
                  onPress={pickResume}
                  activeOpacity={0.75}
                >
                  <Text style={s.uploadIcon}>⬆️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.uploadText}>Tap to upload resume</Text>
                    <Text style={s.uploadSubText}>PDF, DOC or DOCX · Max 5MB</Text>
                  </View>
                  <View style={s.uploadBrowseBtn}>
                    <Text style={s.uploadBrowseBtnText}>Browse</Text>
                  </View>
                </TouchableOpacity>
              )}
            </Field>

            {/* Government ID */}
            <Field label="Government ID Number" hint="(for identity verification)">
              <Input
                value={idProof}
                onChangeText={setIdProof}
                placeholder="Aadhaar, PAN, Passport number etc."
              />
              <Text style={s.privacyNote}>
                🔒 Stored securely and only used for identity verification
              </Text>
            </Field>

            {/* What happens next */}
            <View style={s.nextStepsBox}>
              <Text style={s.nextStepsTitle}>What happens next</Text>
              {[
                "Your profile goes to admin review",
                "KYC documents are verified (1–2 days)",
                "Once approved, you appear in AI matching",
                "Clients start seeing you for relevant projects",
              ].map((stepText, i) => (
                <View key={i} style={s.nextStepRow}>
                  <View style={s.nextStepNum}>
                    <Text style={s.nextStepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.nextStepText}>{stepText}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Navigation buttons */}
        <View style={s.navBtns}>
          {step > 0 && (
            <TouchableOpacity style={s.backBtn} onPress={handleBack}>
              <Text style={s.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          {step < 2 ? (
            <TouchableOpacity
              style={[s.nextBtn, step > 0 && { flex: 1 }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={s.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.nextBtn, { flex: 1 }, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={C.white} />
                : <Text style={s.nextBtnText}>Submit Profile ✓</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={s.skipLinkBtn} onPress={handleSkip}>
          <Text style={s.skipLinkText}>I'll complete this later</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.n50 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: C.n200,
  },
  logoImg:  { width: 160, height: 38, borderRadius: 4, overflow: "hidden" },
  skipText: { fontSize: 14, color: C.n400, fontWeight: "500" },

  body: { padding: 20 },

  progressTrack: { height: 4, backgroundColor: C.n200, borderRadius: 2, marginBottom: 24, overflow: "hidden" },
  progressFill:  { height: "100%", backgroundColor: C.g600, borderRadius: 2 },

  stepBarWrap:   { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  stepBarItem:   { flexDirection: "row", alignItems: "center" },
  stepDot:       { width: 32, height: 32, borderRadius: 16, backgroundColor: C.n100, borderWidth: 2, borderColor: C.n200, justifyContent: "center", alignItems: "center" },
  stepDotActive: { backgroundColor: C.g600, borderColor: C.g600 },
  stepDotDone:   { backgroundColor: C.g600, borderColor: C.g600 },
  stepDotTick:   { color: C.white, fontSize: 14, fontWeight: "700" },
  stepDotNum:    { fontSize: 13, fontWeight: "600", color: C.n400 },
  stepLine:      { width: 48, height: 2, backgroundColor: C.n200, marginHorizontal: 4 },
  stepLineDone:  { backgroundColor: C.g600 },

  stepLabelWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  stepLabel:     { fontSize: 22, fontWeight: "700", color: C.n900 },
  stepCounter:   { fontSize: 13, color: C.n400 },

  welcomeBox:   { backgroundColor: C.g50, borderRadius: 14, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.g100 },
  welcomeTitle: { fontSize: 17, fontWeight: "700", color: C.g700, marginBottom: 6 },
  welcomeSub:   { fontSize: 14, color: C.g700, lineHeight: 21 },

  formCard: { backgroundColor: C.white, borderRadius: 16, padding: 22, borderWidth: 1, borderColor: C.n200, shadowColor: C.n900, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 20 },

  fieldWrap: { marginBottom: 20 },
  label:     { fontSize: 14, fontWeight: "600", color: C.n700, marginBottom: 8 },
  labelHint: { fontSize: 13, fontWeight: "400", color: C.n400 },
  input:     { borderWidth: 1, borderColor: C.n200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.n900, backgroundColor: C.white },
  inputTall: { minHeight: 90, textAlignVertical: "top" },
  inputErr:  { borderColor: C.red },
  errText:   { fontSize: 12, color: C.red, marginTop: 5 },

  pillRow:       { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: C.n200, backgroundColor: C.white },
  pillActive:    { backgroundColor: C.g600, borderColor: C.g600 },
  pillText:      { fontSize: 13, fontWeight: "500", color: C.n700 },
  pillTextActive:{ color: C.white },

  chipPreview: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip:        { backgroundColor: C.g50, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.g100 },
  chipText:    { fontSize: 12, color: C.g700, fontWeight: "500" },

  // ── Upload box — no file selected ──
  uploadBox: {
    borderWidth: 2, borderColor: C.n200, borderStyle: "dashed",
    borderRadius: 12, padding: 18,
    backgroundColor: C.n50, flexDirection: "row",
    alignItems: "center", gap: 12,
  },
  uploadIcon:       { fontSize: 24 },
  uploadText:       { fontSize: 14, color: C.n700, fontWeight: "600" },
  uploadSubText:    { fontSize: 12, color: C.n400, marginTop: 2 },
  uploadBrowseBtn:  { backgroundColor: C.g600, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  uploadBrowseBtnText: { fontSize: 13, color: C.white, fontWeight: "600" },

  // ── Upload box — file selected ──
  uploadBoxDone: {
    borderWidth: 2, borderColor: C.g500,
    borderRadius: 12, padding: 18,
    backgroundColor: C.g50, flexDirection: "row",
    alignItems: "center", gap: 12,
  },
  uploadFileName:   { fontSize: 14, color: C.g700, fontWeight: "600" },
  uploadFileSub:    { fontSize: 12, color: C.g600, marginTop: 2 },
  uploadRemoveBtn:  { width: 30, height: 30, borderRadius: 15, backgroundColor: C.n100, justifyContent: "center", alignItems: "center" },
  uploadRemoveText: { fontSize: 14, color: C.n600, fontWeight: "600" },

  privacyNote: { fontSize: 12, color: C.n400, marginTop: 8 },

  kycInfoBox:   { backgroundColor: "#fffbeb", borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#fde68a" },
  kycInfoTitle: { fontSize: 15, fontWeight: "600", color: "#92400e", marginBottom: 6 },
  kycInfoText:  { fontSize: 13, color: "#b45309", lineHeight: 20 },

  nextStepsBox:    { backgroundColor: C.g50, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.g100, marginTop: 8 },
  nextStepsTitle:  { fontSize: 14, fontWeight: "600", color: C.g700, marginBottom: 12 },
  nextStepRow:     { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  nextStepNum:     { width: 24, height: 24, borderRadius: 12, backgroundColor: C.g600, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  nextStepNumText: { fontSize: 12, color: C.white, fontWeight: "700" },
  nextStepText:    { fontSize: 13, color: C.g700, flex: 1, lineHeight: 20 },

  navBtns:     { flexDirection: "row", gap: 12, marginBottom: 14 },
  backBtn:     { borderWidth: 1.5, borderColor: C.n200, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10 },
  backBtnText: { fontSize: 15, fontWeight: "600", color: C.n700 },
  nextBtn:     { backgroundColor: C.g600, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, alignItems: "center", shadowColor: C.g600, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  nextBtnText: { color: C.white, fontSize: 15, fontWeight: "700" },

  skipLinkBtn:  { alignItems: "center", paddingVertical: 8 },
  skipLinkText: { fontSize: 13, color: C.n400 },

  successWrap:   { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, backgroundColor: C.white },
  successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.g50, justifyContent: "center", alignItems: "center", marginBottom: 24, borderWidth: 2, borderColor: C.g200 },
  successTitle:  { fontSize: 26, fontWeight: "700", color: C.n900, marginBottom: 12 },
  successSub:    { fontSize: 15, color: C.n600, textAlign: "center", lineHeight: 24, marginBottom: 8 },
  successNote:   { fontSize: 13, color: C.n400, marginTop: 8 },
});
