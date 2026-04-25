import React, { useState, useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { MapPin, BadgeCheck, X, Heart, Zap, SlidersHorizontal, MessageSquare } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { profiles as allProfiles, Profile } from "@/mocks/profiles";
import HmongMatchHeader from "@/components/HmongMatchHeader";
import { useLikes, DAILY_LIMIT } from "@/providers/LikesProvider";

const W = Dimensions.get("window");
const SW = W.width; const SH = W.height; const TH = SW * 0.25;

function Card({ profile, isFirst, onSwipeLeft, onSwipeRight, onSuperLike, height }: { profile: Profile; isFirst: boolean; onSwipeLeft: () => void; onSwipeRight: () => void; onSuperLike: () => void; height: number }) {
  const pos = useRef(new Animated.ValueXY()).current;
  const rot = pos.x.interpolate({ inputRange: [-SW / 2, 0, SW / 2], outputRange: ["-8deg", "0deg", "8deg"], extrapolate: "clamp" });
  const likeOp = pos.x.interpolate({ inputRange: [0, SW / 4], outputRange: [0, 1], extrapolate: "clamp" });
  const nopeOp = pos.x.interpolate({ inputRange: [-SW / 4, 0], outputRange: [1, 0], extrapolate: "clamp" });
  const reset = useCallback(() => { Animated.spring(pos, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: true }).start(); }, [pos]);
  const swipe = useCallback((d: "left" | "right") => {
    const tx = d === "right" ? SW + 100 : -SW - 100;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.timing(pos, { toValue: { x: tx, y: 0 }, duration: 250, useNativeDriver: true }).start(() => { d === "right" ? onSwipeRight() : onSwipeLeft(); });
  }, [pos, onSwipeLeft, onSwipeRight]);
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => isFirst,
    onMoveShouldSetPanResponder: (_, g) => isFirst && (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5),
    onPanResponderMove: (_, g) => { pos.setValue({ x: g.dx, y: g.dy * 0.4 }); },
    onPanResponderRelease: (_, g) => { g.dx > TH ? swipe("right") : g.dx < -TH ? swipe("left") : reset(); },
  }), [isFirst, pos, swipe, reset]);
  const cs = isFirst ? { transform: [...pos.getTranslateTransform(), { rotate: rot }], zIndex: 2 as number } : { transform: [{ scale: 0.95 }], zIndex: 1 as number, top: 10 };
  return (
    <Animated.View style={[st.card, { height }, cs]} {...(isFirst ? pan.panHandlers : {})}>
      <Image source={{ uri: profile.photos[0] }} style={st.img} contentFit="cover" transition={300} />
      <View style={st.ov} />
      <View style={st.inf}>
        <View style={st.nr}><Text style={st.cn}>{profile.name}</Text><Text style={st.ca}>{profile.age}</Text>{profile.verified && <BadgeCheck size={20} color="#4A90D9" fill="#4A90D9" />}</View>
        <Text style={st.cl}>{profile.clan} Clan</Text>
        <View style={st.lr}><MapPin size={13} color="rgba(255,255,255,0.75)" /><Text style={st.lt}>{profile.location} · {profile.distance}</Text></View>
      </View>
      {isFirst && <><Animated.View style={[st.sp, st.ls, { opacity: likeOp }]}><Text style={st.lst}>LIKE</Text></Animated.View><Animated.View style={[st.sp, st.ns, { opacity: nopeOp }]}><Text style={st.nst}>NOPE</Text></Animated.View></>}
    </Animated.View>
  );
}

function ActionBtn({ onPress, color, children, testID }: { onPress: () => void; color: string; children: React.ReactNode; testID?: string }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[st.ab, { borderColor: color }]} testID={testID}>
      {children}
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { consume, canLike, remaining, premium, used } = useLikes();
  const [idx, setIdx] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [limitOpen, setLimitOpen] = useState<boolean>(false);
  const onL = useCallback(() => { setIdx(p => p + 1); }, []);
  const onR = useCallback(() => {
    const ok = consume();
    if (!ok) { setLimitOpen(true); return; }
    setIdx(p => p + 1);
  }, [consume]);
  const onS = useCallback(() => {
    const ok = consume();
    if (!ok) { setLimitOpen(true); return; }
    setIdx(p => p + 1);
  }, [consume]);
  const rem = allProfiles.slice(idx);
  const emp = rem.length === 0;
  const cardHeight = SH - ins.top - ins.bottom - 220;

  return (
    <View style={[st.ct, { paddingTop: ins.top }]}>
      <HmongMatchHeader right={
        <>
          <View style={st.iconBtn}><MessageSquare size={22} color={Colors.dark.text} /><View style={st.redDot} /></View>
          <SlidersHorizontal size={22} color={Colors.dark.text} />
          <Zap size={22} color={Colors.accent} fill={Colors.accent} />
        </>
      } />
      <View style={st.likesCounter} testID="likes-counter">
        <Heart size={13} color={Colors.crimsonLight} fill={Colors.crimsonLight} />
        <Text style={st.likesCounterText}>{premium ? "Unlimited likes" : `${Math.max(0, DAILY_LIMIT - used)}/${DAILY_LIMIT} likes left today`}</Text>
      </View>
      <View style={st.cc}>
        {emp ? (
          <View style={st.es}>
            <Heart size={48} color={Colors.dark.textFaint} />
            <Text style={st.et}>No more profiles</Text>
            <Text style={st.esu}>Check back later for more Hmong singles.</Text>
            <TouchableOpacity style={st.rb} onPress={() => setIdx(0)} testID="reset-button"><Text style={st.rt}>Start Over</Text></TouchableOpacity>
          </View>
        ) : (
          rem.slice(0, 2).reverse().map((p, i) => (
            <Card key={p.id} profile={p} isFirst={i === rem.slice(0, 2).length - 1} onSwipeLeft={onL} onSwipeRight={onR} onSuperLike={onS} height={cardHeight} />
          ))
        )}

        {showTutorial && !emp && (
          <View style={st.tut} pointerEvents="box-none">
            <View style={st.tutInner} pointerEvents="auto">
              <Text style={st.wave}>👋</Text>
              <Text style={st.tutH}>Let&apos;s get you ready!</Text>
              <Text style={st.tutS}>Here&apos;s everything you need to know.</Text>
              <TouchableOpacity style={st.tutBtn} onPress={() => setShowTutorial(false)} testID="start-tutorial">
                <Text style={st.tutBtnT}>START TUTORIAL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowTutorial(false)} testID="skip-tutorial">
                <Text style={st.skip}>SKIP</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={st.actions}>
          <ActionBtn color={Colors.nope} onPress={() => onL()} testID="nope-button"><X size={30} color={Colors.nope} strokeWidth={3} /></ActionBtn>
          <ActionBtn color={Colors.like} onPress={() => onR()} testID="like-button"><Heart size={30} color={Colors.like} strokeWidth={3} /></ActionBtn>
        </View>

        {limitOpen && (
          <View style={st.limitOv} pointerEvents="auto">
            <View style={st.limitCard}>
              <View style={st.limitIcon}><Heart size={32} color="#FFF" fill="#FFF" /></View>
              <Text style={st.limitTitle}>You&apos;re out of likes</Text>
              <Text style={st.limitSub}>You can like up to {DAILY_LIMIT} people per day. Upgrade for unlimited likes and see who likes you.</Text>
              <TouchableOpacity style={st.limitCta} onPress={() => { setLimitOpen(false); router.push("/subscription"); }} testID="upgrade-from-limit">
                <Text style={st.limitCtaText}>Upgrade to Gold</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLimitOpen(false)} testID="close-limit">
                <Text style={st.limitLater}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "#000" },
  iconBtn: { position: "relative" },
  redDot: { position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  cc: { flex: 1, alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 16, paddingTop: 4 },
  card: { width: SW - 32, borderRadius: 20, position: "absolute", overflow: "hidden", backgroundColor: "#111", top: 4 },
  img: { width: "100%", height: "100%" },
  ov: { position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", backgroundColor: "rgba(0,0,0,0.45)" },
  inf: { position: "absolute", bottom: 20, left: 20, right: 20 },
  nr: { flexDirection: "row", alignItems: "center", gap: 8 },
  cn: { fontSize: 28, fontWeight: "700" as const, color: "#FFF" },
  ca: { fontSize: 24, fontWeight: "400" as const, color: "rgba(255,255,255,0.9)" },
  cl: { fontSize: 15, fontWeight: "600" as const, color: Colors.accentLight, marginTop: 2 },
  lr: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  lt: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  sp: { position: "absolute", top: 50, padding: 10, borderWidth: 4, borderRadius: 8 },
  ls: { left: 20, borderColor: Colors.like, transform: [{ rotate: "-15deg" }] },
  ns: { right: 20, borderColor: Colors.nope, transform: [{ rotate: "15deg" }] },
  lst: { color: Colors.like, fontSize: 28, fontWeight: "800" as const },
  nst: { color: Colors.nope, fontSize: 28, fontWeight: "800" as const },
  tut: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 20, alignItems: "center", justifyContent: "center", margin: 16, marginBottom: 90 },
  tutInner: { alignItems: "center", paddingHorizontal: 32 },
  wave: { fontSize: 56, marginBottom: 16 },
  tutH: { fontSize: 32, fontWeight: "800" as const, color: "#FFF", textAlign: "center" },
  tutS: { fontSize: 15, color: "rgba(255,255,255,0.85)", marginTop: 8, marginBottom: 28, textAlign: "center" },
  tutBtn: { backgroundColor: "#FFF", borderRadius: 999, paddingVertical: 16, paddingHorizontal: 48, marginBottom: 18 },
  tutBtnT: { color: "#1a1a1f", fontSize: 14, fontWeight: "800" as const, letterSpacing: 1 },
  skip: { color: "#FFF", fontSize: 13, fontWeight: "700" as const, letterSpacing: 1 },
  actions: { position: "absolute", bottom: 12, left: 0, right: 0, flexDirection: "row", justifyContent: "space-evenly", alignItems: "center", paddingHorizontal: 16 },
  ab: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  es: { alignItems: "center", justifyContent: "center", flex: 1, gap: 8 },
  et: { fontSize: 20, fontWeight: "700" as const, color: Colors.dark.text, marginTop: 12 },
  esu: { fontSize: 14, color: Colors.dark.textDim, textAlign: "center", paddingHorizontal: 40 },
  rb: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  rt: { color: "#FFF", fontWeight: "700" as const },
  likesCounter: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", backgroundColor: "rgba(192,21,47,0.15)", borderWidth: 1, borderColor: "rgba(192,21,47,0.35)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginBottom: 6 },
  likesCounterText: { color: Colors.crimsonLight, fontSize: 12, fontWeight: "700" as const },
  limitOv: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  limitCard: { backgroundColor: "#161324", borderRadius: 22, padding: 26, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "rgba(212,168,67,0.25)" },
  limitIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  limitTitle: { color: "#FFF", fontSize: 22, fontWeight: "800" as const, textAlign: "center" as const },
  limitSub: { color: "rgba(255,255,255,0.7)", fontSize: 14, textAlign: "center" as const, marginTop: 8, lineHeight: 20 },
  limitCta: { backgroundColor: Colors.accent, paddingVertical: 14, paddingHorizontal: 36, borderRadius: 999, marginTop: 20 },
  limitCtaText: { color: "#1a1404", fontSize: 15, fontWeight: "800" as const },
  limitLater: { color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "600" as const, marginTop: 14 },
});
