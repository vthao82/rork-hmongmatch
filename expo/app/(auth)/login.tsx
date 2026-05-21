import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Platform, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import Colors from "@/constants/colors";
import PajNtaubPattern from "@/components/onboarding/PajNtaubPattern";
import PillButton from "@/components/onboarding/PillButton";
import HmongLogo from "@/components/onboarding/HmongLogo";
import BackButton from "@/components/onboarding/BackButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

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
  const t = useT();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(rise, { toValue: 0, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, [fade, rise]);

  const onGoogle = async () => {
    update({ method: "google" });
    if (Platform.OS === "web") {
      router.push("/(auth)/account-picker");
      return;
    }
    try {
      const supported = await Linking.canOpenURL("https://accounts.google.com");
      if (supported) {
        await Linking.openURL("https://accounts.google.com/signin");
      }
      router.push("/(auth)/terms");
    } catch (e) {
      console.log("google login error", e);
      router.push("/(auth)/terms");
    }
  };

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

        <View style={s.middle} />

        <Animated.View style={[s.bottom, { opacity: fade }]}>
          <PillButton
            label={t("continueWithGoogle")}
            onPress={onGoogle}
            variant="light"
            left={<GoogleG />}
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.indigo },
  safe: { flex: 1, paddingHorizontal: 24 },
  backRow: { paddingTop: 4, marginLeft: -4 },
  top: { alignItems: "center", paddingTop: 20, gap: 0 },
  brand: { fontSize: 34, fontWeight: "800" as const, color: Colors.offwhite, letterSpacing: 0.5 },
  tag: { fontSize: 16, color: "rgba(245,240,235,0.85)", fontStyle: "italic" as const, marginTop: -40, textAlign: "center" as const, paddingHorizontal: 16 },
  middle: { flex: 1 },
  bottom: { paddingBottom: 20, gap: 10 },
  fine: { color: "rgba(245,240,235,0.62)", fontSize: 11.5, textAlign: "center", marginTop: 18, lineHeight: 17 },
  link: { color: Colors.gold, fontWeight: "600" as const },
});
