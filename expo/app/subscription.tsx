import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Check, Lock, Flame } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const SW = Dimensions.get("window").width;

type Plan = { id: "plus" | "gold" | "platinum"; name: string; price: string; color: string; border: string; bg: readonly [string, string] };

const PLANS: Plan[] = [
  { id: "plus", name: "Hmong Date +", price: "STARTING AT $29.99", color: Colors.primary, border: "#ff5574", bg: ["#3a0512", "#1a0208"] as const },
  { id: "gold", name: "Hmong Date GOLD", price: "STARTING AT $44.99", color: Colors.accent, border: Colors.accent, bg: ["#2a1f05", "#140e02"] as const },
  { id: "platinum", name: "Hmong Date PLATINUM", price: "STARTING AT $59.99", color: "#c0c0d6", border: "#c0c0d6", bg: ["#1a1a22", "#0c0c10"] as const },
];

type Feature = { label: string; desc?: string; plus: boolean; gold: boolean; platinum: boolean };

const SECTIONS: { title: string; features: Feature[] }[] = [
  {
    title: "Upgrade Your Likes",
    features: [
      { label: "Unlimited Likes", plus: true, gold: true, platinum: true },
      { label: "See Who Likes You", plus: false, gold: true, platinum: true },
      { label: "Priority Likes", desc: "Your Likes will be seen sooner with Priority Likes.", plus: false, gold: false, platinum: true },
    ],
  },
  {
    title: "Enhance Your Experience",
    features: [
      { label: "Unlimited Rewinds", plus: true, gold: true, platinum: true },
      { label: "1 Free Boost per month", plus: false, gold: true, platinum: true },
      { label: "2 Free Super Likes per week", plus: false, gold: true, platinum: true },
      { label: "3 Free First Impressions per week", desc: "Stand out with a message before matching.", plus: false, gold: false, platinum: true },
    ],
  },
  {
    title: "Premium Discovery",
    features: [
      { label: "Unlimited Passport™ Mode", plus: true, gold: true, platinum: true },
    ],
  },
];

export default function SubscriptionScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const [idx, setIdx] = useState<number>(0);
  const current = PLANS[idx];

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} testID="close-sub">
          <X size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.title}>My Subscription</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <FlatList
          horizontal
          pagingEnabled
          data={PLANS}
          keyExtractor={p => p.id}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / SW))}
          renderItem={({ item }) => (
            <View style={{ width: SW, paddingHorizontal: 24 }}>
              <LinearGradient colors={item.bg} style={[s.planCard, { borderColor: item.border }]}>
                <Flame size={28} color={item.color} fill={item.color} />
                <Text style={s.planName}>{item.name}</Text>
              </LinearGradient>
            </View>
          )}
        />

        <View style={s.dots}>
          {PLANS.map((_, i) => (
            <View key={i} style={[s.dot, idx === i && s.dotActive]} />
          ))}
        </View>

        {SECTIONS.map(sec => {
          const key = current.id === "plus" ? "plus" : current.id === "gold" ? "gold" : "platinum";
          return (
            <View key={sec.title} style={s.section}>
              <View style={s.sectionPill}><Text style={s.sectionPillText}>{sec.title}</Text></View>
              <View style={s.featureCard}>
                {sec.features.map(f => {
                  const enabled = key === "plus" ? f.plus : key === "gold" ? f.gold : f.platinum;
                  return (
                    <View key={f.label} style={s.featureRow}>
                      <View style={s.featureIcon}>
                        {enabled ? <Check size={22} color={Colors.primary} strokeWidth={3} /> : <Lock size={18} color="rgba(255,255,255,0.45)" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.featureLabel, !enabled && s.featureLabelDim]}>{f.label}</Text>
                        {f.desc && <Text style={s.featureDesc}>{f.desc}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[s.ctaWrap, { paddingBottom: Math.max(ins.bottom, 16) }]}>
        {current.id === "plus" ? (
          <LinearGradient colors={["#ff5574", "#ff8a3d"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cta}>
            <Text style={s.ctaText}>{current.price}</Text>
          </LinearGradient>
        ) : (
          <View style={[s.cta, { backgroundColor: current.color }]}>
            <Text style={[s.ctaText, { color: "#1a1404" }]}>{current.price}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  title: { color: "#FFF", fontSize: 18, fontWeight: "700" as const },
  planCard: { height: 160, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 8, gap: 10 },
  planName: { color: "#FFF", fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.3 },
  dots: { flexDirection: "row", gap: 8, justifyContent: "center", marginVertical: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)" },
  dotActive: { backgroundColor: "#FFF" },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionPill: { alignSelf: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: "#000", zIndex: 2, marginBottom: -16 },
  sectionPillText: { color: "#FFF", fontSize: 13, fontWeight: "600" as const },
  featureCard: { borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, paddingTop: 22 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 10 },
  featureIcon: { width: 24, alignItems: "center", marginTop: 2 },
  featureLabel: { color: "#FFF", fontSize: 16, fontWeight: "700" as const },
  featureLabelDim: { color: "rgba(255,255,255,0.55)" },
  featureDesc: { color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 4, lineHeight: 18 },
  ctaWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#000" },
  cta: { borderRadius: 999, paddingVertical: 18, alignItems: "center", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 }, default: {} }) },
  ctaText: { color: "#FFF", fontSize: 15, fontWeight: "800" as const, letterSpacing: 1 },
});
