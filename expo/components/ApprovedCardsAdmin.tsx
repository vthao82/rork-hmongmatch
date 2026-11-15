import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Sparkles } from "lucide-react-native";
import Colors from "@/constants/colors";
import { CATEGORY_GROUPS } from "@/constants/categories";
import { useApprovedCards, generateCardPhoto, type SuggestedCard } from "@/lib/interestCards";

function CardRow({ c }: { c: SuggestedCard }) {
  const [busy, setBusy] = useState<boolean>(false);
  const group = CATEGORY_GROUPS.find((g) => g.id === c.groupId);
  const make = async () => {
    setBusy(true);
    try {
      await generateCardPhoto(c.id);
    } catch (e) {
      Alert.alert("Couldn't make the photo", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={s.row} testID={`approved-card-${c.id}`}>
      <Image source={{ uri: c.image || group?.cards[0]?.image }} style={[s.thumb, !c.image && { opacity: 0.45 }]} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>{c.label}</Text>
        <Text style={s.meta} numberOfLines={1}>{group?.title ?? c.groupId} · {c.image ? "AI photo" : "Using group photo"}</Text>
      </View>
      <TouchableOpacity style={s.btn} onPress={() => void make()} disabled={busy} testID={`generate-card-photo-${c.id}`}>
        {busy ? <ActivityIndicator color="#FFF" size="small" /> : <Sparkles size={14} color="#FFF" />}
        <Text style={s.btnTxt}>{busy ? "Making…" : c.image ? "Redo photo" : "Make photo"}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ApprovedCardsAdmin() {
  const cards = useApprovedCards();
  if (cards.length === 0) return null;
  return (
    <View style={{ marginTop: 26 }} testID="approved-cards-admin">
      <Text style={s.sec}>Approved Interest cards ({cards.length})</Text>
      <Text style={s.sub}>Tap "Make photo" to create an AI picture for the card (takes about 20 seconds).</Text>
      {cards.map((c) => <CardRow key={c.id} c={c} />)}
    </View>
  );
}

const s = StyleSheet.create({
  sec: { fontSize: 17, fontWeight: "800" as const, color: Colors.text },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  thumb: { width: 48, height: 60, borderRadius: 10, backgroundColor: "#eee" },
  title: { fontSize: 16, fontWeight: "700" as const, color: Colors.text },
  meta: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  btnTxt: { color: "#FFF", fontWeight: "800" as const, fontSize: 12 },
});
