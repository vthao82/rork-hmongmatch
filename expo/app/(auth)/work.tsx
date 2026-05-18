import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import OptionCard from "@/components/onboarding/OptionCard";
import { useOnboarding, WorkId } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const OPTIONS: { id: WorkId; title: string }[] = [
  { id: "wfh", title: "Work from home" },
  { id: "full-time", title: "Full-time job" },
  { id: "part-time", title: "Part-time job" },
  { id: "school", title: "Still in school" },
  { id: "government", title: "Government job" },
  { id: "labor", title: "Labor" },
  { id: "other", title: "Other" },
];

export default function WorkScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<WorkId | undefined>(data.work);
  const [other, setOther] = useState<string>(data.workOther ?? "");

  const onNext = () => {
    update({ work: selected, workOther: selected === "other" ? other.trim() : undefined });
    router.push("/(auth)/education");
  };

  return (
    <OnboardingScreen
      step={12}
      total={19}
      footer={<PillButton label={t("next")} onPress={onNext} disabled={!selected || (selected === "other" && other.trim().length === 0)} variant="light" testID="work-next" />}
    >
      <Text style={s.head}>{t("workQ")}</Text>
      <Text style={s.sub}>{t("workSub")}</Text>
      <View style={{ height: 18 }} />
      {OPTIONS.map(o => (
        <OptionCard key={o.id} title={o.title} selected={selected === o.id} onPress={() => setSelected(o.id)} testID={`work-${o.id}`} />
      ))}
      {selected === "other" && (
        <TextInput
          style={s.input}
          value={other}
          onChangeText={setOther}
          placeholder="Tell us what you do"
          placeholderTextColor="rgba(255,255,255,0.35)"
          testID="work-other-input"
        />
      )}
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  skip: { color: Colors.dark.textDim, fontSize: 14, fontWeight: "600" as const, padding: 8 },
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
  input: { marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.crimson, backgroundColor: "rgba(192,21,47,0.08)", color: Colors.dark.text, fontSize: 15 },
});
