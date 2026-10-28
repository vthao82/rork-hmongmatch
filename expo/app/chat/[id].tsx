import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { PhotoViewer } from "@/components/PhotoViewer";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Send, Video, MoreVertical, ImagePlus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { profiles as mockProfiles } from "@/mocks/profiles";
import { useAllProfiles } from "@/lib/discoverProfiles";
import { useChatMessages, sendChatMessage, sendChatPhoto, markMessageRead, formatRelative, setMessageReaction, REACTIONS, type ChatMessage } from "@/lib/chat";
import { setActiveChat } from "@/lib/notifications";
import { Modal, Pressable } from "react-native";
import { auth } from "@/lib/firebase";
import { blockUser } from "@/providers/BlockProvider";
import { useActiveLabel } from "@/lib/presence";
import { useTypingPinger, useOtherTyping, markChatSeen, useOtherSeenAt } from "@/lib/typing";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { unmatchUser, useMyMatches } from "@/lib/discoverProfiles";
import { useTier } from "@/providers/TierProvider";
import { useT } from "@/providers/LanguageProvider";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const ins = useSafeAreaInsets();
  const t = useT();
  const { consumeMessage } = useTier();
  const { byId: liveById } = useAllProfiles();
  const me = auth.currentUser;
  // Prefer live Firestore profile; fall back to mocks during loading or for legacy IDs
  const pr = (id ? liveById[id] : null) ?? mockProfiles.find(x => x.id === id);
  const { messages, matchId } = useChatMessages(id);
  const activeText = useActiveLabel(id);
  const otherTyping = useOtherTyping(matchId, id);
  const pingTyping = useTypingPinger(matchId, me?.uid);
  const { matchIds } = useMyMatches();
  const { data: onb } = useOnboarding();
  const receiptsOn = onb.showReadReceipts !== false;
  const otherSeenAt = useOtherSeenAt(matchId, id, receiptsOn);
  const [tx, setTx] = useState<string>("");
  const [sendingPhoto, setSendingPhoto] = useState<boolean>(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [reactFor, setReactFor] = useState<ChatMessage | null>(null);

  // Skip push banners for this chat while it's open
  useEffect(() => {
    setActiveChat(id ?? null);
    return () => setActiveChat(null);
  }, [id]);

  const react = (emoji: string) => {
    if (!reactFor || !id) return;
    const mineNow = reactFor.reactions[myUidRef.current] === emoji;
    void setMessageReaction(id, reactFor.id, mineNow ? null : emoji);
    Haptics.selectionAsync().catch(() => {});
    setReactFor(null);
  };
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

  // Share "Seen" with the sender whenever new messages arrive while the chat is open
  useEffect(() => {
    if (receiptsOn && messages.length > 0) markChatSeen(matchId, me?.uid);
  }, [messages.length, matchId, me?.uid, receiptsOn]);

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => lr.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const myUid = me?.uid ?? "";
  const myUidRef = useRef<string>(myUid);
  myUidRef.current = myUid;
  const openProfile = () => { if (id) router.push(`/user/${id}`); };

  const lastMine = [...messages].reverse().find((m) => m.senderId === myUid);
  const seenLast = !!lastMine && !!otherSeenAt && !!lastMine.createdAt && otherSeenAt >= lastMine.createdAt;
  const seenAgo = otherSeenAt ? Date.now() - otherSeenAt : 0;
  const seenLabel = seenAgo < 60_000 ? "Seen just now" : seenAgo < 24 * 3600_000 ? `Seen ${formatRelative(otherSeenAt)} ago` : "Seen";

  const renderMsg = ({ item }: { item: ChatMessage }) => {
    const mine = item.senderId === myUid;
    const showSeen = mine && seenLast && item.id === lastMine?.id;
    return (
      <View style={[s.mr, mine ? s.my : s.th]}>
        {!mine && pr && (
          <TouchableOpacity onPress={openProfile} testID={`msg-avatar-${item.id}`}>
            <Image source={{ uri: pr.photos[0] }} style={s.ma} contentFit="cover" />
          </TouchableOpacity>
        )}
        <Pressable
          onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setReactFor(item); }}
          delayLongPress={300}
          style={[s.bb, mine ? s.mb2 : s.tb, item.image && s.imgBubble]}
          testID={`msg-bubble-${item.id}`}
        >
          {item.image ? (
            <TouchableOpacity onPress={() => setViewerUrl(item.image!.url)} activeOpacity={0.85} testID={`msg-photo-${item.id}`}>
              <Image
                source={{ uri: item.image.url }}
                style={[s.msgImg, { aspectRatio: Math.min(1.6, Math.max(0.6, item.image.width / item.image.height)) }]}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          ) : (
            <Text style={[s.bt2, mine ? s.mbt : s.tbt]}>{item.text}</Text>
          )}
          <Text style={[s.tt, mine ? s.mtt : s.ttt]}>{formatRelative(item.createdAt)}</Text>
          {Object.keys(item.reactions).length > 0 && (
            <View style={[s.rxPill, mine ? s.rxMine : s.rxTheirs]} testID={`msg-reactions-${item.id}`}>
              <Text style={s.rxTxt}>
                {Array.from(new Set(Object.values(item.reactions))).join(" ")}
                {Object.keys(item.reactions).length > 1 ? ` ${Object.keys(item.reactions).length}` : ""}
              </Text>
            </View>
          )}
        </Pressable>
        {showSeen && <Text style={s.seen} testID="msg-seen">{seenLabel}</Text>}
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
    pingTyping(true);
    const res = await sendChatMessage(id, trimmed);
    if (!res.ok) {
      Alert.alert("Couldn't send", res.error ?? "Please try again.");
      setTx(trimmed); // restore so user doesn't lose draft
    }
  };

  const pickAndSend = async (source: "camera" | "library") => {
    if (!id || sendingPhoto) return;
    try {
      const perm = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", source === "camera" ? "Allow camera access to take a photo." : "Allow photo access to share a picture.");
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7, allowsEditing: false };
      const res = source === "camera" ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets?.[0]) return;
      if (!consumeMessage()) return;
      const a = res.assets[0];
      setSendingPhoto(true);
      const out = await sendChatPhoto(id, { uri: a.uri, width: a.width, height: a.height });
      if (!out.ok) Alert.alert("Couldn't send photo", "Please check your connection and try again.");
    } catch (e) {
      console.log("[chat] photo error", e);
      Alert.alert("Couldn't send photo", "Please try again.");
    } finally {
      setSendingPhoto(false);
    }
  };

  const onAttach = () => {
    Alert.alert("Send a photo", undefined, [
      { text: "Take photo", onPress: () => { void pickAndSend("camera"); } },
      { text: "Choose from library", onPress: () => { void pickAndSend("library"); } },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const onVideo = () => {
    Alert.alert(
      "Video messages",
      "Coming soon! You'll be able to record and send video messages to your matches.",
      [{ text: "OK", style: "default" }]
    );
  };

  const openSafetyMenu = () => {
    if (!pr) return;
    Alert.alert(
      pr.name,
      "What would you like to do?",
      [
        {
          text: "Report this user",
          style: "destructive",
          onPress: () =>
            router.push({
              pathname: "/report",
              params: { userId: pr.id, userName: pr.name },
            }),
        },
        ...(id && matchIds.includes(id)
          ? [{
              text: "Unmatch",
              style: "destructive" as const,
              onPress: () =>
                Alert.alert(`Unmatch ${pr.name}?`, "Your chat will disappear for both of you. If you match again later, your messages come back.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Unmatch",
                    style: "destructive",
                    onPress: async () => {
                      if (!(await unmatchUser(pr.id))) { Alert.alert("Couldn't unmatch", "Please try again."); return; }
                      router.back();
                    },
                  },
                ]),
            }]
          : []),
        {
          text: "Block this user",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              `Block ${pr.name}?`,
              "You won't see them again and they won't see you.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Block",
                  style: "destructive",
                  onPress: async () => {
                    if (!me) return;
                    const ok = await blockUser(me.uid, pr);
                    if (!ok) { Alert.alert("Couldn't block", "Please try again."); return; }
                    Alert.alert("Blocked", `${pr.name} has been blocked. You can unblock them in Settings.`);
                    router.back();
                  },
                },
              ]
            ),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{
        title: pr.name,
        headerTitle: () => (
          <TouchableOpacity onPress={openProfile} testID="header-name">
            <Text style={s.htitle} numberOfLines={1}>{pr.name}</Text>
            {otherTyping ? (
              <Text style={[s.hsub, { color: Colors.primary }]} testID="chat-typing-status">typing…</Text>
            ) : activeText ? (
              <Text style={[s.hsub, activeText === "Active now" && { color: Colors.online }]} testID="chat-active-status">{activeText}</Text>
            ) : null}
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={s.headerRight}>
            <TouchableOpacity onPress={onVideo} style={s.headerVideo} testID="header-video">
              <Video size={20} color={Colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openSafetyMenu} style={s.headerVideo} testID="header-safety">
              <MoreVertical size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openProfile} testID="header-avatar" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Image source={{ uri: pr.photos[0] }} style={s.ha} contentFit="cover" />
            </TouchableOpacity>
          </View>
        )
      }} />
      <KeyboardAvoidingView style={s.ct} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        {messages.length === 0 ? (
          <View style={s.ec}>
            <TouchableOpacity onPress={openProfile} testID="empty-avatar" style={{ alignItems: "center" }}>
              <Image source={{ uri: pr.photos[0] }} style={s.ea} contentFit="cover" />
              <Text style={s.en}>{pr.name}</Text>
            </TouchableOpacity>
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
          <TouchableOpacity style={s.videoBtn} onPress={onAttach} disabled={sendingPhoto} testID="attach-photo-btn">
            {sendingPhoto ? <ActivityIndicator size="small" color={Colors.accent} /> : <ImagePlus size={20} color={Colors.accent} />}
          </TouchableOpacity>
          <TextInput
            style={s.ip}
            placeholder={t("typeMessage")}
            placeholderTextColor={Colors.textTertiary}
            value={tx}
            onChangeText={(v) => { setTx(v); pingTyping(v.length === 0); }}
            onBlur={() => pingTyping(true)}
            multiline
            maxLength={500}
            testID="chat-input"
          />
          <TouchableOpacity style={[s.sb, !tx.trim() && s.sbd]} onPress={send} disabled={!tx.trim()} testID="send-button">
            <Send size={20} color={tx.trim() ? "#FFF" : Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Modal visible={!!reactFor} transparent animationType="fade" onRequestClose={() => setReactFor(null)}>
        <Pressable style={s.rxBackdrop} onPress={() => setReactFor(null)} testID="reaction-backdrop">
          <View style={s.rxBar}>
            {REACTIONS.map((e) => {
              const picked = reactFor?.reactions[myUid] === e;
              return (
                <TouchableOpacity key={e} onPress={() => react(e)} style={[s.rxBtn, picked && s.rxPicked]} testID={`reaction-${REACTIONS.indexOf(e)}`}>
                  <Text style={s.rxEmoji}>{e}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={s.rxHint}>Tap your reaction again to remove it</Text>
        </Pressable>
      </Modal>
      <PhotoViewer photos={viewerUrl ? [viewerUrl] : []} startIndex={0} visible={!!viewerUrl} onClose={() => setViewerUrl(null)} />
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
  htitle: { fontSize: 17, fontWeight: "700" as const, color: Colors.text },
  hsub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  ml: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  mr: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end", gap: 8 },
  seen: { width: "100%", textAlign: "right" as const, fontSize: 11, color: Colors.textTertiary, marginTop: -4 },
  my: { justifyContent: "flex-end" },
  th: { justifyContent: "flex-start" },
  ma: { width: 28, height: 28, borderRadius: 14 },
  bb: { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mb2: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  tb: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bt2: { fontSize: 15, lineHeight: 21 },
  rxPill: { position: "absolute", bottom: -12, backgroundColor: Colors.surface, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.borderLight },
  rxMine: { left: -6 },
  rxTheirs: { right: -6 },
  rxTxt: { fontSize: 13, color: Colors.text },
  rxBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  rxBar: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6, gap: 4 },
  rxBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  rxPicked: { backgroundColor: Colors.surfaceAlt },
  rxEmoji: { fontSize: 28 },
  rxHint: { color: "#FFF", fontSize: 12, marginTop: 10 },
  imgBubble: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 6 },
  msgImg: { width: 220, borderRadius: 14, backgroundColor: Colors.surfaceAlt },
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
