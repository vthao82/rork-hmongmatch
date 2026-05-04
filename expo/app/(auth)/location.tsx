import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Easing, Platform } from "react-native";
import { router } from "expo-router";
import { MapPin, ChevronDown } from "lucide-react-native";
import * as Location from "expo-location";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

export default function LocationScreen() {
  const { update } = useOnboarding();
  const t = useT();
  const [expanded, setExpanded] = useState<boolean>(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const op = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const allow = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        update({ locationGranted: status === "granted" });
      } else if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(() => update({ locationGranted: true }), () => update({ locationGranted: false }));
      }
    } catch (e) {
      console.log("loc error", e);
    } finally {
      router.push("/(auth)/complete");
    }
  };

  return (
    <OnboardingScreen
      step={19}
      total={19}
      footer={<PillButton label={t("locationAllow")} onPress={allow} variant="light" testID="allow-location" />}
      scroll={false}
    >
      <View style={s.wrap}>
        <Text style={s.head}>{t("locationQ")}</Text>

        <View style={s.iconWrap}>
          <Animated.View style={[s.pulse, { transform: [{ scale }], opacity: op }]} />
          <Animated.View style={[s.pulse2, { transform: [{ scale }], opacity: op }]} />
          <View style={s.iconCircle}>
            <MapPin size={44} color={Colors.crimson} strokeWidth={2.2} />
          </View>
        </View>

        <Text style={s.sub}>{t("locationSub")}</Text>

        <Pressable style={s.row} onPress={() => setExpanded(v => !v)} testID="toggle-info">
          <Text style={s.link}>How is my location used?</Text>
          <ChevronDown size={16} color={Colors.gold} style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }} />
        </Pressable>
        {expanded && (
          <Text style={s.expanded}>
            Your coordinates are used only to calculate distance to other members. You control precision in Settings at any time.
          </Text>
        )}
      </View>
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 20 },
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, textAlign: "center" as const, letterSpacing: -0.5, lineHeight: 34 },
  iconWrap: { marginTop: 50, marginBottom: 30, width: 180, height: 180, justifyContent: "center", alignItems: "center" },
  pulse: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(192,21,47,0.3)" },
  pulse2: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(212,168,67,0.18)" },
  iconCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(245,240,235,0.92)", justifyContent: "center", alignItems: "center", shadowColor: Colors.crimson, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  sub: { color: Colors.dark.textDim, fontSize: 14, textAlign: "center" as const, lineHeight: 21, paddingHorizontal: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 22 },
  link: { color: Colors.gold, fontSize: 14, fontWeight: "600" as const },
  expanded: { color: Colors.dark.textDim, fontSize: 13, textAlign: "center" as const, marginTop: 10, paddingHorizontal: 12, lineHeight: 19 },
});
