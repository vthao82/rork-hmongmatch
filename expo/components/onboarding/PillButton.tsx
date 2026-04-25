import React, { memo, ReactNode } from "react";
import { Text, StyleSheet, Pressable, ActivityIndicator, View, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type Variant = "primary" | "light" | "ghost" | "dark";

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  left?: ReactNode;
  right?: ReactNode;
  testID?: string;
  fullWidth?: boolean;
};

function PillButton({ label, onPress, disabled, loading, variant = "light", left, right, testID, fullWidth = true }: Props) {
  const handle = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };
  const bg =
    variant === "primary" ? Colors.crimson :
    variant === "dark" ? "rgba(255,255,255,0.08)" :
    variant === "ghost" ? "transparent" : Colors.offwhite;
  const fg =
    variant === "primary" ? "#FFF" :
    variant === "dark" ? Colors.offwhite :
    variant === "ghost" ? Colors.offwhite : Colors.ink;
  const border = variant === "ghost" ? "rgba(255,255,255,0.25)" : variant === "dark" ? Colors.dark.border : "transparent";

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === "ghost" || variant === "dark" ? 1 : 0 },
        fullWidth && { alignSelf: "stretch" },
        pressed && !disabled && { transform: [{ scale: 0.98 }], opacity: 0.95 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <View style={s.row}>
        {left}
        {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.label, { color: fg }]}>{label}</Text>}
        {right}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  label: { fontSize: 16, fontWeight: "700" as const, letterSpacing: 0.2 },
});

export default memo(PillButton);
