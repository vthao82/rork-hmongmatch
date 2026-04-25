import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { Flame } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops" }} />
      <View style={s.c}><Flame size={48} color={Colors.primary} /><Text style={s.t}>Page not found</Text><Text style={s.st}>The page you are looking for does not exist.</Text><Link href="/" style={s.l}><Text style={s.lt}>Back to HmongMatch</Text></Link></View>
    </>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: Colors.background, gap: 10 },
  t: { fontSize: 22, fontWeight: "700" as const, color: Colors.text, marginTop: 8 },
  st: { fontSize: 15, color: Colors.textSecondary, textAlign: "center" },
  l: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: Colors.primary, borderRadius: 24 },
  lt: { fontSize: 15, color: "#FFF", fontWeight: "600" as const },
});
