import React, { memo } from "react";
import { Pressable, StyleSheet, Text, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

function TagChip({ label, selected, onPress, testID }: Props) {
  const handle = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    onPress();
  };
  return (
    <Pressable
      onPress={handle}
      testID={testID}
      style={({ pressed }) => [s.tag, selected && s.tagActive, pressed && { opacity: 0.85 }]}
    >
      <Text style={[s.txt, selected && s.txtActive]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  tag: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245,240,235,0.18)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  tagActive: {
    borderColor: Colors.crimson,
    backgroundColor: "rgba(192,21,47,0.10)",
  },
  txt: { color: Colors.dark.text, fontSize: 13.5, fontWeight: "600" as const },
  txtActive: { color: Colors.dark.text },
});

export default memo(TagChip);
