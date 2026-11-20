import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import Colors from "@/constants/colors";
import RedBackground from "@/components/RedBackground";
import { useIsAdmin, usePendingEvents } from "@/lib/events";
import { usePendingCards } from "@/lib/interestCards";
import { listUsers, useErrorLogs, type AdminUser } from "@/lib/admin";
import { AdminMembers } from "@/components/admin/AdminMembers";
import { AdminUnlimited, AdminErrors } from "@/components/admin/AdminLists";
import { WEB_READABLE } from "@/lib/webSetup";

type Tab = "overview" | "members" | "unlimited" | "errors";
const TABS: { id: Tab; label: string }[] = [{ id: "overview", label: "Overview" }, { id: "members", label: "Members" }, { id: "unlimited", label: "Unlimited list" }, { id: "errors", label: "Error log" }];
const DAY = 864e5;

function Stat({ n, label }: { n: number | string; label: string }) {
  return <View style={s.stat}><Text style={s.statN}>{n}</Text><Text style={s.statL}>{label}</Text></View>;
}

function Overview({ users, pending, errors, onGo }: { users: AdminUser[]; pending: number; errors: number; onGo: (t: Tab | "events") => void }) {
  const now = Date.now();
  const real = users.filter((u) => u.onboarded);
  const tips = [
    pending > 0 ? { t: `${pending} events or card ideas waiting for your review`, go: "events" as const } : null,
    errors > 0 ? { t: `${errors} app errors recorded; check what they mean`, go: "errors" as const } : null,
    users.some((u) => !u.onboarded) ? { t: `${users.filter((u) => !u.onboarded).length} sign-ups never finished their profile (includes Google test bots)`, go: "members" as const } : null,
  ].filter(Boolean) as { t: string; go: Tab | "events" }[];
  return (
    <View testID="admin-overview">
      <View style={s.stats}>
        <Stat n={users.length} label="Accounts" />
        <Stat n={real.length} label="Finished profiles" />
        <Stat n={users.filter((u) => now - u.createdAt < 7 * DAY).length} label="New this week" />
        <Stat n={users.filter((u) => u.lastActive && now - u.lastActive < DAY).length} label="Active today" />
        <Stat n={users.filter((u) => u.lastActive && now - u.lastActive < 7 * DAY).length} label="Active this week" />
        <Stat n={users.filter((u) => u.unlimited).length} label="Unlimited" />
        <Stat n={users.filter((u) => u.disabled).length} label="Blocked" />
        <Stat n={users.reduce((t, u) => t + (u.referralCount || 0), 0)} label="Friends invited" />
      </View>
      <Text style={s.h2}>Needs your attention</Text>
      {tips.length === 0 ? <Text style={s.muted}>All caught up.</Text> : tips.map((x) => (
        <TouchableOpacity key={x.t} style={s.tip} onPress={() => onGo(x.go)} testID={`admin-tip-${x.go}`}><Text style={s.tipTxt}>{x.t}</Text><Text style={s.tipGo}>Open →</Text></TouchableOpacity>
      ))}
    </View>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [err, setErr] = useState<string>("");
  const [partial, setPartial] = useState(false);
  const pendingEvents = usePendingEvents(isAdmin);
  const pendingCards = usePendingCards(isAdmin);
  const errors = useErrorLogs();
  const load = useCallback(() => {
    setErr("");
    listUsers().then((r) => { setUsers(r.users); setPartial(!r.full); }).catch((e) => setErr(e?.message ?? "Couldn't load members."));
  }, []);
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  if (!isAdmin) return (<><Stack.Screen options={{ title: "Admin" }} /><View style={[s.ct, s.center]}><RedBackground /><Text style={s.muted}>Admins only.</Text></View></>);
  return (
    <>
      <Stack.Screen options={{ title: "Admin Dashboard", headerStyle: { backgroundColor: "#0a0207" }, headerTintColor: "#FFF" }} />
      <View style={s.ct}>
        <RedBackground />
        <ScrollView contentContainerStyle={[s.scroll, WEB_READABLE, { maxWidth: 900 }]} keyboardShouldPersistTaps="handled" testID="admin-screen">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {TABS.map((x) => (
              <TouchableOpacity key={x.id} style={[s.tab, tab === x.id && s.tabOn]} onPress={() => setTab(x.id)} testID={`admin-tab-${x.id}`}>
                <Text style={[s.tabTxt, tab === x.id && s.tabTxtOn]}>{x.label}{x.id === "errors" && errors.length ? ` (${errors.length})` : ""}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ marginTop: 18 }}>
            {partial && tab !== "errors" ? <Text style={[s.muted, { fontSize: 12, marginBottom: 12 }]} testID="admin-partial-note">Showing members from the database. Last sign-in dates appear once the admin sign-in tool is reachable.</Text> : null}
            {tab === "errors" ? <AdminErrors /> : tab === "unlimited" ? <AdminUnlimited users={users ?? []} /> : err ? <Text style={s.muted} testID="admin-load-error">{err}</Text> : !users ? <ActivityIndicator color="#FFF" /> : tab === "overview" ? (
              <Overview users={users} pending={pendingEvents.length + pendingCards.length} errors={errors.length} onGo={(t) => (t === "events" ? router.push("/events") : setTab(t))} />
            ) : <AdminMembers users={users} onChanged={load} />}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.indigo },
  center: { alignItems: "center", justifyContent: "center" },
  scroll: { padding: 18, paddingBottom: 60 },
  tab: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  tabOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  tabTxt: { color: "#FFF", fontWeight: "700" as const },
  tabTxtOn: { color: Colors.indigo },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { flexGrow: 1, minWidth: 140, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  statN: { color: Colors.goldLight, fontSize: 26, fontWeight: "800" as const },
  statL: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  h2: { color: "#FFF", fontSize: 17, fontWeight: "800" as const, marginTop: 24, marginBottom: 8 },
  muted: { color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 21 },
  tip: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(232,194,122,0.12)", borderRadius: 14, padding: 14, marginTop: 8, borderWidth: 1, borderColor: "rgba(232,194,122,0.4)" },
  tipTxt: { color: "#FFF", flex: 1, fontSize: 14 },
  tipGo: { color: Colors.goldLight, fontWeight: "800" as const },
});
