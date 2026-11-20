import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Heart } from "lucide-react-native";
import Colors from "@/constants/colors";
import type { PromptAnswer } from "@/constants/prompts";
import LikeCommentModal from "@/components/LikeCommentModal";

type Props = { prompts?: PromptAnswer[]; name: string; dark?: boolean; onLike?: (comment: string) => void };

/** Read-only prompt answers on a profile; tapping the heart likes with a comment. */
export default function PromptCards({ prompts, name, dark, onLike }: Props) {
  const [target, setTarget] = useState<PromptAnswer | null>(null);
  if (!prompts?.length) return null;
  return (
    <View style={{ gap: 12, marginBottom: 24 }}>
      {prompts.map((p, i) => (
        <View key={`${p.q}-${i}`} style={[s.card, dark && s.cardDark]} testID={`profile-prompt-${i}`}>
          <Text style={[s.q, dark && s.qDark]}>{p.q}</Text>
          <Text style={[s.a, dark && s.aDark]}>{p.a}</Text>
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
  a: { fontSize: 13, fontWeight: "700" as const, color: Colors.textSecondary, marginTop: 6, lineHeight: 19 },
  cardDark: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(212,168,67,0.4)" },
  qDark: { color: Colors.goldLight },
  aDark: { color: Colors.goldLight },
  heart: { position: "absolute", right: 12, bottom: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#f0e6d8" },
});
