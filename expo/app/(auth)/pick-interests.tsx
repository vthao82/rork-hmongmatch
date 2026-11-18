import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { INTEREST_GROUPS } from "@/constants/interests";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const MAX = 10;

export default function InterestsScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<string[]>(data.interests ?? []);

  const toggle = useCallback((tag: string) => {
    setSelected(prev => {
      const has = prev.includes(tag);
      if (!has && prev.length >= MAX) return prev;
      if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
      return has ? prev.filter(t => t !== tag) : [...prev, tag];
    });
  }, []);

  const count = selected.length;
  const valid = count >= 3;

  const onNext = () => {
    update({ interests: selected });
    router.push("/(auth)/lifestyle");
  };

  const headerLabel = useMemo(() => `${t("next")}  ${count}/${MAX}`, [count, t]);

  return (
    <OnboardingScreen
      step={14}
      total={19}
      footer={<PillButton label={headerLabel} onPress={onNext} disabled={!valid} variant="light" testID="interests-next" />}
    >
      <Text style={s.head}>{t("interestsQ")}</Text>
      <Text style={s.sub}>{t("interestsSub")}</Text>
      <Text style={s.sub2}>Your interests will be used to display your profile inside the explore page.</Text>

      <View style={{ height: 10 }} />
      {INTEREST_GROUPS.map(g => (
        <View key={g.title} style={s.group}>
          <Text style={s.gTitle}>{g.emoji}  {g.title}</Text>
          <View style={s.tags}>
            {g.items.map(i => {
              const active = selected.includes(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => toggle(i)}
                  style={[s.tag, active && s.tagActive]}
                  testID={`tag-${i}`}
                >
                  {active && <Check size={14} color={Colors.ink} />}
                  <Text style={[s.tagTxt, active && s.tagTxtActive]}>{i}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <View style={{ height: 30 }} />
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 8, lineHeight: 20 },
  sub2: { fontSize: 13, color: Colors.gold, marginTop: 8, lineHeight: 18, fontStyle: "italic" as const },
  group: { marginTop: 22 },
  gTitle: { fontSize: 13, color: Colors.gold, fontWeight: "700" as const, letterSpacing: 1.1, textTransform: "uppercase" as const, marginBottom: 10 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: "rgba(245,240,235,0.18)" },
  tagActive: { backgroundColor: Colors.offwhite, borderColor: Colors.offwhite },
  tagTxt: { color: Colors.dark.text, fontSize: 13.5, fontWeight: "600" as const },
  tagTxtActive: { color: Colors.ink },
});
