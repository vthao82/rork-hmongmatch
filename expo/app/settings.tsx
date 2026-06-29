import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Modal, TextInput, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, MapPin, ChevronRight, Check, X as XIcon, Crown } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTier } from "@/providers/TierProvider";
import { useT } from "@/providers/LanguageProvider";

const ADV_KEY = "hmongdate.adv-filters.v1";
const PREF_KEY = "hmongdate.discovery.v1";

type PickerOption = { value: string; label: string };
type PickerConfig = { key: string; title: string; options: PickerOption[]; multi?: boolean };

const PICKERS: Record<string, PickerConfig> = {
  interestedIn: { key: "interestedIn", title: "Interested In", options: [
    { value: "women", label: "Women" }, { value: "men", label: "Men" }, { value: "everyone", label: "Everyone" },
  ]},
  lookingFor: { key: "lookingFor", title: "Looking for", options: [
    { value: "long", label: "Long-term partner" }, { value: "long-open", label: "Long-term, open to short" },
    { value: "short-open", label: "Short-term, open to long" }, { value: "short", label: "Short-term fun" },
    { value: "friends", label: "New friends" }, { value: "unsure", label: "Still figuring it out" },
  ]},
  languages: { key: "languages", title: "Languages", multi: true,
    options: ["Hmong","English","Spanish","French","Mandarin","Thai","Vietnamese","Lao"].map(l => ({ value: l, label: l })) },
  education: { key: "education", title: "Education",
    options: ["High School","College","Bachelor","Masters","PhD","Trade School","Other"].map(l => ({ value: l, label: l })) },
  family: { key: "family", title: "Family Plans",
    options: ["Want kids","Don't want kids","Have kids & want more","Have kids & done","Not sure"].map(l => ({ value: l, label: l })) },
  religion: { key: "religion", title: "Religion",
    options: ["Christian","Catholic","Traditional","Other"].map(l => ({ value: l, label: l })) },
  dialect: { key: "dialect", title: "Dialect", options: [{ value: "green", label: "Green" }, { value: "white", label: "White" }] },
  pets: { key: "pets", title: "Pets", multi: true,
    options: ["Dog","Cat","Bird","Fish","Reptile","Other","None"].map(l => ({ value: l, label: l })) },
  drinking: { key: "drinking", title: "Drinking",
    options: ["Not for me","Sober","Sober curious","On special occasions","Socially","Most nights"].map(l => ({ value: l, label: l })) },
  smoking: { key: "smoking", title: "Smoking",
    options: ["Non-smoker","Smoker","Smoker when drinking","Trying to quit"].map(l => ({ value: l, label: l })) },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={s.section}><Text style={s.sTitle}>{title}</Text>{children}</View>;
}

function Row({ label, value, onPress, right, testID }: { label: string; value?: string; onPress?: () => void; right?: React.ReactNode; testID?: string }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7} testID={testID} disabled={!onPress}>
      <Text style={s.rowLabel} numberOfLines={1}>{label}</Text>
      <View style={s.rowRight}>
        {value ? <Text style={s.rowValue} numberOfLines={1}>{value}</Text> : null}
        {right ?? <ChevronRight size={18} color="rgba(255,255,255,0.45)" />}
      </View>
    </TouchableOpacity>
  );
}

function Toggle({ value, onChange, testID }: { value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  return <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.primary, false: "rgba(255,255,255,0.2)" }} thumbColor="#FFF" ios_backgroundColor="rgba(255,255,255,0.2)" testID={testID} />;
}

function Slider({ value, onChange, max = 100, min = 0 }: { value: number; onChange: (v: number) => void; max?: number; min?: number }) {
  const [w, setW] = useState<number>(0);
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const toVal = (x: number) => !w ? value : Math.round(min + Math.max(0, Math.min(1, x / w)) * (max - min));
  return (
    <View style={s.slider} onLayout={e => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
      onResponderMove={e => onChange(toVal(e.nativeEvent.locationX))}
      onResponderRelease={e => onChange(toVal(e.nativeEvent.locationX))}>
      <View style={s.sliderTrack} />
      <View style={[s.sliderFill, { width: `${pct * 100}%` }]} />
      <View style={[s.sliderThumb, { left: `${pct * 100}%` }]} />
    </View>
  );
}

function RangeSlider({ low, high, onChange, min = 18, max = 80 }: { low: number; high: number; onChange: (l: number, h: number) => void; min?: number; max?: number }) {
  const [w, setW] = useState<number>(0);
  const span = max - min;
  const lPct = Math.max(0, Math.min(1, (low - min) / span));
  const hPct = Math.max(0, Math.min(1, (high - min) / span));
  const active = React.useRef<"l" | "h">("l");
  const update = (x: number) => {
    if (!w) return;
    const v = Math.round(min + Math.max(0, Math.min(1, x / w)) * span);
    if (active.current === "l") onChange(Math.min(v, high - 1), high);
    else onChange(low, Math.max(v, low + 1));
  };
  const pick = (x: number) => {
    if (!w) return;
    const v = Math.round(min + Math.max(0, Math.min(1, x / w)) * span);
    active.current = Math.abs(v - low) <= Math.abs(v - high) ? "l" : "h";
    update(x);
  };
  return (
    <View style={s.slider} onLayout={e => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
      onResponderGrant={e => pick(e.nativeEvent.locationX)} onResponderMove={e => update(e.nativeEvent.locationX)}>
      <View style={s.sliderTrack} />
      <View style={[s.sliderFill, { left: `${lPct * 100}%`, width: `${(hPct - lPct) * 100}%` }]} />
      <View style={[s.sliderThumb, { left: `${lPct * 100}%` }]} />
      <View style={[s.sliderThumb, { left: `${hPct * 100}%` }]} />
    </View>
  );
}

function PickerModal({ visible, config, selected, onClose, onSave, t }: { visible: boolean; config: PickerConfig | null; selected: string[]; onClose: () => void; onSave: (vals: string[]) => void; t: (k: any, vars?: any) => string }) {
  const [local, setLocal] = useState<string[]>(selected);
  useEffect(() => { setLocal(selected); }, [selected, visible]);
  if (!config) return null;
  const toggle = (v: string) => {
    if (config.multi) setLocal(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    else setLocal([v]);
  };
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modal}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><XIcon size={24} color="#FFF" /></TouchableOpacity>
          <Text style={s.modalTitle}>{config.title}</Text>
          <TouchableOpacity onPress={() => { onSave(local); onClose(); }} testID="picker-save">
            <Text style={s.modalSave}>{t("save")}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {config.options.map(opt => {
            const on = local.includes(opt.value);
            return (
              <TouchableOpacity key={opt.value} style={[s.optRow, on && s.optRowOn]} onPress={() => toggle(opt.value)} activeOpacity={0.8}>
                <Text style={[s.optLabel, on && s.optLabelOn]}>{opt.label}</Text>
                {on && <Check size={20} color={Colors.primary} strokeWidth={3} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { isPaid } = useTier();
  const t = useT();

  const [worldwide, setWorldwide] = useState<boolean>(false);
  const [usOnly, setUsOnly] = useState<boolean>(false);
  const [distance, setDistance] = useState<number>(50);
  const [showFurther, setShowFurther] = useState<boolean>(true);
  const [discovery, setDiscovery] = useState<boolean>(true);
  const [photoVerifiedChat, setPhotoVerifiedChat] = useState<boolean>(false);
  const [location, setLocation] = useState<string>("Little Canada, Minnesota");
  const [ageLow, setAgeLow] = useState<number>(21);
  const [ageHigh, setAgeHigh] = useState<number>(45);

  const [values, setValues] = useState<Record<string, string[]>>({
    interestedIn: ["women"], lookingFor: [], languages: ["Hmong", "English"],
    education: [], family: [], religion: [], dialect: [], pets: [], drinking: [], smoking: [],
  });
  const [savedToast, setSavedToast] = useState<boolean>(false);

  const [notifs, setNotifs] = useState<{ push: boolean; matches: boolean; messages: boolean; likes: boolean; promos: boolean }>({
    push: true, matches: true, messages: true, likes: true, promos: false,
  });

  const [picker, setPicker] = useState<PickerConfig | null>(null);
  const [locOpen, setLocOpen] = useState<boolean>(false);
  const [locInput, setLocInput] = useState<string>("");

  // hydrate
  useEffect(() => {
    (async () => {
      try {
        const [adv, pref] = await Promise.all([AsyncStorage.getItem(ADV_KEY), AsyncStorage.getItem(PREF_KEY)]);
        if (adv && adv !== "null") { try { setValues(prev => ({ ...prev, ...JSON.parse(adv) })); } catch (_e) {} }
        if (pref && pref !== "null") { try {
          const p = JSON.parse(pref);
          if (p.worldwide !== undefined) setWorldwide(p.worldwide);
          if (p.usOnly !== undefined) setUsOnly(p.usOnly);
          if (p.distance !== undefined) setDistance(p.distance);
          if (p.location) setLocation(p.location);
          if (p.ageLow !== undefined) setAgeLow(p.ageLow);
          if (p.ageHigh !== undefined) setAgeHigh(p.ageHigh);
        } catch (_e) {} }
      } catch (e) { console.log("settings hydrate", e); }
    })();
  }, []);

  const persistPref = useCallback(async (patch: object) => {
    try {
      const cur = await AsyncStorage.getItem(PREF_KEY);
      const merged = { ...(cur && cur !== "null" ? (() => { try { return JSON.parse(cur); } catch (_e) { return {}; } })() : {}), ...patch };
      await AsyncStorage.setItem(PREF_KEY, JSON.stringify(merged));
    } catch (e) { console.log("settings persist", e); }
  }, []);

  const openPicker = useCallback((cfg: PickerConfig) => setPicker(cfg), []);

  const savePicker = useCallback(async (vals: string[]) => {
    if (!picker) return;
    const next = { ...values, [picker.key]: vals };
    setValues(next);
    try { await AsyncStorage.setItem(ADV_KEY, JSON.stringify(next)); } catch (e) { console.log("adv save", e); }
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  }, [picker, values]);

  const displayValue = (k: string): string => {
    const cfg = PICKERS[k];
    const vs = values[k] ?? [];
    if (!cfg || vs.length === 0) return t("select");
    const labels = vs.map(v => cfg.options.find(o => o.value === v)?.label ?? v);
    return labels.length === 1 ? labels[0] : `${labels[0]} +${labels.length - 1}`;
  };

  const interestedInLabel = useMemo(() => displayValue("interestedIn"), [values]);

  const onWorldwide = (v: boolean) => { setWorldwide(v); if (v) setUsOnly(false); persistPref({ worldwide: v, usOnly: v ? false : usOnly }); };
  const onUSOnly = (v: boolean) => { setUsOnly(v); if (v) setWorldwide(false); persistPref({ usOnly: v, worldwide: v ? false : worldwide }); };

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} testID="back-settings">
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t("settings")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Section title={t("yourPlan")}>
          <TouchableOpacity style={s.planCard} onPress={() => router.push("/subscription")} activeOpacity={0.85} testID="plan-card">
            <Crown size={22} color={Colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={s.planTitle}>{isPaid ? "Hmong Date Unlimited" : "Hmong Date Free"}</Text>
              <Text style={s.planSub}>{isPaid ? t("allFeaturesUnlocked") : t("upgradeForUnlimited")}</Text>
            </View>
            <Text style={s.upgradeLink}>{isPaid ? t("manage") : t("upgrade")}</Text>
          </TouchableOpacity>
        </Section>

        <Section title={t("discoverySettings")}>
          <View style={s.card}>
            <Text style={s.rowLabel}>{t("location")}</Text>
            <View style={s.locRow}>
              <MapPin size={18} color={Colors.primary} />
              <Text style={s.locText}>{location}</Text>
            </View>
            <TouchableOpacity onPress={() => { setLocInput(location); setLocOpen(true); }} testID="add-location">
              <Text style={s.link}>{t("changeLocation")}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.card}>
            <View style={s.rowTop}>
              <Text style={s.rowLabel}>{t("maximumDistance")}</Text>
              <Text style={s.rowValue}>{worldwide ? t("worldwide") : usOnly ? t("usOnly") : `${distance}mi.`}</Text>
            </View>
            {!worldwide && !usOnly && <Slider value={distance} onChange={(v) => { setDistance(v); persistPref({ distance: v }); }} max={100} />}
            <View style={[s.rowToggle, { marginTop: 14 }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.rowLabel}>{t("searchWorldwide")}</Text>
                <Text style={s.rowSub}>{t("searchWorldwideSub")}</Text>
              </View>
              <Toggle value={worldwide} onChange={onWorldwide} testID="worldwide-toggle" />
            </View>
            <View style={[s.rowToggle, { marginTop: 12 }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.rowLabel}>{t("usOnlyTitle")}</Text>
                <Text style={s.rowSub}>{t("usOnlySub")}</Text>
              </View>
              <Toggle value={usOnly} onChange={onUSOnly} testID="us-only-toggle" />
            </View>
            {!worldwide && !usOnly && (
              <View style={[s.rowToggle, { marginTop: 12 }]}>
                <Text style={[s.rowLabel, { flex: 1, paddingRight: 8 }]}>{t("showFurther")}</Text>
                <Toggle value={showFurther} onChange={setShowFurther} />
              </View>
            )}
          </View>

          <Row label={t("interestedIn")} value={interestedInLabel} onPress={() => openPicker(PICKERS.interestedIn)} testID="interested-in" />

          <View style={s.card}>
            <View style={s.rowTop}>
              <Text style={s.rowLabel}>{t("ageRange")}</Text>
              <Text style={s.rowValue}>{ageLow} - {ageHigh}</Text>
            </View>
            <RangeSlider low={ageLow} high={ageHigh} onChange={(l, h) => { setAgeLow(l); setAgeHigh(h); persistPref({ ageLow: l, ageHigh: h }); }} />
          </View>
        </Section>





        <Section title={t("visibility")}>
          <View style={s.card}>
            <View style={s.rowToggle}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.rowLabel}>{t("enableDiscovery")}</Text>
                <Text style={s.rowSub}>{t("enableDiscoverySub")}</Text>
              </View>
              <Toggle value={discovery} onChange={setDiscovery} testID="discovery-toggle" />
            </View>
          </View>
        </Section>

        <Section title="Photo Verification">
          <View style={s.card}>
            <View style={s.rowToggle}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={s.rowLabel}>Photo Verification</Text>
                <Text style={s.rowSub}>{t("photoVerifiedChatSub")}</Text>
              </View>
              <Toggle value={photoVerifiedChat} onChange={(v) => { if (v) router.push("/photo-verify"); setPhotoVerifiedChat(v); }} />
            </View>
            <TouchableOpacity onPress={() => router.push("/photo-verify")} style={{ marginTop: 10 }}>
              <Text style={s.link}>{t("takeSelfieVerify")}</Text>
            </TouchableOpacity>
          </View>
        </Section>

        <Section title={t("notifications")}>
          {[
            { k: "matches", label: t("newMatches") },
            { k: "likes", label: t("newLikes") },
            { k: "messages", label: t("newMessages") },
            { k: "push", label: t("pushNotifications") },
          ].map(r => (
            <View key={r.k} style={s.card}>
              <View style={s.rowToggle}>
                <Text style={s.rowLabel}>{r.label}</Text>
                <Toggle value={(notifs as Record<string, boolean>)[r.k]} onChange={v => setNotifs(p => ({ ...p, [r.k]: v }))} />
              </View>
            </View>
          ))}
        </Section>

        <Section title={t("account")}>
          <Row label={t("editProfile")} onPress={() => router.push("/edit-profile")} testID="edit-profile-row" />
          <Row label={t("manageSubscription")} onPress={() => router.push("/subscription")} testID="manage-sub-row" />
          <Row label={t("reportProblem")} onPress={() => router.push("/report")} testID="report-row" />
          <TouchableOpacity style={s.row} onPress={() => Alert.alert(t("logout"), t("logoutConfirm"), [
            { text: t("cancel"), style: "cancel" },
            { text: t("logout"), style: "destructive", onPress: () => router.replace("/(auth)/login" as never) },
          ])} testID="logout-row">
            <Text style={[s.rowLabel, { color: Colors.primary }]}>{t("logout")}</Text>
          </TouchableOpacity>
        </Section>
      </ScrollView>

      <PickerModal visible={picker !== null} config={picker} selected={picker ? values[picker.key] ?? [] : []} onClose={() => setPicker(null)} onSave={savePicker} t={t} />

      <Modal visible={locOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLocOpen(false)}>
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setLocOpen(false)}><XIcon size={24} color="#FFF" /></TouchableOpacity>
            <Text style={s.modalTitle}>{t("changeLocationTitle")}</Text>
            <TouchableOpacity onPress={() => { if (locInput.trim()) { setLocation(locInput.trim()); persistPref({ location: locInput.trim() }); } setLocOpen(false); }}>
              <Text style={s.modalSave}>{t("save")}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <TextInput value={locInput} onChangeText={setLocInput} placeholder={t("cityState")} placeholderTextColor="rgba(255,255,255,0.4)" style={s.input} autoFocus />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "#0a0207" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" as const, flex: 1 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sTitle: { color: "#FFF", fontSize: 16, fontWeight: "700" as const, marginBottom: 10 },
  card: { backgroundColor: "#141414", borderRadius: 16, padding: 16, marginBottom: 10 },
  row: { backgroundColor: "#141414", borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  rowLabel: { color: "#FFF", fontSize: 15, fontWeight: "600" as const, flexShrink: 1 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: "55%" },
  rowValue: { color: "rgba(255,255,255,0.65)", fontSize: 14 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  rowToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowSub: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 4, lineHeight: 17 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  locText: { color: "#FFF", fontSize: 15 },
  link: { color: Colors.primary, fontSize: 14, fontWeight: "700" as const, marginTop: 10 },
  slider: { height: 36, justifyContent: "center" },
  sliderTrack: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)" },
  sliderFill: { position: "absolute", height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  sliderThumb: { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, marginLeft: -10, borderWidth: 2, borderColor: "#FFF" },
  modal: { flex: 1, backgroundColor: "#0b0b0b" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  modalTitle: { color: "#FFF", fontSize: 17, fontWeight: "700" as const, flex: 1, textAlign: "center", paddingHorizontal: 8 },
  modalSave: { color: Colors.primary, fontSize: 15, fontWeight: "700" as const },
  optRow: { backgroundColor: "#141414", borderRadius: 14, padding: 16, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "transparent" },
  optRowOn: { borderColor: Colors.primary, backgroundColor: "#1a0d10" },
  optLabel: { color: "#FFF", fontSize: 15, fontWeight: "600" as const },
  optLabelOn: { color: Colors.primary },
  input: { backgroundColor: "#141414", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: "#FFF", fontSize: 16 },
  planCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1a1404", borderWidth: 1, borderColor: "rgba(212,168,67,0.3)", borderRadius: 16, padding: 14 },
  planTitle: { color: "#FFF", fontSize: 16, fontWeight: "700" as const },
  planSub: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },
  upgradeLink: { color: Colors.accent, fontSize: 14, fontWeight: "700" as const },
  toast: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", backgroundColor: "rgba(47,192,113,0.2)", borderColor: Colors.like, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: 8 },
  toastTxt: { color: Colors.like, fontSize: 12, fontWeight: "700" as const },
});
