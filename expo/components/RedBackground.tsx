import React, { memo } from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const COLORS = [Colors.indigo, "#3c0a24", Colors.crimson] as const;

function RedBackground() {
  return (
    <LinearGradient
      colors={COLORS}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      pointerEvents="none"
    />
  );
}

export default memo(RedBackground);
