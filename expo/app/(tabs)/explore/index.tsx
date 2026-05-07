import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { User } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import HmongMatchHeader from "@/components/HmongMatchHeader";
import { useOnboarding } from "@/providers/OnboardingProvider";

const SW = Dimensions.get("window").width;
const GAP = 12;
const HALF = (SW - 32 - GAP) / 2;

type Card = { title: string; members: string; tint: string; image: string; full?: boolean; cta?: string };

type Section = { title: string; subtitle: string; cards: Card[] };

const SECTIONS: Section[] = [
  {
    title: "Goal-driven dating",
    subtitle: "Find people with similar relationship goals",
    cards: [
      { title: "Short-term fun", members: "272", tint: "rgba(192,21,47,0.65)", image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800", full: true },
      { title: "Serious Daters", members: "1K", tint: "rgba(217,83,30,0.65)", image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600" },
      { title: "Long-term partner", members: "1K", tint: "rgba(217,83,30,0.65)", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600" },
      { title: "Free Tonight", members: "339", tint: "rgba(138,43,226,0.65)", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600" },
      { title: "New friends", members: "75", tint: "rgba(212,168,67,0.65)", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600" },
    ],
  },
  {
    title: "Similar plans and lifestyles",
    subtitle: "Find people with similar life goals",
    cards: [
      { title: "Wants Kids", members: "89", tint: "rgba(34,139,69,0.65)", image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600" },
      { title: "Child-Free", members: "232", tint: "rgba(50,130,184,0.65)", image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600" },
      { title: "Family First", members: "418", tint: "rgba(120,60,100,0.65)", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600" },
      { title: "Speaks Hmong", members: "612", tint: "rgba(192,21,47,0.65)", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600" },
    ],
  },
  {
    title: "Shared interests or hobbies",
    subtitle: "Find people with similar interests",
    cards: [
      { title: "Travel", members: "625", tint: "rgba(192,21,47,0.65)", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600" },
      { title: "Binge Watchers", members: "477", tint: "rgba(34,139,69,0.65)", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600" },
      { title: "Sporty", members: "498", tint: "rgba(192,21,47,0.65)", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600" },
      { title: "Coffee Date", members: "123", tint: "rgba(212,168,67,0.65)", image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=600" },
      { title: "Date Night", members: "538", tint: "rgba(140,60,160,0.65)", image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600" },
      { title: "Thrill Seekers", members: "739", tint: "rgba(212,168,67,0.65)", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600" },
      { title: "Creatives", members: "754", tint: "rgba(44,140,140,0.65)", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600" },
      { title: "Foodies", members: "650", tint: "rgba(120,30,50,0.65)", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600" },
      { title: "Nature Lovers", members: "829", tint: "rgba(34,139,69,0.65)", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600" },
      { title: "Music Lovers", members: "701", tint: "rgba(138,43,226,0.65)", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600" },
      { title: "Self Care", members: "687", tint: "rgba(34,139,69,0.65)", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600" },
      { title: "Gamers", members: "164", tint: "rgba(20,80,50,0.7)", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600" },
      { title: "Outdoors & Hunting", members: "321", tint: "rgba(25,80,40,0.7)", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600" },
      { title: "Hmong New Year", members: "540", tint: "rgba(212,168,67,0.65)", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600" },
      { title: "Animal Parents", members: "133", tint: "rgba(217,83,30,0.65)", image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600", full: true, cta: "TRY NOW" },
    ],
  },
];

function CategoryCard({ c, w, h, onPress }: { c: Card; w: number; h: number; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.card, { width: w, height: h }]} testID={`cat-${c.title}`}>
      <Image source={{ uri: c.image }} style={s.cardImg} contentFit="cover" />
      <View style={[s.cardTint, { backgroundColor: c.tint }]} />
      <View style={s.badge}><User size={12} color="#FFF" /><Text style={s.badgeText}>{c.members}</Text></View>
      <Text style={s.cardLabel}>{c.title}</Text>
      {c.cta && (
        <View style={s.ctaPill}><Text style={s.ctaText}>{c.cta}</Text></View>
      )}
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useOnboarding();
  const userInterests = data.interests ?? [];
  const advFilters = [data.lookingFor, data.dialect, ...(data.genders ?? []), ...(data.seeking ?? [])].filter(Boolean) as string[];
  const matchTokens = [...userInterests, ...advFilters].map(s => s.toLowerCase());

  const rows = useMemo(() => {
    if (matchTokens.length === 0) return SECTIONS;
    return SECTIONS.map(sec => {
      const filteredCards = sec.cards.filter(c => {
        const t = c.title.toLowerCase();
        return matchTokens.some(token => t.includes(token) || token.includes(t.split(" ")[0]));
      });
      return { ...sec, cards: filteredCards.length > 0 ? filteredCards : sec.cards.slice(0, 2) };
    });
  }, [matchTokens]);

  const go = (title: string) => router.push(`/category/${encodeURIComponent(title)}`);
  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <HmongMatchHeader />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {rows.map((sec, sIdx) => {
          const rowsForSec: Card[][] = [];
          let i = 0;
          while (i < sec.cards.length) {
            const c = sec.cards[i];
            if (c.full) { rowsForSec.push([c]); i += 1; }
            else { rowsForSec.push(sec.cards.slice(i, i + 2)); i += 2; }
          }
          return (
            <View key={sec.title} style={{ marginBottom: 8 }}>
              {sIdx > 0 && (
                <View style={s.sectionHeader}>
                  <Text style={s.sTitle}>{sec.title}</Text>
                  <Text style={s.sSub}>{sec.subtitle}</Text>
                </View>
              )}
              {sIdx === 0 && (
                <>
                  {rowsForSec[0] && (
                    <View style={s.row}>
                      <CategoryCard c={rowsForSec[0][0]} w={SW - 32} h={260} onPress={() => go(rowsForSec[0][0].title)} />
                    </View>
                  )}
                  <View style={s.sectionHeader}>
                    <Text style={s.sTitle}>{sec.title}</Text>
                    <Text style={s.sSub}>{sec.subtitle}</Text>
                  </View>
                  {rowsForSec.slice(1).map((r, idx) => (
                    <View key={`r-${idx}`} style={s.row}>
                      {r.map(c => <CategoryCard key={c.title} c={c} w={c.full ? SW - 32 : HALF} h={c.full ? 220 : 220} onPress={() => go(c.title)} />)}
                    </View>
                  ))}
                </>
              )}
              {sIdx > 0 && rowsForSec.map((r, idx) => (
                <View key={`r-${sIdx}-${idx}`} style={s.row}>
                  {r.map(c => <CategoryCard key={c.title} c={c} w={c.full ? SW - 32 : HALF} h={c.full ? 220 : 220} onPress={() => go(c.title)} />)}
                </View>
              ))}
            </View>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "#000" },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: { marginTop: 20, marginBottom: 12 },
  sTitle: { color: "#FFF", fontSize: 20, fontWeight: "800" as const },
  sSub: { color: "rgba(255,255,255,0.55)", fontSize: 14, marginTop: 2 },
  row: { flexDirection: "row", gap: GAP, marginBottom: GAP, flexWrap: "wrap" },
  card: { borderRadius: 16, overflow: "hidden", backgroundColor: "#111" },
  cardImg: { ...StyleSheet.absoluteFillObject },
  cardTint: { ...StyleSheet.absoluteFillObject },
  badge: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: "#FFF", fontSize: 12, fontWeight: "700" as const },
  cardLabel: { position: "absolute", bottom: 14, left: 14, right: 14, color: "#FFF", fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.3 },
  ctaPill: { position: "absolute", bottom: 14, right: 14, backgroundColor: "#FFF", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  ctaText: { color: "#1a1a1f", fontWeight: "800" as const, fontSize: 12, letterSpacing: 0.5 },
});
