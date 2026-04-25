import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type Props = {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testID?: string;
};

function ShowOnProfile({ label, value, onChange, testID }: Props) {
  const toggle = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    onChange(!value);
  };
  return (
    <Pressable onPress={toggle} style={s.row} testID={testID}>
      <View style={[s.box, value && s.boxOn]}>
        {value && <Check size={14} color="#fff" />}
      </View>
      <Text style={s.label}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  box: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 1.5, borderColor: "rgba(245,240,235,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  boxOn: { backgroundColor: Colors.crimson, borderColor: Colors.crimson },
  label: { color: Colors.dark.text, fontSize: 14.5, fontWeight: "600" as const },
});

export default memo(ShowOnProfile);
