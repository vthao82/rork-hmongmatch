import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, ShieldCheck } from "lucide-react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { auth, db } from "@/lib/firebase";
import { uploadPhotoAsync } from "@/lib/photoUpload";
import { WebcamCapture } from "@/components/web/WebcamCapture";

const WEB = Platform.OS === "web";

export default function PhotoVerifyScreen() {
  const { update } = useOnboarding();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const onboarding = mode === "onboarding";
  const [selfie, setSelfie] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState<boolean>(false);
  const [camOpen, setCamOpen] = useState<boolean>(false);

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
    if (WEB) { setCamOpen(true); return; }
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
        mediaTypes: ["images"],
      });
      if (!res.canceled && res.assets[0]) {
        setSelfie(res.assets[0].uri);
      }
    } catch (e) {
      console.log("verify error", e);
      Alert.alert("Camera unavailable", "We couldn't open your camera. Please try again.");
    }
  };

  const onContinue = async () => {
    if (busy || !selfie) return;
    const me = auth.currentUser;
    if (!me) {
      Alert.alert("Not signed in", "Please sign in again to verify your photos.");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadPhotoAsync(me.uid, selfie, "verification-selfie");
      // merge: works during onboarding before the profile doc exists
      await setDoc(
        doc(db, "users", me.uid),
        { photoVerified: true, verificationSelfie: url, verifiedAt: serverTimestamp() },
        { merge: true }
      );
      update({ photoVerified: true });
      Alert.alert("You're verified", "Your blue verified badge is now on your profile.", [{ text: "OK", onPress: advance }]);
    } catch (e) {
      console.log("[photo-verify] persist error", e);
      Alert.alert("Couldn't submit verification", "Check your connection and tap Submit again, or choose Do this later.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScreen
      footer={
        <View style={{ gap: 10 }}>
          <PillButton label={busy ? "Submitting..." : (selfie ? "Submit verification" : "Take selfie")} onPress={selfie ? onContinue : takeSelfie} variant="light" testID="verify-cta" disabled={busy} />
          {busy && <ActivityIndicator color="#FFF" />}
          <Pressable onPress={advance} style={s.skipBtn} testID="verify-skip" disabled={busy}>
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
        <Pressable onPress={takeSelfie} style={{ marginTop: 14 }} testID="verify-retake" disabled={busy}>
          <Text style={s.retake}>Re-take selfie</Text>
        </Pressable>
      )}

      {WEB && (
        <View style={s.webBox} testID="verify-web-help">
          <Text style={s.webTitle}>Signing up on a computer?</Text>
          <Text style={s.webTxt}>Use your webcam: tap Take selfie and allow camera access when your browser asks.</Text>
          <Text style={s.webTxt}>No webcam? Tap Do this later, then open the Hmong Date app on your phone and go to Profile, then Verify your photos.</Text>
        </View>
      )}

      <Text style={s.note}>Uploads from your library are not allowed for verification. You can skip this and verify later — your profile will not show the blue verified badge until you complete it.</Text>
      {WEB && <WebcamCapture visible={camOpen} onClose={() => setCamOpen(false)} onCapture={(uri) => { setSelfie(uri); setCamOpen(false); }} />}
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
  webBox: { marginTop: 22, padding: 14, borderRadius: 14, backgroundColor: "rgba(212,168,67,0.1)", borderWidth: 1, borderColor: "rgba(212,168,67,0.35)", gap: 6 },
  webTitle: { color: Colors.goldLight, fontSize: 14, fontWeight: "800" as const },
  webTxt: { color: Colors.dark.text, fontSize: 13, lineHeight: 19 },
  skipBtn: { paddingVertical: 6, alignItems: "center" },
  skipText: { color: Colors.dark.textDim, fontSize: 13, fontWeight: "600" as const },
});
