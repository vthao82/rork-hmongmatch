import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, ScrollText, ShieldCheck } from "lucide-react-native";
import Colors from "@/constants/colors";
import PajNtaubPattern from "@/components/onboarding/PajNtaubPattern";
import PillButton from "@/components/onboarding/PillButton";
import BackButton from "@/components/onboarding/BackButton";
import { useT } from "@/providers/LanguageProvider";

type Section = { title: string; body?: string; bullets?: string[] };

const TOS: Section[] = [
  { title: "1. Acceptance of Terms", body: "By accessing or using Hmong Date (\"the App\"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the App." },
  { title: "2. Eligibility", body: "You must be at least 18 years old to use Hmong Date. By using the App, you confirm that you meet this requirement." },
  { title: "3. User Accounts", body: "You agree to provide accurate and truthful information, including name, age, and profile details. You are responsible for maintaining the confidentiality of your account." },
  { title: "4. User Conduct", body: "You agree NOT to:", bullets: ["Harass, abuse, or harm other users", "Share false or misleading information", "Use the app for illegal purposes", "Send spam or solicit money"] },
  { title: "5. User Interactions", body: "Hmong Date does not conduct background checks or guarantee user identity. You are solely responsible for your interactions with other users." },
  { title: "6. Safety Disclaimer", body: "All interactions are at your own risk. Users should exercise caution when communicating or meeting others." },
  { title: "7. Premium Services", body: "Some features require payment. All purchases are final unless required otherwise by law." },
  { title: "8. Intellectual Property", body: "All content, branding, and design of Hmong Date are owned by us and may not be copied or reused without permission." },
  { title: "9. Limitation of Liability", body: "To the fullest extent permitted by law, Hmong Date is not liable for any damages, injuries, or losses resulting from use of the App." },
  { title: "10. Indemnification", body: "You agree to indemnify and hold harmless Hmong Date from any claims arising from your use of the App." },
  { title: "11. Termination", body: "We may suspend or terminate your account at any time for violations of these terms." },
  { title: "12. Changes to Terms", body: "We may update these Terms at any time. Continued use means you accept the changes." },
];

const PRIVACY: Section[] = [
  { title: "1. Information We Collect", body: "We may collect:", bullets: ["Name, age, gender", "Location data", "Photos and profile information", "Messages and interactions", "Device and usage data"] },
  { title: "2. How We Use Information", body: "We use your information to:", bullets: ["Provide matching services", "Improve the app experience", "Communicate with users", "Ensure safety and security"] },
  { title: "3. Sharing of Information", body: "We do NOT sell your personal data. We may share data with:", bullets: ["Service providers", "Legal authorities if required by law"] },
  { title: "4. Data Storage", body: "Your data is stored securely. However, no system is 100% secure." },
  { title: "5. User Control", body: "You may:", bullets: ["Edit your profile", "Delete your account", "Control notifications"] },
  { title: "6. Cookies & Tracking", body: "We may use cookies and similar technologies to improve user experience." },
  { title: "7. Children's Privacy", body: "Hmong Date is not intended for users under 18." },
  { title: "8. Changes to Privacy Policy", body: "We may update this policy at any time." },
  { title: "9. Contact", body: "For questions, contact: support@hmongdate.com" },
];

function SectionBlock({ title, body, bullets }: Section) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {body ? <Text style={s.sectionBody}>{body}</Text> : null}
      {bullets?.map((b) => (
        <View key={b} style={s.bulletRow}>
          <View style={s.bulletDot} />
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TermsScreen() {
  const t = useT();
  const [agreed, setAgreed] = useState<boolean>(false);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(rise, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, [fade, rise]);

  const toggle = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setAgreed((p) => !p);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 120, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  const onContinue = () => {
    if (!agreed) return;
    router.push("/(auth)/rules");
  };

  return (
    <View style={s.root} testID="terms-screen">
      <LinearGradient colors={[Colors.indigo, "#3c0a24", Colors.crimson]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <PajNtaubPattern opacity={0.06} color={Colors.gold} />
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <View style={s.topBar}>
          <BackButton tint="light" />
        </View>

        <Animated.View style={[s.header, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <View style={s.iconBadge}>
            <ShieldCheck size={22} color={Colors.gold} />
          </View>
          <Text style={s.title}>{t("termsTitle")}</Text>
          <Text style={s.sub}>{t("termsSub")}</Text>
        </Animated.View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            <View style={s.cardHead}>
              <ScrollText size={18} color={Colors.gold} />
              <Text style={s.cardHeadText}>{t("termsOfService").toUpperCase()}</Text>
            </View>
            {TOS.map((sec) => <SectionBlock key={sec.title} {...sec} />)}
          </View>

          <View style={s.card}>
            <View style={s.cardHead}>
              <ShieldCheck size={18} color={Colors.gold} />
              <Text style={s.cardHeadText}>{t("privacyPolicy").toUpperCase()}</Text>
            </View>
            {PRIVACY.map((sec) => <SectionBlock key={sec.title} {...sec} />)}
          </View>

          <View style={s.finalNote}>
            <Text style={s.finalTitle}>{t("finalNote")}</Text>
            <Text style={s.finalBody}>
              By using Hmong Date, you acknowledge that you have read and agreed to both the Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={s.footer}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Pressable
              onPress={toggle}
              style={({ pressed }) => [s.agreeBox, agreed && s.agreeBoxOn, pressed && { opacity: 0.85 }]}
              testID="terms-agree-checkbox"
            >
              <View style={[s.checkbox, agreed && s.checkboxOn]}>
                {agreed && <Check size={16} color={Colors.ink} strokeWidth={3} />}
              </View>
              <Text style={s.agreeText}>{t("termsAgreeCheckbox")}</Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: 12 }} />
          <PillButton
            label={t("termsAgreeContinue")}
            onPress={onContinue}
            variant="light"
            disabled={!agreed}
            testID="terms-continue"
          />
        </SafeAreaView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.indigo },
  safe: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 4, minHeight: 42 },
  header: { paddingHorizontal: 24, paddingTop: 6, paddingBottom: 14, alignItems: "flex-start", gap: 10 },
  iconBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(212,168,67,0.14)",
    borderWidth: 1, borderColor: "rgba(212,168,67,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 28, fontWeight: "800" as const, color: Colors.offwhite, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: "rgba(245,240,235,0.72)", lineHeight: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20, gap: 14 },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 18,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  cardHeadText: { color: Colors.gold, fontSize: 12, fontWeight: "800" as const, letterSpacing: 1.4 },
  section: { marginTop: 10 },
  sectionTitle: { color: Colors.offwhite, fontSize: 15, fontWeight: "800" as const, marginBottom: 4, letterSpacing: -0.2 },
  sectionBody: { color: "rgba(245,240,235,0.78)", fontSize: 13.5, lineHeight: 20 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 6, paddingLeft: 4 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.gold, marginTop: 8 },
  bulletText: { flex: 1, color: "rgba(245,240,235,0.78)", fontSize: 13.5, lineHeight: 20 },
  finalNote: {
    marginTop: 6,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(212,168,67,0.10)",
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.30)",
  },
  finalTitle: { color: Colors.gold, fontSize: 12, fontWeight: "800" as const, letterSpacing: 1.4, marginBottom: 6 },
  finalBody: { color: "rgba(245,240,235,0.85)", fontSize: 13.5, lineHeight: 20 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "rgba(12,7,25,0.55)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  agreeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.14)",
  },
  agreeBoxOn: {
    backgroundColor: "rgba(212,168,67,0.14)",
    borderColor: Colors.gold,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  agreeText: { flex: 1, color: Colors.offwhite, fontSize: 13.5, lineHeight: 19, fontWeight: "600" as const },
});
