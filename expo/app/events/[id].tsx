import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { MapPin, CalendarDays, Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useApprovedEvents, usePendingEvents, useMyEvents, useIsAdmin, setGoing, reviewEvent, removeEvent } from "@/lib/events";
import { useAllProfiles } from "@/lib/discoverProfiles";
import { useBlocks } from "@/providers/BlockProvider";
import { auth } from "@/lib/firebase";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const approved = useApprovedEvents();
  const pending = usePendingEvents(isAdmin);
  const mine = useMyEvents();
  const { byId } = useAllProfiles();
  const { hidden } = useBlocks();
  const me = auth.currentUser?.uid ?? "";
  const e = [...approved, ...pending, ...mine].find((x) => x.id === id);

  if (!e) return (<><Stack.Screen options={{ title: "Event" }} /><View style={s.cen}><Text style={s.muted}>Loading event…</Text></View></>);

  const going = e.going.includes(me);
  const attendees = e.going.filter((u) => u !== me && !hidden.has(u)).map((u) => byId[u]).filter((p): p is NonNullable<typeof p> => !!p && p.photos.length > 0);

  const review = (status: "approved" | "rejected") => reviewEvent(e.id, status).then(() => router.back()).catch(() => Alert.alert("Couldn't update", "Please try again."));
  const del = () => Alert.alert("Delete event?", "This can't be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => removeEvent(e.id).then(() => router.back()).catch(() => Alert.alert("Couldn't delete", "Please try again.")) },
  ]);

  return (
    <>
      <Stack.Screen options={{ title: "Event" }} />
      <ScrollView style={s.ct} contentContainerStyle={s.scroll} testID="event-detail">
        {e.status !== "approved" ? <Text style={s.status} testID="event-status">{e.status === "pending" ? "Waiting for approval" : "Not approved"}</Text> : null}
        <Text style={s.title}>{e.title}</Text>
        <View style={s.meta}><CalendarDays size={16} color={Colors.primary} /><Text style={s.metaText}>{new Date(e.startsAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}{e.timeText ? ` · ${e.timeText}` : ""}</Text></View>
        <View style={s.meta}><MapPin size={16} color={Colors.primary} /><Text style={s.metaText}>{[e.venue, e.city, e.state].filter(Boolean).join(", ")}</Text></View>
        {e.description ? <Text style={s.desc}>{e.description}</Text> : null}

        {e.status === "approved" && (
          <TouchableOpacity style={[s.goBtn, going && s.goBtnOn]} onPress={() => void setGoing(e.id, !going)} testID="event-going-toggle">
            {going ? <Check size={18} color={Colors.primary} /> : null}
            <Text style={[s.goText, going && s.goTextOn]}>{going ? "You're going" : "I'm going"}</Text>
          </TouchableOpacity>
        )}

        {isAdmin && e.status === "pending" && (
          <View style={s.adminRow}>
            <TouchableOpacity style={[s.adminBtn, { backgroundColor: Colors.like }]} onPress={() => review("approved")} testID="event-approve"><Text style={s.adminText}>Approve</Text></TouchableOpacity>
            <TouchableOpacity style={[s.adminBtn, { backgroundColor: Colors.nope }]} onPress={() => review("rejected")} testID="event-reject"><Text style={s.adminText}>Reject</Text></TouchableOpacity>
          </View>
        )}
        {(isAdmin || e.createdBy === me) && (
          <TouchableOpacity onPress={del} style={{ marginTop: 16 }} testID="event-delete"><Text style={s.delete}>Delete event</Text></TouchableOpacity>
        )}

        {e.status === "approved" && (
          <View style={{ marginTop: 28 }}>
            <Text style={s.sec}>Who's going ({e.going.length})</Text>
            {!going && attendees.length > 0 ? <Text style={s.muted}>Tap "I'm going" to see who else will be there.</Text> : null}
            {going && attendees.length === 0 ? <Text style={s.muted}>No one else yet. Check back closer to the date.</Text> : null}
            {going && (
              <View style={s.grid}>
                {attendees.map((p) => (
                  <TouchableOpacity key={p.id} style={s.person} onPress={() => router.push(`/user/${p.id}`)} testID={`attendee-${p.id}`}>
                    <Image source={{ uri: p.photos[0] }} style={s.avatar} contentFit="cover" />
                    <Text style={s.pName} numberOfLines={1}>{p.name}{p.age ? `, ${p.age}` : ""}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 60 },
  cen: { flex: 1, alignItems: "center", justifyContent: "center" },
  status: { alignSelf: "flex-start", color: Colors.primary, backgroundColor: "#fbeaec", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontWeight: "800" as const, fontSize: 12, marginBottom: 10, overflow: "hidden" },
  title: { fontSize: 26, fontWeight: "800" as const, color: Colors.text },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  metaText: { color: Colors.text, fontSize: 15, flex: 1 },
  desc: { marginTop: 16, color: Colors.textSecondary, fontSize: 15, lineHeight: 22 },
  goBtn: { marginTop: 22, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, borderRadius: 999, paddingVertical: 15, borderWidth: 2, borderColor: Colors.primary },
  goBtnOn: { backgroundColor: "#FFF" },
  goText: { color: "#FFF", fontWeight: "800" as const, fontSize: 15 },
  goTextOn: { color: Colors.primary },
  adminRow: { flexDirection: "row", gap: 10, marginTop: 22 },
  adminBtn: { flex: 1, borderRadius: 999, paddingVertical: 14, alignItems: "center" },
  adminText: { color: "#FFF", fontWeight: "800" as const },
  delete: { color: Colors.nope, fontWeight: "700" as const, textAlign: "center" },
  sec: { fontSize: 17, fontWeight: "800" as const, color: Colors.text, marginBottom: 8 },
  muted: { color: Colors.textSecondary, fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 },
  person: { width: 96, alignItems: "center" },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  pName: { marginTop: 6, fontSize: 13, color: Colors.text, fontWeight: "600" as const },
});
