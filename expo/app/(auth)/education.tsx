import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import TagChip from "@/components/onboarding/TagChip";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const OPTIONS: string[] = [
  "Bachelors",
  "In College",
  "High School",
  "PhD",
  "In Grad School",
  "Masters",
  "Trade School",
  "Prefer Not to Say",
];

export default function EducationScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<string | undefined>(data.education);

  const onNext = () => {
    if (!selected) return;
    update({ education: selected });
    router.push("/(auth)/interests");
  };

  return (
    <OnboardingScreen
      step={9}
      total={15}
      gradient={[Colors.dark.bg, Colors.dark.bgSoft] as const}
      topRight={
        <Pressable onPress={() => router.back()} style={s.back}>
          <ArrowLeft size={22} color={Colors.dark.text} />
        </Pressable>
      }
      footer={<PillButton label={t("next")} onPress={onNext} disabled={!selected} variant="light" testID="education-next" />}
    >
      <Text style={s.head}>{t("educationQ")}</Text>
      <Text style={s.sub}>{t("educationSub")}</Text>

      <View style={s.tags}>
        {OPTIONS.map(o => (
          <TagChip key={o} label={o} selected={selected === o} onPress={() => setSelected(o)} testID={`edu-${o}`} />
        ))}
      </View>
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.06)", justifyContent: "center", alignItems: "center" },
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 28 },
});
