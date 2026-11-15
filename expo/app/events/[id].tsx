import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, CalendarDays, Check, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useApprovedEvents, usePendingEvents, useMyEvents, useIsAdmin, setRsvp, reviewEvent, removeEvent, type Rsvp } from "@/lib/events";
import { EventAttendees } from "@/components/EventAttendees";
import { EventComments } from "@/components/EventComments";
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
  const notGoing = e.notGoing.includes(me);
  const showingMe = going && !e.goingHidden.includes(me);
  const attendees = e.going.filter((u) => u !== me && !hidden.has(u) && !e.goingHidden.includes(u)).map((u) => byId[u]).filter((p): p is NonNullable<typeof p> => !!p && p.photos.length > 0);

  const people = Object.fromEntries(Object.entries(byId).map(([k, p]) => [k, { name: p.name, photo: p.photos[0] }]));
  const save = (r: Rsvp, show = true) => setRsvp(e.id, r, show).catch(() => Alert.alert("Couldn't update", "Please try again."));
  const tapGoing = () => {
    if (going) { void save(null); return; }
    Alert.alert("Show your profile at this event?", "People going can see you in \"Who's going\" and open your profile. You can change this anytime.", [
      { text: "Cancel", style: "cancel" },
      { text: "Keep me hidden", onPress: () => void save("going", false) },
      { text: "Show my profile", onPress: () => void save("going", true) },
    ]);
  };
  const tapNotGoing = () => void save(notGoing ? null : "notGoing");

  const review = (status: "approved" | "rejected") => reviewEvent(e.id, status).then(() => router.back()).catch(() => Alert.alert("Couldn't update", "Please try again."));
  const del = () => Alert.alert("Delete event?", "This can't be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => removeEvent(e.id).then(() => router.back()).catch(() => Alert.alert("Couldn't delete", "Please try again.")) },
  ]);

  return (
    <>
      <Stack.Screen options={{ title: "Event" }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView style={s.ct} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" testID="event-detail">
        {e.status !== "approved" ? <Text style={s.status} testID="event-status">{e.status === "pending" ? "Waiting for approval" : "Not approved"}</Text> : null}
        <Text style={s.title}>{e.title}</Text>
        <View style={s.meta}><CalendarDays size={16} color={Colors.primary} /><Text style={s.metaText}>{new Date(e.startsAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}{e.timeText ? ` · ${e.timeText}` : ""}</Text></View>
        <View style={s.meta}><MapPin size={16} color={Colors.primary} /><Text style={s.metaText}>{[e.venue, e.city, e.state].filter(Boolean).join(", ")}</Text></View>
        {e.description ? <Text style={s.desc}>{e.description}</Text> : null}

        {e.status === "approved" && (
          <View style={s.rsvpRow}>
            <TouchableOpacity style={[s.goBtn, going && s.goBtnOn]} onPress={tapGoing} testID="event-going-btn">
              {going ? <Check size={18} color="#FFF" /> : null}
              <Text style={[s.goText, going && s.goTextOn]}>{going ? "Going" : "I'm going"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.goBtn, s.notBtn, notGoing && s.notBtnOn]} onPress={tapNotGoing} testID="event-not-going-btn">
              {notGoing ? <X size={18} color="#FFF" /> : null}
              <Text style={[s.goText, s.notText, notGoing && s.goTextOn]}>{notGoing ? "Not going" : "Can't go"}</Text>
            </TouchableOpacity>
          </View>
        )}
        {e.status === "approved" && going && (
          <View style={s.showRow}>
            <Text style={s.showTxt}>Show my profile in "Who's going"</Text>
            <Switch value={showingMe} onValueChange={(v) => void save("going", v)} trackColor={{ true: Colors.primary, false: Colors.border }} thumbColor="#FFF" testID="event-show-profile-switch" />
          </View>
        )}
        {e.status === "approved" ? <Text style={s.counts} testID="event-rsvp-counts">{e.going.length} going · {e.notGoing.length} can't go</Text> : null}

        {isAdmin && e.status === "pending" && (
          <View style={s.adminRow}>
            <TouchableOpacity style={[s.adminBtn, { backgroundColor: Colors.like }]} onPress={() => review("approved")} testID="event-approve"><Text style={s.adminText}>Approve</Text></TouchableOpacity>
            <TouchableOpacity style={[s.adminBtn, { backgroundColor: Colors.nope }]} onPress={() => review("rejected")} testID="event-reject"><Text style={s.adminText}>Reject</Text></TouchableOpacity>
          </View>
        )}
        {(isAdmin || e.createdBy === me) && (
          <TouchableOpacity onPress={del} style={{ marginTop: 16 }} testID="event-delete"><Text style={s.delete}>Delete event</Text></TouchableOpacity>
        )}

        {e.status === "approved" && <EventAttendees total={e.going.length} attendees={attendees} canSee={going} />}
        {e.status === "approved" && <EventComments eventId={e.id} people={people} hidden={hidden} isAdmin={isAdmin} />}
      </ScrollView>
      </KeyboardAvoidingView>
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
  rsvpRow: { flexDirection: "row", gap: 10, marginTop: 22 },
  notBtn: { backgroundColor: "#FFF", borderColor: Colors.border },
  notBtnOn: { backgroundColor: Colors.textSecondary, borderColor: Colors.textSecondary },
  notText: { color: Colors.text },
  showRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingVertical: 6 },
  showTxt: { color: Colors.text, fontSize: 14, fontWeight: "600" as const, flex: 1 },
  counts: { marginTop: 10, color: Colors.textSecondary, fontSize: 13 },
  goBtn: { flex: 1, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, borderRadius: 999, paddingVertical: 15, borderWidth: 2, borderColor: Colors.primary },
  goBtnOn: { backgroundColor: Colors.like, borderColor: Colors.like },
  goText: { color: "#FFF", fontWeight: "800" as const, fontSize: 15 },
  goTextOn: { color: "#FFF" },
  adminRow: { flexDirection: "row", gap: 10, marginTop: 22 },
  adminBtn: { flex: 1, borderRadius: 999, paddingVertical: 14, alignItems: "center" },
  adminText: { color: "#FFF", fontWeight: "800" as const },
  delete: { color: Colors.nope, fontWeight: "700" as const, textAlign: "center" },
  muted: { color: Colors.textSecondary, fontSize: 14 },
});
