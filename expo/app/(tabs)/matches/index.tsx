import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Heart, Star, Zap, ArrowRight, Ban, Crown } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import HmongMatchHeader from "@/components/HmongMatchHeader";
import RedBackground from "@/components/RedBackground";
import { profiles as mockProfiles } from "@/mocks/profiles";
import { useAllProfiles } from "@/lib/discoverProfiles";
import { useLikes, DAILY_LIMIT } from "@/providers/LikesProvider";
import { useTier } from "@/providers/TierProvider";
import { useT } from "@/providers/LanguageProvider";
import VerifiedBadge from "@/components/VerifiedBadge";

const SW = Dimensions.get("window").width;
const CW = (SW - 32 - 12) / 2;

export default function LikesScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const { used, premium, likedIds } = useLikes();
  const { isPaid } = useTier();
  const { byId: liveById } = useAllProfiles();
  const [tab, setTab] = useState<"likes" | "liked" | "top">("liked");
  const [blocked, setBlocked] = useState<string[]>([]);
  const [upgradeOpen, setUpgradeOpen] = useState<boolean>(false);
  // "You Liked" — pull from Firestore live profiles by id (fall back to mocks during loading)
  const myLiked = likedIds
    .filter((id) => !blocked.includes(id))
    .map((id) => liveById[id] ?? mockProfiles.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  // "Top Picks" — show all other live profiles (excluding self & already-liked)
  const topPicks = Object.values(liveById)
    .filter((p) => !likedIds.includes(p.id) && !blocked.includes(p.id))
    .slice(0, 12);

  const blockUser = (id: string, name: string) => {
    Alert.alert(t("blockTitle", { name }), t("blockBody"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("block"), style: "destructive", onPress: () => setBlocked(b => [...b, id]) },
    ]);
  };

  const shownRemaining = premium ? t("unlimitedLikesText") : t("leftOutOf", { n: Math.max(0, DAILY_LIMIT - used) });

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <RedBackground />
      <HmongMatchHeader />
      <View style={s.tabs}>
        {isPaid && (
          <>
            <TouchableOpacity style={s.tab} onPress={() => setTab("likes")} testID="tab-likes">
              <Text style={[s.tabText, tab === "likes" && s.tabTextActive]}>{t("likesYou")}</Text>
              {tab === "likes" && <View style={s.tabBar} />}
            </TouchableOpacity>
            <View style={s.tabDivider} />
          </>
        )}
        <TouchableOpacity style={s.tab} onPress={() => setTab("liked")} testID="tab-liked">
          <Text style={[s.tabText, tab === "liked" && s.tabTextActive]}>{t("youLiked")}</Text>
          {tab === "liked" && <View style={s.tabBar} />}
        </TouchableOpacity>
        <View style={s.tabDivider} />
        <TouchableOpacity style={s.tab} onPress={() => setTab("top")} testID="tab-top">
          <View style={s.tabRow}><Text style={[s.tabText, tab === "top" && s.tabTextActive]}>{t("topPicks")}</Text><View style={s.redDot} /></View>
          {tab === "top" && <View style={s.tabBar} />}
        </TouchableOpacity>
      </View>

      {tab === "liked" ? (
        <ScrollView contentContainerStyle={s.likesScroll} showsVerticalScrollIndicator={false}>
          <Text style={s.sectionHead}>{t("peopleYouLiked", { n: myLiked.length })}</Text>
          {myLiked.length === 0 ? (
            <View style={s.emptyLiked}>
              <Heart size={36} color={Colors.dark.textFaint} />
              <Text style={s.emptyTitle}>{t("noLikedYetTitle")}</Text>
              <Text style={s.emptySub}>{t("noLikedYetSub")}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/discover" as never)} style={s.startBtn} testID="start-swiping-likes">
                <Text style={s.startBtnText}>{t("startSwiping")}</Text>
                <ArrowRight size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.grid}>
              {myLiked.map(p => (
                <TouchableOpacity key={p.id} style={[s.pick, { width: CW }]} onPress={() => router.push(`/user/${p.id}`)} testID={`liked-${p.id}`}>
                  <Image source={{ uri: p.photos[0] }} style={s.pickImg} contentFit="cover" />
                  <View style={s.pickOverlay} />
                  <View style={s.pickInfo}>
                    <View style={s.pickNameRow}>
                      <Text style={s.pickName}>{p.name}, {p.age}</Text>
                      <VerifiedBadge verified={!!p.verified} size={14} />
                    </View>
                    <Text style={s.pickTime}>{p.distance}</Text>
                  </View>
                  <View style={s.likedBadge}><Heart size={12} color="#FFF" fill="#FFF" /></View>
                  {isPaid && (
                    <TouchableOpacity onPress={() => blockUser(p.id, p.name)} style={s.blockBadge} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} testID={`block-${p.id}`}>
                      <Ban size={12} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : tab === "likes" ? (
        <ScrollView contentContainerStyle={s.likesScroll} showsVerticalScrollIndicator={false}>
          <View style={s.counterCard}>
            <View style={s.counterRow}>
              <Zap size={20} color={Colors.accent} fill={Colors.accent} />
              <Text style={s.counterTitle}>{t("dailyLikes")}</Text>
            </View>
            <Text style={s.counterBig}>{premium ? "∞" : `${Math.max(0, DAILY_LIMIT - used)}`}</Text>
            <Text style={s.counterSub}>{premium ? t("unlimitedLikesText") : `${shownRemaining} / ${DAILY_LIMIT}`}</Text>
            <View style={s.counterBar}>
              <View style={[s.counterFill, { width: premium ? "100%" : `${(used / DAILY_LIMIT) * 100}%` }]} />
            </View>
            {!premium && used >= DAILY_LIMIT && (
              <Text style={s.counterLimit}>{t("outOfLikesNote")}</Text>
            )}
          </View>

          <Text style={s.sectionHead}>{t("whoLikedYou")}</Text>
          <View style={s.grid}>
            {topPicks.slice(0, 4).map(p => (
              <TouchableOpacity key={p.id} style={[s.pick, { width: CW }]} activeOpacity={0.85} onPress={() => { if (!premium && !isPaid) setUpgradeOpen(true); else router.push(`/user/${p.id}`); }} testID={`liked-by-${p.id}`}>
                <Image source={{ uri: p.photos[0] }} style={s.pickImg} contentFit="cover" blurRadius={premium ? 0 : 14} />
                <View style={s.pickOverlay} />
                <View style={s.pickInfo}>
                  <Text style={s.pickName}>{premium ? `${p.name}, ${p.age}` : "?, ?"}</Text>
                </View>
                {!premium && (
                  <View style={s.lockCenter}>
                    <Heart size={28} color={Colors.accent} fill={Colors.accent} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {!premium && (
            <TouchableOpacity style={s.goldBtn} onPress={() => router.push("/subscription")} testID="see-who-likes">
              <Text style={s.goldBtnText}>{t("seeWhoLikesYou")}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={s.topGrid} showsVerticalScrollIndicator={false}>
          <Text style={s.topPrompt}>{t("upgradeTopPicks")}</Text>
          <View style={s.grid}>
            {topPicks.slice(0, 4).map(p => (
              <TouchableOpacity key={p.id} style={[s.pick, { width: CW }]} activeOpacity={0.85} onPress={() => { if (!isPaid) setUpgradeOpen(true); else router.push(`/user/${p.id}`); }} testID={`top-${p.id}`}>
                <Image source={{ uri: p.photos[0] }} style={s.pickImg} contentFit="cover" blurRadius={isPaid ? 0 : 8} />
                <View style={s.pickOverlay} />
                <View style={s.pickInfo}>
                  <Text style={s.pickName}>{isPaid ? `${p.name}, ${p.age}` : "???"}</Text>
                  <Text style={s.pickTime}>14h left</Text>
                </View>
                <View style={s.pickStar}><Star size={14} color="#4A90D9" fill="#4A90D9" /></View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.unlockWrap}>
            <TouchableOpacity style={s.goldBtn} onPress={() => router.push("/subscription")} testID="unlock-top">
              <Text style={s.goldBtnText}>{t("unlockTopPicks")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal visible={upgradeOpen} transparent animationType="fade" onRequestClose={() => setUpgradeOpen(false)}>
        <View style={s.mdl}>
          <View style={s.mdlCard}>
            <Crown size={36} color={Colors.accent} />
            <Text style={s.mdlTitle}>{t("upgradeLikesTitle")}</Text>
            <Text style={s.mdlSub}>{t("upgradeLikesSub")}</Text>
            <TouchableOpacity style={s.mdlCta} onPress={() => { setUpgradeOpen(false); router.push("/subscription"); }} testID="upgrade-likes">
              <Text style={s.mdlCtaTxt}>{t("seePlans")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setUpgradeOpen(false)}><Text style={s.mdlLater}>{t("maybeLater")}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "transparent" },
  tabs: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 8, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14, position: "relative" },
  tabRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabDivider: { width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.15)" },
  tabText: { fontSize: 18, fontWeight: "700" as const, color: "rgba(255,255,255,0.45)" },
  tabTextActive: { color: "#FFF" },
  tabBar: { position: "absolute", bottom: -1, left: "30%", right: "30%", height: 2, backgroundColor: Colors.primary },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  likesScroll: { padding: 16, paddingBottom: 32 },
  counterCard: { backgroundColor: "#141414", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "rgba(212,168,67,0.2)" },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  counterTitle: { color: "#FFF", fontSize: 15, fontWeight: "700" as const },
  counterBig: { color: "#FFF", fontSize: 48, fontWeight: "800" as const, marginTop: 4 },
  counterSub: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  counterBar: { height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, marginTop: 14, overflow: "hidden" },
  counterFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  counterLimit: { color: Colors.crimsonLight, fontSize: 13, marginTop: 12, fontWeight: "600" as const },
  sectionHead: { color: "#FFF", fontSize: 18, fontWeight: "800" as const, marginTop: 24, marginBottom: 12 },
  topGrid: { padding: 16 },
  topPrompt: { color: "#FFF", fontSize: 18, textAlign: "center", marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  pick: { height: CW * 1.25, borderRadius: 14, overflow: "hidden", backgroundColor: "#111" },
  pickImg: { ...StyleSheet.absoluteFillObject },
  pickOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  pickInfo: { position: "absolute", left: 10, bottom: 10, right: 10 },
  pickNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pickName: { color: "#FFF", fontSize: 15, fontWeight: "700" as const },
  pickTime: { color: Colors.accent, fontSize: 12, fontWeight: "600" as const, marginTop: 2 },
  pickStar: { position: "absolute", bottom: 10, right: 10, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  lockCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  goldBtn: { backgroundColor: Colors.accent, borderRadius: 999, paddingVertical: 16, paddingHorizontal: 40, marginTop: 24, alignSelf: "center" },
  goldBtnText: { color: "#1a1a1f", fontSize: 16, fontWeight: "800" as const },
  unlockWrap: { alignItems: "center", marginTop: 24 },
  emptyLiked: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { color: "#FFF", fontSize: 17, fontWeight: "800" as const, marginTop: 8 },
  emptySub: { color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center" as const },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, marginTop: 14 },
  startBtnText: { color: "#FFF", fontWeight: "800" as const, fontSize: 14 },
  likedBadge: { position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.crimson, alignItems: "center", justifyContent: "center" },
  blockBadge: { position: "absolute", top: 10, left: 10, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  mdl: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 28 },
  mdlCard: { backgroundColor: "#16060c", borderRadius: 22, padding: 26, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "rgba(212,168,67,0.3)" },
  mdlTitle: { color: "#FFF", fontSize: 19, fontWeight: "700" as const, marginTop: 12, textAlign: "center" as const },
  mdlSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center" as const, marginTop: 8, lineHeight: 19 },
  mdlCta: { backgroundColor: Colors.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999, marginTop: 18 },
  mdlCtaTxt: { color: "#1a1404", fontSize: 14, fontWeight: "700" as const },
  mdlLater: { color: "rgba(255,255,255,0.5)", marginTop: 14, fontSize: 13 },
});
