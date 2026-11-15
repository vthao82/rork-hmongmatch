import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Share2, Gift } from "lucide-react-native";
import Colors from "@/constants/colors";
import { shareInvite, useMyReferral, FRIENDS_PER_REWARD } from "@/lib/invite";

const LOGO = require("@/assets/images/hmongdate-logo.png");

export default function InviteCard() {
  const { code, count, rewardUntil } = useMyReferral();
  const progress = count % FRIENDS_PER_REWARD;
  const active = rewardUntil > Date.now();
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => shareInvite(code)} testID="invite-card">
      <LinearGradient colors={[Colors.crimson, Colors.indigo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <View style={s.top}>
          <Image source={LOGO} style={s.logo} />
          <View style={s.body}>
            <Text style={s.title}>Join me on Hmong Date</Text>
            <Text style={s.sub}>Invite 3 friends, get 1 free week of Unlimited.</Text>
          </View>
          <View style={s.btn} testID="invite-share-btn">
            <Share2 size={16} color={Colors.indigo} />
            <Text style={s.btnText}>Share</Text>
          </View>
        </View>
        <View style={s.codeRow}>
          <Text style={s.codeLabel}>Your code</Text>
          <Text style={s.code} testID="invite-code">{code ?? "Creating…"}</Text>
        </View>
        <View style={s.dots}>
          {Array.from({ length: FRIENDS_PER_REWARD }).map((_, i) => (
            <View key={i} style={[s.dot, i < progress && s.dotOn]} />
          ))}
          <Text style={s.progress} testID="invite-progress">
            {progress}/{FRIENDS_PER_REWARD} friends joined{count >= FRIENDS_PER_REWARD ? ` · ${count} total` : ""}
          </Text>
        </View>
        {active ? (
          <View style={s.reward} testID="invite-reward-active">
            <Gift size={14} color={Colors.gold} />
            <Text style={s.rewardText}>Free Unlimited until {new Date(rewardUntil).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
          </View>
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "rgba(212,168,67,0.45)", marginTop: 16 },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 44, height: 44, borderRadius: 12 },
  body: { flex: 1 },
  title: { color: "#FFF", fontSize: 15, fontWeight: "800" as const },
  sub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  btnText: { color: Colors.indigo, fontWeight: "800" as const, fontSize: 13 },
  codeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.25)" },
  codeLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" as const },
  code: { color: Colors.goldLight, fontSize: 18, fontWeight: "800" as const, letterSpacing: 2 },
  dots: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.25)" },
  dotOn: { backgroundColor: Colors.gold },
  progress: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginLeft: 6 },
  reward: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  rewardText: { color: Colors.goldLight, fontSize: 12, fontWeight: "700" as const },
});
