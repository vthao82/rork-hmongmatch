import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Wine, Cigarette, Dumbbell, PawPrint } from "lucide-react-native";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import TagChip from "@/components/onboarding/TagChip";
import { useOnboarding, Lifestyle } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

const DRINK = ["Not for me", "Sober", "Sober curious", "On special occasions", "Socially on weekends", "Most Nights"];
const SMOKE = ["Social smoker", "Smoker when drinking", "Non-smoker", "Smoker", "Trying to quit"];
const WORK = ["Everyday", "Often", "Sometimes", "Never"];
const PETS_BASE = ["Dog", "Cat", "Reptile", "Amphibian", "Bird"];
const PETS_MORE = ["Fish", "Rabbit", "Hamster", "Horse", "No pets", "Want pets"];

export default function LifestyleScreen() {
  const { data, update } = useOnboarding();
  const t = useT();
  const [state, setState] = useState<Lifestyle>(data.lifestyle ?? {});
  const [showMorePets, setShowMorePets] = useState<boolean>(false);

  const togglePet = (p: string) => {
    setState(prev => {
      const curr = prev.pets ?? [];
      return { ...prev, pets: curr.includes(p) ? curr.filter(x => x !== p) : [...curr, p] };
    });
  };

  const filled = useMemo(() => {
    let n = 0;
    if (state.drink) n++;
    if (state.smoke) n++;
    if (state.workout) n++;
    if (state.pets && state.pets.length > 0) n++;
    return n;
  }, [state]);

  const onNext = () => {
    update({ lifestyle: state });
    router.push("/(auth)/extras");
  };

  const onSkip = () => {
    router.push("/(auth)/extras");
  };

  const petsList = showMorePets ? [...PETS_BASE, ...PETS_MORE] : PETS_BASE;
  const name = data.name ?? "";

  return (
    <OnboardingScreen
      step={11}
      total={15}
      gradient={[Colors.dark.bg, Colors.dark.bgSoft] as const}
      topRight={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <ArrowLeft size={22} color={Colors.dark.text} />
          </Pressable>
          <Pressable onPress={onSkip} testID="lifestyle-skip">
            <Text style={s.skip}>{t("skip")}</Text>
          </Pressable>
        </View>
      }
      footer={<PillButton label={`${t("next")}  ${filled}/4`} onPress={onNext} disabled={filled === 0} variant="light" testID="lifestyle-next" />}
    >
      <Text style={s.head}>{t("lifestyleQ")}{name ? `, ${name}` : ""}</Text>
      <Text style={s.sub}>{t("lifestyleSub")}</Text>

      <Section icon={<Wine size={20} color={Colors.gold} />} title="How often do you drink?">
        <View style={s.tags}>
          {DRINK.map(o => <TagChip key={o} label={o} selected={state.drink === o} onPress={() => setState(p => ({ ...p, drink: p.drink === o ? undefined : o }))} testID={`drink-${o}`} />)}
        </View>
      </Section>

      <Section icon={<Cigarette size={20} color={Colors.gold} />} title="How often do you smoke?">
        <View style={s.tags}>
          {SMOKE.map(o => <TagChip key={o} label={o} selected={state.smoke === o} onPress={() => setState(p => ({ ...p, smoke: p.smoke === o ? undefined : o }))} testID={`smoke-${o}`} />)}
        </View>
      </Section>

      <Section icon={<Dumbbell size={20} color={Colors.gold} />} title="Do you workout?">
        <View style={s.tags}>
          {WORK.map(o => <TagChip key={o} label={o} selected={state.workout === o} onPress={() => setState(p => ({ ...p, workout: p.workout === o ? undefined : o }))} testID={`workout-${o}`} />)}
        </View>
      </Section>

      <Section icon={<PawPrint size={20} color={Colors.gold} />} title="Do you have any pets?">
        <View style={s.tags}>
          {petsList.map(o => <TagChip key={o} label={o} selected={(state.pets ?? []).includes(o)} onPress={() => togglePet(o)} testID={`pet-${o}`} />)}
        </View>
        {!showMorePets && (
          <Pressable onPress={() => setShowMorePets(true)} style={{ marginTop: 10 }}>
            <Text style={s.more}>Show more ›</Text>
          </Pressable>
        )}
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
  head: { fontSize: 26, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 32 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 8, lineHeight: 20 },
  section: { marginTop: 22, paddingTop: 22, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  sHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: "700" as const, letterSpacing: -0.2 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  more: { color: Colors.gold, fontSize: 13.5, fontWeight: "700" as const },
});
