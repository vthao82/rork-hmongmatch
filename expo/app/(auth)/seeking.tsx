import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import OptionCard from "@/components/onboarding/OptionCard";
import InfoLink from "@/components/onboarding/InfoLink";
import { useOnboarding, SeekingId } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const OPTIONS: { id: SeekingId; title: string }[] = [
  { id: "men", title: "Men" },
  { id: "women", title: "Women" },
  { id: "beyond", title: "Beyond Binary" },
  { id: "everyone", title: "Everyone" },
];

export default function SeekingScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<SeekingId[]>(data.seeking ?? []);

  const toggle = (id: SeekingId) => {
    setSelected(prev => {
      if (id === "everyone") return prev.includes("everyone") ? [] : ["everyone"];
      const without = prev.filter(x => x !== "everyone");
      return without.includes(id) ? without.filter(x => x !== id) : [...without, id];
    });
  };

  const onNext = () => {
    update({ seeking: selected });
    router.push("/(auth)/looking-for");
  };

  return (
    <OnboardingScreen
      step={9}
      total={19}
      footer={<PillButton label={t("next")} onPress={onNext} disabled={selected.length === 0} variant="light" testID="seeking-next" />}
    >
      <Text style={s.head}>{t("seekingQ")}</Text>
      <Text style={s.sub}>{t("seekingSub")}</Text>

      <View style={{ height: 18 }} />
      {OPTIONS.map(o => (
        <OptionCard key={o.id} title={o.title} selected={selected.includes(o.id)} onPress={() => toggle(o.id)} testID={`seeking-${o.id}`} />
      ))}

      <InfoLink />
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
});
