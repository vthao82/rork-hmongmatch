import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import HmongLogo from "@/components/onboarding/HmongLogo";

type Props = { right?: React.ReactNode };

function HmongMatchHeader({ right }: Props) {
  return (
    <View style={s.row} testID="app-header">
      <HmongLogo width={240} />
      {right ? <View style={s.right}>{right}</View> : <View />}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 },
  right: { flexDirection: "row", alignItems: "center", gap: 14 },
});

export default memo(HmongMatchHeader);
