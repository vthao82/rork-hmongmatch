import React, { memo } from "react";
import { Image } from "react-native";

type Props = { size?: number; width?: number };

function HmongLogo({ size = 96, width }: Props) {
  const w = width ?? size * 2.4;
  const h = w / 2.4;
  return (
    <Image
      source={require("@/assets/images/hmongdate-logo.png")}
      style={{ width: w, height: h }}
      resizeMode="contain"
      testID="hmongdate-logo"
    />
  );
}

export default memo(HmongLogo);
