import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { router } from "expo-router";
import { Gift, CheckCircle2 } from "lucide-react-native";
import { doc, getDoc } from "firebase/firestore";
import Colors from "@/constants/colors";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import PillButton from "@/components/onboarding/PillButton";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { auth, db } from "@/lib/firebase";

export default function InviteCodeStep() {
  const { data, update } = useOnboarding();
  const [code, setCode] = useState<string>(data.referredByCode ?? "");
  const [checking, setChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean>(!!data.referredByCode);

  const go = () => router.push("/(auth)/location");

  const apply = async () => {
    const c = code.trim().toUpperCase();
    if (!c) { update({ referredByCode: undefined }); go(); return; }
    setChecking(true); setError(null);
    try {
      const snap = await getDoc(doc(db, "invites", c));
      if (!snap.exists()) { setError("We couldn't find that code. Check it and try again, or skip."); return; }
      if (snap.data().uid === auth.currentUser?.uid) { setError("You can't use your own invite code."); return; }
      update({ referredByCode: c });
      setOk(true);
      setTimeout(go, 600);
    } catch {
      setError("Couldn't check the code right now. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <OnboardingScreen
      step={20}
      total={21}
      footer={
        <View style={{ gap: 10 }}>
          <PillButton label={code.trim() ? "Apply code" : "Skip"} onPress={apply} loading={checking} variant="light" testID="invite-code-next" />
        </View>
      }
    >
      <View style={s.iconWrap}><Gift size={30} color={Colors.gold} /></View>
      <Text style={s.head}>Have an invite code?</Text>
      <Text style={s.sub}>If a friend invited you, enter their code. When 3 friends join with it, they get a free week of Unlimited.</Text>
      <TextInput
        value={code}
        onChangeText={(v) => { setCode(v.toUpperCase()); setError(null); setOk(false); }}
        placeholder="e.g. VANG4821"
        placeholderTextColor="rgba(245,240,235,0.35)"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={12}
        style={s.input}
        testID="invite-code-input"
      />
      {error ? <Text style={s.err} testID="invite-code-error">{error}</Text> : null}
      {ok ? <View style={s.okRow}><CheckCircle2 size={16} color={Colors.like} /><Text style={s.okText}>Code applied</Text></View> : null}
    </OnboardingScreen>
  );
}

const s = StyleSheet.create({
  iconWrap: { width: 60, height: 60, borderRadius: 18, backgroundColor: "rgba(212,168,67,0.15)", alignItems: "center", justifyContent: "center", marginTop: 6 },
  head: { fontSize: 28, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5, marginTop: 16 },
  sub: { fontSize: 14, color: Colors.dark.textDim, marginTop: 8, lineHeight: 20 },
  input: { marginTop: 22, borderWidth: 1.5, borderColor: "rgba(212,168,67,0.5)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, color: "#FFF", fontSize: 20, fontWeight: "800" as const, letterSpacing: 2 },
  err: { color: "#ff8a8a", marginTop: 10, fontSize: 13 },
  okRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  okText: { color: Colors.like, fontWeight: "700" as const },
});
