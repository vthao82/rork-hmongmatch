import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet, Animated, Easing, Platform, Linking, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Mail, CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import PajNtaubPattern from "@/components/onboarding/PajNtaubPattern";
import PillButton from "@/components/onboarding/PillButton";
import HmongLogo from "@/components/onboarding/HmongLogo";
import BackButton from "@/components/onboarding/BackButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";

function GoogleG() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.3 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
      <Path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.6 15.3 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.3 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.1z"/>
      <Path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13.1-5l-6.1-5c-2 1.4-4.5 2.3-7 2.3-5.3 0-9.8-3.1-11.4-7.5l-6.6 5.1C9.5 39.1 16.1 43.5 24 43.5z"/>
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.1 5c3.9-3.6 6.3-9 6.3-14.5 0-1.2-.1-2.3-.3-3.5z"/>
    </Svg>
  );
}

export default function LoginScreen() {
  const { update } = useOnboarding();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resendVerificationEmail, user, emailVerified, reloadUser, signOut } = useAuth();
  const t = useT();
  const [busy, setBusy] = useState<boolean>(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [resending, setResending] = useState<boolean>(false);
  const [mfaPending, setMfaPending] = useState<boolean>(false);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(rise, { toValue: 0, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, [fade, rise]);

  // Navigate forward only when a user is present AND verified.
  // Unverified email users get pinned to the "Check your email" screen below.
  useEffect(() => {
    if (!user) return;
    if (!emailVerified) {
      // Show the "Check your email" screen for unverified email users
      if (!emailSent && user.email) setEmailSent(user.email);
      return;
    }
    router.replace("/(auth)/terms");
  }, [user, emailVerified, emailSent]);

  // While on the "Check your email" screen, poll Firebase every 3s for verification status.
  useEffect(() => {
    if (!emailSent) return;
    const interval = setInterval(() => {
      reloadUser().catch((e) => console.log("[verify] reload error", e));
    }, 3000);
    return () => clearInterval(interval);
  }, [emailSent, reloadUser]);

  const onGoogle = async () => {
    if (busy) return;
    setBusy(true);
    update({ method: "google" });
    try {
      const res = await signInWithGoogle();
      if (!res.ok) {
        if (res.error && res.error !== "Sign-in canceled") {
          Alert.alert("Sign-in failed", res.error);
        }
        return;
      }
      // Navigation handled by the user/emailVerified useEffect above.
    } catch (e) {
      console.log("google login error", e);
      Alert.alert("Sign-in failed", "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onEmail = async () => {
    if (busy) return;
    const trimmed = email.trim();
    if (!trimmed || !password) {
      Alert.alert("Required", "Please enter your email and password.");
      return;
    }
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password too short", "Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    update({ method: "email" });
    let keepBusy = false;
    try {
      if (mode === "signin") {
        const res = await signInWithEmail(trimmed, password);
        if (!res.ok) {
          Alert.alert("Sign-in failed", res.error ?? "Please try again.");
          return;
        }
        // Navigation handled by the user/emailVerified useEffect above:
        // - verified users → /(auth)/terms
        // - unverified email users → "Check your email" screen
      } else {
        const res = await signUpWithEmail(trimmed, password);
        if (!res.ok) {
          Alert.alert("Sign-up failed", res.error ?? "Please try again.");
          return;
        }
        if (res.emailConfirmationRequired) {
          setEmailSent(trimmed);
        }
        // Navigation handled by the user/emailVerified useEffect above.
      }
    } catch (e) {
      console.log("email auth error", e);
      Alert.alert("Something went wrong", "Please try again.");
    } finally {
      if (!keepBusy) setBusy(false);
    }
  };

  const onResend = async () => {
    if (resending || !emailSent) return;
    setResending(true);
    try {
      const res = await resendVerificationEmail();
      if (!res.ok) {
        Alert.alert("Couldn't resend", res.error ?? "Please try again.");
      } else {
        Alert.alert(t("emailSent"), t("checkEmailHint"));
      }
    } catch (e) {
      console.log("resend error", e);
    } finally {
      setResending(false);
    }
  };

  const onBackToSignIn = async () => {
    // Sign out so the user can use the form again (otherwise our useEffect
    // would just pin them back to the verify screen).
    try {
      await signOut();
    } catch (e) {
      console.log("[verify] signOut error", e);
    }
    setEmailSent(null);
    setMode("signin");
  };

  const toggleMode = () => {
    setMode((p) => (p === "signin" ? "signup" : "signin"));
  };

  if (emailSent) {
    const subText = t("checkEmailSub").replace("{email}", emailSent);
    return (
      <View style={s.root} testID="verify-email-screen">
        <LinearGradient colors={[Colors.indigo, "#3c0a24", Colors.crimson]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <PajNtaubPattern opacity={0.08} color={Colors.gold} />
        <SafeAreaView style={s.safe}>
          <View style={s.backRow}>
            <BackButton tint="light" />
          </View>
          <View style={s.verifyCenter}>
            <View style={s.verifyIconWrap}>
              <CheckCircle size={56} color={Colors.gold} />
            </View>
            <Text style={s.verifyTitle}>{t("checkEmailTitle")}</Text>
            <Text style={s.verifySub}>{subText}</Text>
            <Text style={s.verifyHint}>{t("checkEmailHint")}</Text>
            <View style={s.verifyWaiting}>
              <ActivityIndicator size="small" color={Colors.gold} />
              <Text style={s.verifyWaitingText}>{t("checkingVerification")}</Text>
            </View>
            <PillButton
              label={resending ? "Sending…" : t("resendEmail")}
              onPress={onResend}
              variant="dark"
              testID="resend-email"
            />
            <PressableText
              label={t("backToSignIn")}
              onPress={onBackToSignIn}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.root} testID="login-screen">
      <LinearGradient colors={[Colors.indigo, "#3c0a24", Colors.crimson]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <PajNtaubPattern opacity={0.08} color={Colors.gold} />
      <SafeAreaView style={s.safe}>
        <View style={s.backRow}>
          <BackButton tint="light" />
        </View>
        <Animated.View style={[s.top, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <HmongLogo fullWidth />
          <Text style={s.tag}>Where Hmong Hearts Meet and Real Connections Begin</Text>
        </Animated.View>

        <View style={s.middle}>
          <Animated.View style={[s.emailBox, { opacity: fade }]}>
            <TextInput
              style={s.input}
              placeholder={t("emailPlaceholder")}
              placeholderTextColor="rgba(245,240,235,0.35)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              editable={!busy}
              testID="email-input"
            />
            <TextInput
              style={s.input}
              placeholder={t("passwordPlaceholder")}
              placeholderTextColor="rgba(245,240,235,0.35)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
              autoComplete="password"
              editable={!busy}
              testID="password-input"
            />
            {mfaPending ? (
              <View style={{ alignItems: "center", gap: 12 }}>
                <ActivityIndicator size="small" color={Colors.gold} />
                <Text style={{ color: "rgba(245,240,235,0.8)", fontSize: 15, textAlign: "center" }}>
                  Complete two-factor verification in your browser, then return here.
                </Text>
              </View>
            ) : (
              <>
                <PillButton
                  label={busy ? "Please wait…" : mode === "signin" ? t("continueWithEmail") : t("signUpWithEmail")}
                  onPress={onEmail}
                  variant="primary"
                  left={busy ? <ActivityIndicator size="small" color="#FFF" /> : <Mail size={18} color="#FFF" />}
                  testID="continue-email"
                />
                <PressableText
                  label={mode === "signin" ? t("noAccount") : t("haveAccount")}
                  onPress={toggleMode}
                  disabled={busy}
                />
              </>
            )}
          </Animated.View>
        </View>

        <Animated.View style={[s.bottom, { opacity: fade }]}>
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>
          <PillButton
            label={busy ? "Signing in…" : t("continueWithGoogle")}
            onPress={onGoogle}
            variant="dark"
            left={busy ? <ActivityIndicator size="small" color={Colors.offwhite} /> : <GoogleG />}
            testID="continue-google"
          />
          <Text style={s.fine}>
            By tapping Continue you agree to our{" "}
            <Text style={s.link} onPress={() => Platform.OS !== "web" && Linking.openURL("https://example.com/terms")}>Terms</Text>
            . Learn how we process your data in our{" "}
            <Text style={s.link} onPress={() => Platform.OS !== "web" && Linking.openURL("https://example.com/privacy")}>Privacy Policy</Text>
            {" "}and{" "}
            <Text style={s.link}>Cookie Policy</Text>.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function PressableText({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Text
      style={[s.toggle, pressed && { opacity: 0.6 }]}
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : () => setPressed(true)}
      onPressOut={disabled ? undefined : () => setPressed(false)}
      suppressHighlighting
    >
      {label}
    </Text>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.indigo },
  safe: { flex: 1, paddingHorizontal: 24 },
  backRow: { paddingTop: 4, marginLeft: -4 },
  top: { alignItems: "center", paddingTop: 20, gap: 0 },
  tag: { fontSize: 16, color: "rgba(245,240,235,0.85)", fontStyle: "italic" as const, marginTop: -40, textAlign: "center" as const, paddingHorizontal: 16 },
  middle: { flex: 1, justifyContent: "center", paddingBottom: 20 },
  emailBox: {
    gap: 12,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.offwhite,
    fontWeight: "500" as const,
  },
  toggle: {
    color: Colors.gold,
    fontSize: 13.5,
    fontWeight: "600" as const,
    textAlign: "center",
    paddingVertical: 6,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dividerText: {
    color: "rgba(245,240,235,0.4)",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  bottom: { paddingBottom: 20, gap: 10 },
  fine: { color: "rgba(245,240,235,0.62)", fontSize: 11.5, textAlign: "center", marginTop: 18, lineHeight: 17 },
  link: { color: Colors.gold, fontWeight: "600" as const },
  // Email verification screen
  verifyCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  verifyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  verifyTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.offwhite,
    textAlign: "center",
  },
  verifySub: {
    fontSize: 16,
    color: "rgba(245,240,235,0.85)",
    textAlign: "center",
    lineHeight: 22,
  },
  verifyHint: {
    fontSize: 14,
    color: "rgba(245,240,235,0.5)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  verifyWaiting: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  verifyWaitingText: {
    fontSize: 14,
    color: Colors.gold,
    fontWeight: "500" as const,
  },
});
