import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { User, Lock, Crown, Plus, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import HmongMatchHeader from "@/components/HmongMatchHeader";
import { CATEGORY_GROUPS } from "@/constants/categories";
import { useTier } from "@/providers/TierProvider";
import { useOnboarding } from "@/providers/OnboardingProvider";

const SW = Dimensions.get("window").width;
const GAP = 12;
const HALF = (SW - 32 - GAP) / 2;

export default function InterestsTab() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { tier, isPaid } = useTier();
  const { data } = useOnboarding();
  const [lockOpen, setLockOpen] = useState<boolean>(false);
  const [seeAll, setSeeAll] = useState<string | null>(null);

  // Determine user's selected interests/preferences for highlighting their primary group
  const userTokens = useMemo(() => {
    const t: string[] = [];
    if (data.lookingFor) t.push(data.lookingFor);
    if (data.dialect) t.push(data.dialect);
    if (data.clan) t.push(data.clan.toLowerCase());
    if (data.work) t.push(data.work);
    if (data.education) t.push(data.education.toLowerCase());
    (data.interests ?? []).forEach(i => t.push(i.toLowerCase()));
    return t;
  }, [data]);

  const goCategory = (groupId: string, cardId: string, freeAccess: boolean) => {
    if (!freeAccess && !isPaid) {
      setLockOpen(true);
      return;
    }
    router.push(`/category/${encodeURIComponent(`${groupId}:${cardId}`)}`);
  };

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <HmongMatchHeader />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.heroTitle}>Explore what brings us together</Text>
        <Text style={s.heroSub}>Find people through your interests, culture and goals.</Text>

        {CATEGORY_GROUPS.map(group => {
          const visibleCards = seeAll === group.id ? group.cards : group.cards.slice(0, 4);
          return (
            <View key={group.id} style={s.section}>
              <View style={s.sectionHead}>
                <View style={{ flex: 1 }}>
                  <View style={s.sectionTitleRow}>
                    <Text style={s.sectionTitle}>{group.title}</Text>
                    {!group.freeAccess && !isPaid && (
                      <View style={s.proPill}>
                        <Crown size={10} color={Colors.accent} />
                        <Text style={s.proPillTxt}>Plus</Text>
                      </View>
                    )}
                  </View>
                </View>
                {group.cards.length > 4 && (
                  <TouchableOpacity onPress={() => setSeeAll(seeAll === group.id ? null : group.id)} testID={`seeall-${group.id}`}>
                    <Text style={s.seeAll}>{seeAll === group.id ? "Show less" : "See all"}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.grid}>
                {visibleCards.map(card => {
                  const locked = !group.freeAccess && !isPaid;
                  const highlight = userTokens.some(t => card.label.toLowerCase().includes(t) || t.includes(card.id));
                  return (
                    <TouchableOpacity
                      key={card.id}
                      style={[s.card, { width: HALF, height: 170 }, highlight && s.cardHighlight]}
                      onPress={() => goCategory(group.id, card.id, group.freeAccess)}
                      activeOpacity={0.85}
                      testID={`cat-${group.id}-${card.id}`}
                    >
                      <Image source={{ uri: card.image }} style={s.cardImg} contentFit="cover" />
                      <View style={s.cardTint} />
                      <View style={s.badge}><User size={11} color="#FFF" /><Text style={s.badgeTxt}>{card.members}</Text></View>
                      {locked && (
                        <View style={s.lockBadge}><Lock size={11} color="#FFF" /></View>
                      )}
                      <Text style={s.cardLabel} numberOfLines={2}>{card.label}</Text>
                      <View style={s.addBtn}>
                        <Plus size={14} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={lockOpen} transparent animationType="fade" onRequestClose={() => setLockOpen(false)}>
        <View style={s.modal}>
          <View style={s.modalCard}>
            <Crown size={36} color={Colors.accent} />
            <Text style={s.modalTitle}>Upgrade to see this group</Text>
            <Text style={s.modalSub}>This interest group is available to Plus and Gold members. Unlock all categories and find more meaningful matches.</Text>
            <TouchableOpacity style={s.cta} onPress={() => { setLockOpen(false); router.push("/subscription"); }} testID="upgrade-cta-interest">
              <Text style={s.ctaTxt}>See plans</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLockOpen(false)}><Text style={s.later}>Maybe later</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "#0a0207" },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  heroTitle: { color: "#FFF", fontSize: 22, fontWeight: "700" as const, textAlign: "center" as const, marginTop: 6 },
  heroSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center" as const, marginTop: 6, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionHead: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: "#FFF", fontSize: 16, fontWeight: "700" as const },
  seeAll: { color: Colors.accent, fontSize: 13, fontWeight: "600" as const },
  proPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: "rgba(212,168,67,0.5)", backgroundColor: "rgba(212,168,67,0.12)" },
  proPillTxt: { color: Colors.accent, fontSize: 10, fontWeight: "700" as const },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  card: { borderRadius: 16, overflow: "hidden", backgroundColor: "#111", borderWidth: 1, borderColor: "transparent" },
  cardHighlight: { borderColor: Colors.accent },
  cardImg: { ...StyleSheet.absoluteFillObject },
  cardTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,4,8,0.55)" },
  badge: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeTxt: { color: "#FFF", fontSize: 11, fontWeight: "700" as const },
  lockBadge: { position: "absolute", top: 10, left: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  cardLabel: { position: "absolute", bottom: 14, left: 12, right: 40, color: "#FFF", fontSize: 15, fontWeight: "700" as const, letterSpacing: -0.2 },
  addBtn: { position: "absolute", bottom: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.crimson, justifyContent: "center", alignItems: "center" },
  modal: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 28 },
  modalCard: { backgroundColor: "#16060c", borderRadius: 22, padding: 26, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "rgba(212,168,67,0.3)" },
  modalTitle: { color: "#FFF", fontSize: 19, fontWeight: "700" as const, marginTop: 12, textAlign: "center" as const },
  modalSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center" as const, marginTop: 8, lineHeight: 19 },
  cta: { backgroundColor: Colors.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999, marginTop: 18 },
  ctaTxt: { color: "#1a1404", fontSize: 14, fontWeight: "700" as const },
  later: { color: "rgba(255,255,255,0.5)", marginTop: 14, fontSize: 13 },
});
