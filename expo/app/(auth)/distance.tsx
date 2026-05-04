import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, PanResponder, LayoutChangeEvent, Platform } from "react-native";
import { router } from "expo-router";
import { Minus, Plus, Globe2, Flag } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useLanguage } from "@/providers/LanguageProvider";

const MIN = 1;
const MAX = 100;

export default function DistanceScreen() {
  const { data, update } = useOnboarding();
  const { t } = useLanguage();
  const [value, setValue] = useState<number>(data.distance ?? 50);
  const [worldwide, setWorldwide] = useState<boolean>(data.distanceWorldwide ?? false);
  const [usOnly, setUsOnly] = useState<boolean>(data.distanceUSOnly ?? false);
  const [searchByDistance, setSearchByDistance] = useState<boolean>(data.searchByDistance ?? true);
  const [width, setWidth] = useState<number>(0);
  const lastHaptic = useRef<number>(value);

  const pct = (value - MIN) / (MAX - MIN);

  const setFromX = (x: number) => {
    if (width <= 0) return;
    const clamped = Math.max(0, Math.min(width, x));
    const v = Math.round(MIN + (clamped / width) * (MAX - MIN));
    if (v !== lastHaptic.current) {
      lastHaptic.current = v;
      if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    }
    setValue(v);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_e, g) => setFromX(g.x0 - 24),
      onPanResponderMove: (_e, g) => setFromX(g.moveX - 24),
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const bump = (delta: number) => {
    const v = Math.max(MIN, Math.min(MAX, value + delta));
    if (v !== value) {
      setValue(v);
      lastHaptic.current = v;
      if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    }
  };

  const onNext = () => {
    update({ distance: value, distanceWorldwide: worldwide, distanceUSOnly: usOnly, searchByDistance });
    router.push("/(auth)/work");
  };

  const toggleWorldwide = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setWorldwide(w => {
      const next = !w;
      if (next) { setUsOnly(false); setSearchByDistance(false); }
      return next;
    });
  };
  const toggleUS = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setUsOnly(u => {
      const next = !u;
      if (next) setWorldwide(false);
      return next;
    });
  };
  const toggleSearchByDistance = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setSearchByDistance(v => {
      const next = !v;
      if (next) setWorldwide(false);
      return next;
    });
  };

  return (
    <OnboardingScreen
      step={11}
      total={19}
      footer={<PillButton label="Next" onPress={onNext} variant="light" testID="distance-next" />}
    >
      <Text style={s.head}>Your distance{"\n"}preference?</Text>
      <Text style={s.sub}>Toggle search by distance, US only, or worldwide — your choice.</Text>

      <Pressable onPress={toggleSearchByDistance} style={({ pressed }) => [s.wwCard, searchByDistance && s.wwCardOn, pressed && s.wwPressed]} testID="distance-by-toggle">
        <View style={[s.wwIcon, searchByDistance && s.wwIconOn]}>
          <Minus size={20} color={searchByDistance ? "#fff" : Colors.crimson} />
        </View>
        <View style={s.wwTextWrap}>
          <Text style={s.wwTitle}>Search by distance</Text>
          <Text style={s.wwSub}>Use a max distance slider to find nearby matches.</Text>
        </View>
        <View style={[s.wwSwitch, searchByDistance && s.wwSwitchOn]}>
          <View style={[s.wwKnob, searchByDistance && s.wwKnobOn]} />
        </View>
      </Pressable>

      {searchByDistance && !worldwide && (
        <>
          <View style={s.labelRow}>
            <Text style={s.lead}>{t("distancePref")}</Text>
            <View style={s.stepper}>
              <Pressable onPress={() => bump(-1)} onLongPress={() => bump(-5)} style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed]} testID="distance-minus">
                <Minus size={16} color={Colors.dark.text} />
              </Pressable>
              <Text style={s.val}>{`${value} Mi`}</Text>
              <Pressable onPress={() => bump(1)} onLongPress={() => bump(5)} style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed]} testID="distance-plus">
                <Plus size={16} color={Colors.dark.text} />
              </Pressable>
            </View>
          </View>

          <View style={s.sliderWrap} {...pan.panHandlers} onLayout={onLayout}>
            <View style={s.track} />
            <View style={[s.fill, { width: `${pct * 100}%` }]} />
            <View style={[s.handle, { left: `${pct * 100}%` }]} />
          </View>
        </>
      )}

      <Pressable onPress={toggleUS} style={({ pressed }) => [s.wwCard, usOnly && s.wwCardOn, pressed && s.wwPressed, { marginTop: 14 }]} testID="distance-us-only">
        <View style={[s.wwIcon, usOnly && s.wwIconOn]}>
          <Flag size={20} color={usOnly ? "#fff" : Colors.crimson} />
        </View>
        <View style={s.wwTextWrap}>
          <Text style={s.wwTitle}>US only</Text>
          <Text style={s.wwSub}>Limit your matches to people across the United States.</Text>
        </View>
        <View style={[s.wwSwitch, usOnly && s.wwSwitchOn]}>
          <View style={[s.wwKnob, usOnly && s.wwKnobOn]} />
        </View>
      </Pressable>

      <Pressable onPress={toggleWorldwide} style={({ pressed }) => [s.wwCard, worldwide && s.wwCardOn, pressed && s.wwPressed, { marginTop: 14 }]} testID="distance-worldwide">
        <View style={[s.wwIcon, worldwide && s.wwIconOn]}>
          <Globe2 size={20} color={worldwide ? "#fff" : Colors.crimson} />
        </View>
        <View style={s.wwTextWrap}>
          <Text style={s.wwTitle}>Search worldwide</Text>
          <Text style={s.wwSub}>See people from any country across the globe.</Text>
        </View>
        <View style={[s.wwSwitch, worldwide && s.wwSwitchOn]}>
          <View style={[s.wwKnob, worldwide && s.wwKnobOn]} />
        </View>
      </Pressable>

      <Text style={s.note}>You can change preferences later in Settings.</Text>
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6, lineHeight: 34 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 10, lineHeight: 20 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 34 },
  lead: { color: Colors.dark.textDim, fontSize: 14, fontWeight: "600" as const },
  val: { color: Colors.dark.text, fontSize: 20, fontWeight: "800" as const },
  sliderWrap: { height: 44, marginTop: 16, justifyContent: "center", position: "relative" as const },
  track: { height: 4, borderRadius: 2, backgroundColor: "rgba(245,240,235,0.14)" },
  fill: { position: "absolute", left: 0, height: 4, borderRadius: 2, backgroundColor: Colors.crimson },
  handle: {
    position: "absolute", width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.crimson, marginLeft: -13,
    borderWidth: 3, borderColor: "#fff",
    shadowColor: Colors.crimson, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  note: { color: Colors.dark.textDim, fontSize: 13, marginTop: 18, lineHeight: 18 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", justifyContent: "center", alignItems: "center" },
  stepBtnPressed: { backgroundColor: "rgba(192,21,47,0.25)", borderColor: Colors.crimson },
  stepBtnDisabled: { opacity: 0.4 },
  valDim: { color: Colors.crimson },
  sliderDisabled: { opacity: 0.35 },
  wwCard: { marginTop: 22, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  wwCardOn: { backgroundColor: "rgba(192,21,47,0.12)", borderColor: Colors.crimson },
  wwPressed: { opacity: 0.85 },
  wwIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(192,21,47,0.14)", justifyContent: "center", alignItems: "center" },
  wwIconOn: { backgroundColor: Colors.crimson },
  wwTextWrap: { flex: 1 },
  wwTitle: { color: Colors.dark.text, fontSize: 15, fontWeight: "700" as const },
  wwSub: { color: Colors.dark.textDim, fontSize: 12, marginTop: 2, lineHeight: 16 },
  wwSwitch: { width: 42, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.14)", padding: 3, justifyContent: "center" },
  wwSwitchOn: { backgroundColor: Colors.crimson },
  wwKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  wwKnobOn: { alignSelf: "flex-end" },
});
