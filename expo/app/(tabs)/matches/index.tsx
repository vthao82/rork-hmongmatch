import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Heart, Star, Zap, ArrowRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import HmongMatchHeader from "@/components/HmongMatchHeader";
import { profiles } from "@/mocks/profiles";
import { useLikes, DAILY_LIMIT } from "@/providers/LikesProvider";

const SW = Dimensions.get("window").width;
const CW = (SW - 32 - 12) / 2;

export default function LikesScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { used, premium, likedIds } = useLikes();
  const [tab, setTab] = useState<"likes" | "liked" | "top">("likes");
  const myLiked = profiles.filter(p => likedIds.includes(p.id));

  const likesCount = premium ? used : used;
  const shownRemaining = premium ? "Unlimited" : `${Math.max(0, DAILY_LIMIT - used)} left today`;

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <HmongMatchHeader />
      <View style={s.tabs}>
        <TouchableOpacity style={s.tab} onPress={() => setTab("likes")} testID="tab-likes">
          <Text style={[s.tabText, tab === "likes" && s.tabTextActive]}>Likes You</Text>
          {tab === "likes" && <View style={s.tabBar} />}
        </TouchableOpacity>
        <View style={s.tabDivider} />
        <TouchableOpacity style={s.tab} onPress={() => setTab("liked")} testID="tab-liked">
          <Text style={[s.tabText, tab === "liked" && s.tabTextActive]}>You Liked</Text>
          {tab === "liked" && <View style={s.tabBar} />}
        </TouchableOpacity>
        <View style={s.tabDivider} />
        <TouchableOpacity style={s.tab} onPress={() => setTab("top")} testID="tab-top">
          <View style={s.tabRow}><Text style={[s.tabText, tab === "top" && s.tabTextActive]}>Top Picks</Text><View style={s.redDot} /></View>
          {tab === "top" && <View style={s.tabBar} />}
        </TouchableOpacity>
      </View>

      {tab === "liked" ? (
        <ScrollView contentContainerStyle={s.likesScroll} showsVerticalScrollIndicator={false}>
          <Text style={s.sectionHead}>People you liked ({myLiked.length})</Text>
          {myLiked.length === 0 ? (
            <View style={s.emptyLiked}>
              <Heart size={36} color={Colors.dark.textFaint} />
              <Text style={s.emptyTitle}>You haven&apos;t liked anyone yet</Text>
              <Text style={s.emptySub}>Start swiping to find your match.</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/discover" as never)} style={s.startBtn} testID="start-swiping-likes">
                <Text style={s.startBtnText}>Start swiping</Text>
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
                    <Text style={s.pickName}>{p.name}, {p.age}</Text>
                    <Text style={s.pickTime}>{p.distance}</Text>
                  </View>
                  <View style={s.likedBadge}><Heart size={12} color="#FFF" fill="#FFF" /></View>
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
              <Text style={s.counterTitle}>Daily Likes</Text>
            </View>
            <Text style={s.counterBig}>{premium ? "∞" : `${Math.max(0, DAILY_LIMIT - used)}`}</Text>
            <Text style={s.counterSub}>{premium ? "You have unlimited likes" : `${shownRemaining} out of ${DAILY_LIMIT}`}</Text>
            <View style={s.counterBar}>
              <View style={[s.counterFill, { width: premium ? "100%" : `${(used / DAILY_LIMIT) * 100}%` }]} />
            </View>
            {!premium && used >= DAILY_LIMIT && (
              <Text style={s.counterLimit}>You&apos;ve used all your daily likes. Upgrade for unlimited.</Text>
            )}
          </View>

          <Text style={s.sectionHead}>Who liked you</Text>
          <View style={s.grid}>
            {profiles.slice(0, 4).map(p => (
              <View key={p.id} style={[s.pick, { width: CW }]}>
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
              </View>
            ))}
          </View>

          {!premium && (
            <TouchableOpacity style={s.goldBtn} onPress={() => router.push("/subscription")} testID="see-who-likes">
              <Text style={s.goldBtnText}>See Who Likes You</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={s.topGrid} showsVerticalScrollIndicator={false}>
          <Text style={s.topPrompt}>Upgrade to Hmong Date Gold™ for more Top Picks!</Text>
          <View style={s.grid}>
            {profiles.slice(0, 4).map(p => (
              <View key={p.id} style={[s.pick, { width: CW }]}>
                <Image source={{ uri: p.photos[0] }} style={s.pickImg} contentFit="cover" blurRadius={8} />
                <View style={s.pickOverlay} />
                <View style={s.pickInfo}>
                  <Text style={s.pickName}>{p.name}, {p.age}</Text>
                  <Text style={s.pickTime}>14h left</Text>
                </View>
                <View style={s.pickStar}><Star size={14} color="#4A90D9" fill="#4A90D9" /></View>
              </View>
            ))}
          </View>
          <View style={s.unlockWrap}>
            <TouchableOpacity style={s.goldBtn} onPress={() => router.push("/subscription")} testID="unlock-top">
              <Text style={s.goldBtnText}>Unlock all Top Picks</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
  pickInfo: { position: "absolute", left: 10, bottom: 10 },
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
});
