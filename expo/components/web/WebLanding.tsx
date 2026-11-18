import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck, CalendarDays, Users, Heart, Smartphone } from "lucide-react-native";
import Colors from "@/constants/colors";
import HmongLogo from "@/components/onboarding/HmongLogo";
import RedBackground from "@/components/RedBackground";
import { PLAY_STORE_URL } from "@/lib/invite";

const FEATURES = [
  { icon: Users, title: "Clan-aware matching", body: "See clan, dialect and hometown up front, and hide your own clan if you want to." },
  { icon: ShieldCheck, title: "Verified & safe", body: "Selfie-verified profiles, blocking, reporting and date-safety tools built in." },
  { icon: CalendarDays, title: "Community events", body: "Hmong New Year, festivals and meetups. See who's going and say hi first." },
  { icon: Heart, title: "Made for long-term", body: "Prompts, interests and daily Most Compatible picks for people who are serious." },
];
const LEGAL = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "Delete account", href: "/delete-account" },
  { label: "Support", href: "/support" },
];
const open = (href: string) => { window.location.href = href; };

function StoreButtons() {
  return (
    <View style={s.stores}>
      <TouchableOpacity style={s.store} onPress={() => Linking.openURL(PLAY_STORE_URL)} testID="landing-google-play">
        <Smartphone size={18} color="#FFF" />
        <View><Text style={s.storeSmall}>GET IT ON</Text><Text style={s.storeBig}>Google Play</Text></View>
      </TouchableOpacity>
      <View style={[s.store, s.storeSoon]} testID="landing-app-store">
        <Smartphone size={18} color="rgba(255,255,255,0.7)" />
        <View><Text style={s.storeSmall}>COMING SOON</Text><Text style={[s.storeBig, { color: "rgba(255,255,255,0.8)" }]}>App Store</Text></View>
      </View>
    </View>
  );
}

export default function WebLanding() {
  const router = useRouter();
  const [w, setW] = useState<number>(window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const wide = w >= 900;
  const login = () => router.push("/(auth)/login");

  return (
    <View style={{ flex: 1 }}>
    <RedBackground />
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.page} testID="web-landing">
      <View style={s.nav}>
        <HmongLogo width={240} />
        <TouchableOpacity style={s.navBtn} onPress={login} testID="landing-nav-login"><Text style={s.navBtnTxt}>Log in</Text></TouchableOpacity>
      </View>

      <View style={[s.hero, wide && s.heroWide]}>
        <View style={[s.heroText, wide && { flex: 1 }]}>
          <Text style={s.kicker}>FOR HMONG SINGLES, BY HMONG</Text>
          <Text style={[s.h1, wide && { fontSize: 56, lineHeight: 62 }]}>Meet someone who shares your roots.</Text>
          <Text style={s.sub}>Hmong Date connects Hmong singles who value culture, family and real relationships. Use it on your phone or right here on your computer.</Text>
          <View style={s.ctaRow}>
            <TouchableOpacity style={s.cta} onPress={login} testID="landing-create-account"><Text style={s.ctaTxt}>Create free account</Text></TouchableOpacity>
            <TouchableOpacity style={s.ctaGhost} onPress={login} testID="landing-login"><Text style={s.ctaGhostTxt}>I have an account</Text></TouchableOpacity>
          </View>
          <StoreButtons />
        </View>
        <View style={[s.shots, !wide && { marginTop: 40 }]}>
          <Image source={{ uri: "/store/shot-1.jpg" }} style={[s.shot, { transform: [{ rotate: "-4deg" }] }]} />
          {wide ? <Image source={{ uri: "/store/shot-3.jpg" }} style={[s.shot, { marginLeft: -60, marginTop: 50, transform: [{ rotate: "4deg" }] }]} /> : null}
        </View>
      </View>

      <View style={[s.features, wide && { flexDirection: "row" }]}>
        {FEATURES.map((f) => (
          <View key={f.title} style={[s.feature, wide && { flex: 1 }]} testID={`landing-feature-${f.title}`}>
            <f.icon size={22} color={Colors.gold} />
            <Text style={s.fTitle}>{f.title}</Text>
            <Text style={s.fBody}>{f.body}</Text>
          </View>
        ))}
      </View>

      <View style={s.band}>
        <Text style={s.bandTitle}>Free to join. Unlimited when you're ready.</Text>
        <Text style={s.bandSub}>Free members get daily likes and messages. Upgrade to Unlimited on the web, Google Play or the App Store, and it works everywhere you sign in.</Text>
        <TouchableOpacity style={[s.cta, { alignSelf: "center", marginTop: 20 }]} onPress={login} testID="landing-get-started"><Text style={s.ctaTxt}>Get started</Text></TouchableOpacity>
      </View>

      <View style={s.footer}>
        <View style={s.footLinks}>
          {LEGAL.map((l) => (
            <Text key={l.href} style={s.footLink} onPress={() => open(l.href)} testID={`landing-link-${l.label}`}>{l.label}</Text>
          ))}
        </View>
        <Text style={s.copy}>© {new Date().getFullYear()} Hmong Date · support@hmongdate.com</Text>
      </View>
    </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { paddingHorizontal: 24, paddingBottom: 40, maxWidth: 1180, width: "100%", alignSelf: "center" },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 18 },
  navBtn: { borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  navBtnTxt: { color: "#FFF", fontWeight: "700" as const },
  hero: { marginTop: 30 },
  heroWide: { flexDirection: "row", alignItems: "center", gap: 40, marginTop: 50 },
  heroText: { maxWidth: 560 },
  kicker: { color: Colors.gold, fontWeight: "800" as const, letterSpacing: 2, fontSize: 12 },
  h1: { color: "#FFF", fontSize: 40, lineHeight: 46, fontWeight: "800" as const, marginTop: 14 },
  sub: { color: "rgba(255,255,255,0.8)", fontSize: 17, lineHeight: 26, marginTop: 18 },
  ctaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 28 },
  cta: { backgroundColor: Colors.gold, borderRadius: 999, paddingHorizontal: 26, paddingVertical: 15 },
  ctaTxt: { color: Colors.ink, fontWeight: "800" as const, fontSize: 16 },
  ctaGhost: { borderWidth: 1.5, borderColor: "#FFF", borderRadius: 999, paddingHorizontal: 24, paddingVertical: 14 },
  ctaGhostTxt: { color: "#FFF", fontWeight: "800" as const, fontSize: 16 },
  stores: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 26 },
  store: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#000", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  storeSoon: { backgroundColor: "rgba(0,0,0,0.35)" },
  storeSmall: { color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: "700" as const, letterSpacing: 1 },
  storeBig: { color: "#FFF", fontSize: 16, fontWeight: "800" as const },
  shots: { flexDirection: "row", justifyContent: "center", flex: 1 },
  shot: { width: 270, height: 480, borderRadius: 24 },
  features: { gap: 16, marginTop: 70 },
  feature: { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderRadius: 20, padding: 22 },
  fTitle: { color: "#FFF", fontSize: 17, fontWeight: "800" as const, marginTop: 12 },
  fBody: { color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 21, marginTop: 6 },
  band: { marginTop: 60, padding: 32, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.25)" },
  bandTitle: { color: "#FFF", fontSize: 26, fontWeight: "800" as const, textAlign: "center" },
  bandSub: { color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 23, textAlign: "center", marginTop: 10, maxWidth: 640, alignSelf: "center" },
  footer: { marginTop: 50, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", paddingTop: 22, alignItems: "center" },
  footLinks: { flexDirection: "row", flexWrap: "wrap", gap: 18, justifyContent: "center" },
  footLink: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" as const },
  copy: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 12 },
});
