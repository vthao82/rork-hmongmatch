import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gift } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { useMyReferral } from "@/lib/invite";

const PIECES = Array.from({ length: 22 }, (_, i) => ({ left: (i * 37) % 100, delay: (i * 90) % 900, color: ["#E8C27A", "#FFF", "#D9475A", "#F5D99A"][i % 4], size: 6 + (i % 4) * 2 }));

/** Pops up once each time invites earn a new free week of Unlimited. */
export default function RewardCelebration() {
  const { user } = useAuth();
  const { rewardUntil } = useMyReferral();
  const [open, setOpen] = useState<boolean>(false);
  const pop = useRef(new Animated.Value(0)).current;
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user || rewardUntil <= Date.now()) return;
    const key = `inviteRewardSeen:${user.uid}`;
    AsyncStorage.getItem(key).then((seen) => {
      if (Number(seen ?? 0) >= rewardUntil) return;
      void AsyncStorage.setItem(key, String(rewardUntil));
      setOpen(true);
    });
  }, [user?.uid, rewardUntil]);

  useEffect(() => {
    if (!open) return;
    pop.setValue(0);
    fall.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    Animated.loop(Animated.timing(fall, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true })).start();
  }, [open, pop, fall]);

  if (!open) return null;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={s.backdrop} testID="reward-celebration">
        {PIECES.map((p, i) => (
          <Animated.View
            key={i}
            style={[s.piece, { left: `${p.left}%`, width: p.size, height: p.size * 1.6, backgroundColor: p.color, transform: [
              { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-60 - p.delay / 3, 900] }) },
              { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${360 + i * 40}deg`] }) },
            ] }]}
          />
        ))}
        <Animated.View style={[s.card, { transform: [{ scale: pop }] }]}>
          <View style={s.icon}><Gift size={34} color={Colors.indigo} /></View>
          <Text style={s.title}>Congratulations!</Text>
          <Text style={s.body} testID="reward-celebration-text">You now have unlimited use for 7 days</Text>
          <Text style={s.small}>Thanks for inviting 3 friends to Hmong Date.</Text>
          <TouchableOpacity style={s.btn} onPress={() => setOpen(false)} testID="reward-celebration-close"><Text style={s.btnTxt}>Let's go</Text></TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(10,2,7,0.75)", alignItems: "center", justifyContent: "center", padding: 28, overflow: "hidden" },
  piece: { position: "absolute", top: 0, borderRadius: 2 },
  card: { width: "100%", maxWidth: 360, backgroundColor: "#2A0710", borderRadius: 26, padding: 26, alignItems: "center", borderWidth: 1, borderColor: "rgba(232,194,122,0.6)" },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.gold, alignItems: "center", justifyContent: "center" },
  title: { color: Colors.goldLight, fontSize: 24, fontWeight: "800" as const, marginTop: 16 },
  body: { color: "#FFF", fontSize: 18, fontWeight: "700" as const, textAlign: "center", marginTop: 8, lineHeight: 25 },
  small: { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center", marginTop: 8 },
  btn: { marginTop: 20, backgroundColor: Colors.gold, borderRadius: 999, paddingHorizontal: 34, paddingVertical: 13 },
  btnTxt: { color: Colors.indigo, fontWeight: "800" as const, fontSize: 16 },
});
