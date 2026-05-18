import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Shield, MessageSquare, Search } from "lucide-react-native";
import Colors from "@/constants/colors";
import HmongMatchHeader from "@/components/HmongMatchHeader";
import RedBackground from "@/components/RedBackground";

export default function ChatScreen() {
  const ins = useSafeAreaInsets();
  const [q, setQ] = useState<string>("");
  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <RedBackground />
      <HmongMatchHeader right={
        <>
          <Shield size={22} color={Colors.dark.text} />
          <View style={{ position: "relative" }}>
            <MessageSquare size={22} color={Colors.dark.text} />
            <View style={s.redDot} />
          </View>
        </>
      } />
      <View style={s.searchWrap}>
        <Search size={18} color="rgba(255,255,255,0.45)" />
        <TextInput
          style={s.search}
          value={q}
          onChangeText={setQ}
          placeholder="Search 0 Matches"
          placeholderTextColor="rgba(255,255,255,0.45)"
          testID="chat-search"
        />
      </View>
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
});
