import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { suggestCard } from "@/lib/interestCards";

type Props = { group: { id: string; title: string } | null; onClose: () => void };

/** Member suggests a new Interest card for a category; admins approve it. */
export default function SuggestCardModal({ group, onClose }: Props) {
  const [label, setLabel] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  useEffect(() => { if (group) setLabel(""); }, [group]);

  const send = async () => {
    if (!group || !label.trim()) return;
    setBusy(true);
    try {
      await suggestCard(group.id, label);
      onClose();
      Alert.alert("Thanks for the idea!", `"${label.trim()}" was sent to our team. We review every idea and may add it to ${group.title} in a future update.`);
    } catch (e) {
      Alert.alert("Couldn't send", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={!!group} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.backdrop}>
        <View style={s.card} testID="suggest-card-modal">
          <View style={s.head}>
            <Text style={s.title}>Suggest a card</Text>
            <TouchableOpacity onPress={onClose} testID="suggest-card-close"><X size={22} color={Colors.text} /></TouchableOpacity>
          </View>
          <Text style={s.sub}>What should we add to {group?.title}?</Text>
          <TextInput value={label} onChangeText={setLabel} placeholder="e.g. Volleyball" placeholderTextColor={Colors.textTertiary} maxLength={30} style={s.input} autoFocus testID="suggest-card-input" />
          <TouchableOpacity style={[s.btn, !label.trim() && { opacity: 0.4 }]} onPress={send} disabled={!label.trim() || busy} testID="suggest-card-send">
            {busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Send for review</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 22, padding: 20 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800" as const, color: Colors.text },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },
  input: { marginTop: 14, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 13, fontSize: 16, color: Colors.text },
  btn: { marginTop: 14, backgroundColor: Colors.primary, borderRadius: 999, paddingVertical: 15, alignItems: "center" },
  btnText: { color: "#FFF", fontWeight: "800" as const, fontSize: 15 },
});
