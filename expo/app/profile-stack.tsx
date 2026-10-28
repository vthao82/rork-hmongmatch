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
import { spendCategoryView, useCategoryViewsLeft } from "@/lib/categoryViews";

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
      upsell("Out of free views", "You've used today's free Interests views. Upgrade to Unlimited to keep browsing, or come back tomorrow.");
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    setIdx((i) => Math.min(total - 1, i + 1));
  };
  const prev = () => {
    if (idx <= 0) return;
    // Interests: going back uses a rewind (shared with Discover)
    if (fromInterests && !consumeRewind(true)) {
      upsell("Out of rewinds", "You've used today's free rewinds. Upgrade to Unlimited for unlimited rewinds.");
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

  const onLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    addLike(profile.id);
    void recordSwipe(profile.id, true);
    // Move to next on like so they can keep going through the list
    if (idx < total - 1) setIdx((i) => i + 1);
    else router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: stack.title ?? profile.name }} />
      <ScrollView style={s.ct} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View style={s.ph}>
          <PhotoCarousel key={profile.id} photos={profile.photos} counterTop={ins.top + 12} />
          <View style={[s.counterWrap, { top: ins.top + 12 }]} pointerEvents="none" testID="profile-position">
            <View style={s.counter}><Text style={s.counterTxt}>Profile {idx + 1} of {total}</Text></View>
          </View>
          <View style={s.pf} pointerEvents="none">
            <View style={s.nr}>
              <Text style={s.nm}>{profile.name}, {profile.age}</Text>
              <VerifiedBadge verified={!!profile.verified} size={22} />
            </View>
            <Text style={s.cl}>{profile.clan} Clan</Text>
          </View>
        </View>

        <View style={s.actions}>
          <Pressable style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }]} onPress={prev} disabled={idx === 0} testID="prev-profile">
            <ChevronUp size={26} color={idx === 0 ? Colors.textTertiary : Colors.text} />
            <Text style={[s.iconLbl, idx === 0 && { color: Colors.textTertiary }]}>Prev</Text>
          </Pressable>
          <TouchableOpacity style={s.likeBtn} onPress={onLike} testID="stack-like">
            <Heart size={22} color="#FFF" fill="#FFF" />
            <Text style={s.likeTxt}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.msgBtn} onPress={onMessage} testID="stack-message">
            <MessageCircle size={20} color={Colors.text} />
            <Text style={s.iconLbl}>Chat</Text>
          </TouchableOpacity>
          <Pressable style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.6 }]} onPress={next} disabled={idx === total - 1} testID="next-profile">
            <ChevronDown size={26} color={idx === total - 1 ? Colors.textTertiary : Colors.text} />
            <Text style={[s.iconLbl, idx === total - 1 && { color: Colors.textTertiary }]}>Next</Text>
          </Pressable>
        </View>

        <View style={s.cn}>
          <View style={s.se}>
            <Text style={s.st}>About</Text>
            <Text style={s.bt}>{profile.bio || "—"}</Text>
          </View>
          <View style={s.se}>
            <Text style={s.st}>Details</Text>
            <View style={s.dc}>
              <View style={s.di}><MapPin size={16} color={Colors.primary} /><Text style={s.dt}>{profile.location}{profile.distance ? ` · ${profile.distance}` : ""}</Text></View>
              {profile.languages?.length ? <View style={s.di}><Globe size={16} color={Colors.primary} /><Text style={s.dt}>{profile.languages.join(", ")}</Text></View> : null}
              {profile.lookingFor ? <View style={s.di}><Heart size={16} color={Colors.primary} /><Text style={s.dt}>{profile.lookingFor}</Text></View> : null}
            </View>
          </View>
          {profile.interests?.length ? (
            <View style={s.se}>
              <Text style={s.st}>Interests</Text>
              <View style={s.ir}>
                {profile.interests.map((i) => <View key={i} style={s.ic}><Text style={s.it}>{i}</Text></View>)}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

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

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.background },
  cen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background, padding: 20 },
  err: { fontSize: 16, color: Colors.textSecondary, textAlign: "center" as const },
  ph: { position: "relative", backgroundColor: "#000" },
  counterWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  counter: { backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  counterTxt: { color: "#FFF", fontSize: 12, fontWeight: "700" as const },
  pf: { position: "absolute", bottom: 24, left: 20, right: 20 },
  nr: { flexDirection: "row", alignItems: "center", gap: 8 },
  nm: { fontSize: 30, fontWeight: "800" as const, color: "#FFF", textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  cl: { fontSize: 16, fontWeight: "600" as const, color: Colors.accentLight, marginTop: 4, textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  closeWrap: { position: "absolute", left: 16, zIndex: 10 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 14, backgroundColor: Colors.surface, marginTop: -22, marginHorizontal: 16, borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  iconBtn: { alignItems: "center", paddingHorizontal: 8 },
  iconLbl: { fontSize: 12, color: Colors.text, fontWeight: "600" as const, marginTop: 2 },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 999 },
  likeTxt: { color: "#FFF", fontSize: 14, fontWeight: "700" as const },
  msgBtn: { alignItems: "center", paddingHorizontal: 8 },
  cn: { paddingHorizontal: 20, paddingTop: 24 },
  se: { marginBottom: 24 },
  st: { fontSize: 17, fontWeight: "700" as const, color: Colors.text, marginBottom: 10 },
  bt: { fontSize: 15, color: Colors.textSecondary, lineHeight: 23 },
  dc: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12 },
  di: { flexDirection: "row", alignItems: "center", gap: 10 },
  dt: { fontSize: 14, color: Colors.text, flex: 1 },
  ir: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ic: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  it: { fontSize: 13, fontWeight: "500" as const, color: Colors.text },
  hint: { color: "rgba(255,255,255,0.6)", fontSize: 11, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
});
