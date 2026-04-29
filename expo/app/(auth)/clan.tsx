import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import OptionCard from "@/components/onboarding/OptionCard";
import ShowOnProfile from "@/components/onboarding/ShowOnProfile";
import { useOnboarding } from "@/providers/OnboardingProvider";

const CLANS = [
  "Chang",
  "Cheng",
  "Fang",
  "Her",
  "Khang",
  "Kong",
  "Kue",
  "Lee (Ly)",
  "Lor (Lo)",
  "Moua",
  "Pha",
  "Thao",
  "Vang",
  "Vue",
  "Xiong",
  "Yang",
  "Hang",
  "Cha",
];

export default function ClanScreen() {
  const { data, update } = useOnboarding();
  const [selected, setSelected] = useState<string>(data.clan ?? "");
  const [show, setShow] = useState<boolean>(data.showClan ?? true);

  const onNext = () => {
    update({ clan: selected, showClan: show });
    router.push("/(auth)/dialect");
  };

  return (
    <OnboardingScreen
      step={5}
      total={19}
      gradient={[Colors.indigo, "#3c0a24", Colors.crimson] as const}
      footer={
        <View>
          <ShowOnProfile label="Show clan on profile" value={show} onChange={setShow} testID="show-clan" />
          <PillButton label="Next" onPress={onNext} disabled={!selected} variant="light" testID="clan-next" />
        </View>
      }
    >
      <Text style={s.head}>What clan do you belong to?</Text>
      <Text style={s.sub}>Pick the clan name you identify with most.</Text>
      <View style={{ height: 18 }} />
      {CLANS.map(clan => (
        <OptionCard
          key={clan}
          title={clan}
          selected={selected === clan}
          onPress={() => setSelected(clan)}
          testID={`clan-${clan}`}
        />
      ))}
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
});
