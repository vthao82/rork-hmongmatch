import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, MessageCircle, Heart, Moon } from "lucide-react-native";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import TagChip from "@/components/onboarding/TagChip";
import { useOnboarding, Extras } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const COMM = ["Big time texter", "Phone caller", "Video chatter", "Bad texter", "Better in person"];
const LOVE = ["Thoughtful gestures", "Presents", "Touch", "Compliments", "Time together"];
const ZODIAC = ["Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"];

export default function ExtrasScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [state, setState] = useState<Extras>(data.extras ?? {});

  const filled = useMemo(() => {
    let n = 0;
    if (state.communication) n++;
    if (state.love) n++;
    if (state.zodiac) n++;
    return n;
  }, [state]);

  const onNext = () => {
    update({ extras: state });
    router.push("/(auth)/photos");
  };
  const onSkip = () => router.push("/(auth)/photos");

  return (
    <OnboardingScreen
      step={12}
      total={15}
      gradient={[Colors.dark.bg, Colors.dark.bgSoft] as const}
      topRight={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <ArrowLeft size={22} color={Colors.dark.text} />
          </Pressable>
          <Pressable onPress={onSkip} testID="extras-skip">
            <Text style={s.skip}>{t("skip")}</Text>
          </Pressable>
        </View>
      }
      footer={<PillButton label={`${t("next")}  ${filled}/3`} onPress={onNext} disabled={filled === 0} variant="light" testID="extras-next" />}
    >
      <Text style={s.head}>{t("extrasQ")}</Text>
      <Text style={s.sub}>{t("extrasSub")}</Text>

      <Section icon={<MessageCircle size={20} color={Colors.gold} />} title="What is your communication style?">
        <View style={s.tags}>
          {COMM.map(o => <TagChip key={o} label={o} selected={state.communication === o} onPress={() => setState(p => ({ ...p, communication: p.communication === o ? undefined : o }))} testID={`comm-${o}`} />)}
        </View>
      </Section>

      <Section icon={<Heart size={20} color={Colors.gold} />} title="How do you receive love?">
        <View style={s.tags}>
          {LOVE.map(o => <TagChip key={o} label={o} selected={state.love === o} onPress={() => setState(p => ({ ...p, love: p.love === o ? undefined : o }))} testID={`love-${o}`} />)}
        </View>
      </Section>

      <Section icon={<Moon size={20} color={Colors.gold} />} title="What is your zodiac sign?">
        <View style={s.tags}>
          {ZODIAC.map(o => <TagChip key={o} label={o} selected={state.zodiac === o} onPress={() => setState(p => ({ ...p, zodiac: p.zodiac === o ? undefined : o }))} testID={`zodiac-${o}`} />)}
        </View>
      </Section>
    </OnboardingScreen>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sHead}>
        {icon}
        <Text style={s.sTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.06)", justifyContent: "center", alignItems: "center" },
  skip: { color: Colors.dark.textDim, fontSize: 14, fontWeight: "600" as const, padding: 8 },
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 8, lineHeight: 20 },
  section: { marginTop: 22, paddingTop: 22, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  sHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: "700" as const, letterSpacing: -0.2 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
