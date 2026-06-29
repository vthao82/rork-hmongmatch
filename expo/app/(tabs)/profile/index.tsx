import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Settings as SettingsIcon, Edit3, Image as ImageIcon, Type, Flame, Plus, Lock, Check, AlertTriangle, Eye } from "lucide-react-native";
import VerifiedBadge from "@/components/VerifiedBadge";
import Colors from "@/constants/colors";
import { currentUser } from "@/mocks/profiles";
import HmongMatchHeader from "@/components/HmongMatchHeader";
import RedBackground from "@/components/RedBackground";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useTier } from "@/providers/TierProvider";
import { useT } from "@/providers/LanguageProvider";
import { auth } from "@/lib/firebase";

function TaskCard({ icon, title, sub, pct, onPress, done, testID }: { icon: React.ReactNode; title: string; sub: string; pct: string; onPress: () => void; done?: boolean; testID?: string }) {
  return (
    <TouchableOpacity style={s.taskCard} onPress={onPress} activeOpacity={0.85} testID={testID}>
      <View style={s.taskIconWrap}>
        {icon}
        <View style={s.pctBadge}><Text style={s.pctText}>{pct}</Text></View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.taskTitle}>{title}</Text>
        <Text style={s.taskSub}>{sub}</Text>
      </View>
      {done ? (
        <View style={s.doneCircle}><Check size={14} color="#FFF" /></View>
      ) : (
        <View style={s.dashedCircle} />
      )}
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, cta, color, onPress, testID }: { icon: React.ReactNode; label: string; cta: string; color: string; onPress: () => void; testID?: string }) {
  return (
    <TouchableOpacity style={s.statCard} onPress={onPress} activeOpacity={0.85} testID={testID}>
      <View style={s.plusBtn}><Plus size={14} color="#FFF" /></View>
      <View style={{ alignItems: "center", gap: 6 }}>
        {icon}
        <Text style={s.statLabel}>{label}</Text>
        <Text style={[s.statCta, { color }]}>{cta}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const { data } = useOnboarding();
  const { isPaid, upgrade } = useTier();
  const displayName = data.name?.trim() ? data.name : currentUser.name;
  const photo = data.photos && data.photos.length > 0 ? data.photos[0] : currentUser.photos[0];
  const photoCount = data.photos?.length ?? 0;
  const hasBio = !!data.bio?.trim();
  const base = 32;
  const completion = Math.min(100, base + (photoCount >= 4 ? 38 : 0) + (hasBio ? 30 : 0));

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <RedBackground />
      <HmongMatchHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.topRow}>
          <Image source={{ uri: photo }} style={s.avatar} contentFit="cover" />
          <View style={s.nameCol}>
            <View style={s.nameRow}>
              <Text style={s.name}>{displayName}</Text>
              <VerifiedBadge verified={!!data.photoVerified} size={18} />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity style={s.editBtn} onPress={() => router.push("/edit-profile")} testID="edit-profile">
                <Edit3 size={14} color="#1a1a1f" />
                <Text style={s.editText}>{t("editProfile")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.viewBtn}
                onPress={() => {
                  const uid = auth.currentUser?.uid;
                  if (uid) router.push(`/user/${uid}`);
                  else Alert.alert("Sign in required", "Sign in to preview your public profile.");
                }}
                testID="view-profile"
              >
                <Eye size={14} color="#FFF" />
                <Text style={s.viewBtnText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/settings")} testID="settings-btn">
            <SettingsIcon size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        <View style={s.progressRow}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${completion}%` }]}>
              <Text style={s.progressText}>{completion}%</Text>
            </View>
          </View>
        </View>
        <Text style={s.progressSub}>{t("completeProfile")}</Text>

        {photoCount < 4 && (
          <TaskCard icon={<ImageIcon size={28} color={Colors.primary} />} title={t("addPhotosTitle")} sub={t("addPhotosSub", { n: photoCount })} pct="+28%" done={false} onPress={() => router.push({ pathname: "/edit-profile", params: { focus: "photos" } })} testID="task-photos" />
        )}
        {!hasBio && (
          <TaskCard icon={<Type size={28} color={Colors.primary} />} title={t("addBioTitle")} sub={t("addBioSub")} pct="+30%" done={false} onPress={() => router.push({ pathname: "/edit-profile", params: { focus: "bio" } })} testID="task-bio" />
        )}

        <View style={s.statsRow}>
        </View>

        <TouchableOpacity style={s.goldCard} onPress={() => router.push("/subscription")} activeOpacity={0.9} testID="upgrade-card">
          <View style={s.goldHeader}>
            <View style={s.goldBadge}>
              <Flame size={18} color={Colors.accent} fill={Colors.accent} />
              <Text style={s.goldWordmark}>Hmong Date</Text>
              <View style={s.goldChip}><Text style={s.goldChipText}>{isPaid ? "UNLIMITED" : "FREE"}</Text></View>
            </View>
            {isPaid ? (
              <TouchableOpacity
                style={[s.upgradeBtn, { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }]}
                onPress={() => {
                  Alert.alert("Cancel subscription?", "Your Unlimited access will end immediately. You can re-subscribe anytime.", [
                    { text: "Keep Unlimited", style: "cancel" },
                    { text: "Cancel", style: "destructive", onPress: async () => { await upgrade("free"); Alert.alert("Subscription cancelled", "You're back on the Free plan."); } },
                  ]);
                }}
                testID="cancel-sub"
              >
                <Text style={[s.upgradeText, { color: "#FFF" }]}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.upgradeBtn}><Text style={s.upgradeText}>{t("upgrade")}</Text></View>
            )}
          </View>
          <View style={s.compareHeader}>
            <Text style={s.compareTitle}>{t("whatsIncluded")}</Text>
            <View style={s.compareCols}>
              <Text style={s.compareColText}>{t("free")}</Text>
              <Text style={s.compareColText}>Unlimited</Text>
            </View>
          </View>
          {[
            { label: t("seeWhoLikesYouFeat"), free: false },
            { label: t("topPicksFeat"), free: false },
            { label: t("unlimitedLikesFeat"), free: false },
            { label: t("profileBoosts"), free: false },
          ].map(r => (
            <View key={r.label} style={s.compareRow}>
              <Text style={s.compareRowText}>{r.label}</Text>
              <View style={s.compareCols}>
                <View style={s.colIcon}>{r.free ? <Check size={16} color={Colors.accent} /> : <Lock size={14} color="rgba(255,255,255,0.5)" />}</View>
                <View style={s.colIcon}><Check size={16} color={Colors.accent} /></View>
              </View>
            </View>
          ))}
        </TouchableOpacity>

        <TouchableOpacity style={s.reportRow} onPress={() => router.push("/report")} testID="report-row">
          <AlertTriangle size={18} color={Colors.crimsonLight} />
          <Text style={s.reportText}>{t("reportRow")}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "transparent" },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#222" },
  nameCol: { flex: 1, gap: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: "#FFF", fontSize: 22, fontWeight: "800" as const },
  editBtn: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, backgroundColor: "#FFF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  editText: { color: "#1a1a1f", fontWeight: "700" as const, fontSize: 13 },
  viewBtn: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  viewBtnText: { color: "#FFF", fontWeight: "700" as const, fontSize: 13 },
  reportRow: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: "#141414", borderWidth: 1, borderColor: "rgba(192,21,47,0.25)" },
  reportText: { color: "#FFF", fontSize: 14, fontWeight: "700" as const },
  progressRow: { marginTop: 18 },
  progressBar: { height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "visible" },
  progressFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4, justifyContent: "center", alignItems: "flex-end", paddingRight: 6 },
  progressText: { color: "#FFF", fontSize: 10, fontWeight: "800" as const, position: "absolute", right: -20, top: -4, backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  progressSub: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 16, marginBottom: 12 },
  taskCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#141414", borderRadius: 16, padding: 14, marginBottom: 10 },
  taskIconWrap: { width: 56, height: 56, borderRadius: 14, backgroundColor: "rgba(192,21,47,0.1)", justifyContent: "center", alignItems: "center", position: "relative" },
  pctBadge: { position: "absolute", bottom: -6, left: -4, backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  pctText: { color: "#FFF", fontSize: 10, fontWeight: "800" as const },
  taskTitle: { color: "#FFF", fontSize: 15, fontWeight: "700" as const },
  taskSub: { color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 2 },
  dashedCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)", borderStyle: "dashed" },
  doneCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: "#141414", borderRadius: 14, padding: 16, minHeight: 110, position: "relative" },
  plusBtn: { position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)", justifyContent: "center", alignItems: "center" },
  statLabel: { color: "#FFF", fontSize: 13, fontWeight: "700" as const },
  statCta: { fontSize: 11, fontWeight: "800" as const, letterSpacing: 0.5 },
  goldCard: { marginTop: 16, backgroundColor: "#1a1404", borderWidth: 1, borderColor: "rgba(212,168,67,0.3)", borderRadius: 18, padding: 16 },
  goldHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  goldBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  goldWordmark: { color: "#FFF", fontSize: 16, fontWeight: "800" as const },
  goldChip: { backgroundColor: Colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  goldChipText: { color: "#1a1404", fontSize: 10, fontWeight: "800" as const },
  upgradeBtn: { backgroundColor: Colors.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  upgradeText: { color: "#1a1404", fontWeight: "800" as const, fontSize: 13 },
  compareHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(212,168,67,0.15)" },
  compareTitle: { color: "#FFF", fontSize: 14, fontWeight: "700" as const },
  compareCols: { flexDirection: "row", gap: 20 },
  compareColText: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "700" as const, width: 36, textAlign: "center" },
  compareRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  compareRowText: { color: "#FFF", fontSize: 14 },
  colIcon: { width: 36, alignItems: "center" },
});
