import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { MapPin, Globe, Heart, MessageCircle, X } from "lucide-react-native";
import VerifiedBadge from "@/components/VerifiedBadge";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { profiles } from "@/mocks/profiles";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter();
  const p = profiles.find(x => x.id === id);
  if (!p) return <View style={s.cen}><Text style={s.err}>Profile not found</Text></View>;
  return (
    <><Stack.Screen options={{ title: p.name }} />
      <ScrollView style={s.ct} showsVerticalScrollIndicator={false}>
        <View style={s.ph}><Image source={{ uri: p.photos[0] }} style={s.pi} contentFit="cover" transition={300} /><View style={s.po} /><View style={s.pf}><View style={s.nr}><Text style={s.nm}>{p.name}, {p.age}</Text><VerifiedBadge verified={!!p.verified} size={22} /></View><Text style={s.cl}>{p.clan} Clan</Text></View></View>
        <View style={s.cn}>
          <View style={s.ab}><TouchableOpacity style={s.pb} onPress={() => router.back()}><X size={24} color={Colors.nope} /></TouchableOpacity><TouchableOpacity style={s.mb} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/chat/${p.id}`); }}><MessageCircle size={24} color="#FFF" /><Text style={s.mt}>Message</Text></TouchableOpacity><TouchableOpacity style={s.lb}><Heart size={24} color={Colors.like} /></TouchableOpacity></View>
          <View style={s.se}><Text style={s.st}>About</Text><Text style={s.bt}>{p.bio}</Text></View>
          <View style={s.se}><Text style={s.st}>Details</Text><View style={s.dc}><View style={s.di}><MapPin size={16} color={Colors.primary} /><Text style={s.dt}>{p.location} · {p.distance}</Text></View><View style={s.di}><Globe size={16} color={Colors.primary} /><Text style={s.dt}>{p.languages.join(", ")}</Text></View><View style={s.di}><Heart size={16} color={Colors.primary} /><Text style={s.dt}>{p.lookingFor}</Text></View></View></View>
          <View style={s.se}><Text style={s.st}>Interests</Text><View style={s.ir}>{p.interests.map(i => <View key={i} style={s.ic}><Text style={s.it}>{i}</Text></View>)}</View></View>
          {p.photos.length>1 && <View style={s.se}><Text style={s.st}>More Photos</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pr}>{p.photos.slice(1).map((ph,i) => <Image key={i} source={{ uri: ph }} style={s.ep} contentFit="cover" transition={200} />)}</ScrollView></View>}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView></>
  );
}
const s = StyleSheet.create({ ct: { flex: 1, backgroundColor: Colors.background }, cen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }, err: { fontSize: 16, color: Colors.textSecondary }, ph: { height: 400, position: "relative" }, pi: { width: "100%", height: "100%" }, po: { position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", backgroundColor: "rgba(0,0,0,0.3)" }, pf: { position: "absolute", bottom: 20, left: 20, right: 20 }, nr: { flexDirection: "row", alignItems: "center", gap: 8 }, nm: { fontSize: 30, fontWeight: "700" as const, color: "#FFF" }, cl: { fontSize: 16, fontWeight: "600" as const, color: Colors.accentLight, marginTop: 4 }, cn: { paddingHorizontal: 20, paddingTop: 16 }, ab: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 24 }, pb: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }, mb: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }, mt: { color: "#FFF", fontSize: 16, fontWeight: "600" as const }, lb: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }, se: { marginBottom: 24 }, st: { fontSize: 18, fontWeight: "700" as const, color: Colors.text, marginBottom: 10 }, bt: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 }, dc: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }, di: { flexDirection: "row", alignItems: "center", gap: 10 }, dt: { fontSize: 15, color: Colors.text }, ir: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, ic: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }, it: { fontSize: 14, fontWeight: "500" as const, color: Colors.text }, pr: { gap: 10 }, ep: { width: 200, height: 260, borderRadius: 16 } });
