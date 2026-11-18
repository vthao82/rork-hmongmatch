import React from "react";
import { View } from "react-native";

type AppleModule = typeof import("expo-apple-authentication");

/** Apple's official "Sign in with Apple" button (iOS only; render after availability check). */
export function AppleButton({ onPress }: { onPress: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const A = require("expo-apple-authentication") as AppleModule;
  return (
    <View style={{ marginTop: 12 }} testID="continue-apple">
      <A.AppleAuthenticationButton
        buttonType={A.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={A.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={999}
        style={{ width: "100%", height: 52 }}
        onPress={onPress}
      />
    </View>
  );
}
