import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Modal, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, MapPin, ChevronRight, Check, Info, X as XIcon } from "lucide-react-native";
import Colors from "@/constants/colors";

type PickerOption = { value: string; label: string };

type PickerConfig = {
  key: string;
  title: string;
  options: PickerOption[];
  multi?: boolean;
};

const PICKERS: Record<string, PickerConfig> = {
  interestedIn: {
    key: "interestedIn",
    title: "Interested In",
    options: [
      { value: "women", label: "Women" },
      { value: "men", label: "Men" },
      { value: "everyone", label: "Everyone" },
    ],
  },
  interests: {
    key: "interests",
    title: "Interests",
    multi: true,
    options: [
      "Travel","Foodie","Music","Hiking","Gaming","Reading","Coffee","Fitness","Art","Movies","Dancing","Photography","Cooking","Yoga","Fashion","Pets","Outdoors","Hmong Culture",
    ].map(l => ({ value: l, label: l })),
  },
  lookingFor: {
    key: "lookingFor",
    title: "Looking for",
    options: [
      { value: "long", label: "Long-term partner" },
      { value: "long-open", label: "Long-term, open to short" },
      { value: "short-open", label: "Short-term, open to long" },
      { value: "short", label: "Short-term fun" },
      { value: "friends", label: "New friends" },
      { value: "unsure", label: "Still figuring it out" },
    ],
  },
  openTo: {
    key: "openTo",
    title: "Open to…",
    multi: true,
    options: ["Dating","Networking","Friendship","Casual","Marriage"].map(l => ({ value: l, label: l })),
  },
  languages: {
    key: "languages",
    title: "Languages",
    multi: true,
    options: ["Hmong","English","Spanish","French","Mandarin","Thai","Vietnamese","Lao"].map(l => ({ value: l, label: l })),
  },
  zodiac: {
    key: "zodiac",
    title: "Zodiac",
    options: ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"].map(l => ({ value: l, label: l })),
  },
  education: {
    key: "education",
    title: "Education",
    options: ["High School","In College","Undergrad","Postgrad","PhD","Trade School","Other"].map(l => ({ value: l, label: l })),
  },
  family: {
    key: "family",
    title: "Family Plans",
    options: ["Want kids","Don't want kids","Have kids & want more","Have kids & done","Not sure"].map(l => ({ value: l, label: l })),
  },
  communication: {
    key: "communication",
    title: "Communication Style",
    options: ["Big texter","Phone caller","Video caller","In person","Bad texter","Better in person"].map(l => ({ value: l, label: l })),
  },
  love: {
    key: "love",
    title: "Love Style",
    options: ["Thoughtful gestures","Gifts","Quality time","Touch","Compliments"].map(l => ({ value: l, label: l })),
  },
  pets: {
    key: "pets",
    title: "Pets",
    multi: true,
    options: ["Dog","Cat","Bird","Fish","Reptile","Other","None"].map(l => ({ value: l, label: l })),
  },
  drinking: {
    key: "drinking",
    title: "Drinking",
    options: ["Not for me","Sober","Sober curious","On special occasions","Socially","Most nights"].map(l => ({ value: l, label: l })),
  },
  smoking: {
    key: "smoking",
    title: "Smoking",
    options: ["Non-smoker","Smoker","Smoker when drinking","Trying to quit"].map(l => ({ value: l, label: l })),
  },
  cannabis: {
    key: "cannabis",
    title: "Cannabis",
    options: ["Yes","Sometimes","No","Trying to quit"].map(l => ({ value: l, label: l })),
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sTitle}>{title}</Text>
      {children}
    </View>
  );
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
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: Colors.primary, false: "rgba(255,255,255,0.2)" }}
      thumbColor="#FFF"
      ios_backgroundColor="rgba(255,255,255,0.2)"
      testID={testID}
    />
  );
}

function Slider({ value, onChange, max = 100, min = 0, unit = "mi" }: { value: number; onChange: (v: number) => void; max?: number; min?: number; unit?: string }) {
  const [w, setW] = useState<number>(0);
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const toVal = (x: number) => {
    if (!w) return value;
    const r = Math.max(0, Math.min(1, x / w));
    return Math.round(min + r * (max - min));
  };
  return (
    <View
      style={s.slider}
      onLayout={e => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderMove={e => onChange(toVal(e.nativeEvent.locationX))}
      onResponderRelease={e => onChange(toVal(e.nativeEvent.locationX))}
    >
      <View style={s.sliderTrack} />
      <View style={[s.sliderFill, { width: `${pct * 100}%` }]} />
      <View style={[s.sliderThumb, { left: `${pct * 100}%` }]} />
      <Text style={s.srOnly}>{value}{unit}</Text>
    </View>
  );
}

function RangeSlider({ low, high, onChange, min = 18, max = 80 }: { low: number; high: number; onChange: (l: number, h: number) => void; min?: number; max?: number }) {
  const [w, setW] = useState<number>(0);
  const span = max - min;
  const lPct = Math.max(0, Math.min(1, (low - min) / span));
  const hPct = Math.max(0, Math.min(1, (high - min) / span));
  const active = React.useRef<"l" | "h">("l");
  const pick = (x: number) => {
    if (!w) return;
    const r = Math.max(0, Math.min(1, x / w));
    const v = Math.round(min + r * span);
    const dl = Math.abs(v - low);
    const dh = Math.abs(v - high);
    active.current = dl <= dh ? "l" : "h";
    update(x);
  };
  const update = (x: number) => {
    if (!w) return;
    const r = Math.max(0, Math.min(1, x / w));
    const v = Math.round(min + r * span);
    if (active.current === "l") onChange(Math.min(v, high - 1), high);
    else onChange(low, Math.max(v, low + 1));
  };
  return (
    <View
      style={s.slider}
      onLayout={e => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={e => pick(e.nativeEvent.locationX)}
      onResponderMove={e => update(e.nativeEvent.locationX)}
    >
      <View style={s.sliderTrack} />
      <View style={[s.sliderFill, { left: `${lPct * 100}%`, width: `${(hPct - lPct) * 100}%` }]} />
      <View style={[s.sliderThumb, { left: `${lPct * 100}%` }]} />
      <View style={[s.sliderThumb, { left: `${hPct * 100}%` }]} />
    </View>
  );
}

function PickerModal({ visible, config, selected, onClose, onSave }: { visible: boolean; config: PickerConfig | null; selected: string[]; onClose: () => void; onSave: (vals: string[]) => void }) {
  const [local, setLocal] = useState<string[]>(selected);
  React.useEffect(() => { setLocal(selected); }, [selected, visible]);
  if (!config) return null;
  const toggle = (v: string) => {
    if (config.multi) {
      setLocal(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    } else {
      setLocal([v]);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modal}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose} testID="picker-close"><XIcon size={24} color="#FFF" /></TouchableOpacity>
          <Text style={s.modalTitle}>{config.title}</Text>
          <TouchableOpacity onPress={() => { onSave(local); onClose(); }} testID="picker-save">
            <Text style={s.modalSave}>Save</Text>
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

function TextModal({ visible, title, initial, placeholder, onClose, onSave }: { visible: boolean; title: string; initial: string; placeholder?: string; onClose: () => void; onSave: (v: string) => void }) {
  const [val, setVal] = useState<string>(initial);
  React.useEffect(() => { setVal(initial); }, [initial, visible]);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modal}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><XIcon size={24} color="#FFF" /></TouchableOpacity>
          <Text style={s.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={() => { onSave(val.trim()); onClose(); }}>
            <Text style={s.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: 16 }}>
          <TextInput
            value={val}
            onChangeText={setVal}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={s.input}
            autoFocus
          />
        </View>
      </View>
    </Modal>
  );
}

const PROFILE_FEATURES = ["Web Profile", "Q&A Events", "Top Picks", "Zodiac Mode", "Music", "Swipe Surge", "Active Status"] as const;

export default function SettingsScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();

  const [global, setGlobal] = useState<boolean>(false);
  const [worldwide, setWorldwide] = useState<boolean>(false);
  const [distance, setDistance] = useState<number>(100);
  const [showFurther, setShowFurther] = useState<boolean>(true);
  const [showOutOfRange, setShowOutOfRange] = useState<boolean>(true);
  const [hasBio, setHasBio] = useState<boolean>(false);
  const [minPhotos, setMinPhotos] = useState<number>(1);
  const [visibility, setVisibility] = useState<"standard" | "incognito">("standard");
  const [discovery, setDiscovery] = useState<boolean>(true);
  const [photoVerifiedChat, setPhotoVerifiedChat] = useState<boolean>(false);
  const [safetyPartner, setSafetyPartner] = useState<boolean>(false);
  const [location, setLocation] = useState<string>("Little Canada, Minnesota");
  const [ageLow, setAgeLow] = useState<number>(33);
  const [ageHigh, setAgeHigh] = useState<number>(53);

  const [values, setValues] = useState<Record<string, string[]>>({
    interestedIn: ["women"],
    interests: [],
    lookingFor: [],
    openTo: [],
    languages: ["Hmong", "English"],
    zodiac: [],
    education: [],
    family: [],
    communication: [],
    love: [],
    pets: [],
    drinking: [],
    smoking: [],
    cannabis: [],
  });

  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(PROFILE_FEATURES.map(f => [f, true]))
  );
  const [notifs, setNotifs] = useState<{ push: boolean; email: boolean; matches: boolean; messages: boolean; promos: boolean }>({
    push: true, email: true, matches: true, messages: true, promos: false,
  });

  const [picker, setPicker] = useState<PickerConfig | null>(null);
  const [locOpen, setLocOpen] = useState<boolean>(false);
  const [featureOpen, setFeatureOpen] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState<"push" | "email" | "notifications" | null>(null);

  const openPicker = useCallback((cfg: PickerConfig) => setPicker(cfg), []);
  const savePicker = useCallback((vals: string[]) => {
    if (!picker) return;
    setValues(prev => ({ ...prev, [picker.key]: vals }));
  }, [picker]);

  const displayValue = (k: string): string => {
    const cfg = PICKERS[k];
    const vs = values[k] ?? [];
    if (!cfg || vs.length === 0) return "Select";
    const labels = vs.map(v => cfg.options.find(o => o.value === v)?.label ?? v);
    if (labels.length === 1) return labels[0];
    return `${labels[0]} +${labels.length - 1}`;
  };

  const interestedInLabel = useMemo(() => displayValue("interestedIn"), [values]);

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} testID="back-settings">
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Section title="Discovery Settings">
          <View style={s.card}>
            <Text style={s.rowLabel}>Location</Text>
            <View style={s.locRow}>
              <MapPin size={18} color={Colors.primary} />
              <Text style={s.locText}>{location}</Text>
            </View>
            <TouchableOpacity onPress={() => setLocOpen(true)} testID="add-location">
              <Text style={s.link}>Add a new location</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.hint}>Change locations to find matches anywhere.</Text>

          <View style={s.card}>
            <View style={s.rowToggle}>
              <Text style={s.rowLabel}>Global</Text>
              <Toggle value={global} onChange={setGlobal} testID="global-toggle" />
            </View>
          </View>
          <Text style={s.hint}>Going global will allow you to see people nearby and from around the world.</Text>

          <View style={s.card}>
            <View style={s.rowTop}>
              <Text style={s.rowLabel}>Maximum Distance</Text>
              <Text style={s.rowValue}>{worldwide ? "Worldwide" : `${distance}mi.`}</Text>
            </View>
            {!worldwide && <Slider value={distance} onChange={setDistance} max={100} />}
            <View style={[s.rowToggle, { marginTop: 10 }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.rowLabel}>Search worldwide</Text>
                <Text style={s.rowSub}>Disable distance filter and find people from anywhere in the world.</Text>
              </View>
              <Toggle value={worldwide} onChange={setWorldwide} testID="worldwide-toggle" />
            </View>
            {!worldwide && (
              <View style={[s.rowToggle, { marginTop: 10 }]}>
                <Text style={[s.rowLabel, { flex: 1, paddingRight: 8 }]}>Show people further away if I run out of profiles to see</Text>
                <Toggle value={showFurther} onChange={setShowFurther} />
              </View>
            )}
          </View>

          <Row label="Interested In" value={interestedInLabel} onPress={() => openPicker(PICKERS.interestedIn)} testID="interested-in" />

          <View style={s.card}>
            <View style={s.rowTop}>
              <Text style={s.rowLabel}>Age Range</Text>
              <Text style={s.rowValue}>{ageLow} - {ageHigh}</Text>
            </View>
            <RangeSlider low={ageLow} high={ageHigh} onChange={(l, h) => { setAgeLow(l); setAgeHigh(h); }} />
            <View style={[s.rowToggle, { marginTop: 10 }]}>
              <Text style={[s.rowLabel, { flex: 1, paddingRight: 8 }]}>Show people slightly out of my preferred range</Text>
              <Toggle value={showOutOfRange} onChange={setShowOutOfRange} />
            </View>
          </View>

          <TouchableOpacity style={s.premium} onPress={() => router.push("/subscription")} activeOpacity={0.9} testID="unlock-prefs">
            <Text style={s.premiumTitle}>Unlock more Preferences…</Text>
            <Text style={s.premiumDesc}>Want more personalization? Set your Premium Preferences to see profiles that match your vibe.</Text>
            <View style={s.unlockBtn}><Text style={s.unlockText}>Unlock</Text></View>
          </TouchableOpacity>

          <View style={s.card}>
            <View style={s.rowTop}>
              <Text style={s.rowLabel}>Minimum Number of Photos</Text>
              <Text style={s.rowValue}>{minPhotos}</Text>
            </View>
            <Slider value={minPhotos} onChange={setMinPhotos} max={6} min={1} unit="" />
          </View>

          <View style={s.card}>
            <View style={s.rowToggle}>
              <Text style={s.rowLabel}>Has a bio</Text>
              <Toggle value={hasBio} onChange={setHasBio} />
            </View>
          </View>

          <Row label="Interests" value={displayValue("interests")} onPress={() => openPicker(PICKERS.interests)} />
        </Section>

        <Section title="Advanced Filters">
          {[
            { label: "Looking for 👁", k: "lookingFor" },
            { label: "Open to… 🤍", k: "openTo" },
            { label: "Languages 🗣", k: "languages" },
            { label: "Zodiac 🌙", k: "zodiac" },
            { label: "Education 🎓", k: "education" },
            { label: "Family Plans 🍼", k: "family" },
            { label: "Communication Style 💬", k: "communication" },
            { label: "Love Style 💌", k: "love" },
            { label: "Pets 🐾", k: "pets" },
            { label: "Drinking 🍷", k: "drinking" },
            { label: "Smoking 🚭", k: "smoking" },
            { label: "Cannabis 🌿", k: "cannabis" },
          ].map(r => (
            <Row key={r.k} label={r.label} value={displayValue(r.k)} onPress={() => openPicker(PICKERS[r.k])} testID={`filter-${r.k}`} />
          ))}
        </Section>

        <Section title="Control My Visibility">
          <TouchableOpacity style={[s.visCard, visibility === "standard" && s.visCardActive]} onPress={() => setVisibility("standard")} testID="vis-standard" activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={s.visTitle}>Standard</Text>
              <Text style={s.visSub}>You will be discoverable in the card stack</Text>
            </View>
            {visibility === "standard" && <Check size={22} color={Colors.primary} strokeWidth={3} />}
          </TouchableOpacity>
          <TouchableOpacity style={[s.visCard, visibility === "incognito" && s.visCardActive]} onPress={() => setVisibility("incognito")} testID="vis-incognito" activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <View style={s.visTitleRow}>
                <Text style={s.visTitle}>Incognito</Text>
                <View style={s.plusBadge}><Text style={s.plusBadgeText}>Hmong Date Plus™</Text></View>
              </View>
              <Text style={s.visSub}>You will be discoverable only by people you Like</Text>
            </View>
            {visibility === "incognito" && <Check size={22} color={Colors.primary} strokeWidth={3} />}
          </TouchableOpacity>
        </Section>

        <Section title="Enable Discovery">
          <View style={s.card}>
            <View style={s.rowToggle}>
              <Text style={s.rowLabel}>Enable Discovery</Text>
              <Toggle value={discovery} onChange={setDiscovery} testID="discovery-toggle" />
            </View>
          </View>
          <Text style={s.hint}>When turned off, your profile will be hidden from the card stack and Discovery will be disabled. People you have already Liked may still see and match with you.</Text>
        </Section>

        <Section title="Control Who Messages You">
          <View style={s.card}>
            <View style={s.rowToggle}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={s.verifiedBadge}><Text style={s.verifiedText}>Must be verified</Text></View>
                <Text style={[s.rowLabel, { marginTop: 6 }]}>Photo Verified Chat</Text>
                <Text style={s.rowSub}>Take a quick selfie to verify your photos. Verified members can enable this to only receive messages from other verified profiles.</Text>
              </View>
              <Toggle value={photoVerifiedChat} onChange={(v) => { if (v) router.push("/photo-verify"); else setPhotoVerifiedChat(false); }} />
            </View>
            {photoVerifiedChat && (
              <TouchableOpacity onPress={() => router.push("/photo-verify")} style={{ marginTop: 10 }}>
                <Text style={s.link}>Re-take selfie verification</Text>
              </TouchableOpacity>
            )}
          </View>
        </Section>

        <Section title="Profile Features">
          {PROFILE_FEATURES.map(r => (
            <Row
              key={r}
              label={r}
              value={featureToggles[r] ? "On" : "Off"}
              onPress={() => setFeatureOpen(r)}
              testID={`feature-${r}`}
            />
          ))}
        </Section>

        <Section title="App Settings">
          <Row label="Notifications" value={notifs.matches && notifs.messages ? "All" : "Custom"} onPress={() => setNotifOpen("notifications")} testID="notif-row" />
          <Row label="Email" value={notifs.email ? "On" : "Off"} onPress={() => setNotifOpen("email")} testID="email-row" />
          <Row label="Push Notifications" value={notifs.push ? "On" : "Off"} onPress={() => setNotifOpen("push")} testID="push-row" />
        </Section>

        <Section title="Account">
          <Row label="Edit Profile" onPress={() => router.push("/edit-profile")} testID="edit-profile-row" />
          <Row label="Manage Subscription" onPress={() => router.push("/subscription")} testID="manage-sub-row" />
          <TouchableOpacity
            style={s.row}
            onPress={() => Alert.alert("Log out", "Are you sure you want to log out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Log out", style: "destructive", onPress: () => router.replace("/(auth)/welcome" as never) },
            ])}
            testID="logout-row"
          >
            <Text style={[s.rowLabel, { color: Colors.primary }]}>Log out</Text>
          </TouchableOpacity>
        </Section>
      </ScrollView>

      <PickerModal
        visible={picker !== null}
        config={picker}
        selected={picker ? values[picker.key] ?? [] : []}
        onClose={() => setPicker(null)}
        onSave={savePicker}
      />

      <TextModal
        visible={locOpen}
        title="Add a new location"
        initial={location}
        placeholder="City, State"
        onClose={() => setLocOpen(false)}
        onSave={v => { if (v) setLocation(v); }}
      />

      <Modal visible={featureOpen !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFeatureOpen(null)}>
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setFeatureOpen(null)}><XIcon size={24} color="#FFF" /></TouchableOpacity>
            <Text style={s.modalTitle}>{featureOpen ?? ""}</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={{ padding: 16 }}>
            <View style={s.card}>
              <View style={s.rowToggle}>
                <Text style={s.rowLabel}>Enabled</Text>
                <Toggle
                  value={featureOpen ? !!featureToggles[featureOpen] : false}
                  onChange={v => featureOpen && setFeatureToggles(prev => ({ ...prev, [featureOpen]: v }))}
                />
              </View>
            </View>
            <Text style={s.hint}>Manage how {featureOpen} appears and behaves across Hmong Date.</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={notifOpen !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNotifOpen(null)}>
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setNotifOpen(null)}><XIcon size={24} color="#FFF" /></TouchableOpacity>
            <Text style={s.modalTitle}>{notifOpen === "email" ? "Email" : notifOpen === "push" ? "Push Notifications" : "Notifications"}</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {notifOpen === "email" && (
              <View style={s.card}><View style={s.rowToggle}><Text style={s.rowLabel}>Email Notifications</Text><Toggle value={notifs.email} onChange={v => setNotifs(p => ({ ...p, email: v }))} /></View></View>
            )}
            {notifOpen === "push" && (
              <View style={s.card}><View style={s.rowToggle}><Text style={s.rowLabel}>Push Notifications</Text><Toggle value={notifs.push} onChange={v => setNotifs(p => ({ ...p, push: v }))} /></View></View>
            )}
            {notifOpen === "notifications" && (
              <>
                <View style={s.card}><View style={s.rowToggle}><Text style={s.rowLabel}>New Matches</Text><Toggle value={notifs.matches} onChange={v => setNotifs(p => ({ ...p, matches: v }))} /></View></View>
                <View style={s.card}><View style={s.rowToggle}><Text style={s.rowLabel}>New Messages</Text><Toggle value={notifs.messages} onChange={v => setNotifs(p => ({ ...p, messages: v }))} /></View></View>
                <View style={s.card}><View style={s.rowToggle}><Text style={s.rowLabel}>Promotions & Tips</Text><Toggle value={notifs.promos} onChange={v => setNotifs(p => ({ ...p, promos: v }))} /></View></View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "800" as const, flex: 1 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sTitle: { color: "#FFF", fontSize: 18, fontWeight: "800" as const, marginBottom: 10 },
  card: { backgroundColor: "#141414", borderRadius: 16, padding: 16, marginBottom: 10 },
  row: { backgroundColor: "#141414", borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  rowLabel: { color: "#FFF", fontSize: 15, fontWeight: "600" as const, flexShrink: 1 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: "55%" },
  rowValue: { color: "rgba(255,255,255,0.65)", fontSize: 14 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  rowToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowSub: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 4, lineHeight: 17 },
  rowTitleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  locText: { color: "#FFF", fontSize: 15 },
  link: { color: Colors.primary, fontSize: 14, fontWeight: "700" as const, marginTop: 10 },
  hint: { color: "rgba(255,255,255,0.55)", fontSize: 13, paddingHorizontal: 4, marginBottom: 12, lineHeight: 18 },
  slider: { height: 36, justifyContent: "center", ...(Platform.OS === "web" ? { cursor: "pointer" as unknown as string } : {}) },
  sliderTrack: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)" },
  sliderFill: { position: "absolute", height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  sliderThumb: { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, marginLeft: -10, borderWidth: 2, borderColor: "#FFF" },
  srOnly: { display: "none" },
  premium: { backgroundColor: "#1a1404", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(212,168,67,0.3)" },
  premiumTitle: { color: Colors.accent, fontSize: 17, fontWeight: "800" as const, marginBottom: 6 },
  premiumDesc: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 18, marginBottom: 12 },
  unlockBtn: { alignSelf: "flex-start", backgroundColor: Colors.accent, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10 },
  unlockText: { color: "#1a1404", fontWeight: "800" as const },
  visCard: { backgroundColor: "#141414", borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "transparent" },
  visCardActive: { borderColor: Colors.primary },
  visTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  visTitle: { color: "#FFF", fontSize: 17, fontWeight: "700" as const },
  visSub: { color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 4 },
  plusBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  plusBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" as const },
  verifiedBadge: { alignSelf: "flex-start", backgroundColor: "#2a8ae0", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  verifiedText: { color: "#FFF", fontSize: 11, fontWeight: "700" as const },
  modal: { flex: 1, backgroundColor: "#0b0b0b" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  modalTitle: { color: "#FFF", fontSize: 17, fontWeight: "800" as const, flex: 1, textAlign: "center", paddingHorizontal: 8 },
  modalSave: { color: Colors.primary, fontSize: 15, fontWeight: "800" as const },
  optRow: { backgroundColor: "#141414", borderRadius: 14, padding: 16, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "transparent" },
  optRowOn: { borderColor: Colors.primary, backgroundColor: "#1a0d10" },
  optLabel: { color: "#FFF", fontSize: 15, fontWeight: "600" as const },
  optLabelOn: { color: Colors.primary },
  input: { backgroundColor: "#141414", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: "#FFF", fontSize: 16 },
});
