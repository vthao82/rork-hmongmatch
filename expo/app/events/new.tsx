import React, { useState } from "react";
import { Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { suggestEvent, parseEventDate } from "@/lib/events";

export default function NewEventScreen() {
  const router = useRouter();
  const [f, setF] = useState({ title: "", venue: "", city: "", state: "", dateText: "", timeText: "", description: "" });
  const [busy, setBusy] = useState<boolean>(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const startsAt = parseEventDate(f.dateText);
    if (!f.title.trim() || !f.city.trim() || !f.state.trim()) { Alert.alert("Missing info", "Please add a name, city and state."); return; }
    if (!startsAt) { Alert.alert("Check the date", "Use the format MM/DD/YYYY, e.g. 11/28/2026."); return; }
    setBusy(true);
    try {
      await suggestEvent({ ...f, title: f.title.trim(), startsAt });
      Alert.alert("Thanks!", "Your event was sent for review. It will appear once it's approved.");
      router.back();
    } catch (e) {
      Alert.alert("Couldn't submit", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = (k: keyof typeof f, label: string, ph: string, extra?: object) => (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput value={f[k]} onChangeText={set(k)} placeholder={ph} placeholderTextColor={Colors.textTertiary} style={s.input} testID={`event-${k}`} {...extra} />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: "Suggest an event" }} />
      <ScrollView style={s.ct} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {field("title", "Event name", "e.g. Hmong New Year Fresno 2026", { maxLength: 80 })}
        {field("venue", "Venue (optional)", "e.g. Fresno Fairgrounds", { maxLength: 80 })}
        {field("city", "City", "e.g. Fresno", { maxLength: 40 })}
        {field("state", "State", "e.g. CA", { maxLength: 30 })}
        {field("dateText", "Date", "MM/DD/YYYY", { keyboardType: "numbers-and-punctuation", maxLength: 10 })}
        {field("timeText", "Time (optional)", "e.g. 10:00 AM – 6:00 PM", { maxLength: 40 })}
        {field("description", "Details (optional)", "Tickets, parking, what to expect…", { multiline: true, maxLength: 500, style: [s.input, { minHeight: 90, textAlignVertical: "top" }] })}
        <TouchableOpacity style={s.btn} onPress={submit} disabled={busy} testID="event-submit">
          {busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Send for review</Text>}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: "700" as const, color: Colors.text, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 13, fontSize: 15, color: Colors.text },
  btn: { marginTop: 24, backgroundColor: Colors.primary, borderRadius: 999, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#FFF", fontWeight: "800" as const, fontSize: 15 },
});
