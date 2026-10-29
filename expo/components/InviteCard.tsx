import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Share2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { shareInvite } from "@/lib/invite";

const LOGO = require("@/assets/images/hmongdate-logo.png");

export default function InviteCard() {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={shareInvite} testID="invite-card">
      <LinearGradient colors={[Colors.crimson, Colors.indigo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <Image source={LOGO} style={s.logo} />
        <View style={s.body}>
          <Text style={s.title}>Join me on Hmong Date</Text>
          <Text style={s.sub}>Invite friends and help our community grow.</Text>
        </View>
        <View style={s.btn} testID="invite-share-btn">
          <Share2 size={16} color={Colors.indigo} />
          <Text style={s.btnText}>Share</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "rgba(212,168,67,0.45)", marginTop: 16 },
  logo: { width: 44, height: 44, borderRadius: 12 },
  body: { flex: 1 },
  title: { color: "#FFF", fontSize: 15, fontWeight: "800" as const },
  sub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  btnText: { color: Colors.indigo, fontWeight: "800" as const, fontSize: 13 },
});
