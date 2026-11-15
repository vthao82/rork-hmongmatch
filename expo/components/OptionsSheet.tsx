import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import Colors from "@/constants/colors";

export type SheetOption = { text: string; style?: "default" | "destructive" | "cancel"; onPress?: () => void };

type Props = { visible: boolean; title: string; subtitle?: string; options: SheetOption[]; onClose: () => void };

/** Bottom action sheet with a close button (Android alerts only show 3 buttons). */
export default function OptionsSheet({ visible, title, subtitle, options, onClose }: Props) {
  const ins = useSafeAreaInsets();
  const pick = (o: SheetOption) => { onClose(); setTimeout(() => o.onPress?.(), 250); };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} testID="options-sheet-backdrop">
        <Pressable style={[s.sheet, { paddingBottom: ins.bottom + 16 }]} onPress={() => {}} testID="options-sheet">
          <View style={s.head}>
            <View style={{ flex: 1 }}>
              <Text style={s.title} numberOfLines={1}>{title}</Text>
              {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={s.close} hitSlop={10} testID="options-sheet-close">
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {options.filter((o) => o.style !== "cancel").map((o, i) => (
            <TouchableOpacity key={o.text} style={s.row} onPress={() => pick(o)} testID={`options-sheet-item-${i}`}>
              <Text style={[s.rowText, o.style === "destructive" && s.destructive]}>{o.text}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.cancel} onPress={onClose} testID="options-sheet-cancel">
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 18 },
  head: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "800" as const, color: Colors.text },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowText: { fontSize: 16, color: Colors.text, fontWeight: "600" as const },
  destructive: { color: Colors.nope },
  cancel: { marginTop: 12, paddingVertical: 15, borderRadius: 999, backgroundColor: Colors.surfaceAlt, alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "700" as const, color: Colors.text },
});
