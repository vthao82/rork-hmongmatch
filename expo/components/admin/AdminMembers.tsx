import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import Colors from "@/constants/colors";
import { ago, fmt, setBlocked, type AdminUser } from "@/lib/admin";

function Badge({ label, tone }: { label: string; tone: "gold" | "red" | "dim" }) {
  return <View style={[a.badge, tone === "gold" ? a.bGold : tone === "red" ? a.bRed : a.bDim]}><Text style={[a.badgeTxt, tone === "gold" && { color: Colors.indigo }]}>{label}</Text></View>;
}

function MemberRow({ u, onChanged }: { u: AdminUser; onChanged: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState<boolean>(false);
  const toggle = () => Alert.alert(u.disabled ? "Unblock member?" : "Block member?", u.disabled ? `${u.name ?? u.email} will be able to sign in again.` : `${u.name ?? u.email} will be signed out, can't sign back in, and is hidden from everyone.`, [
    { text: "Cancel", style: "cancel" },
    { text: u.disabled ? "Unblock" : "Block", style: u.disabled ? "default" : "destructive", onPress: async () => {
      setBusy(true);
      try { await setBlocked(u.uid, !u.disabled); onChanged(); } catch (e) { Alert.alert("Couldn't update", e instanceof Error ? e.message : "Try again."); } finally { setBusy(false); }
    } },
  ]);
  const activeNow = !!u.lastActive && Date.now() - u.lastActive < 5 * 60000;
  return (
    <View style={a.row} testID={`admin-member-${u.uid}`}>
      {u.photo ? <Image source={{ uri: u.photo }} style={a.av} contentFit="cover" /> : <View style={[a.av, a.avEmpty]}><Text style={a.avTxt}>{(u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}</Text></View>}
      <View style={{ flex: 1 }}>
        <Text style={a.name} numberOfLines={1}>{u.name ?? "(no name yet)"}</Text>
        <Text style={a.meta} numberOfLines={1}>{u.email ?? "no email"}{u.provider ? ` · ${u.provider.replace(".com", "")}` : ""}</Text>
        {u.createdAt ? <Text style={a.meta}>Joined {fmt(u.createdAt)}</Text> : null}
        <Text style={a.meta}>{u.lastSignIn ? `Last sign-in ${ago(u.lastSignIn)} · ` : ""}{activeNow ? "Active now" : `Active ${ago(u.lastActive)}`}</Text>
        <View style={a.badges}>
          {u.isAdmin ? <Badge label="Admin" tone="gold" /> : null}
          {u.unlimited ? <Badge label="Unlimited" tone="gold" /> : null}
          {u.disabled ? <Badge label="Blocked" tone="red" /> : null}
          {!u.onboarded ? <Badge label="Profile not finished" tone="dim" /> : null}
          {u.referralCount ? <Badge label={`${u.referralCount} invited`} tone="dim" /> : null}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {u.onboarded ? <TouchableOpacity style={a.ghost} onPress={() => router.push(`/user/${u.uid}`)} testID={`admin-view-${u.uid}`}><Text style={a.ghostTxt}>View</Text></TouchableOpacity> : null}
        {!u.isAdmin ? (
          <TouchableOpacity style={[a.ghost, !u.disabled && a.danger]} onPress={toggle} disabled={busy} testID={`admin-block-${u.uid}`}>
            <Text style={[a.ghostTxt, !u.disabled && { color: "#FFF" }]}>{busy ? "…" : u.disabled ? "Unblock" : "Block"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function AdminMembers({ users, onChanged }: { users: AdminUser[]; onChanged: () => void }) {
  const [q, setQ] = useState<string>("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return users.filter((u) => !t || (u.name ?? "").toLowerCase().includes(t) || (u.email ?? "").toLowerCase().includes(t)).sort((x, y) => y.createdAt - x.createdAt);
  }, [users, q]);
  return (
    <View testID="admin-members">
      <View style={a.search}>
        <Search size={18} color="rgba(255,255,255,0.6)" />
        <TextInput style={a.searchInput} value={q} onChangeText={setQ} placeholder="Search by name or email" placeholderTextColor="rgba(255,255,255,0.45)" autoCapitalize="none" testID="admin-search" />
      </View>
      <Text style={a.count}>{list.length} of {users.length} members · newest first</Text>
      {list.map((u) => <MemberRow key={u.uid} u={u} onChanged={onChanged} />)}
    </View>
  );
}

export const a = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  searchInput: { flex: 1, color: "#FFF", fontSize: 15, paddingVertical: 12 },
  count: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 10, marginBottom: 4 },
  row: { flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  av: { width: 48, height: 48, borderRadius: 24 },
  avEmpty: { backgroundColor: "rgba(232,194,122,0.2)", alignItems: "center", justifyContent: "center" },
  avTxt: { color: Colors.goldLight, fontWeight: "800" as const, fontSize: 18 },
  name: { color: "#FFF", fontWeight: "800" as const, fontSize: 15 },
  meta: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  bGold: { backgroundColor: Colors.gold },
  bRed: { backgroundColor: Colors.nope },
  bDim: { backgroundColor: "rgba(255,255,255,0.14)" },
  badgeTxt: { color: "#FFF", fontSize: 11, fontWeight: "800" as const },
  ghost: { borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, alignItems: "center" },
  danger: { backgroundColor: Colors.nope, borderColor: Colors.nope },
  ghostTxt: { color: "#FFF", fontWeight: "700" as const, fontSize: 12 },
});
