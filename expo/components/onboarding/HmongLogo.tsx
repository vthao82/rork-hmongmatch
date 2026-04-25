import React, { memo } from "react";
import { View } from "react-native";

type Props = { size?: number };

function HmongLogo({ size = 0 }: Props) {
  return <View style={{ width: 0, height: size }} testID="hm-logo-empty" />;
}

export default memo(HmongLogo);
