import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { CalendarDays, MapPin, Plus, ShieldCheck, Users } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useApprovedEvents, usePendingEvents, useMyEvents, useIsAdmin, type HmongEvent } from "@/lib/events";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { usePendingCards, reviewCard } from "@/lib/interestCards";
import { CATEGORY_GROUPS } from "@/constants/categories";

export function EventRow({ e, onPress, badge }: { e: HmongEvent; onPress: () => void; badge?: string }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} testID={`event-${e.id}`}>
      <View style={s.dateBox}>
        <Text style={s.dateMon}>{new Date(e.startsAt).toLocaleString("en-US", { month: "short" }).toUpperCase()}</Text>
        <Text style={s.dateDay}>{new Date(e.startsAt).getDate()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>{e.title}</Text>
        <View style={s.meta}><MapPin size={13} color={Colors.textSecondary} /><Text style={s.metaText} numberOfLines={1}>{[e.venue, e.city, e.state].filter(Boolean).join(", ")}</Text></View>
        <View style={s.meta}><Users size={13} color={Colors.textSecondary} /><Text style={s.metaText}>{e.going.length} going{e.timeText ? ` · ${e.timeText}` : ""}</Text></View>
      </View>
      {badge ? <Text style={s.badge}>{badge}</Text> : null}
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const isAdmin = useIsAdmin();
  const approved = useApprovedEvents();
  const pending = usePendingEvents(isAdmin);
  const mine = useMyEvents();
  const pendingCards = usePendingCards(isAdmin);
  const review = (id: string, status: "approved" | "rejected") => reviewCard(id, status).catch(() => Alert.alert("Couldn't update", "Please try again."));
  const [nearOnly, setNearOnly] = useState<boolean>(false);

  const todayStart = new Date().setHours(0, 0, 0, 0);
  const upcoming = useMemo(
    () => approved.filter((e) => e.startsAt >= todayStart && (!nearOnly || !data.hometownState || e.state.toLowerCase() === data.hometownState.toLowerCase())),
    [approved, todayStart, nearOnly, data.hometownState]
  );
  const myPending = mine.filter((e) => e.status !== "approved");

  return (
    <>
      <Stack.Screen options={{ title: "Hmong Events" }} />
      <ScrollView style={s.ct} contentContainerStyle={s.scroll} testID="events-screen">
        <Text style={s.h1}>Community events</Text>
        <Text style={s.sub}>Hmong New Year celebrations, festivals and meetups. Tap "I'm going" to see who else will be there.</Text>

        <View style={s.actions}>
          <TouchableOpacity style={s.suggest} onPress={() => router.push("/events/new")} testID="events-suggest">
            <Plus size={18} color="#FFF" />
            <Text style={s.suggestText}>Suggest an event</Text>
          </TouchableOpacity>
          {data.hometownState ? (
            <TouchableOpacity style={[s.chip, nearOnly && s.chipOn]} onPress={() => setNearOnly((v) => !v)} testID="events-near-toggle">
              <Text style={[s.chipText, nearOnly && s.chipTextOn]}>{data.hometownState} only</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {isAdmin && pendingCards.length > 0 && (
          <View style={s.section} testID="requested-cards">
            <View style={s.secHead}><ShieldCheck size={16} color={Colors.primary} /><Text style={s.secTitle}>Requested Interest cards ({pendingCards.length})</Text></View>
            {pendingCards.map((c) => (
              <View key={c.id} style={s.reqRow} testID={`requested-card-${c.id}`}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{c.label}</Text>
                  <Text style={s.metaText}>In {CATEGORY_GROUPS.find((g) => g.id === c.groupId)?.title ?? c.groupId}</Text>
                </View>
                <TouchableOpacity style={[s.reqBtn, { backgroundColor: Colors.like }]} onPress={() => review(c.id, "approved")} testID={`approve-card-${c.id}`}><Text style={s.reqBtnText}>Approve</Text></TouchableOpacity>
                <TouchableOpacity style={[s.reqBtn, { backgroundColor: Colors.nope }]} onPress={() => review(c.id, "rejected")} testID={`reject-card-${c.id}`}><Text style={s.reqBtnText}>Reject</Text></TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {isAdmin && pending.length > 0 && (
          <View style={s.section}>
            <View style={s.secHead}><ShieldCheck size={16} color={Colors.primary} /><Text style={s.secTitle}>Waiting for your approval ({pending.length})</Text></View>
            {pending.map((e) => <EventRow key={e.id} e={e} badge="Review" onPress={() => router.push(`/events/${e.id}`)} />)}
          </View>
        )}

        <View style={s.section}>
          <View style={s.secHead}><CalendarDays size={16} color={Colors.primary} /><Text style={s.secTitle}>Upcoming</Text></View>
          {upcoming.length === 0 ? <Text style={s.empty} testID="events-empty">No upcoming events yet. Know of one? Suggest it above.</Text> : upcoming.map((e) => <EventRow key={e.id} e={e} onPress={() => router.push(`/events/${e.id}`)} />)}
        </View>

        {myPending.length > 0 && (
          <View style={s.section}>
            <Text style={s.secTitle}>Your suggestions</Text>
            {myPending.map((e) => <EventRow key={e.id} e={e} badge={e.status === "pending" ? "Pending" : "Not approved"} onPress={() => router.push(`/events/${e.id}`)} />)}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 60 },
  h1: { fontSize: 26, fontWeight: "800" as const, color: Colors.text },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 10, marginTop: 18, alignItems: "center" },
  suggest: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: Colors.primary, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 18 },
  suggestText: { color: "#FFF", fontWeight: "800" as const },
  chip: { borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14 },
  chipOn: { backgroundColor: Colors.text, borderColor: Colors.text },
  chipText: { color: Colors.text, fontWeight: "600" as const },
  chipTextOn: { color: "#FFF" },
  section: { marginTop: 26 },
  secHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  secTitle: { fontSize: 17, fontWeight: "800" as const, color: Colors.text },
  empty: { color: Colors.textSecondary, fontSize: 14, paddingVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  dateBox: { width: 52, height: 56, borderRadius: 14, backgroundColor: "#fbeaec", alignItems: "center", justifyContent: "center" },
  dateMon: { color: Colors.primary, fontSize: 11, fontWeight: "800" as const },
  dateDay: { color: Colors.text, fontSize: 20, fontWeight: "800" as const },
  title: { fontSize: 16, fontWeight: "700" as const, color: Colors.text },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  metaText: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  reqBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  reqBtnText: { color: "#FFF", fontWeight: "800" as const, fontSize: 12 },
  badge: { color: Colors.primary, fontSize: 12, fontWeight: "800" as const },
});
