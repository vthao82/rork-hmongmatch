import React, { useCallback, useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Modal, Platform, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { MapPin, BadgeCheck, X, Heart, RotateCcw, MessageCircle, Zap, Crown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { Profile } from "@/mocks/profiles";
import { useDiscoverProfiles, recordSwipe, deleteSwipe } from "@/lib/discoverProfiles";
import HmongMatchHeader from "@/components/HmongMatchHeader";
import RedBackground from "@/components/RedBackground";
import { useTier } from "@/providers/TierProvider";
import { useLikes } from "@/providers/LikesProvider";
import { useT } from "@/providers/LanguageProvider";

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

function ProfileCard({ profile, height }: { profile: Profile; height: number }) {
  const verified = profile.verified;
  const t = useT();
  return (
    <View style={[st.card, { height }]} pointerEvents="box-none">
      <PhotoCarousel photos={profile.photos} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} locations={[0.35, 1]} style={st.shade} pointerEvents="none" />
      <View style={st.info} pointerEvents="none">
        <View style={st.nameRow}>
          <Text style={st.name}>{profile.name}</Text>
          {verified ? (
            <View style={st.badgeDot}>
              <BadgeCheck size={18} color="#FFF" fill="#2a8ae0" />
            </View>
          ) : (
            <View style={st.badgeDot}>
              <BadgeCheck size={18} color="#FFF" fill="#e89216" />
            </View>
          )}
        </View>
        <Text style={st.meta}>{profile.age} · <MapPin size={11} color="rgba(255,255,255,0.85)" /> {profile.location}</Text>
        <Text style={st.clan}>{profile.clan} Clan</Text>
        {!!profile.bio && (
          <View style={st.aboutBox}>
            <Text style={st.aboutLabel}>{t("aboutMe")}</Text>
            <Text style={st.aboutTxt} numberOfLines={3}>{profile.bio}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function BrowseScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const { isPaid, remaining, consumeLike, consumeDislike, consumeRewind, startBoost, stopBoost, boostActive, showLimitModal, setShowLimitModal, show75Modal, setShow75Modal } = useTier();
  const { consume: addLike } = useLikes();
  const { profiles: liveProfiles, loading: loadingProfiles, error: profilesError, reload: reloadProfiles } = useDiscoverProfiles();
  // Local session-only dismissed set. The Firestore swipes doc is the
  // source of truth across sessions (filtered in useDiscoverProfiles); this
  // set only prevents showing the same person twice within a single screen
  // session. Importantly we DON'T touch usage.seenIds anymore — that was
  // causing the queue to shift under us after every swipe so the user saw
  // a different person on rewind.
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<{ id: string; liked: boolean }[]>([]);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const cardHeight = W.height - ins.top - ins.bottom - 220;

  // Queue is liveProfiles minus session dismissals. We always look at queue[0]
  // — after a swipe the dismissed card drops out and the next person slides
  // into position 0. No idx math, no skipping.
  const queue = useMemo(() => liveProfiles.filter(p => !dismissedIds.has(p.id)), [liveProfiles, dismissedIds]);

  const current = queue[0];

  const advance = useCallback((liked: boolean) => {
    if (!current) return;
    setHistory(h => [...h, { id: current.id, liked }]);
    setDismissedIds(prev => { const next = new Set(prev); next.add(current.id); return next; });
  }, [current]);

  const onLike = useCallback(() => {
    if (!current) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const ok = consumeLike(current.id);
    if (!ok) return;
    addLike(current.id);
    const liked = current;
    advance(true);
    // Persist swipe + check for match in the background
    recordSwipe(liked.id, true).then((res) => {
      if (res.ok && res.isMatch) {
        setMatchedProfile(liked);
      }
    });
  }, [current, consumeLike, addLike, advance]);

  const onDislike = useCallback(() => {
    if (!current) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    consumeDislike();
    const passed = current;
    advance(false);
    recordSwipe(passed.id, false).catch((e) => console.log("[swipe] pass error", e));
  }, [current, consumeDislike, advance]);

  const onMessage = useCallback(() => {
    if (!current) return;
    if (!isPaid) {
      Alert.alert(
        "Chat is a paid feature",
        "You must match with a user to use chat option, or you can upgrade to use this feature freely.",
        [
          { text: "Maybe later", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/subscription") },
        ]
      );
      return;
    }
    router.push(`/chat/${current.id}`);
  }, [current, router, isPaid]);

  const onRewind = useCallback(() => {
    if (history.length === 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const ok = consumeRewind();
    if (!ok) return;
    const last = history[history.length - 1];
    // Paid users get a true undo — also wipe the Firestore swipe doc so the
    // person can re-appear in future sessions. Free users keep sticky dislike.
    if (isPaid && last?.id) {
      deleteSwipe(last.id).catch((e) => console.log("[rewind] deleteSwipe", e));
    }
    // Restore the dismissed person to the front of the queue
    setDismissedIds(prev => { const next = new Set(prev); next.delete(last.id); return next; });
    setHistory(h => h.slice(0, -1));
  }, [history, consumeRewind, isPaid]);

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
          <Text style={[st.boostTxt, boostActive && { color: "#1a1404" }]}>{boostActive ? t("boostOn") : t("boost")}</Text>
        </TouchableOpacity>
      } />

      <View style={st.topCounter}>
        <View style={st.counterPill}>
          <Heart size={12} color={Colors.like} fill={Colors.like} />
          <Text style={st.counterPillTxt}>{isPaid ? "∞" : remaining.likes} likes</Text>
        </View>
        <View style={st.counterPill}>
          <X size={12} color={Colors.nope} strokeWidth={3} />
          <Text style={st.counterPillTxt}>{isPaid ? "∞" : remaining.dislikes} passes</Text>
        </View>
        <View style={st.counterPill}>
          <RotateCcw size={12} color={Colors.accent} />
          <Text style={st.counterPillTxt}>{isPaid ? "∞" : remaining.rewinds} rewinds</Text>
        </View>
      </View>

      <View style={st.cardArea}>
        {loadingProfiles ? (
          <View style={st.empty}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={st.emptyTitle}>Finding people…</Text>
          </View>
        ) : profilesError ? (
          <View style={st.empty}>
            <Heart size={48} color={Colors.dark.textFaint} />
            <Text style={st.emptyTitle}>Couldn’t load profiles</Text>
            <Text style={st.emptySub}>{profilesError}</Text>
            <TouchableOpacity onPress={() => reloadProfiles()} style={st.retryBtn} testID="retry-discover">
              <Text style={st.retryTxt}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : !current ? (
          <View style={st.empty}>
            <Heart size={48} color={Colors.dark.textFaint} />
            <Text style={st.emptyTitle}>{t("seenEveryoneTitle")}</Text>
            <Text style={st.emptySub}>{t("seenEveryoneSub")}</Text>
            <TouchableOpacity onPress={() => reloadProfiles()} style={st.retryBtn} testID="refresh-discover">
              <Text style={st.retryTxt}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={{ height: cardHeight }}>
              <ProfileCard profile={current} height={cardHeight} />
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

        <TouchableOpacity onPress={onRewind} disabled={history.length === 0} style={[st.rewindBtn, history.length === 0 && { opacity: 0.4 }]} testID="rewind-button">
          <RotateCcw size={18} color={Colors.accent} />
          <Text style={st.rewindTxt}>{isPaid ? t("rewind") : `${t("rewind")} (${remaining.rewinds})`}</Text>
        </TouchableOpacity>
      </View>

      {/* Limit reached modal */}
      <Modal visible={showLimitModal} transparent animationType="fade" onRequestClose={() => setShowLimitModal(false)}>
        <View style={st.modal}>
          <View style={st.modalCard}>
            <Crown size={32} color={Colors.accent} />
            <Text style={st.modalTitle}>{t("hitDailyTitle")}</Text>
            <Text style={st.modalSub}>{t("hitDailySub")}</Text>
            <TouchableOpacity style={st.cta} onPress={() => { setShowLimitModal(false); router.push("/subscription"); }} testID="upgrade-cta">
              <Text style={st.ctaTxt}>{t("upgradeNow")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLimitModal(false)}><Text style={st.later}>{t("maybeLater")}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 75% warning */}
      <Modal visible={show75Modal} transparent animationType="fade" onRequestClose={() => setShow75Modal(false)}>
        <View style={st.modal}>
          <View style={st.modalCard}>
            <Zap size={32} color={Colors.accent} />
            <Text style={st.modalTitle}>{t("runningLowTitle")}</Text>
            <Text style={st.modalSub}>{t("runningLowSub")}</Text>
            <TouchableOpacity style={st.cta} onPress={() => { setShow75Modal(false); router.push("/subscription"); }}>
              <Text style={st.ctaTxt}>{t("seePlans")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShow75Modal(false)}><Text style={st.later}>{t("keepBrowsing")}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* It's a Match! */}
      <Modal visible={!!matchedProfile} transparent animationType="fade" onRequestClose={() => setMatchedProfile(null)}>
        <View style={st.modal}>
          <View style={st.matchCard}>
            <Text style={st.matchTitle}>It’s a Match! 💞</Text>
            <Text style={st.matchSub}>You and {matchedProfile?.name} liked each other.</Text>
            {!!matchedProfile?.photos?.[0] && (
              <Image source={{ uri: matchedProfile.photos[0] }} style={st.matchPhoto} contentFit="cover" transition={200} />
            )}
            <TouchableOpacity
              style={st.cta}
              onPress={() => {
                const p = matchedProfile;
                setMatchedProfile(null);
                if (p) router.push(`/chat/${p.id}`);
              }}
              testID="match-message-btn"
            >
              <Text style={st.ctaTxt}>Send a message</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMatchedProfile(null)} testID="match-keep-swiping">
              <Text style={st.later}>Keep swiping</Text>
            </TouchableOpacity>
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
  counterRow: { paddingTop: 8, alignItems: "center" },
  counterTxt: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  topCounter: { flexDirection: "row", justifyContent: "center", gap: 8, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 6 },
  counterPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  counterPillTxt: { color: "#FFF", fontSize: 11, fontWeight: "700" as const },
  cardArea: { flex: 1, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 10 },
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
  badgeDot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  meta: { color: "rgba(255,255,255,0.92)", fontSize: 14, marginTop: 4 },
  clan: { color: Colors.accentLight, fontSize: 14, fontWeight: "600" as const, marginTop: 4 },
  actions: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 22, paddingTop: 14, paddingBottom: 6 },
  actBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(0,0,0,0.65)", borderWidth: 2, justifyContent: "center", alignItems: "center" },
  rewindBtn: { position: "absolute", top: 12, right: 16, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: Colors.accent, backgroundColor: "rgba(0,0,0,0.4)" },
  aboutBox: { marginTop: 10, backgroundColor: "transparent", borderWidth: 0, borderColor: "transparent", borderRadius: 12, paddingHorizontal: 0, paddingVertical: 4 },
  aboutLabel: { color: Colors.accentLight, fontSize: 10, fontWeight: "800" as const, letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 4 },
  aboutTxt: { color: "rgba(255,255,255,0.92)", fontSize: 13, lineHeight: 18 },
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
  retryBtn: { marginTop: 16, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: Colors.gold },
  retryTxt: { color: Colors.gold, fontSize: 13, fontWeight: "700" as const },
  matchCard: { backgroundColor: "#16060c", borderRadius: 22, padding: 26, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "rgba(212,168,67,0.4)" },
  matchTitle: { color: Colors.gold, fontSize: 26, fontWeight: "800" as const, textAlign: "center" as const, letterSpacing: -0.5 },
  matchSub: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center" as const, marginTop: 8, lineHeight: 20 },
  matchPhoto: { width: 160, height: 200, borderRadius: 16, marginTop: 18, borderWidth: 2, borderColor: Colors.gold },
});
