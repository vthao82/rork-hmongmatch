import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import OptionCard from "@/components/onboarding/OptionCard";
import ShowOnProfile from "@/components/onboarding/ShowOnProfile";
import { useOnboarding } from "@/providers/OnboardingProvider";

const DIALECTS = ["Green", "White"];

export default function DialectScreen() {
  const { data, update } = useOnboarding();
  const [selected, setSelected] = useState<string>(data.dialect ?? "");
  const [show, setShow] = useState<boolean>(data.showDialect ?? true);

  const onNext = () => {
    update({ dialect: selected, showDialect: show });
    router.push("/(auth)/from");
  };

  return (
    <OnboardingScreen
      step={6}
      total={19}
      gradient={[Colors.indigo, "#3c0a24", Colors.crimson] as const}
      footer={
        <View>
          <ShowOnProfile label="Show dialect on profile" value={show} onChange={setShow} testID="show-dialect" />
          <PillButton label="Next" onPress={onNext} disabled={!selected} variant="light" testID="dialect-next" />
        </View>
      }
    >
      <Text style={s.head}>What dialect do you speak?</Text>
      <Text style={s.sub}>Choose the Hmong dialect you use most often.</Text>

      <View style={{ height: 18 }} />
      {DIALECTS.map(option => (
        <OptionCard
          key={option}
          title={option}
          selected={selected === option}
          onPress={() => setSelected(option)}
          testID={`dialect-${option.toLowerCase()}`}
        />
      ))}
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
});
