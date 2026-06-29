import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Heart, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import PajNtaubPattern from "@/components/onboarding/PajNtaubPattern";
import PillButton from "@/components/onboarding/PillButton";
import BackButton from "@/components/onboarding/BackButton";
import FreeTierWelcomeModal from "@/components/FreeTierWelcomeModal";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const CARDS = [
  { uri: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600", name: "Mai" },
  { uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600", name: "Pa" },
  { uri: "https://images.unsplash.com/photo-1502767089025-6572583495f4?w=600", name: "Kou" },
];

export default function CompleteScreen() {
  const { finish } = useOnboarding();
  const t = useT();
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(180, [
      Animated.spring(a1, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 120 }),
      Animated.spring(a2, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 120 }),
    ]).start();
  }, [a1, a2]);

  const [showFreeTier, setShowFreeTier] = useState<boolean>(false);

  const go = async () => {
    setShowFreeTier(true);
  };

  const finishAndGo = async () => {
    // Navigate immediately for snappy UX; sync to Firestore in the background.
    setShowFreeTier(false);
    router.replace("/discover");
    void finish().catch((e) => console.log("[complete] background sync error", e));
  };

  return (
    <View style={s.root} testID="complete-screen">
      <LinearGradient colors={[Colors.crimson, "#4d0a2a", Colors.indigo]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <PajNtaubPattern opacity={0.06} color={Colors.gold} />
      <SafeAreaView style={s.safe}>
        <View style={s.backRow}>
          <BackButton tint="light" />
        </View>
        <View style={s.stack}>
          {CARDS.map((c, i) => {
            const isMid = i === 1;
            const driver = i === 0 ? a1 : isMid ? a2 : a1;
            const rot = driver.interpolate({ inputRange: [0, 1], outputRange: ["0deg", i === 0 ? "-10deg" : i === 2 ? "10deg" : "0deg"] });
            const ty = driver.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
            return (
              <Animated.View key={c.name} style={[s.card, { zIndex: isMid ? 2 : 1, transform: [{ rotate: rot }, { translateY: ty }, { translateX: i === 0 ? -36 : i === 2 ? 36 : 0 }] }]}>
                <Image source={{ uri: c.uri }} style={s.cImg} />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={s.cOv} />
                <Text style={s.cName}>{c.name}</Text>
              </Animated.View>
            );
          })}
        </View>

        <View style={s.actions}>
          <View style={s.actBtn}><X size={22} color="#fff" /></View>
          <View style={[s.actBtn, s.actHeart]}><Heart size={22} color="#fff" fill="#fff" /></View>
        </View>

        <View style={s.bottom}>
          <Text style={s.head}>{t("allSet")}</Text>
          <Text style={s.sub}>{t("allSetSub")}</Text>
          <View style={s.dots}>
            <View style={[s.dot, s.dotOn]} />
            <View style={s.dot} />
            <View style={s.dot} />
          </View>
          <PillButton label={t("startSwiping")} onPress={go} variant="light" testID="start-swiping" />
        </View>
      </SafeAreaView>
      <FreeTierWelcomeModal visible={showFreeTier} onClose={finishAndGo} onUpgrade={() => { setShowFreeTier(false); router.replace("/subscription"); void finish().catch((e) => console.log("[complete] background sync error", e)); }} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.crimson },
  safe: { flex: 1, paddingHorizontal: 24 },
  backRow: { paddingTop: 4, marginLeft: -4 },
  stack: { alignItems: "center", justifyContent: "center", marginTop: 20, height: 320 },
  card: { position: "absolute", width: 200, height: 280, borderRadius: 22, backgroundColor: "#333", overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.18)" },
  cImg: { width: "100%", height: "100%" },
  cOv: { position: "absolute", bottom: 0, left: 0, right: 0, height: "55%" },
  cName: { position: "absolute", bottom: 14, left: 14, color: "#fff", fontSize: 20, fontWeight: "700" as const },
  actions: { flexDirection: "row", justifyContent: "center", gap: 22, marginTop: 6 },
  actBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center" },
  actHeart: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  bottom: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 20, gap: 12 },
  head: { fontSize: 28, fontWeight: "800" as const, color: "#fff", textAlign: "center" as const, lineHeight: 34, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" as const, marginTop: -4, marginBottom: 6, paddingHorizontal: 20 },
  dots: { flexDirection: "row", gap: 6, marginVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.35)" },
  dotOn: { width: 22, backgroundColor: "#fff" },
});
