import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Easing, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Check, Globe } from "lucide-react-native";
import Colors from "@/constants/colors";
import PajNtaubPattern from "@/components/onboarding/PajNtaubPattern";
import PillButton from "@/components/onboarding/PillButton";
import HmongLogo from "@/components/onboarding/HmongLogo";
import BackButton from "@/components/onboarding/BackButton";
import { useLanguage, Lang } from "@/providers/LanguageProvider";

type Opt = { id: Lang; title: string; subtitle: string; icon?: string };

const HMOOB_ICON = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/eu41kb55ot3rfcjk1476b.png";

const OPTIONS: Opt[] = [
  { id: "en", title: "English", subtitle: "Continue in English" },
  { id: "hmn", title: "Hmoob", subtitle: "Txuas ntxiv ua Lus Hmoob", icon: HMOOB_ICON },
];

export default function LanguageScreen() {
  const { lang, setLang, t } = useLanguage();
  const [sel, setSel] = useState<Lang>(lang);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(rise, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, [fade, rise]);

  const onContinue = async () => {
    await setLang(sel);
    router.replace("/(auth)/login");
  };

  return (
    <View style={s.root} testID="language-screen">
      <LinearGradient colors={[Colors.indigo, "#3c0a24", Colors.crimson]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <PajNtaubPattern opacity={0.08} color={Colors.gold} />
      <SafeAreaView style={s.safe}>
        <View style={s.backRow}>
          <BackButton tint="light" />
        </View>
        <Animated.View style={[s.top, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <HmongLogo width={320} />
          <View style={s.iconRow}>
            <Globe size={18} color={Colors.gold} />
            <Text style={s.eyebrow}>Language · Hom Lus</Text>
          </View>
          <Text style={s.title}>{t("chooseLanguage")}</Text>
          <Text style={s.sub}>{t("chooseLanguageSub")}</Text>
        </Animated.View>

        <Animated.View style={[s.list, { opacity: fade }]}>
          {OPTIONS.map(o => {
            const active = sel === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setSel(o.id)}
                style={[s.opt, active && s.optActive]}
                testID={`lang-${o.id}`}
              >
                {o.icon ? (
                  <Image source={{ uri: o.icon }} style={s.iconImg} resizeMode="contain" />
                ) : (
                  <View style={s.enBadge}>
                    <Text style={s.flagEmoji}>🇺🇸</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.optTitle}>{o.title}</Text>
                  <Text style={s.optSub}>{o.subtitle}</Text>
                </View>
                <View style={[s.check, active && s.checkOn]}>
                  {active && <Check size={16} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        <View style={s.bottom}>
          <PillButton label={t("continue")} onPress={onContinue} variant="light" testID="lang-continue" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.indigo },
  safe: { flex: 1, paddingHorizontal: 24 },
  backRow: { paddingTop: 4, marginLeft: -4, minHeight: 38 },
  top: { alignItems: "center", paddingTop: 10, gap: 12 },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  eyebrow: { color: Colors.gold, fontSize: 12, fontWeight: "700" as const, letterSpacing: 1.4, textTransform: "uppercase" as const },
  title: { fontSize: 28, fontWeight: "800" as const, color: Colors.offwhite, textAlign: "center", letterSpacing: -0.5, marginTop: 4 },
  sub: { fontSize: 14, color: "rgba(245,240,235,0.75)", textAlign: "center", lineHeight: 20, paddingHorizontal: 12 },
  list: { flex: 1, justifyContent: "center", gap: 14, paddingVertical: 20 },
  opt: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 18, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)",
  },
  optActive: { borderColor: Colors.gold, backgroundColor: "rgba(212,168,67,0.15)" },
  iconImg: { width: 38, height: 38 },
  enBadge: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(212,168,67,0.15)", borderWidth: 1, borderColor: "rgba(212,168,67,0.35)" },
  flagEmoji: { fontSize: 24, lineHeight: 28 },
  optTitle: { color: Colors.offwhite, fontSize: 17, fontWeight: "800" as const, letterSpacing: -0.2 },
  optSub: { color: "rgba(245,240,235,0.7)", fontSize: 13, marginTop: 2 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)", alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  bottom: { paddingBottom: 20 },
});
