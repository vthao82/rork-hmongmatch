import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const CLANS = [
  "Chang", "Cheng", "Fang", "Her", "Khang", "Kong", "Kue",
  "Lee (Ly)", "Lor (Lo)", "Moua", "Pha", "Thao", "Vang", "Vue",
  "Xiong", "Yang", "Hang", "Cha",
];

export default function ClanScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [selected, setSelected] = useState<string | undefined>(data.clan);

  const pick = (c: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setSelected(c);
  };

  const onNext = () => {
    if (!selected) return;
    update({ clan: selected });
    router.push("/(auth)/dialect");
  };

  return (
    <OnboardingScreen
      step={5}
      total={19}
      footer={<PillButton label={t("next")} onPress={onNext} disabled={!selected} variant="light" testID="clan-next" />}
    >
      <Text style={s.head}>{t("clanQ")}</Text>
      <Text style={s.sub}>{t("clanSub")}</Text>

      <View style={s.grid}>
        {CLANS.map(c => {
          const on = selected === c;
          return (
            <Pressable key={c} onPress={() => pick(c)} style={[s.tile, on && s.tileOn]} testID={`clan-${c}`}>
              {on && <Check size={14} color="#fff" />}
              <Text style={[s.label, on && s.labelOn]}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 22 },
  tile: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(245,240,235,0.18)", backgroundColor: "rgba(255,255,255,0.04)" },
  tileOn: { borderColor: Colors.crimson, backgroundColor: Colors.crimson },
  label: { color: Colors.dark.text, fontSize: 14, fontWeight: "700" as const },
  labelOn: { color: "#fff" },
});
