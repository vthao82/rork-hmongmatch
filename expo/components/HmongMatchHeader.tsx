import React, { memo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import HmongLogo from "@/components/onboarding/HmongLogo";

type Props = { right?: React.ReactNode };

const SCREEN_W = Dimensions.get("window").width;

function HmongMatchHeader({ right }: Props) {
  return (
    <View style={s.row} testID="app-header">
      <View style={s.center} pointerEvents="none">
        <HmongLogo width={Math.min(SCREEN_W - 32, 360)} />
      </View>
      {right ? <View style={s.right}>{right}</View> : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { height: 56, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4, justifyContent: "center" },
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  right: { position: "absolute", right: 16, top: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 14 },
});

export default memo(HmongMatchHeader);
