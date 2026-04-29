import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Animated, Easing, Pressable } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

function format(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  const m = d.slice(0, 2);
  const day = d.slice(2, 4);
  const y = d.slice(4, 8);
  let out = m;
  if (d.length >= 3) out += "/" + day;
  if (d.length >= 5) out += "/" + y;
  return out;
}

function isValid(v: string): boolean {
  const d = v.replace(/\D/g, "");
  if (d.length !== 8) return false;
  const m = parseInt(d.slice(0, 2), 10);
  const day = parseInt(d.slice(2, 4), 10);
  const y = parseInt(d.slice(4, 8), 10);
  if (m < 1 || m > 12) return false;
  if (day < 1 || day > 31) return false;
  const now = new Date().getFullYear();
  if (y < 1920 || y > now - 17) return false;
  return true;
}

export default function BirthdayScreen() {
  const { update } = useOnboarding();
  const t = useT();
  const [v, setV] = useState<string>("");
  const cursor = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(cursor, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.linear }),
      ])
    ).start();
  }, [cursor]);

  const formatted = useMemo(() => format(v), [v]);
  const ok = isValid(formatted);

  const onNext = () => {
    update({ birthday: formatted });
    router.push("/(auth)/gender");
  };

  return (
    <OnboardingScreen
      step={3}
      total={19}
      gradient={[Colors.indigo, "#3c0a24", Colors.crimson] as const}
      footer={<PillButton label={t("next")} onPress={onNext} disabled={!ok} variant="light" testID="bday-next" />}
    >
      <Text style={s.head}>{t("bdayQ")}</Text>
      <View style={s.row}>
        <TextInput
          style={s.input}
          value={formatted}
          onChangeText={(t) => setV(t)}
          placeholder="MM/DD/YYYY"
          placeholderTextColor="rgba(245,240,235,0.22)"
          keyboardType="number-pad"
          maxLength={10}
          autoFocus
          testID="bday-input"
        />
        {!formatted && <Animated.View style={[s.cursor, { opacity: cursor }]} pointerEvents="none" />}
      </View>
      <View style={s.line} />
      <Text style={s.note}>{t("bdayNote")}</Text>
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.06)", justifyContent: "center", alignItems: "center" },
  head: { fontSize: 30, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 10 },
  row: { marginTop: 40, flexDirection: "row" },
  input: { fontSize: 34, fontWeight: "700" as const, color: Colors.dark.text, letterSpacing: 1, flex: 1, paddingVertical: 6 },
  cursor: { position: "absolute", left: 2, bottom: 12, width: 2, height: 36, backgroundColor: Colors.crimson },
  line: { height: 2, backgroundColor: Colors.crimson, marginTop: 4, borderRadius: 1 },
  note: { color: Colors.dark.textDim, fontSize: 13, marginTop: 14 },
});
