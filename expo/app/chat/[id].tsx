import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Send, Video, Lock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { profiles as mockProfiles } from "@/mocks/profiles";
import { useAllProfiles } from "@/lib/discoverProfiles";
import { useChatMessages, sendChatMessage, markMessageRead, formatRelative, type ChatMessage } from "@/lib/chat";
import { auth } from "@/lib/firebase";
import { useTier } from "@/providers/TierProvider";
import { useT } from "@/providers/LanguageProvider";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const ins = useSafeAreaInsets();
  const t = useT();
  const { isPaid, consumeMessage } = useTier();
  const { byId: liveById } = useAllProfiles();
  const me = auth.currentUser;
  // Prefer live Firestore profile; fall back to mocks during loading or for legacy IDs
  const pr = (id ? liveById[id] : null) ?? mockProfiles.find(x => x.id === id);
  const { messages, matchId } = useChatMessages(id);
  const [tx, setTx] = useState<string>("");
  const lr = useRef<FlatList<ChatMessage>>(null);

  // Mark unread incoming messages as read once we open the chat
  useEffect(() => {
    if (!matchId || !me) return;
    messages.forEach((m) => {
      if (m.senderId !== me.uid && !m.read) {
        void markMessageRead(matchId, m.id);
      }
    });
  }, [messages, matchId, me?.uid]);

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => lr.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const myUid = me?.uid ?? "";

  const renderMsg = ({ item }: { item: ChatMessage }) => {
    const mine = item.senderId === myUid;
    return (
      <View style={[s.mr, mine ? s.my : s.th]}>
        {!mine && pr && <Image source={{ uri: pr.photos[0] }} style={s.ma} contentFit="cover" />}
        <View style={[s.bb, mine ? s.mb2 : s.tb]}>
          <Text style={[s.bt2, mine ? s.mbt : s.tbt]}>{item.text}</Text>
          <Text style={[s.tt, mine ? s.mtt : s.ttt]}>{formatRelative(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (!pr) return (
    <View style={s.cen}>
      <Text style={s.err}>{t("convNotFound")}</Text>
      <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
        <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: "700" as const }}>{t("back")}</Text>
      </TouchableOpacity>
    </View>
  );

  const send = async () => {
    const trimmed = tx.trim();
    if (!trimmed) return;
    if (!id) return;
    const ok = consumeMessage();
    if (!ok) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTx("");
    const res = await sendChatMessage(id, trimmed);
    if (!res.ok) {
      Alert.alert("Couldn't send", res.error ?? "Please try again.");
      setTx(trimmed); // restore so user doesn't lose draft
    }
  };

  const onVideo = () => {
    if (!isPaid) {
      Alert.alert(t("videoGoldTitle"), t("videoGoldSub"), [
        { text: t("maybeLater"), style: "cancel" },
        { text: t("seePlans"), onPress: () => router.push("/subscription") },
      ]);
      return;
    }
    Alert.alert(t("startVideoChat"), t("startVideoChatWith", { name: pr.name }));
  };

  return (
    <>
      <Stack.Screen options={{
        title: pr.name,
        headerRight: () => (
          <View style={s.headerRight}>
            <TouchableOpacity onPress={onVideo} style={s.headerVideo} testID="header-video">
              <Video size={20} color={isPaid ? Colors.accent : Colors.textTertiary} />
              {!isPaid && <Lock size={10} color={Colors.textTertiary} style={s.lockOverlay} />}
            </TouchableOpacity>
            <Image source={{ uri: pr.photos[0] }} style={s.ha} contentFit="cover" />
          </View>
        )
      }} />
      <KeyboardAvoidingView style={s.ct} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        {messages.length === 0 ? (
          <View style={s.ec}>
            <Image source={{ uri: pr.photos[0] }} style={s.ea} contentFit="cover" />
            <Text style={s.en}>{pr.name}</Text>
            <Text style={s.ecl}>{pr.clan} Clan</Text>
            <Text style={s.eh}>{t("sayHello")}</Text>
          </View>
        ) : (
          <FlatList
            ref={lr}
            data={messages}
            renderItem={renderMsg}
            keyExtractor={i => i.id}
            contentContainerStyle={s.ml}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => lr.current?.scrollToEnd({ animated: false })}
          />
        )}
        <View style={[s.ir, { paddingBottom: Math.max(ins.bottom, 12) + 24 }]}>
          <TouchableOpacity style={s.videoBtn} onPress={onVideo} testID="video-btn">
            <Video size={20} color={isPaid ? Colors.accent : Colors.textTertiary} />
            {!isPaid && <Lock size={10} color={Colors.textTertiary} style={s.lockOverlay} />}
          </TouchableOpacity>
          <TextInput
            style={s.ip}
            placeholder={t("typeMessage")}
            placeholderTextColor={Colors.textTertiary}
            value={tx}
            onChangeText={setTx}
            multiline
            maxLength={500}
            testID="chat-input"
          />
          <TouchableOpacity style={[s.sb, !tx.trim() && s.sbd]} onPress={send} disabled={!tx.trim()} testID="send-button">
            <Send size={20} color={tx.trim() ? "#FFF" : Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.background },
  cen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  err: { fontSize: 16, color: Colors.textSecondary },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerVideo: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.04)" },
  lockOverlay: { position: "absolute", bottom: 4, right: 4 },
  ha: { width: 32, height: 32, borderRadius: 16 },
  ml: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  mr: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end", gap: 8 },
  my: { justifyContent: "flex-end" },
  th: { justifyContent: "flex-start" },
  ma: { width: 28, height: 28, borderRadius: 14 },
  bb: { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mb2: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  tb: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bt2: { fontSize: 15, lineHeight: 21 },
  mbt: { color: "#FFF" },
  tbt: { color: Colors.text },
  tt: { fontSize: 11, marginTop: 4 },
  mtt: { color: "rgba(255,255,255,0.7)", textAlign: "right" as const },
  ttt: { color: Colors.textTertiary },
  ec: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 4 },
  ea: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  en: { fontSize: 20, fontWeight: "700" as const, color: Colors.text },
  ecl: { fontSize: 14, fontWeight: "600" as const, color: Colors.accent },
  eh: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: "center" },
  ir: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: "#FFF", gap: 8 },
  videoBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  ip: { flex: 1, backgroundColor: Colors.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, color: Colors.text },
  sb: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  sbd: { backgroundColor: Colors.borderLight },
});
