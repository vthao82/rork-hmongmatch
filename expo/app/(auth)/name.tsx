import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Animated, Easing, Pressable, Modal } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";

export default function NameScreen() {
  const { update } = useOnboarding();
  const t = useT();
  const [name, setName] = useState<string>("");
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const cursor = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(cursor, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.linear }),
      ])
    ).start();
  }, [cursor]);

  useEffect(() => {
    if (showWelcome) {
      modalScale.setValue(0.9);
      modalOpacity.setValue(0);
      wave.setValue(0);
      Animated.parallel([
        Animated.spring(modalScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.timing(modalOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave, { toValue: 1, duration: 280, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(wave, { toValue: -1, duration: 280, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(wave, { toValue: 0, duration: 280, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        ]),
        { iterations: 3 }
      ).start();
    }
  }, [showWelcome, modalScale, modalOpacity, wave]);

  const trimmed = name.trim();
  const ok = trimmed.length >= 2;

  const onNext = () => {
    if (!ok) return;
    update({ name: trimmed });
    setShowWelcome(true);
  };

  const onLetsGo = () => {
    setShowWelcome(false);
    router.push("/(auth)/birthday");
  };

  const onEditName = () => {
    setShowWelcome(false);
  };

  const waveRotate = wave.interpolate({ inputRange: [-1, 1], outputRange: ["-20deg", "20deg"] });

  return (
    <OnboardingScreen
      step={2}
      total={19}
      gradient={[Colors.indigo, "#3c0a24", Colors.crimson] as const}
      footer={<PillButton label={t("next")} onPress={onNext} disabled={!ok} variant="light" testID="name-next" />}
    >
      <Text style={s.head}>{t("firstNameQ")}</Text>
      <View style={s.row}>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder=""
          placeholderTextColor="rgba(245,240,235,0.22)"
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={onNext}
          testID="name-input"
        />
        {!name && <Animated.View style={[s.cursor, { opacity: cursor }]} pointerEvents="none" />}
      </View>
      <View style={s.line} />
      <Text style={s.note}>{t("firstNameNote")}</Text>

      <Modal visible={showWelcome} transparent animationType="fade" onRequestClose={onEditName}>
        <View style={s.backdrop}>
          <Animated.View style={[s.card, { opacity: modalOpacity, transform: [{ scale: modalScale }] }]} testID="welcome-card">
            <Animated.Text style={[s.wave, { transform: [{ rotate: waveRotate }] }]}>👋</Animated.Text>
            <Text style={s.welcomeTitle}>{t("welcomeName", { name: trimmed })}</Text>
            <Text style={s.welcomeBody}>{t("welcomeBody")}</Text>
            <View style={{ height: 18 }} />
            <PillButton label={t("letsGo")} onPress={onLetsGo} variant="light" testID="welcome-go" />
            <Pressable onPress={onEditName} style={s.editBtn} testID="welcome-edit">
              <Text style={s.editText}>{t("editName")}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.06)", justifyContent: "center", alignItems: "center" },
  head: { fontSize: 34, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 10, lineHeight: 40 },
  row: { marginTop: 40, flexDirection: "row" },
  input: { fontSize: 32, fontWeight: "700" as const, color: Colors.dark.text, flex: 1, paddingVertical: 6 },
  cursor: { position: "absolute", left: 2, bottom: 12, width: 2, height: 34, backgroundColor: Colors.crimson },
  line: { height: 2, backgroundColor: Colors.crimson, marginTop: 4, borderRadius: 1 },
  note: { color: Colors.dark.textDim, fontSize: 13, marginTop: 14, lineHeight: 20 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  card: { width: "100%", backgroundColor: "#14102a", borderRadius: 22, paddingVertical: 28, paddingHorizontal: 22, alignItems: "center", borderWidth: 1, borderColor: Colors.dark.border },
  wave: { fontSize: 56, marginBottom: 14 },
  welcomeTitle: { fontSize: 22, fontWeight: "800" as const, color: Colors.dark.text, marginBottom: 10, textAlign: "center" },
  welcomeBody: { fontSize: 15, color: Colors.dark.textDim, textAlign: "center", lineHeight: 22, paddingHorizontal: 6 },
  editBtn: { paddingVertical: 14, marginTop: 6 },
  editText: { color: Colors.dark.text, fontWeight: "700" as const, fontSize: 15 },
});
