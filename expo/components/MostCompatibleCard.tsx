import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAllProfiles, fitsSeeking, passesPrefs } from "@/lib/discoverProfiles";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useBlocks } from "@/providers/BlockProvider";
import { mostCompatibleToday } from "@/lib/compatibility";
import { auth } from "@/lib/firebase";

/** Today's single best-fit profile (free for everyone, changes daily). */
export default function MostCompatibleCard() {
  const router = useRouter();
  const { byId } = useAllProfiles();
  const { data } = useOnboarding();
  const { hidden } = useBlocks();
  const myUid = auth.currentUser?.uid;

  const pick = useMemo(() => {
    const prefs = { myClan: data.clan, hideSameClan: data.hideSameClan, verifiedOnly: data.verifiedOnly };
    const list = Object.values(byId).filter(
      (p) => p.id !== myUid && !p.id.startsWith("seed-") && p.photos.length > 0 && !hidden.has(p.id) && fitsSeeking(data.seeking, p.genders) && passesPrefs(p, prefs)
    );
    return mostCompatibleToday(data, list);
  }, [byId, data, hidden, myUid]);

  if (!pick) return null;
  const p = pick.profile;
  return (
    <TouchableOpacity style={s.card} activeOpacity={0.9} onPress={() => router.push(`/user/${p.id}`)} testID="most-compatible-card">
      <Image source={{ uri: p.photos[0] }} style={s.photo} contentFit="cover" />
      <View style={s.body}>
        <View style={s.tagRow}>
          <Sparkles size={14} color={Colors.gold} />
          <Text style={s.tag}>Today's Most Compatible</Text>
        </View>
        <Text style={s.name} numberOfLines={1}>{p.name}{p.age ? `, ${p.age}` : ""}</Text>
        <Text style={s.reason} numberOfLines={2}>{pick.reasons.slice(0, 2).join(" · ") || "Picked for you today"}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: "row", gap: 14, padding: 12, borderRadius: 20, backgroundColor: "rgba(15,6,31,0.55)", borderWidth: 1, borderColor: "rgba(212,168,67,0.5)", marginTop: 16 },
  photo: { width: 84, height: 104, borderRadius: 14 },
  body: { flex: 1, justifyContent: "center" },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tag: { color: Colors.gold, fontSize: 12, fontWeight: "800" as const, letterSpacing: 0.5, textTransform: "uppercase" as const },
  name: { color: "#FFF", fontSize: 20, fontWeight: "800" as const, marginTop: 6 },
  reason: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 },
});
