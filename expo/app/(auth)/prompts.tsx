import React, { useState } from "react";
import { Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import PromptsEditor from "@/components/PromptsEditor";
import { useOnboarding } from "@/providers/OnboardingProvider";
import type { PromptAnswer } from "@/constants/prompts";

export default function PromptsStep() {
  const { data, update } = useOnboarding();
  const [prompts, setPrompts] = useState<PromptAnswer[]>(data.prompts ?? []);
  const answered = prompts.filter((p) => p.a.trim()).length;

  const onNext = () => {
    update({ prompts: prompts.filter((p) => p.a.trim()) });
    router.push("/(auth)/invite-code");
  };

  return (
    <OnboardingScreen
      step={19}
      total={21}
      footer={<PillButton label={answered ? "Next" : "Answer at least 1 prompt"} onPress={onNext} disabled={!answered} variant="light" testID="prompts-next" />}
    >
      <Text style={s.head}>Show your personality</Text>
      <Text style={s.sub}>Answer at least 1 prompt (up to 3). People can like or comment on your answers, which starts better conversations.</Text>
      <PromptsEditor value={prompts} onChange={setPrompts} />
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 8, marginBottom: 18, lineHeight: 20 },
});
