import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import OptionCard from "@/components/onboarding/OptionCard";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const OPTIONS = [
  { id: "christian", title: "Christian" },
  { id: "catholic", title: "Catholic" },
  { id: "traditional", title: "Traditional" },
  { id: "other", title: "Other" },
];

export default function ReligionScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<string>(data.religion ?? "");
  const [other, setOther] = useState<string>(data.religionOther ?? "");

  const onNext = () => {
    update({ religion: selected, religionOther: selected === "other" ? other.trim() : "" });
    router.push("/(auth)/seeking");
  };

  const skip = () => {
    update({ religion: undefined, religionOther: "" });
    router.push("/(auth)/seeking");
  };

  const valid = selected.length > 0 && (selected !== "other" || other.trim().length > 0);

  return (
    <OnboardingScreen
      step={9}
      total={20}
      topRight={
        <Pressable onPress={skip} hitSlop={12} testID="religion-skip">
          <Text style={s.skip}>{t("skip")}</Text>
        </Pressable>
      }
      footer={<PillButton label={t("next")} onPress={onNext} disabled={!valid} variant="light" testID="religion-next" />}
    >
      <Text style={s.head}>What&apos;s your{"\n"}religion?</Text>
      <Text style={s.sub}>Help others find people who share their values.</Text>

      <View style={{ height: 18 }} />
      {OPTIONS.map(o => (
        <OptionCard key={o.id} title={o.title} selected={selected === o.id} onPress={() => setSelected(o.id)} testID={`religion-${o.id}`} />
      ))}

      {selected === "other" && (
        <TextInput
          value={other}
          onChangeText={setOther}
          placeholder="Type your religion"
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={s.input}
          testID="religion-other-input"
        />
      )}
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  skip: { color: Colors.dark.textDim, fontSize: 14, fontFamily: "Cinzel_600SemiBold", padding: 8 },
  head: { fontSize: 28, fontFamily: "Cinzel_700Bold", color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
  input: { marginTop: 14, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.crimson, backgroundColor: "rgba(192,21,47,0.08)", color: Colors.dark.text, fontSize: 15 },
});
