import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ArrowLeft, BadgeCheck, MapPin, Users, Plus, Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import { profiles as mockProfiles, currentUser, Profile } from "@/mocks/profiles";
import { useAllProfiles } from "@/lib/discoverProfiles";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";
import { auth } from "@/lib/firebase";

const SW = Dimensions.get("window").width;
const CW = (SW - 16 * 2 - 12) / 2;

const CATEGORY_MAP: Record<string, { match: (p: Profile) => boolean; subtitle: string }> = {
  "Foodies": { match: p => p.interests.some(i => /food|cook|pho|bbq/i.test(i)), subtitle: "People who love great food" },
  "Music Lovers": { match: p => p.interests.some(i => /music|qeej/i.test(i)), subtitle: "Share your playlist" },
  "Creatives": { match: p => p.interests.some(i => /art|design|film|photo|cloth|paj|embroidery/i.test(i)), subtitle: "Artists, designers, makers" },
  "Sporty": { match: p => p.interests.some(i => /sport|soccer|volley|basket|fitness/i.test(i)), subtitle: "Stay active together" },
  "Hmong New Year": { match: p => p.interests.some(i => /hmong|qeej|paj|dance|story/i.test(i)) || /hmong/i.test(p.bio), subtitle: "Celebrate our culture" },
  "Speaks Hmong": { match: p => p.languages.some(l => /hmong/i.test(l)), subtitle: "Hmong-speaking community" },
  "Family First": { match: p => /family/i.test(p.bio) || /family|clan|traditions/i.test(p.interests.join(" ")), subtitle: "Family-oriented people" },
  "Outdoors & Hunting": { match: p => p.interests.some(i => /fish|hiking|camping|outdoor|hunting/i.test(i)), subtitle: "Adventurous spirits" },
  "Travel": { match: p => p.interests.some(i => /travel|road trip/i.test(i)), subtitle: "Wanderers unite" },
  // Relationship goals — match user's stored lookingFor ID OR descriptive label
  "Long-term partner": {
    match: p => /^long$/i.test(p.lookingFor) || /long.?term|relationship|marriage|serious/i.test(p.lookingFor),
    subtitle: "Looking for something serious",
  },
  "Long-term, open to short": {
    match: p => /long.?open|long.?term.?open/i.test(p.lookingFor),
    subtitle: "Long-term — but flexible",
  },
  "Short-term, open to long": {
    match: p => /short.?open|short.?term.?open/i.test(p.lookingFor),
    subtitle: "Short-term — but open to more",
  },
  "Short-term fun": {
    match: p => /^short$/i.test(p.lookingFor) || /short.?term|casual|fun/i.test(p.lookingFor),
    subtitle: "Keep it casual",
  },
  "Serious Daters": { match: p => /relationship|marriage|long/i.test(p.lookingFor), subtitle: "Dating with intention" },
};

// Maps a Relationship Goals card label to its OnboardingData.lookingFor ID
const RELATIONSHIP_LABEL_TO_ID: Record<string, string> = {
  "Long-term partner": "long",
  "Long-term, open to short": "long-open",
  "Short-term, open to long": "short-open",
  "Short-term fun": "short",
};

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const title = decodeURIComponent(id ?? "");
  const { data, update } = useOnboarding();
  const { byId: liveById } = useAllProfiles();
  // The user belongs to a Relationship Goals card if their lookingFor ID matches;
  // otherwise it's an interests-based category.
  const inCategory = (() => {
    const relationshipId = RELATIONSHIP_LABEL_TO_ID[title];
    if (relationshipId) return data.lookingFor === relationshipId;
    return (data.interests ?? []).includes(title);
  })();

  const { filtered, subtitle } = useMemo(() => {
    const entry = CATEGORY_MAP[title];
    // Prefer live Firestore profiles; fall back to mocks if empty during load
    const liveList = Object.values(liveById);
    const all: Profile[] = liveList.length > 0 ? liveList : mockProfiles;
    // Exclude current user from the base list (we'll add them at the top if they match)
    const myUid = auth.currentUser?.uid;
    const baseFull = myUid ? all.filter((p) => p.id !== myUid) : all;
    const base = entry ? baseFull.filter(entry.match) : baseFull;
    const sub = entry?.subtitle ?? t("peopleInterested");
    if (inCategory) {
      const meLive = myUid ? liveById[myUid] : null;
      const me: Profile = meLive
        ? {
            ...meLive,
            name: (data.name?.trim() || meLive.name) + " (You)",
            photos: (data.photos && data.photos.length > 0) ? data.photos : meLive.photos,
            bio: data.bio ?? meLive.bio,
          }
        : {
            ...currentUser,
            name: (data.name?.trim() || currentUser.name) + " (You)",
            photos: (data.photos && data.photos.length > 0) ? data.photos : currentUser.photos,
            bio: data.bio ?? currentUser.bio,
          };
      return { filtered: [me, ...base], subtitle: sub };
    }
    return { filtered: base, subtitle: sub };
  }, [title, inCategory, data, liveById]);

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back} testID="category-back">
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          <View style={s.metaRow}>
            <Users size={13} color={Colors.accent} />
            <Text style={s.meta}>{filtered.length} {filtered.length === 1 ? t("person") : t("people")}</Text>
          </View>
        </View>
      </View>
      <Text style={s.sub}>{subtitle}</Text>
      <TouchableOpacity
        onPress={() => {
          const relationshipId = RELATIONSHIP_LABEL_TO_ID[title];
          if (relationshipId) {
            // Relationship Goals card → toggle lookingFor instead of interests
            update({ lookingFor: inCategory ? undefined : (relationshipId as any) });
          } else {
            const cur = data.interests ?? [];
            const next = inCategory ? cur.filter(x => x !== title) : [...cur, title];
            update({ interests: next });
          }
        }}
        activeOpacity={0.85}
        style={[s.addSelf, inCategory && s.addSelfOn]}
        testID="add-self-category"
      >
        {inCategory ? <Check size={16} color="#FFF" /> : <Plus size={16} color="#FFF" />}
        <Text style={s.addSelfText}>{inCategory ? t("youreInCategory") : t("addSelfCategory")}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>{t("noOneHere")}</Text>
            <Text style={s.emptySub}>{t("noOneHereSub")}</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {filtered.map(p => (
              <TouchableOpacity key={p.id} style={[s.card, { width: CW }]} activeOpacity={0.85} onPress={() => router.push(`/user/${p.id}`)} testID={`cat-profile-${p.id}`}>
                <Image source={{ uri: p.photos[0] }} style={s.img} contentFit="cover" />
                {p.isOnline && <View style={s.onlineDot} />}
                <View style={s.info}>
                  <View style={s.nameRow}>
                    <Text style={s.name} numberOfLines={1}>{p.name}, {p.age}</Text>
                    {p.verified && <BadgeCheck size={14} color="#4A90D9" fill="#4A90D9" />}
                  </View>
                  <View style={s.locRow}>
                    <MapPin size={11} color="rgba(255,255,255,0.75)" />
                    <Text style={s.loc} numberOfLines={1}>{p.distance}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center" },
  title: { color: "#FFF", fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  meta: { color: Colors.accent, fontSize: 12, fontWeight: "700" as const },
  sub: { color: "rgba(255,255,255,0.55)", fontSize: 13, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  scroll: { paddingHorizontal: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { height: CW * 1.4, borderRadius: 16, overflow: "hidden", backgroundColor: "#111" },
  img: { ...StyleSheet.absoluteFillObject },
  ov: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%", backgroundColor: "rgba(0,0,0,0.5)" },
  gradOv: { position: "absolute", left: 0, right: 0, bottom: 0, height: "40%", backgroundColor: "rgba(0,0,0,0.55)" },
  onlineDot: { position: "absolute", top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.online, borderWidth: 2, borderColor: "#000" },
  info: { position: "absolute", left: 10, right: 10, bottom: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { color: "#FFF", fontSize: 15, fontWeight: "800" as const, flexShrink: 1 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  loc: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" as const },
  emptySub: { color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 6, textAlign: "center" as const, paddingHorizontal: 40 },
  addSelf: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.crimson, paddingVertical: 12, borderRadius: 999 },
  addSelfOn: { backgroundColor: "#1f7a47" },
  addSelfText: { color: "#FFF", fontSize: 14, fontWeight: "800" as const },
});
