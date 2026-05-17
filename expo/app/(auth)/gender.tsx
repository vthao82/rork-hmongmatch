import React, { useState } from "react";
import { View, Text, StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import OptionCard from "@/components/onboarding/OptionCard";
import InfoLink from "@/components/onboarding/InfoLink";
import { useOnboarding, GenderId } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OPTIONS: { id: GenderId; title: string }[] = [
  { id: "man", title: "Man" },
  { id: "woman", title: "Woman" },
  { id: "beyond", title: "Beyond Binary" },
];

export default function GenderScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<GenderId[]>(data.genders ?? []);

  const toggle = (id: GenderId) => {
    if (Platform.OS !== "web") LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const onNext = () => {
    update({ genders: selected });
    router.push("/(auth)/clan");
  };

  return (
    <OnboardingScreen
      step={4}
      total={19}
      footer={<PillButton label={t("next")} onPress={onNext} disabled={selected.length === 0} variant="light" testID="gender-next" />}
    >
      <Text style={s.head}>{t("genderQ")}</Text>
      <Text style={s.sub}>{t("genderSub")}</Text>

      <View style={{ height: 18 }} />
      {OPTIONS.map(o => {
        const isSel = selected.includes(o.id);
        return (
          <View key={o.id}>
            <OptionCard title={o.title} selected={isSel} onPress={() => toggle(o.id)} testID={`gender-${o.id}`} />
          </View>
        );
      })}

      <InfoLink />
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
});
