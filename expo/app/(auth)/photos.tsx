import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Dimensions, Platform, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Plus, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useT } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";
import { uploadPhotoAsync, isRemoteUrl, newPhotoId } from "@/lib/photoUpload";

const { width } = Dimensions.get("window");
const GAP = 10;
const PAD = 24;
const SLOT = (width - PAD * 2 - GAP * 2) / 3;

export default function PhotosScreen() {
  const { data, update } = useOnboarding();
  const { user } = useAuth();
  const t = useT();
  const [photos, setPhotos] = useState<string[]>(data.photos ?? []);
  const [uploading, setUploading] = useState<boolean>(false);

  const pick = useCallback(async (idx: number) => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission needed", "Enable photo library access to add pictures.");
          return;
        }
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: 6,
      });
      if (!res.canceled && res.assets.length > 0) {
        const uris = res.assets.map(a => a.uri);
        setPhotos(prev => {
          const next = [...prev];
          let i = idx;
          for (const u of uris) {
            if (i < 6) {
              next[i] = u;
              i += 1;
            }
          }
          return next.filter(Boolean).slice(0, 6);
        });
      }
    } catch (e) {
      console.log("pick error", e);
    }
  }, []);

  const remove = useCallback((idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const valid = photos.length >= 2 && !uploading;

  const onNext = async () => {
    if (!user) {
      Alert.alert("Sign-in required", "Please sign in again before saving photos.");
      return;
    }
    setUploading(true);
    try {
      // Upload any local file:// photos to Firebase Storage.
      // Already-remote https:// URLs pass through unchanged.
      const uploaded: string[] = [];
      for (const uri of photos) {
        if (isRemoteUrl(uri)) {
          uploaded.push(uri);
          continue;
        }
        const url = await uploadPhotoAsync(user.uid, uri, newPhotoId());
        uploaded.push(url);
      }
      setPhotos(uploaded);
      update({ photos: uploaded });
      router.push({ pathname: "/(auth)/photo-verify", params: { mode: "onboarding" } });
    } catch (e: any) {
      console.log("[photos] upload failed", e);
      Alert.alert("Upload failed", e?.message ?? "Could not upload your photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const slots = Array.from({ length: 6 }, (_, i) => photos[i] ?? null);

  return (
    <OnboardingScreen
      step={17}
      total={19}
      footer={
        <PillButton
          label={uploading ? "Uploading…" : t("next")}
          onPress={onNext}
          disabled={!valid}
          variant="light"
          testID="photos-next"
        />
      }
    >
      <Text style={s.head}>{t("photosQ")}</Text>
      <Text style={s.sub}>{t("photosSub")}</Text>

      <View style={s.grid}>
        {slots.map((uri, i) => (
          <Pressable key={i} style={[s.slot, uri && s.slotFilled]} onPress={() => pick(photos.length > i ? photos.length : i)} testID={`slot-${i}`} disabled={uploading}>
            {uri ? (
              <>
                <Image source={{ uri }} style={s.img} />
                {!uploading && (
                  <Pressable style={s.x} onPress={() => remove(i)} testID={`remove-${i}`}>
                    <X size={14} color="#fff" />
                  </Pressable>
                )}
              </>
            ) : (
              <View style={s.plusWrap}><Plus size={22} color={Colors.crimsonLight} /></View>
            )}
          </Pressable>
        ))}
      </View>

      {uploading && (
        <View style={s.uploadingRow}>
          <ActivityIndicator size="small" color={Colors.gold} />
          <Text style={s.uploadingTxt}>Uploading your photos…</Text>
        </View>
      )}

      <View style={s.tip}>
        <Text style={s.tipTxt}>{t("photosTip")}</Text>
      </View>
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 6 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 8, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, marginTop: 24 },
  slot: { width: SLOT, height: SLOT * 1.35, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(245,240,235,0.22)", justifyContent: "center", alignItems: "center", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.03)" },
  slotFilled: { borderStyle: "solid", borderColor: Colors.crimson },
  img: { width: "100%", height: "100%" },
  plusWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(192,21,47,0.18)", justifyContent: "center", alignItems: "center" },
  x: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  uploadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 18 },
  uploadingTxt: { color: Colors.goldLight, fontSize: 14, fontWeight: "600" as const },
  tip: { marginTop: 24, padding: 14, borderRadius: 14, backgroundColor: "rgba(212,168,67,0.08)", borderWidth: 1, borderColor: "rgba(212,168,67,0.25)" },
  tipTxt: { color: Colors.goldLight, fontSize: 13, fontWeight: "500" as const },
});
