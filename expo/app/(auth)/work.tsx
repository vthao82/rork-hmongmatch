import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import OptionCard from "@/components/onboarding/OptionCard";
import ShowOnProfile from "@/components/onboarding/ShowOnProfile";
import { useOnboarding } from "@/providers/OnboardingProvider";

const OPTIONS = [
  "Work from home",
  "Full time job",
  "Part time job",
  "Still in school",
  "Government job",
  "Labor",
  "Others",
];

export default function WorkScreen() {
  const { data, update } = useOnboarding();
  const [selected, setSelected] = useState<string>(data.work ?? "");
  const [custom, setCustom] = useState<string>(data.workOther ?? "");
  const [show, setShow] = useState<boolean>(data.showWork ?? true);

  const onNext = () => {
    update({ work: selected, workOther: selected === "Others" ? custom : "", showWork: show });
    router.push("/(auth)/orientation");
  };

  const handleOption = (option: string) => {
    setSelected(option);
    if (option !== "Others") setCustom("");
  };

  const valid = Boolean(selected && (selected !== "Others" || custom.trim().length > 0));

  return (
    <OnboardingScreen
      step={8}
      total={19}
      gradient={[Colors.indigo, "#3c0a24", Colors.crimson] as const}
      topRight={
        <Pressable onPress={() => router.push("/(auth)/orientation")} testID="work-skip">
          <Text style={s.skip}>Skip</Text>
        </Pressable>
      }
      footer={
        <View>
          <ShowOnProfile label="Show work on profile" value={show} onChange={setShow} testID="show-work" />
          <PillButton label="Next" onPress={onNext} disabled={!valid} variant="light" testID="work-next" />
        </View>
      }
    >
      <Text style={s.head}>What do you do for work?</Text>
      <Text style={s.sub}>Pick the option that best describes your current work situation.</Text>

      <View style={{ height: 18 }} />
      {OPTIONS.map(option => (
        <OptionCard
          key={option}
          title={option}
          selected={selected === option}
          onPress={() => handleOption(option)}
          testID={`work-${option.replace(/\s+/g, "-").toLowerCase()}`}
        />
      ))}
      {selected === "Others" && (
        <TextInput
          style={s.input}
          placeholder="Tell us what you do"
          placeholderTextColor="rgba(245,240,235,0.4)"
          value={custom}
          onChangeText={setCustom}
          testID="work-other"
        />
      )}
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
  skip: { color: Colors.dark.textDim, fontSize: 14, fontWeight: "600" as const },
  input: { marginTop: 16, borderWidth: 1.5, borderColor: "rgba(245,240,235,0.18)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: Colors.dark.text, fontSize: 15, backgroundColor: "rgba(255,255,255,0.04)" },
});
