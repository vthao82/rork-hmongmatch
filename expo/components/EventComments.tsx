import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Send, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useEventComments, addEventComment, deleteEventComment, type EventComment } from "@/lib/events";
import { auth } from "@/lib/firebase";

type Person = { name: string; photo?: string };

function timeAgo(ms: number): string {
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

function CommentRow({ c, who, isReply, canDelete, onReply, onDelete }: { c: EventComment; who: Person; isReply?: boolean; canDelete: boolean; onReply: () => void; onDelete: () => void }) {
  return (
    <View style={[s.row, isReply && s.reply]} testID={`event-comment-${c.id}`}>
      {who.photo ? <Image source={{ uri: who.photo }} style={s.av} contentFit="cover" /> : <View style={[s.av, s.avEmpty]}><Text style={s.avTxt}>{who.name.slice(0, 1)}</Text></View>}
      <View style={{ flex: 1 }}>
        <View style={s.bubble}>
          <Text style={s.name}>{who.name}</Text>
          <Text style={s.text}>{c.text}</Text>
        </View>
        <View style={s.actions}>
          <Text style={s.time}>{timeAgo(c.createdAt)}</Text>
          <TouchableOpacity onPress={onReply} testID={`event-comment-reply-${c.id}`}><Text style={s.act}>Reply</Text></TouchableOpacity>
          {canDelete ? <TouchableOpacity onPress={onDelete} testID={`event-comment-delete-${c.id}`}><Text style={[s.act, { color: Colors.nope }]}>Delete</Text></TouchableOpacity> : null}
        </View>
      </View>
    </View>
  );
}

export function EventComments({ eventId, people, hidden, isAdmin, onInputFocus }: { eventId: string; people: Record<string, Person>; hidden: Set<string>; isAdmin: boolean; onInputFocus?: () => void }) {
  const me = auth.currentUser?.uid ?? "";
  const comments = useEventComments(eventId, true);
  const [text, setText] = useState<string>("");
  const [replyTo, setReplyTo] = useState<EventComment | null>(null);
  const [sending, setSending] = useState<boolean>(false);

  const visible = comments.filter((c) => !hidden.has(c.uid));
  const top = visible.filter((c) => !c.parentId || !visible.some((p) => p.id === c.parentId));
  const replies = useMemo(() => {
    const m: Record<string, EventComment[]> = {};
    visible.forEach((c) => { if (c.parentId) (m[c.parentId] ??= []).push(c); });
    return m;
  }, [visible]);
  const who = (uid: string): Person => (uid === me ? { ...(people[uid] ?? { name: "" }), name: "You" } : people[uid] ?? { name: "Member" });

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addEventComment(eventId, text, replyTo ? (replyTo.parentId ?? replyTo.id) : null, replyTo?.id ?? null);
      setText("");
      setReplyTo(null);
    } catch {
      Alert.alert("Couldn't post", "Please try again.");
    } finally {
      setSending(false);
    }
  };
  const del = (c: EventComment) => Alert.alert("Delete comment?", undefined, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => deleteEventComment(eventId, c.id).catch(() => Alert.alert("Couldn't delete", "Please try again.")) },
  ]);
  const row = (c: EventComment, isReply?: boolean) => (
    <CommentRow key={c.id} c={c} who={who(c.uid)} isReply={isReply} canDelete={c.uid === me || isAdmin} onReply={() => { setReplyTo(c); onInputFocus?.(); }} onDelete={() => del(c)} />
  );

  return (
    <View style={{ marginTop: 28 }} testID="event-comments">
      <Text style={s.sec}>Comments ({visible.length})</Text>
      {top.length === 0 ? <Text style={s.muted}>No comments yet. Ask a question or say hi.</Text> : null}
      {top.map((c) => (
        <View key={c.id}>
          {row(c)}
          {(replies[c.id] ?? []).map((r) => row(r, true))}
        </View>
      ))}
      {replyTo ? (
        <View style={s.replying} testID="event-replying-to">
          <Text style={s.replyingTxt} numberOfLines={1}>Replying to {who(replyTo.uid).name}</Text>
          <TouchableOpacity onPress={() => setReplyTo(null)} testID="event-reply-cancel"><X size={16} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
      ) : null}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder={replyTo ? "Write a reply…" : "Add a comment…"}
          placeholderTextColor={Colors.textSecondary}
          maxLength={500}
          multiline
          onFocus={onInputFocus}
          testID="event-comment-input"
        />
        <TouchableOpacity style={[s.send, !text.trim() && { opacity: 0.4 }]} onPress={() => void send()} disabled={!text.trim() || sending} testID="event-comment-send">
          {sending ? <ActivityIndicator color="#FFF" size="small" /> : <Send size={18} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sec: { fontSize: 17, fontWeight: "800" as const, color: Colors.text, marginBottom: 8 },
  muted: { color: Colors.textSecondary, fontSize: 14, marginBottom: 6 },
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  reply: { marginLeft: 46, marginTop: 8 },
  av: { width: 36, height: 36, borderRadius: 18 },
  avEmpty: { backgroundColor: "#fbeaec", alignItems: "center", justifyContent: "center" },
  avTxt: { color: Colors.primary, fontWeight: "800" as const },
  bubble: { backgroundColor: "#F4F1F2", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  name: { fontWeight: "800" as const, color: Colors.text, fontSize: 13 },
  text: { color: Colors.text, fontSize: 14, marginTop: 2, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 14, marginTop: 4, paddingLeft: 12 },
  time: { color: Colors.textSecondary, fontSize: 12 },
  act: { color: Colors.textSecondary, fontSize: 12, fontWeight: "800" as const },
  replying: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, backgroundColor: "#fbeaec", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  replyingTxt: { color: Colors.primary, fontWeight: "700" as const, flex: 1 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 12 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderColor: Colors.border, borderRadius: 22, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, color: Colors.text, fontSize: 15 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
});
