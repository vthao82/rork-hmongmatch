import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, PanResponder, Animated, Modal, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { MapPin, BadgeCheck, X, Heart, RotateCcw, MessageCircle, Zap, Crown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { profiles as allProfiles, Profile } from "@/mocks/profiles";
import HmongMatchHeader from "@/components/HmongMatchHeader";
import RedBackground from "@/components/RedBackground";
import { useTier } from "@/providers/TierProvider";
import { useLikes } from "@/providers/LikesProvider";

const W = Dimensions.get("window");

function PhotoCarousel({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState<number>(0);
  return (
    <View style={st.carouselWrap}>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W.width))}
        keyExtractor={(_, i) => `p-${i}`}
        renderItem={({ item }) => <Image source={{ uri: item }} style={st.photo} contentFit="cover" transition={200} />}
      />
      {photos.length > 1 && (
        <View style={st.dots} pointerEvents="none">
          {photos.map((_, i) => (
            <View key={i} style={[st.dot, i === idx && st.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

function ProfileCard({ profile, height, translateY }: { profile: Profile; height: number; translateY: Animated.Value }) {
  const verified = profile.verified;
  return (
    <Animated.View style={[st.card, { height, transform: [{ translateY }] }]} pointerEvents="box-none">
      <PhotoCarousel photos={profile.photos} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} locations={[0.45, 1]} style={st.shade} pointerEvents="none" />
      <View style={st.info} pointerEvents="none">
        <View style={st.nameRow}>
          <Text style={st.name}>{profile.name}</Text>
          <View style={[st.badge, { backgroundColor: verified ? "#2a8ae0" : "#e89216" }]}>
            <BadgeCheck size={12} color="#FFF" fill="#FFF" />
            <Text style={st.badgeTxt}>{verified ? "Photo Verified" : "Not Verified"}</Text>
          </View>
        </View>
        <Text style={st.meta}>{profile.age} · <MapPin size={11} color="rgba(255,255,255,0.85)" /> {profile.location}</Text>
        <Text style={st.clan}>{profile.clan} Clan</Text>
      </View>
    </Animated.View>
  );
}

export default function BrowseScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { isPaid, remaining, consumeLike, consumeDislike, consumeSwipe, consumeRewind, startBoost, stopBoost, boostActive, showLimitModal, setShowLimitModal, show75Modal, setShow75Modal, usage } = useTier();
  const { likedIds, consume: addLike } = useLikes();
  const [idx, setIdx] = useState<number>(0);
  const [history, setHistory] = useState<{ id: string; liked: boolean }[]>([]);
  const cardHeight = W.height - ins.top - ins.bottom - 130;
  const translateY = useRef(new Animated.Value(0)).current;

  // Filter out already-seen users to avoid showing same person again
  const queue = useMemo(() => {
    const seen = new Set(usage.seenIds ?? []);
    return allProfiles.filter(p => !seen.has(p.id));
  }, [usage.seenIds]);

  useEffect(() => {
    if (idx >= queue.length && queue.length > 0) setIdx(0);
  }, [queue.length, idx]);

  const current = queue[idx];

  const swipeNext = useCallback(() => {
    if (!current) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const ok = consumeSwipe(current.id);
    if (!ok) return;
    setHistory(h => [...h, { id: current.id, liked: false }]);
    setIdx(i => i + 1);
  }, [current, consumeSwipe]);

  const onLike = useCallback(() => {
    if (!current) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const ok = consumeLike(current.id);
    if (!ok) return;
    addLike(current.id);
    setHistory(h => [...h, { id: current.id, liked: true }]);
    setIdx(i => i + 1);
  }, [current, consumeLike, addLike]);

  const onDislike = useCallback(() => {
    if (!current) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    consumeDislike();
    const ok = consumeSwipe(current.id);
    if (!ok) return;
    setHistory(h => [...h, { id: current.id, liked: false }]);
    setIdx(i => i + 1);
  }, [current, consumeDislike, consumeSwipe]);

  const onMessage = useCallback(() => {
    if (!current) return;
    router.push(`/chat/${current.id}`);
  }, [current, router]);

  const onRewind = useCallback(() => {
    if (history.length === 0 || idx === 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const ok = consumeRewind();
    if (!ok) return;
    setHistory(h => h.slice(0, -1));
    setIdx(i => Math.max(0, i - 1));
  }, [history, idx, consumeRewind]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => {
      translateY.setValue(g.dy * 0.4);
    },
    onPanResponderRelease: (_, g) => {
      const THRESH = 90;
      if (g.dy < -THRESH) {
        Animated.timing(translateY, { toValue: -cardHeight, duration: 180, useNativeDriver: true }).start(() => {
          translateY.setValue(0);
          swipeNext();
        });
      } else if (g.dy > THRESH) {
        Animated.timing(translateY, { toValue: cardHeight, duration: 180, useNativeDriver: true }).start(() => {
          translateY.setValue(0);
          onRewind();
        });
      } else {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  }), [translateY, cardHeight, swipeNext, onRewind]);

  const toggleBoost = useCallback(() => {
    if (boostActive) stopBoost();
    else {
      const ok = startBoost();
      if (!ok) setShowLimitModal(true);
    }
  }, [boostActive, startBoost, stopBoost, setShowLimitModal]);

  return (
    <View style={[st.ct, { paddingTop: ins.top }]}>
      <RedBackground />
      <HmongMatchHeader right={
        <TouchableOpacity onPress={toggleBoost} style={[st.boost, boostActive && st.boostActive]} testID="boost-toggle">
          <Zap size={14} color={boostActive ? "#1a1404" : Colors.accent} fill={boostActive ? "#1a1404" : "transparent"} />
          <Text style={[st.boostTxt, boostActive && { color: "#1a1404" }]}>{boostActive ? "Boost ON" : "Boost"}</Text>
        </TouchableOpacity>
      } />

      <View style={st.statRow}>
        <Text style={st.statTxt}>{isPaid ? `Unlimited · ${usage.dislikes} passes today` : `${remaining.likes} likes · ${usage.dislikes} passes · ${remaining.swipes} swipes · ${remaining.rewinds} rewinds`}</Text>
      </View>

      <View style={st.cardArea}>
        {!current ? (
          <View style={st.empty}>
            <Heart size={48} color={Colors.dark.textFaint} />
            <Text style={st.emptyTitle}>You&apos;ve seen everyone for now</Text>
            <Text style={st.emptySub}>Check back later for new Hmong singles.</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View {...panResponder.panHandlers} style={{ height: cardHeight }}>
              <ProfileCard profile={current} height={cardHeight} translateY={translateY} />
              <View style={st.swipeHint} pointerEvents="none">
                <Text style={st.swipeHintTxt}>Swipe up for next · Swipe down to rewind</Text>
              </View>
            </View>
            <View style={st.actions}>
              <TouchableOpacity onPress={onDislike} style={[st.actBtn, { borderColor: Colors.nope }]} testID={`dislike-${current.id}`} activeOpacity={0.75} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={26} color={Colors.nope} strokeWidth={3} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onMessage} style={[st.actBtn, { borderColor: "#2a8ae0" }]} testID={`msg-${current.id}`} activeOpacity={0.75} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MessageCircle size={24} color="#2a8ae0" strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onLike} style={[st.actBtn, { borderColor: Colors.like }]} testID={`like-${current.id}`} activeOpacity={0.75} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Heart size={26} color={Colors.like} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity onPress={onRewind} disabled={history.length === 0 || idx === 0} style={[st.rewindBtn, (history.length === 0 || idx === 0) && { opacity: 0.4 }]} testID="rewind-button">
          <RotateCcw size={18} color={Colors.accent} />
          <Text style={st.rewindTxt}>{isPaid ? "Rewind" : `Rewind (${remaining.rewinds})`}</Text>
        </TouchableOpacity>
      </View>

      {/* Limit reached modal */}
      <Modal visible={showLimitModal} transparent animationType="fade" onRequestClose={() => setShowLimitModal(false)}>
        <View style={st.modal}>
          <View style={st.modalCard}>
            <Crown size={32} color={Colors.accent} />
            <Text style={st.modalTitle}>You&apos;ve hit your daily usage</Text>
            <Text style={st.modalSub}>Upgrade to Plus or Gold to keep matching with unlimited likes, swipes, rewinds and chats.</Text>
            <TouchableOpacity style={st.cta} onPress={() => { setShowLimitModal(false); router.push("/subscription"); }} testID="upgrade-cta">
              <Text style={st.ctaTxt}>Upgrade now</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLimitModal(false)}><Text style={st.later}>Maybe later</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 75% warning */}
      <Modal visible={show75Modal} transparent animationType="fade" onRequestClose={() => setShow75Modal(false)}>
        <View style={st.modal}>
          <View style={st.modalCard}>
            <Zap size={32} color={Colors.accent} />
            <Text style={st.modalTitle}>You&apos;re running low</Text>
            <Text style={st.modalSub}>You&apos;ve used 75% of your daily allowance. Upgrade for unlimited matching.</Text>
            <TouchableOpacity style={st.cta} onPress={() => { setShow75Modal(false); router.push("/subscription"); }}>
              <Text style={st.ctaTxt}>See plans</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShow75Modal(false)}><Text style={st.later}>Keep browsing</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "transparent" },
  boost: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Colors.accent },
  boostActive: { backgroundColor: Colors.accent },
  boostTxt: { color: Colors.accent, fontWeight: "700" as const, fontSize: 12 },
  statRow: { paddingHorizontal: 16, paddingBottom: 6 },
  statTxt: { color: "rgba(255,255,255,0.6)", fontSize: 11, textAlign: "center" as const },
  cardArea: { flex: 1, paddingHorizontal: 12, paddingTop: 4 },
  card: { borderRadius: 22, overflow: "hidden", backgroundColor: "#111", borderWidth: 1, borderColor: "rgba(212,168,67,0.18)" },
  carouselWrap: { flex: 1 },
  photo: { width: W.width - 24, height: "100%" },
  shade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" },
  dots: { position: "absolute", top: 12, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 4 },
  dot: { width: 24, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" },
  dotActive: { backgroundColor: "#FFF" },
  info: { position: "absolute", left: 18, right: 18, bottom: 24 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" as const },
  name: { color: "#FFF", fontSize: 30, fontWeight: "700" as const },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeTxt: { color: "#FFF", fontSize: 10, fontWeight: "700" as const, letterSpacing: 0.4 },
  meta: { color: "rgba(255,255,255,0.92)", fontSize: 14, marginTop: 4 },
  clan: { color: Colors.accentLight, fontSize: 14, fontWeight: "600" as const, marginTop: 4 },
  actions: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 22, paddingTop: 14 },
  actBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(0,0,0,0.65)", borderWidth: 2, justifyContent: "center", alignItems: "center" },
  rewindBtn: { position: "absolute", top: 12, right: 16, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: Colors.accent, backgroundColor: "rgba(0,0,0,0.4)" },
  swipeHint: { position: "absolute", top: 48, left: 0, right: 0, alignItems: "center" },
  swipeHintTxt: { color: "rgba(255,255,255,0.55)", fontSize: 11, backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  rewindTxt: { color: Colors.accent, fontSize: 12, fontWeight: "700" as const },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" as const, marginTop: 10 },
  emptySub: { color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center" as const, paddingHorizontal: 40 },
  modal: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 28 },
  modalCard: { backgroundColor: "#16060c", borderRadius: 22, padding: 26, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "rgba(212,168,67,0.3)" },
  modalTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" as const, marginTop: 12, textAlign: "center" as const },
  modalSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center" as const, marginTop: 8, lineHeight: 19 },
  cta: { backgroundColor: Colors.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999, marginTop: 18 },
  ctaTxt: { color: "#1a1404", fontSize: 14, fontWeight: "700" as const },
  later: { color: "rgba(255,255,255,0.5)", marginTop: 14, fontSize: 13 },
});
