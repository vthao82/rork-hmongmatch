import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Heart, X } from "lucide-react-native";
import Colors from "@/constants/colors";

type Props = { visible: boolean; name: string; context?: string; onClose: () => void; onSend: (comment: string) => void };

/** Like someone with an optional comment. */
export default function LikeCommentModal({ visible, name, context, onClose, onSend }: Props) {
  const [text, setText] = useState<string>("");
  useEffect(() => { if (visible) setText(""); }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.backdrop}>
        <View style={s.card} testID="like-comment-modal">
          <View style={s.head}>
            <Text style={s.title}>Like {name}</Text>
            <TouchableOpacity onPress={onClose} testID="like-comment-close"><X size={22} color={Colors.text} /></TouchableOpacity>
          </View>
          {context ? <Text style={s.context} numberOfLines={3}>{context}</Text> : null}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment (optional) — it makes a match more likely"
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={200}
            style={s.input}
            testID="like-comment-input"
          />
          <TouchableOpacity style={s.btn} onPress={() => onSend(text.trim())} testID="like-comment-send">
            <Heart size={18} color="#FFF" fill="#FFF" />
            <Text style={s.btnText}>{text.trim() ? "Send like with comment" : "Send like"}</Text>
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
  context: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#fbf7f2", color: Colors.textSecondary, fontSize: 13 },
  input: { marginTop: 12, minHeight: 80, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12, fontSize: 15, color: Colors.text, textAlignVertical: "top" as const },
  btn: { marginTop: 14, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, borderRadius: 999, paddingVertical: 15 },
  btnText: { color: "#FFF", fontWeight: "800" as const, fontSize: 15 },
});
