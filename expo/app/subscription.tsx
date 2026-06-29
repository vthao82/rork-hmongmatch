import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Check, Flame, Crown, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useT } from "@/providers/LanguageProvider";
import { useTier, UNLIMITED_PRICE, UNLIMITED_PRICE_LABEL } from "@/providers/TierProvider";

type Perk = { label: string; desc?: string };

export default function SubscriptionScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const { isPaid, purchaseUnlimited } = useTier();
  const [busy, setBusy] = useState<"buy" | null>(null);

  const PERKS: Perk[] = [
    { label: t("unlimitedLikes") },
    { label: t("unlimitedRewinds") },
    { label: t("seeWhoLikesYouRow") },
    { label: "2 free boosts per month", desc: "Be one of the top profiles for 60 minutes" },
    { label: "Video messages", desc: "Coming soon — record and send video to your matches" },
  ];

  const buy = async () => {
    if (busy) return;
    setBusy("buy");
    try {
      const res = await purchaseUnlimited();
      if (res.ok) {
        Alert.alert(
          t("hmongDateGold") /* reused string: "You're in!" not present, fall back */,
          "Unlimited unlocked! Enjoy 💛",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Purchase failed", res.error ?? "Please try again.");
      }
    } finally {
      setBusy(null);
    }
  };



  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack && router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/discover" as never);
            }
          }}
          testID="close-sub"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.title}>{t("mySubscription")}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        <View style={s.heroWrap}>
          <LinearGradient
            colors={["#3a0512", "#1a0208"] as const}
            style={[s.heroCard, { borderColor: Colors.primary }]}
          >
            <Flame size={36} color={Colors.primary} fill={Colors.primary} />
            <Text style={s.brand}>Hmong Date</Text>
            <Text style={s.planName}>UNLIMITED</Text>
            <View style={s.priceRow}>
              <Text style={s.priceBig}>{UNLIMITED_PRICE}</Text>
            </View>
            <Text style={s.heroSub}>One plan. Everything unlocked.</Text>
          </LinearGradient>
        </View>

        <View style={s.section}>
          <View style={s.sectionPill}>
            <Sparkles size={12} color="#FFF" />
            <Text style={s.sectionPillText}>What you get</Text>
          </View>
          <View style={s.featureCard}>
            {PERKS.map((p) => (
              <View key={p.label} style={s.featureRow}>
                <View style={s.featureIcon}>
                  <Check size={20} color={Colors.primary} strokeWidth={3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.featureLabel}>{p.label}</Text>
                  {p.desc ? <Text style={s.featureDesc}>{p.desc}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert("Restore purchases", "Available once App Store/Play purchases are live. We'll add this when the store accounts are set up.")}
          style={[s.restoreBtn, { opacity: 0.5 }]}
          testID="restore-purchases"
        >
          <Text style={s.restoreTxt}>Restore purchases (coming soon)</Text>
        </TouchableOpacity>

        <Text style={s.legal}>
          Subscription auto-renews monthly until cancelled. Cancel anytime in your store account settings.
        </Text>
      </ScrollView>

      <View style={[s.ctaWrap, { paddingBottom: Math.max(ins.bottom, 16) }]}>
        {isPaid ? (
          <View style={[s.cta, { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }]}>
            <Crown size={18} color={Colors.accent} />
            <Text style={[s.ctaText, { color: "#FFF", marginLeft: 8 }]}>You&apos;re on Unlimited</Text>
          </View>
        ) : (
          <TouchableOpacity activeOpacity={0.9} onPress={buy} disabled={!!busy} testID="buy-unlimited">
            <LinearGradient
              colors={["#ff5574", "#ff8a3d"] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.cta}
            >
              {busy === "buy" ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.ctaText}>GO UNLIMITED · {UNLIMITED_PRICE_LABEL}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  title: { color: "#FFF", fontSize: 18, fontWeight: "700" as const },
  heroWrap: { paddingHorizontal: 24, paddingTop: 6 },
  heroCard: { borderRadius: 22, borderWidth: 2, padding: 28, alignItems: "center", gap: 8 },
  brand: { color: "rgba(255,255,255,0.55)", fontSize: 12, letterSpacing: 2, fontWeight: "700" as const, marginTop: 6 },
  planName: { color: "#FFF", fontSize: 32, fontWeight: "900" as const, letterSpacing: 1, marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 8 },
  priceBig: { color: "#FFF", fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5 },
  heroSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 6 },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionPill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "#000", zIndex: 2, marginBottom: -16 },
  sectionPillText: { color: "#FFF", fontSize: 13, fontWeight: "600" as const },
  featureCard: { borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, paddingTop: 22 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 10 },
  featureIcon: { width: 24, alignItems: "center", marginTop: 2 },
  featureLabel: { color: "#FFF", fontSize: 15, fontWeight: "700" as const },
  featureDesc: { color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 4, lineHeight: 18 },
  restoreBtn: { alignSelf: "center", marginTop: 24, paddingVertical: 8, paddingHorizontal: 14 },
  restoreTxt: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" as const, textDecorationLine: "underline" },
  legal: { color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "center" as const, marginTop: 18, marginHorizontal: 28, lineHeight: 16 },
  ctaWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#000" },
  cta: { borderRadius: 999, paddingVertical: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 }, default: {} }) },
  ctaText: { color: "#FFF", fontSize: 15, fontWeight: "800" as const, letterSpacing: 1 },
});
