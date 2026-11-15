import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Heart } from "lucide-react-native";
import Colors from "@/constants/colors";
import type { PromptAnswer } from "@/constants/prompts";
import LikeCommentModal from "@/components/LikeCommentModal";

type Props = { prompts?: PromptAnswer[]; name: string; onLike?: (comment: string) => void };

/** Read-only prompt answers on a profile; tapping the heart likes with a comment. */
export default function PromptCards({ prompts, name, onLike }: Props) {
  const [target, setTarget] = useState<PromptAnswer | null>(null);
  if (!prompts?.length) return null;
  return (
    <View style={{ gap: 12, marginBottom: 24 }}>
      {prompts.map((p, i) => (
        <View key={`${p.q}-${i}`} style={s.card} testID={`profile-prompt-${i}`}>
          <Text style={s.q}>{p.q}</Text>
          <Text style={s.a}>{p.a}</Text>
          {onLike ? (
            <TouchableOpacity style={s.heart} onPress={() => setTarget(p)} testID={`prompt-like-${i}`}>
              <Heart size={18} color={Colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
      <LikeCommentModal
        visible={!!target}
        name={name}
        context={target ? `${target.q} ${target.a}` : undefined}
        onClose={() => setTarget(null)}
        onSend={(c) => { const t = target; setTarget(null); onLike?.(t ? `Re: “${t.q}” — ${c}`.trim() : c); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 18, padding: 18, paddingRight: 56, backgroundColor: "#fbf7f2", borderWidth: 1, borderColor: "#f0e6d8" },
  q: { fontSize: 13, fontWeight: "700" as const, color: Colors.textSecondary },
  a: { fontSize: 20, fontWeight: "700" as const, color: Colors.text, marginTop: 6, lineHeight: 27 },
  heart: { position: "absolute", right: 12, bottom: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#f0e6d8" },
});
