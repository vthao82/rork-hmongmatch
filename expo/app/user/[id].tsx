import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { MapPin, Globe, Heart, MessageCircle, X } from "lucide-react-native";
import VerifiedBadge from "@/components/VerifiedBadge";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { profiles as mockProfiles, currentUser, type Profile } from "@/mocks/profiles";
import { useAllProfiles } from "@/lib/discoverProfiles";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { auth } from "@/lib/firebase";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { byId } = useAllProfiles();
  const { data } = useOnboarding();
  const myUid = auth.currentUser?.uid;

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
      languages: data.dialect ? [data.dialect] : currentUser.languages,
      lookingFor: data.lookingFor || currentUser.lookingFor,
      location: [data.hometownCity, data.hometownState].filter(Boolean).join(", ") || currentUser.location,
      verified: !!data.photoVerified,
    };
  }

  if (!p) {
    return (
      <View style={s.cen}>
        <Stack.Screen options={{ title: "Profile" }} />
        <Text style={s.err}>Profile not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 14 }}>
          <Text style={{ color: Colors.primary, fontWeight: "700" as const }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMe = id === myUid;

  return (
    <>
      <Stack.Screen options={{ title: isMe ? "Your Profile" : p.name }} />
      <ScrollView style={s.ct} showsVerticalScrollIndicator={false}>
        <View style={s.ph}>
          <Image source={{ uri: p.photos[0] }} style={s.pi} contentFit="cover" transition={300} />
          <View style={s.po} />
          <View style={s.pf}>
            <View style={s.nr}>
              <Text style={s.nm}>{p.name}{p.age ? `, ${p.age}` : ""}</Text>
              <VerifiedBadge verified={!!p.verified} size={22} />
            </View>
            {p.clan ? <Text style={s.cl}>{p.clan} Clan</Text> : null}
          </View>
        </View>
        <View style={s.cn}>
          <View style={s.ab}>
            <TouchableOpacity style={s.pb} onPress={() => router.back()} testID="back-from-profile">
              <X size={24} color={Colors.nope} />
            </TouchableOpacity>
            {!isMe && (
              <TouchableOpacity
                style={s.mb}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/chat/${p?.id}`); }}
              >
                <MessageCircle size={24} color="#FFF" />
                <Text style={s.mt}>Message</Text>
              </TouchableOpacity>
            )}
            {!isMe && (
              <TouchableOpacity style={s.lb}>
                <Heart size={24} color={Colors.like} />
              </TouchableOpacity>
            )}
            {isMe && (
              <TouchableOpacity style={s.mb} onPress={() => router.push("/edit-profile")} testID="edit-from-view">
                <Text style={s.mt}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
          {p.bio ? (
            <View style={s.se}><Text style={s.st}>About</Text><Text style={s.bt}>{p.bio}</Text></View>
          ) : null}
          <View style={s.se}>
            <Text style={s.st}>Details</Text>
            <View style={s.dc}>
              <View style={s.di}><MapPin size={16} color={Colors.primary} /><Text style={s.dt}>{p.location}{p.distance ? ` · ${p.distance}` : ""}</Text></View>
              {p.languages?.length ? <View style={s.di}><Globe size={16} color={Colors.primary} /><Text style={s.dt}>{p.languages.join(", ")}</Text></View> : null}
              {p.lookingFor ? <View style={s.di}><Heart size={16} color={Colors.primary} /><Text style={s.dt}>{p.lookingFor}</Text></View> : null}
            </View>
          </View>
          {p.interests?.length ? (
            <View style={s.se}>
              <Text style={s.st}>Interests</Text>
              <View style={s.ir}>{p.interests.map(i => <View key={i} style={s.ic}><Text style={s.it}>{i}</Text></View>)}</View>
            </View>
          ) : null}
          {p.photos.length > 1 ? (
            <View style={s.se}>
              <Text style={s.st}>More Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pr}>
                {p.photos.slice(1).map((ph, i) => <Image key={i} source={{ uri: ph }} style={s.ep} contentFit="cover" transition={200} />)}
              </ScrollView>
            </View>
          ) : null}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
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
  ct: { flex: 1, backgroundColor: Colors.background },
  cen: { flex: 1, justifyContent: "center" as const, alignItems: "center" as const, backgroundColor: Colors.background },
  err: { fontSize: 16, color: Colors.textSecondary },
  ph: { height: 400, position: "relative" as const },
  pi: { width: "100%", height: "100%" },
  po: { position: "absolute" as const, bottom: 0, left: 0, right: 0, height: "40%", backgroundColor: "rgba(0,0,0,0.3)" },
  pf: { position: "absolute" as const, bottom: 20, left: 20, right: 20 },
  nr: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  nm: { fontSize: 30, fontWeight: "700" as const, color: "#FFF" },
  cl: { fontSize: 16, fontWeight: "600" as const, color: Colors.accentLight, marginTop: 4 },
  cn: { paddingHorizontal: 20, paddingTop: 16 },
  ab: { flexDirection: "row" as const, justifyContent: "center" as const, alignItems: "center" as const, gap: 16, marginBottom: 24 },
  pb: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFF", justifyContent: "center" as const, alignItems: "center" as const },
  mb: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28 },
  mt: { color: "#FFF", fontSize: 16, fontWeight: "600" as const },
  lb: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFF", justifyContent: "center" as const, alignItems: "center" as const },
  se: { marginBottom: 24 },
  st: { fontSize: 18, fontWeight: "700" as const, color: Colors.text, marginBottom: 10 },
  bt: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },
  dc: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 14 },
  di: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10 },
  dt: { fontSize: 15, color: Colors.text },
  ir: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  ic: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  it: { fontSize: 14, fontWeight: "500" as const, color: Colors.text },
  pr: { gap: 10 },
  ep: { width: 200, height: 260, borderRadius: 16 },
});
