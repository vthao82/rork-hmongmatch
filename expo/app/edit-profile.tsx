import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, Platform, Alert, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { X, Plus, Check, ChevronRight, Star, BadgeCheck, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { currentUser } from "@/mocks/profiles";
import { INTEREST_GROUPS } from "@/constants/interests";

const SW = Dimensions.get("window").width;
const GAP = 10;
const SLOT = (SW - 16 * 2 - GAP * 2) / 3;
const MAX_INTERESTS = 10;

export default function EditProfileScreen() {
  const ins = useSafeAreaInsets();
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [mainPhotoIndex, setMainPhotoIndex] = useState<number>(data.mainPhotoIndex ?? 0);
  const [name, setName] = useState<string>(data.name ?? currentUser.name);
  const [bio, setBio] = useState<string>(data.bio ?? currentUser.bio);
  const [photos, setPhotos] = useState<string[]>(data.photos && data.photos.length > 0 ? data.photos : currentUser.photos);
  const [interests, setInterests] = useState<string[]>(data.interests && data.interests.length > 0 ? data.interests : currentUser.interests);
  const [editingInterests, setEditingInterests] = useState<boolean>(false);

  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const yPhotos = useRef<number>(0);
  const yBio = useRef<number>(0);

  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      const y = focus === "bio" ? yBio.current : yPhotos.current;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }, 250);
    return () => clearTimeout(t);
  }, [focus]);

  const pickPhoto = useCallback(async (idx: number) => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission needed", "Enable photo access to update pictures.");
          return;
        }
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [3, 4],
      });
      if (!res.canceled && res.assets[0]) {
        setPhotos(prev => {
          const next = [...prev];
          next[idx] = res.assets[0].uri;
          return next.filter(Boolean);
        });
      }
    } catch (e) {
      console.log("pick error", e);
    }
  }, []);

  const removePhoto = useCallback((idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const toggleInterest = useCallback((tag: string) => {
    setInterests(prev => {
      const has = prev.includes(tag);
      if (!has && prev.length >= MAX_INTERESTS) return prev;
      return has ? prev.filter(t => t !== tag) : [...prev, tag];
    });
  }, []);

  const save = useCallback(() => {
    update({ name: name.trim(), bio, photos, interests, mainPhotoIndex });
    console.log("profile saved", { name, bio, photoCount: photos.length, interestCount: interests.length });
    router.back();
  }, [name, bio, photos, interests, router, update, mainPhotoIndex]);

  const slots = Array.from({ length: 6 }, (_, i) => photos[i] ?? null);

  return (
    <View style={[s.ct, { paddingTop: ins.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} testID="close-edit">
          <X size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={save} testID="save-profile">
          <Text style={s.done}>Done</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
      <ScrollView ref={scrollRef} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...(Platform.OS === "ios" ? { automaticallyAdjustKeyboardInsets: true } : {})}>
        <Text style={s.sectionLabel} onLayout={e => { yPhotos.current = e.nativeEvent.layout.y; }}>Photos</Text>
        <Text style={s.sectionSub}>Tap to add or change. Long-press a photo to make it your main photo.</Text>
        <View style={s.grid}>
          {slots.map((uri, i) => (
            <TouchableOpacity key={i} style={[s.slot, uri && s.slotFilled, mainPhotoIndex === i && uri && s.slotMain]} onPress={() => pickPhoto(photos.length > i ? i : photos.length)} onLongPress={() => uri && setMainPhotoIndex(i)} testID={`edit-slot-${i}`}>
              {uri ? (
                <>
                  <Image source={{ uri }} style={s.slotImg} contentFit="cover" />
                  {mainPhotoIndex === i && (
                    <View style={s.mainBadge}><Star size={10} color="#1a1404" fill="#1a1404" /><Text style={s.mainBadgeTxt}>MAIN</Text></View>
                  )}
                  <TouchableOpacity style={s.removeBtn} onPress={() => removePhoto(i)} testID={`remove-photo-${i}`}>
                    <X size={12} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={s.plusWrap}><Plus size={22} color={Colors.crimsonLight} /></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.verifyRow} onPress={() => router.push("/photo-verify")} testID="go-verify">
          <View style={[s.verifyIcon, { backgroundColor: data.photoVerified ? "#2a8ae0" : "#e89216" }]}>
            {data.photoVerified ? <BadgeCheck size={20} color="#FFF" fill="#FFF" /> : <Camera size={20} color="#FFF" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.verifyTitle}>{data.photoVerified ? "Photo Verified" : "Get Photo Verified"}</Text>
            <Text style={s.verifySub}>{data.photoVerified ? "You have the blue badge on your profile." : "Take a quick selfie to earn the blue badge."}</Text>
          </View>
          <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <Text style={s.sectionLabel}>Name</Text>
        <View style={s.inputBox}>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Your first name"
            placeholderTextColor="rgba(255,255,255,0.3)"
            maxLength={30}
            testID="edit-name"
          />
        </View>

        <Text style={s.sectionLabel} onLayout={e => { yBio.current = e.nativeEvent.layout.y; }}>About Me</Text>
        <View style={s.inputBox}>
          <TextInput
            style={[s.input, { minHeight: 90, textAlignVertical: "top" }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell potential matches about yourself…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            maxLength={300}
            testID="edit-bio"
          />
          <Text style={s.count}>{bio.length}/300</Text>
        </View>

        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>Interests</Text>
          <TouchableOpacity onPress={() => setEditingInterests(v => !v)} testID="toggle-interests">
            <Text style={s.editLink}>{editingInterests ? "Done" : "Edit"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.sectionSub}>{interests.length}/{MAX_INTERESTS} selected</Text>

        {!editingInterests ? (
          <View style={s.pillWrap}>
            {interests.length === 0 ? (
              <Text style={s.muted}>No interests yet — tap Edit to add.</Text>
            ) : interests.map(i => (
              <View key={i} style={[s.pill, s.pillActive]}>
                <Text style={s.pillTextActive}>{i}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {INTEREST_GROUPS.map(g => (
              <View key={g.title} style={{ marginTop: 16 }}>
                <Text style={s.groupTitle}>{g.emoji}  {g.title}</Text>
                <View style={s.pillWrap}>
                  {g.items.map(it => {
                    const on = interests.includes(it);
                    return (
                      <TouchableOpacity key={it} onPress={() => toggleInterest(it)} style={[s.pill, on && s.pillActive]} testID={`pill-${it}`}>
                        {on && <Check size={12} color={Colors.crimsonLight} />}
                        <Text style={on ? s.pillTextActive : s.pillText}>{it}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={s.saveBtn} onPress={save} testID="save-profile-bottom">
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
        <View style={{ height: 120 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: "#0c0719" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  headerTitle: { color: "#FFF", fontSize: 17, fontWeight: "700" as const },
  done: { color: Colors.crimsonLight, fontSize: 15, fontWeight: "700" as const },
  scroll: { padding: 16, paddingBottom: 32 },
  sectionLabel: { color: "#FFF", fontSize: 16, fontWeight: "800" as const, marginTop: 22 },
  sectionSub: { color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 4, marginBottom: 10 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22 },
  editLink: { color: Colors.crimsonLight, fontSize: 14, fontWeight: "700" as const },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  slot: { width: SLOT, height: SLOT * 1.35, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(245,240,235,0.22)", justifyContent: "center", alignItems: "center", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.03)" },
  slotFilled: { borderStyle: "solid", borderColor: Colors.crimson },
  slotMain: { borderColor: Colors.accent, borderWidth: 3 },
  mainBadge: { position: "absolute", top: 6, left: 6, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Colors.accent, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 },
  mainBadgeTxt: { color: "#1a1404", fontSize: 9, fontWeight: "800" as const, letterSpacing: 0.4 },
  verifyRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: "rgba(212,168,67,0.08)", borderWidth: 1, borderColor: "rgba(212,168,67,0.3)", marginTop: 16 },
  verifyIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  verifyTitle: { color: "#FFF", fontSize: 15, fontWeight: "700" as const },
  verifySub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },
  slotImg: { ...StyleSheet.absoluteFillObject },
  plusWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(192,21,47,0.18)", justifyContent: "center", alignItems: "center" },
  removeBtn: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  inputBox: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 14 },
  input: { color: "#FFF", fontSize: 15 },
  count: { color: "rgba(255,255,255,0.45)", fontSize: 11, textAlign: "right" as const, marginTop: 6 },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.02)" },
  pillActive: { borderColor: Colors.crimson, backgroundColor: "rgba(192,21,47,0.12)" },
  pillText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" as const },
  pillTextActive: { color: Colors.crimsonLight, fontSize: 13, fontWeight: "700" as const },
  groupTitle: { color: "#FFF", fontSize: 14, fontWeight: "700" as const, marginBottom: 6 },
  muted: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  saveBtn: { backgroundColor: Colors.crimson, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 28 },
  saveBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800" as const, letterSpacing: 0.3 },
  promptPicker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 14, marginBottom: 10 },
  promptQ: { color: "#FFF", fontSize: 14, fontWeight: "700" as const, flex: 1 },
  promptQMuted: { color: "rgba(255,255,255,0.5)", fontSize: 14, flex: 1 },
  modalBack: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#15102a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { color: "#FFF", fontSize: 16, fontWeight: "800" as const },
  promptRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  promptRowText: { color: "#FFF", fontSize: 14, flex: 1 }
});
