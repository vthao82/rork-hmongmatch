import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import OptionCard from "@/components/onboarding/OptionCard";
import { useOnboarding, DialectId } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const OPTIONS: { id: DialectId; title: string; description: string }[] = [
  { id: "green", title: "Green Hmong", description: "Hmoob Ntsuab" },
  { id: "white", title: "White Hmong", description: "Hmoob Dawb" },
];

export default function DialectScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<DialectId | undefined>(data.dialect);

  const onNext = () => {
    if (!selected) return;
    update({ dialect: selected });
    router.push("/(auth)/hometown");
  };

  return (
    <OnboardingScreen
      step={6}
      total={19}
      footer={<PillButton label={t("next")} onPress={onNext} disabled={!selected} variant="light" testID="dialect-next" />}
    >
      <Text style={s.head}>{t("dialectQ")}</Text>
      <Text style={s.sub}>{t("dialectSub")}</Text>
      <View style={{ height: 18 }} />
      {OPTIONS.map(o => (
        <OptionCard key={o.id} title={o.title} description={o.description} selected={selected === o.id} onPress={() => setSelected(o.id)} testID={`dialect-${o.id}`} />
      ))}
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
});
