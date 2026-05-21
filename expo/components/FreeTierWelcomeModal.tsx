import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Heart, RefreshCw, MessageCircle, Zap, Crown } from "lucide-react-native";
import Colors from "@/constants/colors";
import HmongLogo from "@/components/onboarding/HmongLogo";
import { useT } from "@/providers/LanguageProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
};

function Item({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={s.item}>
      <View style={s.iconWrap}>{icon}</View>
      <Text style={s.itemLabel}>{label}</Text>
    </View>
  );
}

export default function FreeTierWelcomeModal({ visible, onClose, onUpgrade }: Props) {
  const t = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <HmongLogo width={140} />
          <Text style={s.title}>{t("freeTierTitle")}</Text>
          <Text style={s.sub}>{t("freeTierSub")}</Text>
          <View style={s.list}>
            <Item icon={<Heart size={16} color={Colors.crimson} />} label={t("freeTierLikes")} />
            <Item icon={<RefreshCw size={16} color={Colors.crimson} />} label={t("freeTierRewinds")} />
            <Item icon={<MessageCircle size={16} color={Colors.crimson} />} label={t("freeTierMessages")} />
            <Item icon={<Zap size={16} color={Colors.accent} />} label={t("freeTierBoost")} />
          </View>
          <TouchableOpacity style={s.cta} onPress={onClose} testID="free-tier-continue">
            <Text style={s.ctaTxt}>{t("continueLite")}</Text>
          </TouchableOpacity>
          {onUpgrade && (
            <TouchableOpacity onPress={onUpgrade} style={s.upgrade} testID="free-tier-upgrade">
              <Crown size={14} color={Colors.accent} />
              <Text style={s.upgradeTxt}>{t("seePlans")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { backgroundColor: "#16060c", borderRadius: 24, padding: 24, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "rgba(212,168,67,0.35)" },
  title: { color: "#FFF", fontSize: 22, fontWeight: "700" as const, textAlign: "center" as const, marginTop: 12 },
  sub: { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center" as const, marginTop: 8, lineHeight: 19 },
  list: { width: "100%", marginTop: 22, gap: 10 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(192,21,47,0.15)", alignItems: "center", justifyContent: "center" },
  itemLabel: { color: "#FFF", fontSize: 13, fontWeight: "600" as const },
  cta: { backgroundColor: Colors.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999, marginTop: 22, alignSelf: "stretch", alignItems: "center" },
  ctaTxt: { color: "#1a1404", fontSize: 14, fontWeight: "700" as const },
  upgrade: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, paddingVertical: 6 },
  upgradeTxt: { color: Colors.accent, fontSize: 13, fontWeight: "600" as const },
});
