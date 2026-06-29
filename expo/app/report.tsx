import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Check, AlertTriangle } from "lucide-react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Colors from "@/constants/colors";
import { auth, db } from "@/lib/firebase";

const REASONS = [
  "Harassment or hateful language",
  "Inappropriate photos",
  "Spam or scams",
  "Underage user",
  "Fake profile",
  "Bug or technical issue",
  "Other",
];

export default function ReportScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const [reason, setReason] = useState<string | undefined>();
  const [details, setDetails] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const submit = async () => {
    if (!reason || busy) return;
    const me = auth.currentUser;
    if (!me) {
      Alert.alert("Sign in required", "Please sign in to submit a report.");
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, "reports"), {
        reporterUid: me.uid,
        reporterEmail: me.email ?? null,
        reason,
        details: details.trim(),
        platform: "expo",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Thanks for reporting", "Our team will review this within 24 hours.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Submit failed";
      Alert.alert("Couldn't submit", msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><X size={22} color="#FFF" /></TouchableOpacity>
        <Text style={s.title}>Report a problem</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.banner}>
          <AlertTriangle size={18} color={Colors.crimsonLight} />
          <Text style={s.bannerText}>Reports are confidential. Help us keep Hmong Date safe.</Text>
        </View>

        <Text style={s.section}>What&apos;s going on?</Text>
        {REASONS.map(r => {
          const on = reason === r;
          return (
            <TouchableOpacity key={r} style={[s.row, on && s.rowOn]} onPress={() => setReason(r)} activeOpacity={0.85} testID={`reason-${r}`}>
              <Text style={[s.rowText, on && s.rowTextOn]}>{r}</Text>
              {on && <Check size={18} color={Colors.crimsonLight} strokeWidth={3} />}
            </TouchableOpacity>
          );
        })}

        <Text style={s.section}>Tell us more (optional)</Text>
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder="Add any details, usernames, or context."
          placeholderTextColor="rgba(255,255,255,0.35)"
          multiline
          maxLength={500}
          style={s.input}
          testID="report-details"
        />

        <TouchableOpacity style={[s.submit, (!reason || busy) && s.submitDisabled]} onPress={submit} disabled={!reason || busy} testID="submit-report">
          {busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.submitText}>Submit report</Text>}
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
  banner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "rgba(192,21,47,0.12)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(192,21,47,0.35)" },
  bannerText: { color: Colors.crimsonLight, fontSize: 13, flex: 1, fontWeight: "600" as const },
  section: { color: "#FFF", fontWeight: "800" as const, fontSize: 14, marginTop: 22, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.03)", marginBottom: 8 },
  rowOn: { borderColor: Colors.crimson, backgroundColor: "rgba(192,21,47,0.1)" },
  rowText: { color: "#FFF", fontSize: 14, fontWeight: "600" as const },
  rowTextOn: { color: Colors.crimsonLight },
  input: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 14, color: "#FFF", minHeight: 110, textAlignVertical: "top" as const },
  submit: { backgroundColor: Colors.crimson, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "#FFF", fontWeight: "800" as const, fontSize: 15 },
});
