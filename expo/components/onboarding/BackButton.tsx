import React, { memo } from "react";
import { Pressable, StyleSheet, View, Platform } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type Props = {
  onPress?: () => void;
  tint?: "light" | "dark";
  testID?: string;
};

function BackButton({ onPress, tint = "dark", testID }: Props) {
  const canGo = router.canGoBack();
  if (!canGo && !onPress) return null;
  const handle = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    if (onPress) onPress();
    else if (router.canGoBack()) router.back();
  };
  const color = tint === "light" ? Colors.offwhite : Colors.dark.text;
  const bg = tint === "light" ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)";
  const border = tint === "light" ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.14)";
  return (
    <Pressable
      onPress={handle}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, borderColor: border }, pressed && s.pressed]}
      hitSlop={10}
      testID={testID ?? "onboarding-back"}
    >
      <View style={s.inner}>
        <ChevronLeft size={22} color={color} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: { alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});

export default memo(BackButton);
