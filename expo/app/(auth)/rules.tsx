import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import HmongLogo from "@/components/onboarding/HmongLogo";
import { useT } from "@/providers/LanguageProvider";

type RuleKey = { t: "rule1Title" | "rule2Title" | "rule3Title" | "rule4Title"; b: "rule1Body" | "rule2Body" | "rule3Body" | "rule4Body" };
const RULE_KEYS: RuleKey[] = [
  { t: "rule1Title", b: "rule1Body" },
  { t: "rule2Title", b: "rule2Body" },
  { t: "rule3Title", b: "rule3Body" },
  { t: "rule4Title", b: "rule4Body" },
];

function Rule({ title, body, i }: { title: string; body: string; i: number }) {
  const y = useRef(new Animated.Value(24)).current;
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 500, delay: 200 + i * 120, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(o, { toValue: 1, duration: 500, delay: 200 + i * 120, useNativeDriver: true }),
    ]).start();
  }, [y, o, i]);
  return (
    <Animated.View style={[s.rule, { opacity: o, transform: [{ translateY: y }] }]}>
      <Text style={s.rTitle}>{title}</Text>
      <Text style={s.rBody}>{body}</Text>
    </Animated.View>
  );
}

export default function RulesScreen() {
  const t = useT();
  return (
    <OnboardingScreen
      footer={<PillButton label={t("agree")} onPress={() => router.push("/(auth)/name")} variant="light" testID="rules-agree" />}
    >
      <View style={s.head}>
        <HmongLogo fullWidth />
        <Text style={s.title}>{t("welcomeToHmongMatch")}</Text>
        <Text style={s.sub}>{t("houseRulesSub")}</Text>
      </View>

      {RULE_KEYS.map((r, i) => <Rule key={r.t} title={t(r.t)} body={t(r.b)} i={i} />)}
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { paddingTop: 0, gap: 8, marginTop: -8 },
  title: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, lineHeight: 34, marginTop: 4 },
  sub: { fontSize: 15, color: Colors.dark.textDim },
  rule: { marginTop: 14 },
  rTitle: { fontSize: 18, fontWeight: "800" as const, color: Colors.dark.text, marginBottom: 4 },
  rBody: { fontSize: 14, color: Colors.dark.textDim, lineHeight: 20 },
});
