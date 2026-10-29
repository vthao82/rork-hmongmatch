import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Platform, Linking } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { X, ImagePlus, MessageSquareHeart } from "lucide-react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Colors from "@/constants/colors";
import { auth, db } from "@/lib/firebase";
import { uploadPhotoAsync } from "@/lib/photoUpload";

export const FEEDBACK_EMAIL = "hmongdate.support@gmail.com";

function deviceInfo() {
  return {
    appVersion: Constants.expoConfig?.version ?? "unknown",
    os: Platform.OS,
    osVersion: String(Platform.Version),
    model: Device.modelName ?? "unknown",
  };
}

export default function FeedbackScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const [text, setText] = useState<string>("");
  const [shot, setShot] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (!res.canceled && res.assets[0]) setShot(res.assets[0].uri);
  };

  const submit = async () => {
    const me = auth.currentUser;
    if (!me || !text.trim() || busy) return;
    setBusy(true);
    try {
      const info = deviceInfo();
      const screenshotUrl = shot ? await uploadPhotoAsync(me.uid, shot, `feedback-${Date.now()}`) : null;
      await addDoc(collection(db, "feedback"), {
        uid: me.uid, email: me.email ?? null, message: text.trim(), screenshotUrl, ...info, createdAt: serverTimestamp(),
      });
      const body = `${text.trim()}\n\n---\nApp ${info.appVersion} · ${info.os} ${info.osVersion} · ${info.model}\nUser: ${me.email ?? me.uid}${screenshotUrl ? `\nScreenshot: ${screenshotUrl}` : ""}`;
      const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("Hmong Date feedback")}&body=${encodeURIComponent(body)}`;
      Alert.alert("Thanks for your feedback!", "It's saved. Tap Email to also send a copy to our team.", [
        { text: "Done", onPress: () => router.back() },
        { text: "Email", onPress: () => { Linking.openURL(mailto).catch(() => {}); router.back(); } },
      ]);
    } catch (e) {
      Alert.alert("Couldn't send", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const disabled = !text.trim() || busy;
  return (
    <View style={[s.ct, { paddingTop: ins.top }]} testID="feedback-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} testID="feedback-close"><X size={22} color="#FFF" /></TouchableOpacity>
        <Text style={s.title}>Send feedback</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.banner}>
          <MessageSquareHeart size={18} color={Colors.gold} />
          <Text style={s.bannerText}>Found a bug or have an idea? Tell us — your device and app version are added automatically.</Text>
        </View>
        <TextInput value={text} onChangeText={setText} placeholder="What happened? What did you expect?" placeholderTextColor="rgba(255,255,255,0.35)" multiline maxLength={1000} style={s.input} testID="feedback-input" />
        <TouchableOpacity style={s.attach} onPress={pick} testID="feedback-attach">
          {shot ? <Image source={{ uri: shot }} style={s.thumb} /> : <ImagePlus size={20} color="rgba(255,255,255,0.7)" />}
          <Text style={s.attachText}>{shot ? "Change screenshot" : "Attach a screenshot (optional)"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.submit, disabled && s.submitDisabled]} onPress={submit} disabled={disabled} testID="feedback-submit">
          {busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.submitText}>Send feedback</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "#0c0719" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  title: { color: "#FFF", fontWeight: "800" as const, fontSize: 16 },
  scroll: { padding: 18, paddingBottom: 40 },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "rgba(212,168,67,0.1)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(212,168,67,0.35)", marginBottom: 18 },
  bannerText: { color: Colors.goldLight, fontSize: 13, flex: 1, fontWeight: "600" as const },
  input: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 14, color: "#FFF", minHeight: 150, textAlignVertical: "top" as const },
  attach: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, marginTop: 12, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.2)" },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  attachText: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" as const },
  submit: { backgroundColor: Colors.crimson, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "#FFF", fontWeight: "800" as const, fontSize: 15 },
});
