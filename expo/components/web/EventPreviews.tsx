import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { MapPin, Clock, Users } from "lucide-react-native";
import { db } from "@/lib/firebase";

type PublicEvent = { id: string; title: string; description: string; venue: string; city: string; state: string; timeText: string; startsAt: number; goingCount: number };

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Manrope', 'Helvetica Neue', Arial, sans-serif";
const GOLD = "#E8C27A";

function usePublicEvents() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  useEffect(() => {
    getDocs(query(collection(db, "publicEvents"), where("startsAt", ">", Date.now()), orderBy("startsAt", "asc"), limit(6)))
      .then((snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PublicEvent, "id">) }))))
      .catch((e) => console.log("[landing] events error", e));
  }, []);
  return events;
}

function EventCard({ e, onJoin, wide }: { e: PublicEvent; onJoin: () => void; wide: boolean }) {
  const [hover, setHover] = useState<boolean>(false);
  const d = new Date(e.startsAt);
  const place = [e.venue, [e.city, e.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
  return (
    <Pressable onPress={onJoin} onHoverIn={() => setHover(true)} onHoverOut={() => setHover(false)} style={[s.card, wide && s.cardWide, hover && s.cardHover]} testID={`landing-event-${e.id}`}>
      <View style={s.date}>
        <Text style={s.month}>{d.toLocaleString("en-US", { month: "short" }).toUpperCase()}</Text>
        <Text style={s.day}>{d.getDate()}</Text>
        <Text style={s.year}>{d.getFullYear()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={2}>{e.title}</Text>
        {place ? <View style={s.row}><MapPin size={14} color={GOLD} /><Text style={s.meta} numberOfLines={1}>{place}</Text></View> : null}
        {e.timeText ? <View style={s.row}><Clock size={14} color={GOLD} /><Text style={s.meta}>{e.timeText}</Text></View> : null}
        {e.description ? <Text style={s.desc} numberOfLines={2}>{e.description}</Text> : null}
        <View style={s.foot}>
          <View style={s.going} testID={`landing-event-going-${e.id}`}><Users size={14} color="#2A0710" /><Text style={s.goingTxt}>{e.goingCount} going</Text></View>
          <Text style={s.link}>See who's going →</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function EventPreviews({ wide, onJoin }: { wide: boolean; onJoin: () => void }) {
  const events = usePublicEvents();
  if (events.length === 0) return null;
  return (
    <View style={{ marginTop: 120 }} testID="landing-events">
      <Text style={s.eyebrow}>UPCOMING EVENTS</Text>
      <Text style={[s.h2, { fontSize: wide ? 46 : 34 }]}>Meet the community <Text style={s.accent}>in person.</Text></Text>
      <Text style={s.sub}>New Year celebrations, festivals and meetups. Join free to RSVP, see who's going and say hi before you get there.</Text>
      <View style={[s.list, wide && { flexDirection: "row", flexWrap: "wrap" }]}>
        {events.map((e) => <EventCard key={e.id} e={e} onJoin={onJoin} wide={wide} />)}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  eyebrow: { color: GOLD, fontFamily: SANS, fontWeight: "700", letterSpacing: 3, fontSize: 12, textAlign: "center" },
  h2: { color: "#FFF", fontFamily: SERIF, fontWeight: "600", textAlign: "center", marginTop: 14 },
  accent: { color: GOLD, fontStyle: "italic", fontFamily: SERIF },
  sub: { color: "rgba(255,255,255,0.75)", fontFamily: SANS, fontSize: 16, lineHeight: 25, textAlign: "center", marginTop: 14, maxWidth: 620, alignSelf: "center" },
  list: { gap: 20, marginTop: 44, justifyContent: "center" },
  card: { flexDirection: "row", gap: 20, padding: 22, borderRadius: 24, backgroundColor: "rgba(20,2,8,0.45)", borderWidth: 1, borderColor: "rgba(232,194,122,0.25)", backdropFilter: "blur(14px)", transitionProperty: "transform, border-color", transitionDuration: "300ms", cursor: "pointer" } as object,
  cardWide: { width: "48%", minWidth: 420 } as object,
  cardHover: { transform: [{ translateY: -4 }], borderColor: "rgba(232,194,122,0.7)" },
  date: { width: 84, paddingVertical: 12, borderRadius: 18, alignItems: "center", borderWidth: 1, borderColor: "rgba(232,194,122,0.5)", backgroundColor: "rgba(232,194,122,0.08)", alignSelf: "flex-start" },
  month: { color: GOLD, fontFamily: SANS, fontWeight: "800", fontSize: 12, letterSpacing: 2 },
  day: { color: "#FFF", fontFamily: SERIF, fontSize: 36, fontWeight: "600", lineHeight: 42 },
  year: { color: "rgba(255,255,255,0.55)", fontFamily: SANS, fontSize: 11 },
  title: { color: "#FFF", fontFamily: SERIF, fontSize: 22, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  meta: { color: "rgba(255,255,255,0.8)", fontFamily: SANS, fontSize: 14, flexShrink: 1 },
  desc: { color: "rgba(255,255,255,0.6)", fontFamily: SANS, fontSize: 13, lineHeight: 19, marginTop: 10 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, gap: 10 },
  going: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  goingTxt: { color: "#2A0710", fontFamily: SANS, fontWeight: "800", fontSize: 13 },
  link: { color: GOLD, fontFamily: SANS, fontWeight: "700", fontSize: 14 },
});
