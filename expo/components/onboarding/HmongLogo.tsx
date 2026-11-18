import React, { memo } from "react";
import { Image, Dimensions, Platform, View } from "react-native";

type Props = { size?: number; width?: number; fullWidth?: boolean };

// The square asset's wordmark spans 93% of its width and is 4.08:1
const MARK = 0.93;
const RATIO = 4.08;

function HmongLogo({ size = 96, width, fullWidth }: Props) {
  const screenW = Dimensions.get("window").width;
  const w = fullWidth ? screenW - 16 : (width ?? size * 2.4);
  const h = fullWidth ? w / 1.2 : w / 2.4;
  if (Platform.OS === "web") {
    // Browsers: draw the cropped 4K wordmark at the exact same on-screen size so it stays crisp
    const side = Math.min(w, h);
    const markW = side * MARK;
    return (
      <View style={{ width: w, height: h, alignItems: "center", justifyContent: "center" }} testID="hmongdate-logo">
        <Image source={{ uri: "/landing/logo.webp" }} style={{ width: markW, height: markW / RATIO, marginTop: side * 0.068 }} resizeMode="contain" accessibilityLabel="Hmong Date" />
      </View>
    );
  }
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
