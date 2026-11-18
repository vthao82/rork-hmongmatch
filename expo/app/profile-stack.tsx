import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, Globe, Heart, MessageCircle, X, ChevronUp, ChevronDown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useProfileStack, clearProfileStack } from "@/lib/profileStackStore";
import { useAllProfiles, useMyMatches, recordSwipe } from "@/lib/discoverProfiles";
import { profiles as mockProfiles, type Profile } from "@/mocks/profiles";
import { useTier } from "@/providers/TierProvider";
import { useLikes } from "@/providers/LikesProvider";
import { spendCategoryView, useCategoryViewsLeft, resetsInLabel } from "@/lib/categoryViews";
import { NewBadge } from "@/components/NewBadge";
import { dialectText, lookingForText } from "@/lib/profileLabels";
import PromptCards from "@/components/PromptCards";
import RedBackground from "@/components/RedBackground";

/**
 * Swipeable profile viewer route. Drives the "tap a card → swipe up to next
 * profile" UX on Likes You, You Liked, Top Picks, and category detail screens.
 *
 * Profile list + start index are passed via lib/profileStackStore (set
 * imperatively by the caller before navigation).
 */
export default function ProfileStackScreen() {
  const router = useRouter();
  const ins = useSafeAreaInsets();
  const stack = useProfileStack();
  const { byId } = useAllProfiles();
  const { isPaid, consumeRewind, remaining } = useTier();
  const viewsLeft = useCategoryViewsLeft(isPaid);
  const { consume: addLike } = useLikes();
  const { matchIds } = useMyMatches();
  const [idx, setIdx] = useState<number>(stack?.startIndex ?? 0);

  useEffect(() => () => clearProfileStack(), []);

  const profile = useMemo<Profile | null>(() => {
    const id = stack?.ids?.[idx];
    if (!id) return null;
    return (byId[id] as Profile) ?? mockProfiles.find((p) => p.id === id) ?? null;
  }, [stack, idx, byId]);

  if (!stack || stack.ids.length === 0) {
    return (
      <View style={s.cen}>
        <Stack.Screen options={{ title: "Profile" }} />
        <Text style={s.err}>No profiles to show.</Text>
        <TouchableOpacity style={{ marginTop: 18 }} onPress={() => router.back()} testID="back">
          <Text style={{ color: Colors.primary, fontWeight: "700" as const }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const total = stack.ids.length;
  const fromInterests = stack.source === "category";
  const upsell = (title: string, body: string) =>
    Alert.alert(title, body, [
      { text: "Maybe later", style: "cancel" },
      { text: "Upgrade", onPress: () => router.push("/subscription") },
    ]);
  const next = () => {
    if (idx >= total - 1) return;
    // Interests: each new profile uses a free daily view (ones already seen today are free)
    if (fromInterests && !spendCategoryView(stack.ids[idx + 1], isPaid)) {
      upsell("Out of free views", `You've used today's free Interests views. They reset in ${resetsInLabel()}, or upgrade to Unlimited to keep browsing.`);
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    setIdx((i) => Math.min(total - 1, i + 1));
  };
  const prev = () => {
    if (idx <= 0) return;
    // Interests: going back uses a rewind (shared with Discover)
    if (fromInterests && !consumeRewind(true)) {
      upsell("Out of rewinds", `You've used today's free rewinds. Upgrade to Unlimited for unlimited rewinds.`);
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    setIdx((i) => Math.max(0, i - 1));
  };

  if (!profile) {
    return (
      <View style={s.cen}>
        <Stack.Screen options={{ title: "Profile" }} />
        <Text style={s.err}>Profile not available.</Text>
        <TouchableOpacity style={{ marginTop: 18 }} onPress={() => router.back()} testID="back">
          <Text style={{ color: Colors.primary, fontWeight: "700" as const }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onMessage = () => {
    if (!isPaid && !matchIds.includes(profile.id)) {
      Alert.alert("Chat is a paid feature", "You must match with a user to chat, or upgrade to message anyone.", [
        { text: "Maybe later", style: "cancel" },
        { text: "Upgrade", onPress: () => router.push("/subscription") },
      ]);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(`/chat/${profile.id}`);
  };

  const onLike = (comment?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    addLike(profile.id);
    void recordSwipe(profile.id, true, comment);
    // Move to next on like so they can keep going through the list
    if (idx < total - 1) next();
    else router.back();
  };

  const interests = Array.from(new Map((profile.interests ?? []).map((i) => [i.trim().toLowerCase(), i.trim()])).values()).filter(Boolean);

  return (
    <>
      <Stack.Screen options={{ title: stack.title ?? profile.name, headerStyle: { backgroundColor: "#0a0207" }, headerTintColor: "#FFF", headerShadowVisible: false }} />
      <View style={s.ct}>
      <RedBackground />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View style={s.ph}>
          <PhotoCarousel key={profile.id} photos={profile.photos} counterTop={ins.top + 12} />
          <View style={[s.counterWrap, { top: ins.top + 12 }]} pointerEvents="none" testID="profile-position">
            <View style={s.counter}><Text style={s.counterTxt}>Profile {idx + 1} of {total}</Text></View>
          </View>
          <View style={s.pf} pointerEvents="none">
            <View style={s.nr}>
              <Text style={s.nm}>{profile.name}, {profile.age}</Text>
              <VerifiedBadge verified={!!profile.verified} size={22} />
              <NewBadge createdAtMs={profile.createdAtMs} inline />
            </View>
            {profile.clan && profile.clan !== "—" ? <View style={s.clanPill}><Text style={s.cl}>{profile.clan} Clan</Text></View> : null}
          </View>
        </View>

        <View style={s.actions}>
          <Pressable style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }]} onPress={prev} disabled={idx === 0} testID="prev-profile">
            <ChevronUp size={26} color={idx === 0 ? DIM : "#FFF"} />
            <Text style={[s.iconLbl, idx === 0 && { color: DIM }]}>Prev</Text>
          </Pressable>
          <TouchableOpacity style={s.likeBtn} onPress={() => onLike()} testID="stack-like">
            <Heart size={22} color="#FFF" fill="#FFF" />
            <Text style={s.likeTxt}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.msgBtn} onPress={onMessage} testID="stack-message">
            <MessageCircle size={20} color="#FFF" />
            <Text style={s.iconLbl}>Chat</Text>
          </TouchableOpacity>
          <Pressable style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }]} onPress={next} disabled={idx === total - 1} testID="next-profile">
            <ChevronDown size={26} color={idx === total - 1 ? DIM : "#FFF"} />
            <Text style={[s.iconLbl, idx === total - 1 && { color: DIM }]}>Next</Text>
          </Pressable>
        </View>

        <View style={s.cn}>
          {profile.bio ? (
            <View style={[s.glass, s.se]}><Text style={s.st}>ABOUT</Text><Text style={s.bt}>{profile.bio}</Text></View>
          ) : null}
          <PromptCards prompts={profile.prompts} name={profile.name} dark onLike={(c) => onLike(c)} />
          <View style={s.se}>
            <Text style={[s.st, { marginLeft: 4 }]}>DETAILS</Text>
            <View style={[s.glass, s.dc]}>
              <View style={s.di}><MapPin size={16} color={Colors.gold} /><Text style={s.dt}>{profile.location}{profile.distance ? ` · ${profile.distance}` : ""}</Text></View>
              {dialectText(profile.languages) ? <View style={s.di}><Globe size={16} color={Colors.gold} /><Text style={s.dt}>{dialectText(profile.languages)}</Text></View> : null}
              {profile.lookingFor ? <View style={s.di}><Heart size={16} color={Colors.gold} /><Text style={s.dt}>{lookingForText(profile.lookingFor)}</Text></View> : null}
            </View>
          </View>
          {interests.length ? (
            <View style={s.se}>
              <Text style={[s.st, { marginLeft: 4 }]}>INTERESTS</Text>
              <View style={s.ir}>
                {interests.map((i) => <View key={i} style={s.ic}><Text style={s.it}>{i}</Text></View>)}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
      </View>

      <View style={[s.closeWrap, { top: ins.top + 6 }]}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} testID="close-stack">
          <X size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={{ position: "absolute", bottom: ins.bottom + 6, alignSelf: "center" }}>
        <Text style={s.hint} testID="stack-hint">
          {fromInterests && !isPaid
            ? `${viewsLeft} free views · ${remaining.rewinds} rewinds left today`
            : "Use Prev / Next to browse more profiles"}
        </Text>
      </View>
    </>
  );
}

const DIM = "rgba(255,255,255,0.3)";

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.indigo },
  cen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background, padding: 20 },
  err: { fontSize: 16, color: Colors.textSecondary, textAlign: "center" as const },
  ph: { position: "relative", backgroundColor: "#000", borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" },
  counterWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  counter: { backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  counterTxt: { color: "#FFF", fontSize: 12, fontWeight: "700" as const },
  pf: { position: "absolute", bottom: 24, left: 20, right: 20 },
  nr: { flexDirection: "row", alignItems: "center", gap: 8 },
  nm: { fontSize: 34, fontWeight: "800" as const, color: "#FFF", letterSpacing: -0.8, textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },
  clanPill: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(212,168,67,0.9)" },
  cl: { fontSize: 13, fontWeight: "800" as const, color: Colors.indigo, letterSpacing: 0.4 },
  closeWrap: { position: "absolute", left: 16, zIndex: 10 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 14, backgroundColor: "rgba(20,4,12,0.85)", borderWidth: 1, borderColor: "rgba(212,168,67,0.3)", marginTop: 16, marginHorizontal: 16, borderRadius: 22 },
  iconBtn: { alignItems: "center", paddingHorizontal: 8 },
  iconLbl: { fontSize: 12, color: "#FFF", fontWeight: "600" as const, marginTop: 2 },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.crimson, paddingHorizontal: 26, paddingVertical: 13, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  likeTxt: { color: "#FFF", fontSize: 14, fontWeight: "700" as const },
  msgBtn: { alignItems: "center", paddingHorizontal: 8 },
  cn: { paddingHorizontal: 18, paddingTop: 20 },
  glass: { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", borderRadius: 20, padding: 18 },
  se: { marginBottom: 18 },
  st: { fontSize: 12, fontWeight: "800" as const, color: Colors.goldLight, letterSpacing: 1.6, marginBottom: 10 },
  bt: { fontSize: 17, color: "#FFF", lineHeight: 26, fontWeight: "500" as const },
  dc: { gap: 14 },
  di: { flexDirection: "row", alignItems: "center", gap: 12 },
  dt: { fontSize: 15, color: "#FFF", flex: 1, fontWeight: "600" as const },
  ir: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ic: { backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(212,168,67,0.45)", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  it: { fontSize: 14, fontWeight: "700" as const, color: "#FFF" },
  hint: { color: "rgba(255,255,255,0.6)", fontSize: 11, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
});
