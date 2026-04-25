import React, { memo, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type Props = {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  right?: ReactNode;
  testID?: string;
};

function OptionCard({ title, description, selected, onPress, right, testID }: Props) {
  const handle = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    onPress();
  };
  return (
    <Pressable
      onPress={handle}
      style={({ pressed }) => [s.card, selected && s.cardActive, pressed && { opacity: 0.9 }]}
      testID={testID}
    >
      <View style={s.textWrap}>
        <Text style={[s.title, selected && s.titleActive]}>{title}</Text>
        {description ? <Text style={s.desc}>{description}</Text> : null}
      </View>
      {right ?? (
        <View style={[s.check, selected && s.checkActive]}>
          {selected && <Check size={16} color="#fff" />}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(245,240,235,0.14)",
    backgroundColor: "rgba(255,255,255,0.025)",
    marginBottom: 10,
    gap: 12,
  },
  cardActive: {
    borderColor: Colors.crimson,
    backgroundColor: "rgba(192,21,47,0.08)",
  },
  textWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700" as const, color: Colors.dark.text },
  titleActive: { color: Colors.dark.text },
  desc: { fontSize: 13, color: Colors.dark.textDim, marginTop: 4, lineHeight: 18 },
  check: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: "rgba(245,240,235,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  checkActive: { backgroundColor: Colors.crimson, borderColor: Colors.crimson },
});

export default memo(OptionCard);
