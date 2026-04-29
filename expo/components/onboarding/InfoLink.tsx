import React, { memo } from "react";
import { Pressable, StyleSheet, Text, Alert, Platform } from "react-native";

type Props = {
  label?: string;
  testID?: string;
};

function InfoLink({ label = "Learn how Hmong Date uses this info", testID }: Props) {
  const onPress = () => {
    const msg = "We use this information only to show you compatible people. You can change or hide it anytime in Settings.";
    if (Platform.OS === "web") {
      console.log("info", msg);
    } else {
      Alert.alert("How we use this info", msg);
    }
  };
  return (
    <Pressable onPress={onPress} testID={testID} style={s.wrap}>
      <Text style={s.txt}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { paddingVertical: 10 },
  txt: { color: "#6aa7ff", fontSize: 14, fontWeight: "600" as const, textDecorationLine: "underline" as const },
});

export default memo(InfoLink);
