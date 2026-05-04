import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing, Image } from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import Colors from "@/constants/colors";
import HmongLogo from "@/components/onboarding/HmongLogo";
import { useOnboarding } from "@/providers/OnboardingProvider";

type Acct = { id: string; name: string; email: string; avatar: string };

const ACCOUNTS: Acct[] = [
  { id: "1", name: "Mai Xiong", email: "mai.xiong@gmail.com", avatar: "https://i.pravatar.cc/120?img=47" },
  { id: "2", name: "Kou Yang", email: "kouyang.dev@gmail.com", avatar: "https://i.pravatar.cc/120?img=12" },
  { id: "3", name: "Pa Vue", email: "pavue.hmong@gmail.com", avatar: "https://i.pravatar.cc/120?img=49" },
  { id: "4", name: "Tou Lor", email: "tou.lor88@gmail.com", avatar: "https://i.pravatar.cc/120?img=33" },
];

export default function AccountPicker() {
  const { update } = useOnboarding();
  const slide = useRef(new Animated.Value(500)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }),
    ]).start();
  }, [slide, backdrop]);

  const close = () => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 500, duration: 220, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
    ]).start(() => router.back());
  };

  const pick = (a: Acct) => {
    update({ email: a.email });
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 500, duration: 220, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
    ]).start(() => {
      router.replace("/(auth)/terms");
    });
  };

  return (
    <View style={s.root} testID="account-picker">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: slide }] }]}>
        <View style={s.handle} />
        <Pressable style={s.close} onPress={close} testID="close-picker">
          <X size={20} color={Colors.dark.textDim} />
        </Pressable>
        <View style={s.head}>
          <HmongLogo size={48} />
          <Text style={s.title}>Choose an account to continue</Text>
          <Text style={s.sub}>to Hmong Date</Text>
        </View>
        <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
          {ACCOUNTS.map((a, i) => (
            <Pressable key={a.id} style={({ pressed }) => [s.item, pressed && s.itemPressed, i === ACCOUNTS.length - 1 && s.itemLast]} onPress={() => pick(a)} testID={`account-${a.id}`}>
              <Image source={{ uri: a.avatar }} style={s.avatar} />
              <View style={s.meta}>
                <Text style={s.name}>{a.name}</Text>
                <Text style={s.email}>{a.email}</Text>
              </View>
            </Pressable>
          ))}
          <Pressable style={s.addRow} onPress={() => pick({ id: "new", name: "New", email: "you@gmail.com", avatar: "https://i.pravatar.cc/120?img=5" })}>
            <View style={s.addDot}><Text style={s.addDotTxt}>+</Text></View>
            <Text style={s.addTxt}>Use another account</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { backgroundColor: Colors.dark.bgSoft, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 30, maxHeight: "85%", borderTopWidth: 1, borderColor: Colors.dark.border },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginTop: 10 },
  close: { position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center" },
  head: { alignItems: "center", paddingTop: 20, paddingHorizontal: 24, gap: 6 },
  title: { fontSize: 20, fontWeight: "700" as const, color: Colors.dark.text, textAlign: "center", marginTop: 8 },
  sub: { fontSize: 14, color: Colors.dark.textDim },
  list: { marginTop: 18, paddingHorizontal: 12 },
  item: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14 },
  itemPressed: { backgroundColor: "rgba(255,255,255,0.05)" },
  itemLast: {},
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#333" },
  meta: { flex: 1 },
  name: { color: Colors.dark.text, fontSize: 15, fontWeight: "600" as const },
  email: { color: Colors.dark.textDim, fontSize: 13, marginTop: 2 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 14, marginTop: 4 },
  addDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(212,168,67,0.15)", justifyContent: "center", alignItems: "center" },
  addDotTxt: { color: Colors.gold, fontSize: 22, fontWeight: "600" as const },
  addTxt: { color: Colors.dark.text, fontSize: 15, fontWeight: "600" as const },
});
