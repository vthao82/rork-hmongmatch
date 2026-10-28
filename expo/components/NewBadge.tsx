import React from "react";
import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { useTier } from "@/providers/TierProvider";

const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function isNewMember(createdAtMs: number | null | undefined): boolean {
  return !!createdAtMs && Date.now() - createdAtMs < NEW_WINDOW_MS;
}

/** "NEW" pill for members who joined in the last 3 days — Unlimited members only. */
export function NewBadge({ createdAtMs, style, inline }: { createdAtMs?: number | null; style?: ViewStyle; inline?: boolean }) {
  const { isPaid } = useTier();
  if (!isPaid || !isNewMember(createdAtMs)) return null;
  return (
    <View style={[inline ? st.inline : st.abs, style]} pointerEvents="none" testID="new-member-badge">
      <Text style={st.txt}>NEW</Text>
    </View>
  );
}

const st = StyleSheet.create({
  abs: { position: "absolute", top: 8, left: 8, zIndex: 3, backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  inline: { backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  txt: { color: "#1a1404", fontSize: 11, fontWeight: "800" as const, letterSpacing: 0.8 },
});
