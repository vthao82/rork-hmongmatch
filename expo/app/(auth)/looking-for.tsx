import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding, LookingForId } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const OPTIONS: { id: LookingForId; emoji: string; label: string }[] = [
  { id: "long", emoji: "💘", label: "Long-term partner" },
  { id: "long-open", emoji: "😍", label: "Long-term, open to short" },
  { id: "short-open", emoji: "🥂", label: "Short-term, open to long" },
  { id: "short", emoji: "🎉", label: "Short-term fun" },
  { id: "friends", emoji: "👋", label: "New friends" },
  { id: "unsure", emoji: "🤔", label: "Still figuring it out" },
];

export default function LookingForScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<LookingForId | undefined>(data.lookingFor);

  const pick = (id: LookingForId) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setSelected(id);
  };

  const onNext = () => {
    if (!selected) return;
    update({ lookingFor: selected });
    router.push("/(auth)/distance");
  };

  return (
    <OnboardingScreen
      step={11}
      total={19}
      gradient={[Colors.indigo, "#3c0a24", Colors.crimson] as const}
      footer={<PillButton label={t("next")} onPress={onNext} disabled={!selected} variant="light" testID="lookingfor-next" />}
    >
      <Text style={s.head}>{t("lookingForQ")}</Text>
      <Text style={s.sub}>{t("lookingForSub")}</Text>

      <View style={s.grid}>
        {OPTIONS.map(o => {
          const active = selected === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => pick(o.id)}
              style={[s.tile, active && s.tileActive]}
              testID={`lf-${o.id}`}
            >
              <Text style={s.emoji}>{o.emoji}</Text>
              <Text style={s.label} numberOfLines={2}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.06)", justifyContent: "center", alignItems: "center" },
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
  tile: {
    width: "48%", aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1.5, borderColor: "rgba(245,240,235,0.14)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 14,
    justifyContent: "space-between" as const,
  },
  tileActive: { borderColor: Colors.crimson, backgroundColor: "rgba(192,21,47,0.08)" },
  emoji: { fontSize: 38 },
  label: { color: Colors.dark.text, fontSize: 15, fontWeight: "700" as const, letterSpacing: -0.2 },
});
