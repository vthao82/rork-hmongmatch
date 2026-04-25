import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Image } from "expo-image";
import { Send } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { conversations, profiles, Message } from "@/mocks/profiles";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pr = profiles.find(x => x.id === id);
  const cv = conversations.find(c => c.profile.id === id);
  const [ms, setMs] = useState<Message[]>(cv?.messages ?? []);
  const [tx, setTx] = useState<string>("");
  const lr = useRef<FlatList>(null);
  useEffect(() => { if (ms.length>0) setTimeout(() => lr.current?.scrollToEnd({ animated: true }), 100); }, [ms]);
  if (!pr) return <View style={s.cen}><Text style={s.err}>Conversation not found</Text></View>;
  const send = () => { if (!tx.trim()) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMs(p => [...p, { id: `m_${Date.now()}`, senderId: "me", text: tx.trim(), timestamp: "Just now", read: false }]); setTx(""); };
  const renderMsg = ({ item }: { item: Message }) => { const me = item.senderId==="me"; return <View style={[s.mr, me ? s.my : s.th]}>{!me && <Image source={{ uri: pr.photos[0] }} style={s.ma} contentFit="cover" />}<View style={[s.bb, me ? s.mb2 : s.tb]}><Text style={[s.bt2, me ? s.mbt : s.tbt]}>{item.text}</Text><Text style={[s.tt, me ? s.mtt : s.ttt]}>{item.timestamp}</Text></View></View>; };
  return (
    <><Stack.Screen options={{ title: pr.name, headerRight: () => <Image source={{ uri: pr.photos[0] }} style={s.ha} contentFit="cover" /> }} />
      <KeyboardAvoidingView style={s.ct} behavior={Platform.OS==="ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS==="ios" ? 90 : 0}>
        {ms.length===0 ? <View style={s.ec}><Image source={{ uri: pr.photos[0] }} style={s.ea} contentFit="cover" /><Text style={s.en}>{pr.name}</Text><Text style={s.ecl}>{pr.clan} Clan</Text><Text style={s.eh}>Say hello and start a conversation!</Text></View> : <FlatList ref={lr} data={ms} renderItem={renderMsg} keyExtractor={i => i.id} contentContainerStyle={s.ml} showsVerticalScrollIndicator={false} onContentSizeChange={() => lr.current?.scrollToEnd({ animated: false })} />}
        <View style={s.ir}><TextInput style={s.ip} placeholder="Type a message..." placeholderTextColor={Colors.textTertiary} value={tx} onChangeText={setTx} multiline maxLength={500} testID="chat-input" /><TouchableOpacity style={[s.sb, !tx.trim() && s.sbd]} onPress={send} disabled={!tx.trim()} testID="send-button"><Send size={20} color={tx.trim() ? "#FFF" : Colors.textTertiary} /></TouchableOpacity></View>
      </KeyboardAvoidingView></>
  );
}
const s = StyleSheet.create({ ct: { flex: 1, backgroundColor: Colors.background }, cen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }, err: { fontSize: 16, color: Colors.textSecondary }, ha: { width: 32, height: 32, borderRadius: 16 }, ml: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }, mr: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end", gap: 8 }, my: { justifyContent: "flex-end" }, th: { justifyContent: "flex-start" }, ma: { width: 28, height: 28, borderRadius: 14 }, bb: { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 }, mb2: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 }, tb: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }, bt2: { fontSize: 15, lineHeight: 21 }, mbt: { color: "#FFF" }, tbt: { color: Colors.text }, tt: { fontSize: 11, marginTop: 4 }, mtt: { color: "rgba(255,255,255,0.7)", textAlign: "right" as const }, ttt: { color: Colors.textTertiary }, ec: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 4 }, ea: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 }, en: { fontSize: 20, fontWeight: "700" as const, color: Colors.text }, ecl: { fontSize: 14, fontWeight: "600" as const, color: Colors.accent }, eh: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: "center" }, ir: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: "#FFF", gap: 8 }, ip: { flex: 1, backgroundColor: Colors.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, color: Colors.text }, sb: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" }, sbd: { backgroundColor: Colors.borderLight } });
