import React, { useState } from "react";
import { useKeyboardHeight } from "@/lib/keyboard";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Share } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { ShieldCheck, Send } from "lucide-react-native";
import Colors from "@/constants/colors";
import { SAFETY_TIPS } from "@/constants/prompts";

export default function DateSafetyScreen() {
  const kb = useKeyboardHeight();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [where, setWhere] = useState<string>("");
  const [when, setWhen] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const share = async () => {
    const msg = [
      `Heads up — I'm going on a date${name ? ` with ${name}` : ""} (met on Hmong Date).`,
      where ? `Where: ${where}` : null,
      when ? `When: ${when}` : null,
      notes ? `Notes: ${notes}` : null,
      "I'll check in with you after. If you don't hear from me, please call me.",
    ].filter(Boolean).join("\n");
    try { await Share.share({ message: msg }); } catch (e) { console.log("[safety] share failed", e); }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Date safety" }} />
      <ScrollView style={s.ct} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" testID="date-safety-screen">
        <View style={s.hero}>
          <ShieldCheck size={28} color={Colors.primary} />
          <Text style={s.title}>Share your date plans</Text>
          <Text style={s.sub}>Send the details to a trusted friend or family member before you go.</Text>
        </View>
        <Text style={s.label}>Where are you meeting?</Text>
        <TextInput value={where} onChangeText={setWhere} placeholder="e.g. Hmong Village food court, St. Paul" placeholderTextColor={Colors.textTertiary} style={s.input} testID="safety-where" />
        <Text style={s.label}>When?</Text>
        <TextInput value={when} onChangeText={setWhen} placeholder="e.g. Saturday 7:00 PM" placeholderTextColor={Colors.textTertiary} style={s.input} testID="safety-when" />
        <Text style={s.label}>Anything else (optional)</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Their phone number, car, etc." placeholderTextColor={Colors.textTertiary} style={[s.input, { minHeight: 70 }]} multiline testID="safety-notes" />
        <TouchableOpacity style={s.btn} onPress={share} testID="safety-share">
          <Send size={18} color="#FFF" />
          <Text style={s.btnText}>Share with a friend</Text>
        </TouchableOpacity>

        <Text style={s.tipsHead}>Safety tips</Text>
        {SAFETY_TIPS.map((t, i) => (
          <View key={t} style={s.tip} testID={`safety-tip-${i}`}>
            <Text style={s.tipNum}>{i + 1}</Text>
            <Text style={s.tipText}>{t}</Text>
          </View>
        ))}
      {kb > 0 ? <View style={{ height: kb }} /> : null}
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 60 },
  hero: { alignItems: "flex-start", gap: 6, marginBottom: 18 },
  title: { fontSize: 24, fontWeight: "800" as const, color: Colors.text, marginTop: 6 },
  sub: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "700" as const, color: Colors.text, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 13, fontSize: 15, color: Colors.text, textAlignVertical: "top" as const },
  btn: { marginTop: 20, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, borderRadius: 999, paddingVertical: 15 },
  btnText: { color: "#FFF", fontWeight: "800" as const, fontSize: 15 },
  tipsHead: { fontSize: 18, fontWeight: "800" as const, color: Colors.text, marginTop: 32, marginBottom: 10 },
  tip: { flexDirection: "row", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  tipNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#fbeaec", color: Colors.primary, textAlign: "center", lineHeight: 24, fontWeight: "800" as const, fontSize: 12 },
  tipText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
});
