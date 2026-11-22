import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { MapPin, Globe, Heart, MessageCircle, X, MoreVertical, ArrowLeft } from "lucide-react-native";
import VerifiedBadge from "@/components/VerifiedBadge";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { profiles as mockProfiles, currentUser, type Profile } from "@/mocks/profiles";
import { useAllProfiles, useMyMatches, recordSwipe } from "@/lib/discoverProfiles";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useTier } from "@/providers/TierProvider";
import { useLikes } from "@/providers/LikesProvider";
import { auth } from "@/lib/firebase";
import { blockUser } from "@/providers/BlockProvider";
import { useActiveLabel } from "@/lib/presence";
import { NewBadge } from "@/components/NewBadge";
import { unmatchUser } from "@/lib/discoverProfiles";
import { dialectText, lookingForText } from "@/lib/profileLabels";
import OptionsSheet, { type SheetOption } from "@/components/OptionsSheet";
import RedBackground from "@/components/RedBackground";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PromptCards from "@/components/PromptCards";
import LikeCommentModal from "@/components/LikeCommentModal";
import { shareWithFamily } from "@/lib/shareProfile";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { byId, loading } = useAllProfiles();
  // NOTE: every hook must stay above the early returns below
  const { data } = useOnboarding();
  const myUid = auth.currentUser?.uid;
  const { isPaid } = useTier();
  const { consume: addLike } = useLikes();
  const { matchIds } = useMyMatches();
  const activeText = useActiveLabel(id);
  const [commentOpen, setCommentOpen] = useState<boolean>(false);
  const [menu, setMenu] = useState<SheetOption[] | null>(null);
  const ins = useSafeAreaInsets();

  // 1) Live Firestore lookup
  // 2) Mock fallback (during loading or for legacy mocked IDs)
  // 3) If the requested id is the current user (View Profile from settings),
  //    synthesize a Profile from the OnboardingProvider data
  let p: Profile | null = byId[id ?? ""] as Profile | undefined ?? mockProfiles.find(x => x.id === id) ?? null;
  if (!p && id && id === myUid) {
    const age = data.birthday ? calcAgeFromBirthday(data.birthday) : 0;
    p = {
      ...currentUser,
      id: myUid,
      name: data.name?.trim() || currentUser.name,
      age,
      clan: data.clan || currentUser.clan,
      bio: data.bio || currentUser.bio,
      photos: (data.photos && data.photos.length > 0) ? data.photos : currentUser.photos,
      interests: data.interests || currentUser.interests,
      languages: data.dialect === "other" ? (data.dialectOther ? [data.dialectOther] : []) : data.dialect ? [data.dialect] : currentUser.languages,
      lookingFor: data.lookingFor || currentUser.lookingFor,
      location: [data.hometownCity, data.hometownState].filter(Boolean).join(", ") || currentUser.location,
      verified: !!data.photoVerified,
      prompts: data.prompts ?? [],
    };
  }

  if (!p) {
    return (
      <View style={s.cen}>
        <RedBackground />
        <Stack.Screen options={{ headerShown: false }} />
        {loading ? <ActivityIndicator color="#FFF" size="large" /> : <Text style={s.err}>Profile not found</Text>}
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 14 }}>
          <Text style={{ color: Colors.goldLight, fontWeight: "700" as const }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMe = id === myUid;
  const profile = p;
  const uniqueInterests = Array.from(new Map((p.interests ?? []).map((i) => [i.trim().toLowerCase(), i.trim()])).values()).filter(Boolean);

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
    recordSwipe(profile.id, true, comment).then((res) => {
      if (res.ok && !res.isMatch) {
        Alert.alert("Liked", `We'll let you know if ${profile.name} likes you back.`);
      }
    });
  };

  const openSafetyMenu = () => {
    if (!p || isMe) return;
    setMenu([
        { text: "Share with family", onPress: () => void shareWithFamily(p) },
        {
          text: "Report this user",
          style: "destructive",
          onPress: () =>
            router.push({
              pathname: "/report",
              params: { userId: p.id, userName: p.name },
            }),
        },
        ...(matchIds.includes(p.id)
          ? [{
              text: "Unmatch",
              style: "destructive" as const,
              onPress: () =>
                Alert.alert(`Unmatch ${p.name}?`, "Your chat will disappear for both of you. If you match again later, your messages come back.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Unmatch",
                    style: "destructive",
                    onPress: async () => {
                      if (!(await unmatchUser(p.id))) { Alert.alert("Couldn't unmatch", "Please try again."); return; }
                      router.back();
                    },
                  },
                ]),
            }]
          : []),
        {
          text: "Block this user",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              `Block ${p.name}?`,
              "You won't see them again and they won't see you.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Block",
                  style: "destructive",
                  onPress: async () => {
                    if (!myUid) return;
                    const ok = await blockUser(myUid, p);
                    if (!ok) { Alert.alert("Couldn't block", "Please try again."); return; }
                    Alert.alert("Blocked", `${p.name} has been blocked. You can unblock them in Settings.`);
                    router.back();
                  },
                },
              ]
            ),
        },
      ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.ct}>
      <RedBackground />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.ph}>
          <PhotoCarousel key={p.id} photos={p.photos} />
          <View style={[s.topBar, { top: ins.top + 8 }]}>
            <TouchableOpacity onPress={() => router.back()} style={s.topBtn} testID="profile-back">
              <ArrowLeft size={22} color="#FFF" />
            </TouchableOpacity>
            {!isMe && (
              <TouchableOpacity onPress={openSafetyMenu} style={s.topBtn} testID="safety-menu-btn">
                <MoreVertical size={22} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
          <View style={s.pf} pointerEvents="none">
            <View style={s.nr}>
              <Text style={s.nm}>{p.name}{p.age ? `, ${p.age}` : ""}</Text>
              <VerifiedBadge verified={!!p.verified} size={22} />
              <NewBadge createdAtMs={p.createdAtMs} inline />
            </View>
            {p.clan && p.clan !== "—" ? <View style={s.clanPill}><Text style={s.cl}>{p.clan} Clan</Text></View> : null}
            {!isMe && activeText ? (
              <View style={s.activeRow} testID="profile-active-status">
                {activeText === "Active now" && <View style={s.activeDot} />}
                <Text style={s.activeTxt}>{activeText}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={s.cn}>
          <View style={s.ab}>
            <TouchableOpacity style={s.pb} onPress={() => router.back()} testID="back-from-profile">
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            {!isMe && (
              <TouchableOpacity
                style={s.mb}
                onPress={onMessage}
                testID="profile-message-btn"
              >
                <MessageCircle size={24} color="#FFF" />
                <Text style={s.mt}>Message</Text>
              </TouchableOpacity>
            )}
            {!isMe && (
              <TouchableOpacity style={s.lb} onPress={() => onLike()} testID="profile-like-btn">
                <Heart size={24} color={Colors.like} />
              </TouchableOpacity>
            )}
            {isMe && (
              <TouchableOpacity style={s.mb} onPress={() => router.push("/edit-profile")} testID="edit-from-view">
                <Text style={s.mt}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
          {!isMe && (
            <TouchableOpacity onPress={() => setCommentOpen(true)} style={s.commentLink} testID="profile-like-comment">
              <Text style={s.commentLinkText}>Add a comment with your like</Text>
            </TouchableOpacity>
          )}
          {p.bio ? (
            <View style={[s.glass, s.se]}><Text style={s.st}>ABOUT</Text><Text style={s.bt}>{p.bio}</Text></View>
          ) : null}
          <PromptCards prompts={p.prompts} name={p.name} dark onLike={isMe ? undefined : (c) => onLike(c)} />
          <View style={s.se}>
            <Text style={[s.st, { marginLeft: 4 }]}>DETAILS</Text>
            <View style={[s.glass, s.dc]}>
              <View style={s.di}><MapPin size={16} color={Colors.gold} /><Text style={s.dt}>{p.location}{p.distance ? ` · ${p.distance}` : ""}</Text></View>
              {dialectText(p.languages) ? <View style={s.di}><Globe size={16} color={Colors.gold} /><Text style={s.dt} testID="profile-dialect">{dialectText(p.languages)}</Text></View> : null}
              {p.lookingFor ? <View style={s.di}><Heart size={16} color={Colors.gold} /><Text style={s.dt} testID="profile-looking-for">{lookingForText(p.lookingFor)}</Text></View> : null}
            </View>
          </View>
          {uniqueInterests.length ? (
            <View style={s.se}>
              <Text style={[s.st, { marginLeft: 4 }]}>INTERESTS</Text>
              <View style={s.ir}>{uniqueInterests.map(i => <View key={i} style={s.ic}><Text style={s.it}>{i}</Text></View>)}</View>
            </View>
          ) : null}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
      </View>
      <OptionsSheet visible={!!menu} title={p.name} subtitle="What would you like to do?" options={menu ?? []} onClose={() => setMenu(null)} />
      <LikeCommentModal visible={commentOpen} name={p.name} onClose={() => setCommentOpen(false)} onSend={(c) => { setCommentOpen(false); onLike(c); }} />
    </>
  );
}

function calcAgeFromBirthday(b: string): number {
  // Accepts "MM/DD/YYYY" or "YYYY-MM-DD"
  let d: Date | null = null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(b)) {
    const [m, day, y] = b.split("/").map(Number);
    d = new Date(y, m - 1, day);
  } else if (/^\d{4}-\d{2}-\d{2}/.test(b)) {
    d = new Date(b);
  }
  if (!d) return 0;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.indigo },
  cen: { flex: 1, justifyContent: "center" as const, alignItems: "center" as const, backgroundColor: Colors.indigo },
  err: { fontSize: 16, color: "rgba(255,255,255,0.75)" },
  ph: { position: "relative" as const, backgroundColor: "#000", borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" as const },
  topBar: { position: "absolute" as const, left: 16, right: 16, flexDirection: "row" as const, justifyContent: "space-between" as const },
  topBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center" as const, justifyContent: "center" as const },
  pf: { position: "absolute" as const, bottom: 22, left: 20, right: 20 },
  nr: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, flexWrap: "wrap" as const },
  nm: { fontSize: 34, fontWeight: "800" as const, color: "#FFF", letterSpacing: -0.8, textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },
  clanPill: { alignSelf: "flex-start" as const, marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(212,168,67,0.9)" },
  cl: { fontSize: 13, fontWeight: "800" as const, color: Colors.indigo, letterSpacing: 0.4 },
  cn: { paddingHorizontal: 18, paddingTop: 20 },
  activeRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginTop: 8 },
  activeDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.online },
  activeTxt: { color: "#FFF", fontSize: 13, fontWeight: "600" as const, textShadowColor: "rgba(0,0,0,0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  ab: { flexDirection: "row" as const, justifyContent: "center" as const, alignItems: "center" as const, gap: 16, marginBottom: 22 },
  pb: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", justifyContent: "center" as const, alignItems: "center" as const },
  mb: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, backgroundColor: Colors.crimson, paddingHorizontal: 28, paddingVertical: 15, borderRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  mt: { color: "#FFF", fontSize: 16, fontWeight: "800" as const },
  lb: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#FFF", justifyContent: "center" as const, alignItems: "center" as const },
  glass: { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", borderRadius: 20, padding: 18 },
  se: { marginBottom: 18 },
  commentLink: { alignSelf: "center" as const, marginTop: -8, marginBottom: 20, paddingVertical: 6 },
  commentLinkText: { color: Colors.goldLight, fontWeight: "700" as const, fontSize: 14 },
  // Website: section titles and text share one size and color
  st: Platform.OS === "web" ? { fontSize: 15, fontWeight: "800" as const, color: "#FFF", letterSpacing: 0.4, marginBottom: 8 } : { fontSize: 12, fontWeight: "800" as const, color: Colors.goldLight, letterSpacing: 1.6, marginBottom: 10 },
  bt: Platform.OS === "web" ? { fontSize: 15, color: "#FFF", lineHeight: 23, fontWeight: "500" as const } : { fontSize: 17, color: "#FFF", lineHeight: 26, fontWeight: "500" as const },
  dc: { gap: 14 },
  di: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12 },
  dt: { fontSize: 15, color: "#FFF", flex: 1, fontWeight: "600" as const },
  ir: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  ic: { backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(212,168,67,0.45)", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  it: { fontSize: 14, fontWeight: "700" as const, color: "#FFF" },
});
