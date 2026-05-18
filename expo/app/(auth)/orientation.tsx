import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import OptionCard from "@/components/onboarding/OptionCard";
import InfoLink from "@/components/onboarding/InfoLink";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const OPTIONS: { id: string; title: string; description: string }[] = [
  { id: "straight", title: "Straight", description: "A person who is exclusively attracted to members of the opposite gender" },
  { id: "gay", title: "Gay", description: "An umbrella term used to describe someone who is attracted to members of their gender" },
  { id: "lesbian", title: "Lesbian", description: "A woman who is emotionally, romantically, or sexually attracted to other women" },
  { id: "bisexual", title: "Bisexual", description: "A person who has potential for emotional, romantic, or sexual attraction to people of more than one gender" },
];

export default function OrientationScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<string[]>(data.orientations ?? []);

  const toggle = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const save = () => {
    update({ orientations: selected });
    router.push("/(auth)/religion");
  };

  return (
    <OnboardingScreen
      step={8}
      total={19}
      footer={
        <PillButton label={t("next")} onPress={save} disabled={selected.length === 0} variant="light" testID="orientation-next" />
      }
    >
      <Text style={s.head}>{t("orientationQ")}</Text>
      <Text style={s.sub}>{t("orientationSub")}</Text>

      <View style={{ height: 18 }} />
      {OPTIONS.map(o => (
        <OptionCard
          key={o.id}
          title={o.title}
          description={o.description}
          selected={selected.includes(o.id)}
          onPress={() => toggle(o.id)}
          testID={`orientation-${o.id}`}
        />
      ))}

      <InfoLink />
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  skip: { color: Colors.dark.textDim, fontSize: 14, fontWeight: "600" as const, padding: 8 },
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
});
