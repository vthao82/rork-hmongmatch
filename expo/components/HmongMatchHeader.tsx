import React, { memo, ReactNode } from "react";
import { View, StyleSheet } from "react-native";

type Props = { right?: ReactNode };

function HmongMatchHeader({ right }: Props) {
  return (
    <View style={s.row} testID="hm-header">
      <View style={s.spacer} />
      {right ? <View style={s.right}>{right}</View> : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  spacer: { flex: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 14 },
});

export default memo(HmongMatchHeader);
