import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import Colors from "@/constants/colors";
import { registerWebAlert, type WebAlert } from "@/lib/webSetup";

/** Browser stand-in for the phone's pop-up dialogs. */
export function WebAlertHost() {
  const [a, setA] = useState<WebAlert | null>(null);
  useEffect(() => {
    registerWebAlert(setA);
    return () => registerWebAlert(null);
  }, []);
  if (!a) return null;
  const press = (i: number) => {
    const b = a.buttons[i];
    setA(null);
    b?.onPress?.();
  };
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => setA(null)}>
      <View style={s.backdrop} testID="web-alert">
        <View style={s.box}>
          <Text style={s.title}>{a.title}</Text>
          {a.message ? <Text style={s.msg}>{a.message}</Text> : null}
          <View style={s.btns}>
            {a.buttons.map((b, i) => (
              <TouchableOpacity key={`${b.text}-${i}`} style={[s.btn, b.style === "cancel" ? s.cancel : b.style === "destructive" ? s.danger : s.primary]} onPress={() => press(i)} testID={`web-alert-btn-${i}`}>
                <Text style={[s.btnTxt, b.style === "cancel" && { color: Colors.text }]}>{b.text ?? "OK"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  box: { width: "100%", maxWidth: 380, backgroundColor: "#FFF", borderRadius: 20, padding: 22 },
  title: { fontSize: 18, fontWeight: "800" as const, color: Colors.text },
  msg: { fontSize: 15, color: Colors.textSecondary, marginTop: 8, lineHeight: 21 },
  btns: { marginTop: 18, gap: 8 },
  btn: { borderRadius: 999, paddingVertical: 12, alignItems: "center" },
  primary: { backgroundColor: Colors.primary },
  danger: { backgroundColor: Colors.nope },
  cancel: { backgroundColor: "#F1EEF0" },
  btnTxt: { color: "#FFF", fontWeight: "800" as const, fontSize: 15 },
});
