import React, { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

type Props = { step: number; total: number };

function ProgressBar({ step, total }: Props) {
  const pct = Math.max(0, Math.min(1, step / total));
  const w = useRef(new Animated.Value(pct)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: pct, duration: 420, useNativeDriver: false }).start();
  }, [pct, w]);
  const widthInterp = w.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={s.wrap} testID="onboarding-progress">
      <View style={s.track} />
      <Animated.View style={[s.fill, { width: widthInterp }]}>
        <LinearGradient colors={[Colors.crimson, Colors.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { height: 3, width: "100%", overflow: "hidden" },
  track: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.08)" },
  fill: { height: "100%", borderRadius: 2, overflow: "hidden" },
});

export default memo(ProgressBar);
