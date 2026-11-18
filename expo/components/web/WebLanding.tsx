import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image, Animated, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck, CalendarDays, Users, Heart, Smartphone, Sparkles } from "lucide-react-native";
import RedBackground from "@/components/RedBackground";
import { PLAY_STORE_URL } from "@/lib/invite";

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Manrope', 'Helvetica Neue', Arial, sans-serif";
const GOLD = "#E8C27A";
const HERO = [1, 2, 3, 4, 5].map((i) => `/landing/hero-${i}.jpg`);
const FEATURES = [
  { icon: Users, img: "/landing/card-clan.jpg", title: "Clan-aware matching", body: "Clan, dialect and hometown up front, with the option to keep your own clan private." },
  { icon: ShieldCheck, img: "/landing/card-verified.jpg", title: "Verified & safe", body: "Selfie-verified members, blocking, reporting and date-safety tools built in." },
  { icon: CalendarDays, img: "/landing/card-events.jpg", title: "Community events", body: "Hmong New Year, festivals and meetups. See who's going and say hi first." },
  { icon: Heart, img: "/landing/card-longterm.jpg", title: "Made for forever", body: "Prompts, shared interests and daily Most Compatible picks for people who are serious." },
];
const STEPS = [
  { n: "01", t: "Tell your story", b: "Photos, prompts, clan and what you're looking for. It takes five minutes." },
  { n: "02", t: "Meet with intention", b: "Daily compatible picks, likes with a comment, and events where you can meet in person." },
  { n: "03", t: "Bring them home", b: "Chat safely, plan the date, and share your match with family when it feels right." },
];
const LEGAL = [
  { label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Cookies", href: "/cookies" },
  { label: "Delete account", href: "/delete-account" }, { label: "Support", href: "/support" },
];
const go = (href: string) => { window.location.href = href; };

function useWebFonts() {
  useEffect(() => {
    if (document.getElementById("landing-fonts")) return;
    const l = document.createElement("link");
    l.id = "landing-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Manrope:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }, []);
}

function useWidth() {
  const [w, setW] = useState<number>(window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

/** Five photos stacked; cross-fades to the next every 5 seconds. */
function HeroRotator() {
  const [i, setI] = useState<number>(0);
  const fades = useRef(HERO.map((_, k) => new Animated.Value(k === 0 ? 1 : 0))).current;
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % HERO.length), 5000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    fades.forEach((f, k) => Animated.timing(f, { toValue: k === i ? 1 : 0, duration: 1200, useNativeDriver: false }).start());
  }, [i, fades]);
  return (
    <View style={s.rotWrap} testID="landing-hero-rotator">
      <View style={s.rotGlow} />
      <View style={s.rotFrame}>
        {HERO.map((src, k) => (
          <Animated.View key={src} style={[StyleSheet.absoluteFill, { opacity: fades[k] }]}>
            <Image source={{ uri: src }} style={s.rotImg} resizeMode="cover" />
          </Animated.View>
        ))}
        <View style={s.rotShade} />
        <View style={s.rotChip}><Sparkles size={14} color={GOLD} /><Text style={s.rotChipTxt}>Real connections, real culture</Text></View>
      </View>
      <View style={s.dots}>
        {HERO.map((src, k) => (
          <Pressable key={src} onPress={() => setI(k)} testID={`landing-hero-dot-${k}`}>
            <View style={[s.dot, k === i && s.dotOn]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function FeatureCard({ f, wide }: { f: (typeof FEATURES)[number]; wide: boolean }) {
  const [hover, setHover] = useState<boolean>(false);
  return (
    <Pressable onHoverIn={() => setHover(true)} onHoverOut={() => setHover(false)} style={[s.fCard, wide && { flex: 1 }, hover && s.fCardHover]} testID={`landing-feature-${f.title}`}>
      <Image source={{ uri: f.img }} style={[StyleSheet.absoluteFill, s.fImg, hover && { transform: [{ scale: 1.06 }] }]} resizeMode="cover" />
      <View style={s.fShade} />
      <View style={s.fBody}>
        <View style={s.fIcon}><f.icon size={18} color={GOLD} /></View>
        <Text style={s.fTitle}>{f.title}</Text>
        <Text style={s.fText}>{f.body}</Text>
      </View>
    </Pressable>
  );
}

function StoreButtons() {
  return (
    <View style={s.stores}>
      <TouchableOpacity style={s.store} onPress={() => Linking.openURL(PLAY_STORE_URL)} testID="landing-google-play">
        <Smartphone size={18} color="#FFF" />
        <View><Text style={s.storeSmall}>GET IT ON</Text><Text style={s.storeBig}>Google Play</Text></View>
      </TouchableOpacity>
      <View style={[s.store, { opacity: 0.7 }]} testID="landing-app-store">
        <Smartphone size={18} color="#FFF" />
        <View><Text style={s.storeSmall}>COMING SOON</Text><Text style={s.storeBig}>App Store</Text></View>
      </View>
    </View>
  );
}

export default function WebLanding() {
  useWebFonts();
  const router = useRouter();
  const w = useWidth();
  const wide = w >= 980;
  const login = () => router.push("/(auth)/login");
  const logoW = w < 640 ? w - 170 : Math.min(w * 0.42, 620);

  return (
    <View style={{ flex: 1 }}>
      <RedBackground />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.page, w < 640 && { paddingHorizontal: 20 }]} testID="web-landing">
        <View style={s.nav}>
          <Image source={{ uri: "/landing/logo.png" }} style={{ width: logoW, height: logoW / 4.23 }} resizeMode="contain" accessibilityLabel="Hmong Date" testID="landing-logo" />
          <View style={s.navRight}>
            {wide ? <Text style={s.navLink} onPress={() => go("/support")} testID="landing-nav-support">Support</Text> : null}
            <TouchableOpacity style={[s.navBtn, w < 640 && { paddingHorizontal: 18, paddingVertical: 10 }]} onPress={login} testID="landing-nav-login"><Text style={s.navBtnTxt}>Log in</Text></TouchableOpacity>
          </View>
        </View>

        <View style={[s.hero, wide && s.heroWide]}>
          <View style={[s.heroText, wide && { flex: 1 }]}>
            <View style={s.kickerRow}><View style={s.kickerLine} /><Text style={s.kicker}>WHERE HMONG HEARTS MEET</Text></View>
            <Text style={[s.h1, { fontSize: wide ? 68 : 44, lineHeight: wide ? 76 : 52 }]}>
              Find your forever, <Text style={s.h1Accent}>rooted in tradition.</Text>
            </Text>
            <Text style={s.sub}>The dating app for Hmong singles who value culture, family and real commitment. Swipe on your phone or right here on your computer.</Text>
            <View style={s.ctaRow}>
              <TouchableOpacity style={s.cta} onPress={login} testID="landing-create-account"><Text style={s.ctaTxt}>Join free</Text></TouchableOpacity>
              <TouchableOpacity style={s.ctaGhost} onPress={login} testID="landing-login"><Text style={s.ctaGhostTxt}>I have an account</Text></TouchableOpacity>
            </View>
            <StoreButtons />
            <Text style={s.trust}>Selfie-verified members  ·  Free to join  ·  Made by Hmong, for Hmong</Text>
          </View>
          <View style={[wide ? { flex: 1.25 } : { marginTop: 44 }]}>
            <HeroRotator />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.eyebrow}>WHY HMONG DATE</Text>
          <Text style={[s.h2, { fontSize: wide ? 46 : 34 }]}>Dating that honors <Text style={s.h1Accent}>where you come from.</Text></Text>
          <View style={[s.features, wide && { flexDirection: "row" }]}>
            {FEATURES.map((f) => <FeatureCard key={f.title} f={f} wide={wide} />)}
          </View>
        </View>

        <View style={[s.section, s.steps, wide && { flexDirection: "row" }]}>
          {STEPS.map((x) => (
            <View key={x.n} style={[s.step, wide && { flex: 1 }]} testID={`landing-step-${x.n}`}>
              <Text style={s.stepN}>{x.n}</Text>
              <Text style={s.stepT}>{x.t}</Text>
              <Text style={s.stepB}>{x.b}</Text>
            </View>
          ))}
        </View>

        <View style={[s.band, { minHeight: wide ? 420 : 380 }]}>
          <Image source={{ uri: "/landing/hero-5.jpg" }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={s.bandShade} />
          <View style={s.bandInner}>
            <Text style={[s.h2, { fontSize: wide ? 48 : 32, textAlign: "center" }]}>Your people are already here.</Text>
            <Text style={s.bandSub}>Free members get daily likes and messages. Upgrade to Unlimited on the web, Google Play or the App Store, and it follows you everywhere you sign in.</Text>
            <TouchableOpacity style={[s.cta, { alignSelf: "center", marginTop: 26 }]} onPress={login} testID="landing-get-started"><Text style={s.ctaTxt}>Start for free</Text></TouchableOpacity>
          </View>
        </View>

        <View style={s.footer}>
          <Image source={{ uri: "/landing/logo.png" }} style={{ width: 200, height: 47 }} resizeMode="contain" />
          <View style={s.footLinks}>
            {LEGAL.map((l) => <Text key={l.href} style={s.footLink} onPress={() => go(l.href)} testID={`landing-link-${l.label}`}>{l.label}</Text>)}
          </View>
          <Text style={s.copy}>© {new Date().getFullYear()} Hmong Date · support@hmongdate.com</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const shadow = (v: string) => ({ boxShadow: v }) as object;
const s = StyleSheet.create({
  page: { paddingHorizontal: 32, paddingBottom: 40, maxWidth: 1280, width: "100%", alignSelf: "center" },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 26, paddingBottom: 8 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 26 },
  navLink: { color: "rgba(255,255,255,0.85)", fontFamily: SANS, fontWeight: "600", fontSize: 15 },
  navBtn: { borderWidth: 1, borderColor: "rgba(232,194,122,0.7)", borderRadius: 999, paddingHorizontal: 26, paddingVertical: 12 },
  navBtnTxt: { color: GOLD, fontFamily: SANS, fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },
  hero: { marginTop: 36 },
  heroWide: { flexDirection: "row", alignItems: "center", gap: 56, marginTop: 40, minHeight: 600 },
  heroText: { maxWidth: 600 },
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  kickerLine: { width: 36, height: 1, backgroundColor: GOLD },
  kicker: { color: GOLD, fontFamily: SANS, fontWeight: "700", letterSpacing: 3, fontSize: 12 },
  h1: { color: "#FFF", fontFamily: SERIF, fontWeight: "600", marginTop: 20, letterSpacing: -0.5 },
  h1Accent: { color: GOLD, fontStyle: "italic", fontFamily: SERIF },
  sub: { color: "rgba(255,255,255,0.78)", fontFamily: SANS, fontSize: 18, lineHeight: 29, marginTop: 22, maxWidth: 520 },
  ctaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 34 },
  cta: { backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 34, paddingVertical: 17, ...shadow("0 10px 30px rgba(232,194,122,0.25)") },
  ctaTxt: { color: "#2A0710", fontFamily: SANS, fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  ctaGhost: { borderWidth: 1, borderColor: "rgba(255,255,255,0.55)", borderRadius: 999, paddingHorizontal: 30, paddingVertical: 16 },
  ctaGhostTxt: { color: "#FFF", fontFamily: SANS, fontWeight: "700", fontSize: 16 },
  stores: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 30 },
  store: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  storeSmall: { color: "rgba(255,255,255,0.65)", fontFamily: SANS, fontSize: 9, fontWeight: "700", letterSpacing: 1.2 },
  storeBig: { color: "#FFF", fontFamily: SANS, fontSize: 16, fontWeight: "800" },
  trust: { color: "rgba(255,255,255,0.55)", fontFamily: SANS, fontSize: 13, marginTop: 26, letterSpacing: 0.3 },
  rotWrap: { width: "100%", aspectRatio: 1.5, position: "relative" },
  rotGlow: { position: "absolute", top: 24, left: 24, right: -12, bottom: -14, borderRadius: 32, borderWidth: 1, borderColor: "rgba(232,194,122,0.45)" },
  rotFrame: { flex: 1, borderRadius: 32, overflow: "hidden", backgroundColor: "#1a0208", ...shadow("0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,194,122,0.25)") },
  rotImg: { width: "100%", height: "100%" },
  rotShade: { ...StyleSheet.absoluteFillObject, backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(20,2,8,0.65) 100%)" } as object,
  rotChip: { position: "absolute", left: 22, bottom: 22, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(20,2,8,0.55)", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(232,194,122,0.35)", backdropFilter: "blur(14px)" } as object,
  rotChipTxt: { color: "#FFF", fontFamily: SANS, fontWeight: "700", fontSize: 13 },
  dots: { flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 34 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)" },
  dotOn: { width: 28, backgroundColor: GOLD },
  section: { marginTop: 120 },
  eyebrow: { color: GOLD, fontFamily: SANS, fontWeight: "700", letterSpacing: 3, fontSize: 12, textAlign: "center" },
  h2: { color: "#FFF", fontFamily: SERIF, fontWeight: "600", textAlign: "center", marginTop: 14, letterSpacing: -0.3 },
  features: { gap: 20, marginTop: 50 },
  fCard: { height: 460, borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: "rgba(232,194,122,0.25)", transitionProperty: "transform, box-shadow", transitionDuration: "350ms", ...shadow("0 24px 50px rgba(0,0,0,0.35)") } as object,
  fCardHover: { transform: [{ translateY: -8 }], ...shadow("0 34px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,194,122,0.6)") } as object,
  fImg: { width: "100%", height: "100%", transitionProperty: "transform", transitionDuration: "700ms" } as object,
  fShade: { ...StyleSheet.absoluteFillObject, backgroundImage: "linear-gradient(180deg, rgba(20,2,8,0) 30%, rgba(20,2,8,0.92) 100%)" } as object,
  fBody: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 24 },
  fIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(20,2,8,0.55)", borderWidth: 1, borderColor: "rgba(232,194,122,0.6)" },
  fTitle: { color: "#FFF", fontFamily: SERIF, fontSize: 24, fontWeight: "600", marginTop: 14 },
  fText: { color: "rgba(255,255,255,0.8)", fontFamily: SANS, fontSize: 14, lineHeight: 21, marginTop: 8 },
  steps: { gap: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(232,194,122,0.2)", paddingVertical: 50 },
  step: { paddingHorizontal: 8 },
  stepN: { color: GOLD, fontFamily: SERIF, fontSize: 44, fontStyle: "italic" },
  stepT: { color: "#FFF", fontFamily: SERIF, fontSize: 24, fontWeight: "600", marginTop: 6 },
  stepB: { color: "rgba(255,255,255,0.72)", fontFamily: SANS, fontSize: 15, lineHeight: 24, marginTop: 8, maxWidth: 360 },
  band: { marginTop: 110, borderRadius: 32, overflow: "hidden", justifyContent: "center", borderWidth: 1, borderColor: "rgba(232,194,122,0.3)" },
  bandShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(30,3,12,0.68)" },
  bandInner: { padding: 40, alignItems: "center" },
  bandSub: { color: "rgba(255,255,255,0.82)", fontFamily: SANS, fontSize: 16, lineHeight: 25, textAlign: "center", marginTop: 14, maxWidth: 620 },
  footer: { marginTop: 70, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", paddingTop: 30, alignItems: "center", gap: 14 },
  footLinks: { flexDirection: "row", flexWrap: "wrap", gap: 22, justifyContent: "center" },
  footLink: { color: "rgba(255,255,255,0.8)", fontFamily: SANS, fontSize: 14, fontWeight: "600" },
  copy: { color: "rgba(255,255,255,0.45)", fontFamily: SANS, fontSize: 12 },
});
