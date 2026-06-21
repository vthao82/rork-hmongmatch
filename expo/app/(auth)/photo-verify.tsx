import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, ShieldCheck } from "lucide-react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";

export default function PhotoVerifyScreen() {
  const { update } = useOnboarding();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const onboarding = mode === "onboarding";
  const [selfie, setSelfie] = useState<string | undefined>(undefined);

  const advance = () => {
    if (onboarding) {
      router.replace("/(auth)/bio");
      return;
    }
    try {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/profile");
    } catch {
      router.replace("/(tabs)/profile");
    }
  };

  const takeSelfie = async () => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Camera needed", "Enable camera access to verify your photos.");
          return;
        }
      }
      const res = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        quality: 0.85,
        allowsEditing: false,
      });
      if (!res.canceled && res.assets[0]) {
        setSelfie(res.assets[0].uri);
      }
    } catch (e) {
      console.log("verify error", e);
    }
  };

  const onContinue = () => {
    update({ photoVerified: !!selfie });
    advance();
  };

  return (
    <OnboardingScreen
      footer={
        <View style={{ gap: 10 }}>
          <PillButton label={selfie ? "Submit verification" : "Take selfie"} onPress={selfie ? onContinue : takeSelfie} variant="light" testID="verify-cta" />
          <Pressable onPress={advance} style={s.skipBtn} testID="verify-skip">
            <Text style={s.skipText}>Do this later</Text>
          </Pressable>
        </View>
      }
    >
      <View style={s.headIcon}><ShieldCheck size={28} color={Colors.gold} /></View>
      <Text style={s.head}>Photo verification</Text>
      <Text style={s.sub}>Take a quick selfie so we can confirm your photos are really you. Verified members get a blue badge next to their name.</Text>

      <View style={s.preview}>
        {selfie ? (
          <Image source={{ uri: selfie }} style={s.previewImg} contentFit="cover" />
        ) : (
          <View style={s.placeholder}><Camera size={36} color="rgba(255,255,255,0.35)" /></View>
        )}
      </View>

      {selfie && (
        <Pressable onPress={takeSelfie} style={{ marginTop: 14 }}>
          <Text style={s.retake}>Re-take selfie</Text>
        </Pressable>
      )}

      <Text style={s.note}>Uploads from your library are not allowed for verification. You can skip this and verify later — your profile will not show the blue verified badge until you complete it.</Text>
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  headIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(212,168,67,0.12)", borderWidth: 1, borderColor: "rgba(212,168,67,0.35)", marginTop: 8 },
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 14, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
  preview: { marginTop: 26, alignSelf: "center", width: 220, height: 220, borderRadius: 110, overflow: "hidden", borderWidth: 2, borderColor: Colors.crimson, backgroundColor: "rgba(255,255,255,0.04)" },
  previewImg: { width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  retake: { color: Colors.gold, textAlign: "center" as const, fontWeight: "700" as const, fontSize: 14 },
  note: { color: Colors.dark.textDim, fontSize: 12, marginTop: 24, lineHeight: 18 },
  skipBtn: { paddingVertical: 6, alignItems: "center" },
  skipText: { color: Colors.dark.textDim, fontSize: 13, fontWeight: "600" as const },
});
