import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { router } from "expo-router";
import { Sparkles } from "lucide-react-native";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

export default function BioScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [bio, setBio] = useState<string>(data.bio ?? "");

  const onNext = () => {
    update({ bio });
    router.push("/(auth)/location");
  };

  return (
    <OnboardingScreen
      step={18}
      total={19}
      footer={
        <View style={{ gap: 10 }}>
          <View style={s.bannerWrap}>
            <Sparkles size={14} color={Colors.crimsonLight} />
            <Text style={s.bannerTxt}>Adding a short intro could lead to 25% more matches</Text>
          </View>
          <PillButton label={t("next")} onPress={onNext} variant="light" testID="bio-next" />
        </View>
      }
    >
      <Text style={s.head}>{t("bioQ")}</Text>
      <Text style={s.sub}>{t("bioSub")}</Text>

      <View style={[s.card, bio && s.cardFilled]}>
        <Text style={s.cardLabel}>{t("aboutMe")}</Text>
        <TextInput
          style={s.ta}
          multiline
          value={bio}
          onChangeText={setBio}
          placeholder="Tell your potential matches something they won't find on your profile…"
          placeholderTextColor="rgba(245,240,235,0.3)"
          maxLength={300}
          testID="bio-input"
        />
        <Text style={s.count}>{bio.length}/300</Text>
      </View>
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  skip: { color: Colors.dark.textDim, fontSize: 14, fontWeight: "600" as const, padding: 8 },
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 8 },
  card: { marginTop: 18, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(245,240,235,0.22)", borderRadius: 18, padding: 16, backgroundColor: "rgba(255,255,255,0.03)" },
  cardFilled: { borderStyle: "solid", borderColor: "rgba(192,21,47,0.5)" },
  cardLabel: { fontSize: 11, color: Colors.gold, fontWeight: "700" as const, letterSpacing: 1.2, textTransform: "uppercase" as const, marginBottom: 10 },
  ta: { color: Colors.dark.text, fontSize: 15, minHeight: 90, textAlignVertical: "top" as const },
  count: { color: Colors.dark.textFaint, fontSize: 11, textAlign: "right" as const, marginTop: 6 },
  pRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pPlaceholder: { color: "rgba(245,240,235,0.45)", fontSize: 15 },
  pQ: { color: Colors.gold, fontSize: 14, fontWeight: "600" as const },
  pA: { color: Colors.dark.text, fontSize: 16, marginTop: 6, lineHeight: 22 },
  bannerWrap: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(192,21,47,0.14)", borderWidth: 1, borderColor: "rgba(192,21,47,0.35)", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  bannerTxt: { color: Colors.crimsonLight, fontSize: 13, fontWeight: "500" as const, flex: 1 },
  modalWrap: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  modal: { backgroundColor: Colors.dark.bgSoft, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 30 },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  modalTitle: { color: Colors.dark.text, fontSize: 17, fontWeight: "700" as const },
  pItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  pItemTxt: { color: Colors.dark.text, fontSize: 15, flex: 1 },
  modalInput: { color: Colors.dark.text, fontSize: 16, minHeight: 110, textAlignVertical: "top" as const, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 14, padding: 14 },
});
