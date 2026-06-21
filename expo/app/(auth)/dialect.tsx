import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
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
  { id: "other", title: "Other", description: "Type your dialect" },
];

export default function DialectScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<DialectId | undefined>(data.dialect);
  const [other, setOther] = useState<string>(data.dialectOther ?? "");

  const canNext = !!selected && (selected !== "other" || other.trim().length > 0);

  const onNext = () => {
    if (!canNext) return;
    update({ dialect: selected, dialectOther: selected === "other" ? other.trim() : undefined });
    router.push("/(auth)/hometown");
  };

  return (
    <OnboardingScreen
      step={6}
      total={19}
      footer={<PillButton label={t("next")} onPress={onNext} disabled={!canNext} variant="light" testID="dialect-next" />}
    >
      <Text style={s.head}>{t("dialectQ")}</Text>
      <Text style={s.sub}>{t("dialectSub")}</Text>
      <View style={{ height: 18 }} />
      {OPTIONS.map(o => (
        <OptionCard key={o.id} title={o.title} description={o.description} selected={selected === o.id} onPress={() => setSelected(o.id)} testID={`dialect-${o.id}`} />
      ))}
      {selected === "other" && (
        <TextInput
          style={s.input}
          value={other}
          onChangeText={setOther}
          placeholder="Type your dialect…"
          placeholderTextColor="rgba(245,240,235,0.4)"
          maxLength={40}
          testID="dialect-other-input"
        />
      )}
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
  input: { marginTop: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1.5, borderColor: "rgba(192,21,47,0.4)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, color: Colors.dark.text, fontSize: 15 },
});
