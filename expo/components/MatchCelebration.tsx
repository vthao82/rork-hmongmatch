import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import Colors from "@/constants/colors";
import { db } from "@/lib/firebase";
import { useMyMatches, type MatchInfo } from "@/lib/discoverProfiles";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useAuth } from "@/providers/AuthProvider";

type Shown = { match: MatchInfo; name: string; photo: string | null };

/** "It's a Match!" — shown once per match per member (tracked on the match doc in celebratedBy). */
export default function MatchCelebration() {
  const router = useRouter();
  const { user } = useAuth();
  const { data } = useOnboarding();
  const { matches } = useMyMatches();
  const [shown, setShown] = useState<Shown | null>(null);
  const busy = useRef<boolean>(false);
  const pop = useRef(new Animated.Value(0)).current;
  const uid = user?.uid;

  useEffect(() => {
    if (!uid || shown || busy.current) return;
    const pending = matches.find((m) => m.createdAt && !m.celebratedBy.includes(uid));
    if (!pending) return;
    busy.current = true;
    (async () => {
      // Mark first so it never shows twice, even if the app closes mid-animation
      await updateDoc(doc(db, "matches", pending.matchId), { celebratedBy: arrayUnion(uid) }).catch((e) => console.log("[celebrate] mark error", e));
      const snap = await getDoc(doc(db, "users", pending.otherId)).catch(() => null);
      const r = snap?.data();
      if (r) setShown({ match: pending, name: (r.name as string) ?? "Someone", photo: (r.photos as string[] | undefined)?.[0] ?? null });
      busy.current = false;
    })();
  }, [matches, uid, shown]);

  useEffect(() => {
    if (!shown) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }).start();
  }, [shown, pop]);

  const close = () => setShown(null);
  const myPhoto = data.photos?.[data.mainPhotoIndex ?? 0] ?? data.photos?.[0];
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const leftX = pop.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] });
  const rightX = pop.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });

  return (
    <Modal visible={!!shown} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={st.backdrop} testID="match-celebration">
        <Animated.Text style={[st.title, { opacity: pop, transform: [{ scale }] }]}>It's a Match!</Animated.Text>
        <Text style={st.sub}>You and {shown?.name} liked each other.</Text>
        <View style={st.photos}>
          <Animated.View style={[st.photoWrap, st.tiltLeft, { transform: [{ translateX: leftX }, { rotate: "-8deg" }] }]}>
            {myPhoto ? <Image source={{ uri: myPhoto }} style={st.photo} contentFit="cover" /> : <View style={st.photo} />}
          </Animated.View>
          <Animated.View style={[st.photoWrap, { transform: [{ translateX: rightX }, { rotate: "8deg" }] }]}>
            {shown?.photo ? <Image source={{ uri: shown.photo }} style={st.photo} contentFit="cover" /> : <View style={st.photo} />}
          </Animated.View>
          <Animated.View style={[st.heart, { opacity: pop, transform: [{ scale }] }]}>
            <Heart size={26} color="#FFF" fill="#FFF" />
          </Animated.View>
        </View>
        <TouchableOpacity
          style={st.cta}
          onPress={() => { const id = shown?.match.otherId; close(); if (id) router.push(`/chat/${id}`); }}
          testID="celebration-message-btn"
        >
          <Text style={st.ctaTxt}>Send a message</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={close} testID="celebration-keep-swiping" style={st.later}>
          <Text style={st.laterTxt}>Keep swiping</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(12,4,8,0.96)", alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  title: { color: Colors.gold, fontSize: 40, fontWeight: "800" as const, letterSpacing: -1, textAlign: "center" },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: 15, marginTop: 10, textAlign: "center" },
  photos: { flexDirection: "row", marginTop: 40, marginBottom: 44, alignItems: "center", justifyContent: "center" },
  photoWrap: { borderRadius: 20, borderWidth: 3, borderColor: Colors.gold, overflow: "hidden", backgroundColor: "#2a1a20" },
  tiltLeft: { marginRight: -18, zIndex: 1 },
  photo: { width: 140, height: 186, backgroundColor: "#2a1a20" },
  heart: { position: "absolute", bottom: -22, alignSelf: "center", width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.crimson, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#0c0408", zIndex: 2 },
  cta: { backgroundColor: Colors.gold, paddingVertical: 16, borderRadius: 999, width: "100%", alignItems: "center" },
  ctaTxt: { color: "#1a1404", fontSize: 16, fontWeight: "800" as const },
  later: { paddingVertical: 16 },
  laterTxt: { color: "rgba(255,255,255,0.75)", fontSize: 15, fontWeight: "600" as const },
});
