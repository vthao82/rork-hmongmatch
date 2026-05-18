import React, { memo } from "react";
import { Image, Dimensions } from "react-native";

type Props = { size?: number; width?: number; fullWidth?: boolean };

function HmongLogo({ size = 96, width, fullWidth }: Props) {
  const screenW = Dimensions.get("window").width;
  const w = fullWidth ? screenW - 24 : (width ?? size * 2.4);
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
