import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from "react-native";
import { Plus, X, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { PROMPTS, MAX_PROMPTS, type PromptAnswer } from "@/constants/prompts";

type Props = { value: PromptAnswer[]; onChange: (v: PromptAnswer[]) => void };

/** Pick up to 3 prompts and write answers (dark theme). */
export default function PromptsEditor({ value, onChange }: Props) {
  const [picking, setPicking] = useState<number | null>(null);
  const used = value.map((p) => p.q);

  const choose = (q: string) => {
    if (picking === null) return;
    const next = [...value];
    if (picking >= next.length) next.push({ q, a: "" });
    else next[picking] = { q, a: next[picking].a };
    onChange(next);
    setPicking(null);
  };

  return (
    <View style={{ gap: 12 }}>
      {value.map((p, i) => (
        <View key={`${p.q}-${i}`} style={s.card} testID={`prompt-card-${i}`}>
          <View style={s.cardHead}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setPicking(i)} testID={`prompt-change-${i}`}>
              <Text style={s.q}>{p.q}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onChange(value.filter((_, j) => j !== i))} hitSlop={10} testID={`prompt-remove-${i}`}>
              <X size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          <TextInput
            value={p.a}
            onChangeText={(a) => onChange(value.map((x, j) => (j === i ? { ...x, a } : x)))}
            placeholder="Your answer…"
            placeholderTextColor="rgba(245,240,235,0.35)"
            multiline
            maxLength={150}
            style={s.input}
            testID={`prompt-answer-${i}`}
          />
          <Text style={s.count}>{p.a.length}/150</Text>
        </View>
      ))}
      {value.length < MAX_PROMPTS && (
        <TouchableOpacity style={s.add} onPress={() => setPicking(value.length)} testID="prompt-add">
          <Plus size={18} color={Colors.gold} />
          <Text style={s.addText}>Add a prompt ({value.length}/{MAX_PROMPTS})</Text>
        </TouchableOpacity>
      )}

      <Modal visible={picking !== null} transparent animationType="slide" onRequestClose={() => setPicking(null)}>
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Pick a prompt</Text>
              <TouchableOpacity onPress={() => setPicking(null)} testID="prompt-picker-close"><X size={22} color="#FFF" /></TouchableOpacity>
            </View>
            <ScrollView>
              {PROMPTS.filter((q) => !used.includes(q)).map((q) => (
                <TouchableOpacity key={q} style={s.row} onPress={() => choose(q)} testID={`prompt-option-${PROMPTS.indexOf(q)}`}>
                  <Text style={s.rowText}>{q}</Text>
                  <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(212,168,67,0.35)" },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  q: { color: Colors.goldLight, fontSize: 14, fontWeight: "800" as const },
  input: { color: "#FFF", fontSize: 15, minHeight: 50, marginTop: 8, textAlignVertical: "top" as const },
  count: { color: "rgba(255,255,255,0.35)", fontSize: 11, alignSelf: "flex-end" },
  add: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(212,168,67,0.5)" },
  addText: { color: Colors.gold, fontWeight: "700" as const, fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { maxHeight: "75%", backgroundColor: Colors.dark.bgSoft, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24 },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18 },
  sheetTitle: { color: "#FFF", fontSize: 17, fontWeight: "800" as const },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  rowText: { color: "#FFF", fontSize: 15, flex: 1, paddingRight: 10 },
});
