import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Modal, ScrollView } from "react-native";
import { router } from "expo-router";
import { Sparkles, ChevronRight, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { PROMPTS } from "@/constants/interests";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

export default function BioScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [bio, setBio] = useState<string>(data.bio ?? "");
  const [prompt, setPrompt] = useState<{ q: string; a: string } | undefined>(data.prompt);
  const [pickOpen, setPickOpen] = useState<boolean>(false);
  const [writingFor, setWritingFor] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>("");

  const onNext = () => {
    update({ bio, prompt });
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

      <Pressable style={[s.card, prompt && s.cardFilled]} onPress={() => setPickOpen(true)} testID="prompt-card">
        <Text style={s.cardLabel}>{t("selectPrompt")}</Text>
        {prompt ? (
          <>
            <Text style={s.pQ}>{prompt.q}</Text>
            <Text style={s.pA}>{prompt.a}</Text>
          </>
        ) : (
          <View style={s.pRow}>
            <Text style={s.pPlaceholder}>Answer a personality question</Text>
            <ChevronRight size={18} color={Colors.dark.textDim} />
          </View>
        )}
      </Pressable>

      <Modal visible={pickOpen} transparent animationType="slide" onRequestClose={() => setPickOpen(false)}>
        <View style={s.modalWrap}>
          <View style={s.modal}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>{writingFor ? "Your answer" : "Pick a prompt"}</Text>
              <Pressable onPress={() => { setPickOpen(false); setWritingFor(null); setAnswer(""); }}>
                <X size={22} color={Colors.dark.text} />
              </Pressable>
            </View>
            {!writingFor ? (
              <ScrollView style={{ maxHeight: 420 }}>
                {PROMPTS.map(p => (
                  <Pressable key={p} style={s.pItem} onPress={() => setWritingFor(p)}>
                    <Text style={s.pItemTxt}>{p}</Text>
                    <ChevronRight size={18} color={Colors.dark.textDim} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={{ padding: 18, gap: 12 }}>
                <Text style={s.pQ}>{writingFor}</Text>
                <TextInput
                  style={s.modalInput}
                  multiline
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder="Write your answer…"
                  placeholderTextColor="rgba(245,240,235,0.3)"
                  maxLength={200}
                  autoFocus
                />
                <PillButton
                  label="Save"
                  disabled={!answer.trim()}
                  onPress={() => {
                    setPrompt({ q: writingFor, a: answer.trim() });
                    setPickOpen(false);
                    setWritingFor(null);
                    setAnswer("");
                  }}
                  variant="primary"
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
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
