import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import type { Profile } from "@/mocks/profiles";
import { useTier } from "@/providers/TierProvider";
import { spendCategoryView, useCategoryViewsLeft, useResetsIn } from "@/lib/categoryViews";

export function EventAttendees({ total, attendees, canSee }: { total: number; attendees: Profile[]; canSee: boolean }) {
  const router = useRouter();
  const { isPaid } = useTier();
  const left = useCategoryViewsLeft(isPaid);
  const resetsIn = useResetsIn();

  const open = (id: string) => {
    if (!spendCategoryView(id, isPaid)) {
      Alert.alert("No free views left", `You've used today's free profile views. They reset in ${resetsIn}, or get Unlimited to keep looking.`, [
        { text: "Not now", style: "cancel" },
        { text: "Get Unlimited", onPress: () => router.push("/subscription") },
      ]);
      return;
    }
    router.push(`/user/${id}`);
  };

  return (
    <View style={{ marginTop: 28 }} testID="event-attendees">
      <Text style={s.sec}>Who's going ({total})</Text>
      {!canSee ? <Text style={s.muted}>Tap "Going" to see who else will be there.</Text> : null}
      {canSee && attendees.length === 0 ? <Text style={s.muted}>No one else is showing their profile yet. Check back closer to the date.</Text> : null}
      {canSee && !isPaid && attendees.length > 0 ? (
        <Text style={s.views} testID="event-views-left">{left > 0 ? `${left} free profile views left today` : `No free views left · resets in ${resetsIn}`}</Text>
      ) : null}
      {canSee && (
        <View style={s.grid}>
          {attendees.map((p) => (
            <TouchableOpacity key={p.id} style={s.person} onPress={() => open(p.id)} testID={`attendee-${p.id}`}>
              <Image source={{ uri: p.photos[0] }} style={s.avatar} contentFit="cover" />
              <Text style={s.pName} numberOfLines={1}>{p.name}{p.age ? `, ${p.age}` : ""}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  sec: { fontSize: 17, fontWeight: "800" as const, color: Colors.text, marginBottom: 8 },
  muted: { color: Colors.textSecondary, fontSize: 14 },
  views: { color: Colors.primary, fontSize: 13, fontWeight: "700" as const, marginBottom: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 },
  person: { width: 96, alignItems: "center" },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  pName: { marginTop: 6, fontSize: 13, color: Colors.text, fontWeight: "600" as const },
});
