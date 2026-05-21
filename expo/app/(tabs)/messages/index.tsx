import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { MessageSquarePlus, Search, X as XIcon } from "lucide-react-native";
import Colors from "@/constants/colors";
import HmongMatchHeader from "@/components/HmongMatchHeader";
import RedBackground from "@/components/RedBackground";
import { conversations, matches, Conversation } from "@/mocks/profiles";

export default function ChatTab() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState<string>("");
  const [newOpen, setNewOpen] = useState<boolean>(false);

  const filtered = useMemo<Conversation[]>(() => {
    if (!q.trim()) return conversations;
    const needle = q.trim().toLowerCase();
    return conversations.filter(c => c.profile.name.toLowerCase().includes(needle));
  }, [q]);

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <RedBackground />
      <HmongMatchHeader right={
        <TouchableOpacity onPress={() => setNewOpen(true)} testID="new-message-btn" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={{ position: "relative" }}>
            <MessageSquarePlus size={24} color={Colors.dark.text} />
            <View style={s.redDot} />
          </View>
        </TouchableOpacity>
      } />
      <View style={s.searchWrap}>
        <Search size={18} color="rgba(255,255,255,0.45)" />
        <TextInput
          style={s.search}
          value={q}
          onChangeText={setQ}
          placeholder={`Search ${conversations.length} Matches`}
          placeholderTextColor="rgba(255,255,255,0.45)"
          testID="chat-search"
        />
      </View>

      {filtered.length === 0 ? (
        <View style={s.empty}>
          <View style={s.cardsIcon}>
            <View style={s.cardBack} />
            <View style={s.cardFront}>
              <View style={s.likeStamp}>
                <Text style={s.likeText}>LIKE</Text>
              </View>
            </View>
          </View>
          <Text style={s.title}>Get Swiping</Text>
          <Text style={s.sub}>When you match with other users they&apos;ll appear here where you can send them a message</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.row} onPress={() => router.push(`/chat/${item.profile.id}`)} testID={`conv-${item.id}`} activeOpacity={0.75}>
              <View style={{ position: "relative" }}>
                <Image source={{ uri: item.profile.photos[0] }} style={s.avatar} contentFit="cover" />
                {item.profile.isOnline && <View style={s.onlineDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.rowTop}>
                  <Text style={s.name}>{item.profile.name}</Text>
                  <Text style={s.time}>{item.lastMessageTime}</Text>
                </View>
                <View style={s.rowBottom}>
                  <Text style={[s.preview, item.unreadCount > 0 && s.previewUnread]} numberOfLines={1}>{item.lastMessage}</Text>
                  {item.unreadCount > 0 && <View style={s.unread}><Text style={s.unreadTxt}>{item.unreadCount}</Text></View>}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={newOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNewOpen(false)}>
        <View style={s.modal}>
          <View style={s.modalHead}>
            <TouchableOpacity onPress={() => setNewOpen(false)} testID="close-new"><XIcon size={24} color="#FFF" /></TouchableOpacity>
            <Text style={s.modalTitle}>New Message</Text>
            <View style={{ width: 24 }} />
          </View>
          <Text style={s.modalSub}>Choose a match to start chatting</Text>
          <FlatList
            data={matches}
            keyExtractor={i => i.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.matchRow} onPress={() => { setNewOpen(false); router.push(`/chat/${item.profile.id}`); }} testID={`new-${item.id}`}>
                <Image source={{ uri: item.profile.photos[0] }} style={s.avatar} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.profile.name}, {item.profile.age}</Text>
                  <Text style={s.matchedAt}>Matched {item.matchedAt}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={s.noMatches}>You don&apos;t have any matches yet.</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "transparent" },
  redDot: { position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginTop: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.15)" },
  search: { flex: 1, color: "#FFF", fontSize: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  cardsIcon: { width: 140, height: 170, marginBottom: 24 },
  cardBack: { position: "absolute", left: 10, top: 14, width: 110, height: 148, borderRadius: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.18)" },
  cardFront: { position: "absolute", left: 26, top: 0, width: 110, height: 148, borderRadius: 14, borderWidth: 2, borderColor: Colors.like, backgroundColor: "rgba(47,192,113,0.1)", transform: [{ rotate: "6deg" }], alignItems: "center", justifyContent: "center" },
  likeStamp: { borderWidth: 2, borderColor: Colors.like, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(47,192,113,0.2)" },
  likeText: { color: Colors.like, fontSize: 16, fontWeight: "800" as const, letterSpacing: 1 },
  title: { color: "rgba(255,255,255,0.7)", fontSize: 22, fontWeight: "700" as const, marginBottom: 10 },
  sub: { color: "rgba(255,255,255,0.55)", fontSize: 15, textAlign: "center", lineHeight: 22 },
  row: { flexDirection: "row", gap: 12, paddingVertical: 12, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#222" },
  onlineDot: { position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.online, borderWidth: 2, borderColor: "#190614" },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowBottom: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  name: { color: "#FFF", fontSize: 16, fontWeight: "700" as const },
  time: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  preview: { flex: 1, color: "rgba(255,255,255,0.6)", fontSize: 13 },
  previewUnread: { color: "#FFF", fontWeight: "600" as const },
  unread: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  unreadTxt: { color: "#FFF", fontSize: 11, fontWeight: "800" as const },
  modal: { flex: 1, backgroundColor: "#0b0b0b" },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  modalTitle: { color: "#FFF", fontSize: 17, fontWeight: "700" as const },
  modalSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, paddingHorizontal: 16, paddingTop: 12 },
  matchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  matchedAt: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  noMatches: { color: "rgba(255,255,255,0.55)", fontSize: 14, textAlign: "center" as const, marginTop: 40 },
});
