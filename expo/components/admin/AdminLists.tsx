import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { addCompEmail, removeCompEmail, useCompEmails, useErrorLogs, deleteErrorLog, explainError, fmt, type AdminUser } from "@/lib/admin";
import { a } from "@/components/admin/AdminMembers";

export function AdminUnlimited({ users }: { users: AdminUser[] }) {
  const emails = useCompEmails();
  const [email, setEmail] = useState<string>("");
  const add = async () => {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { Alert.alert("Check the email", "Please type a full email address."); return; }
    try { await addCompEmail(e); setEmail(""); } catch { Alert.alert("Couldn't add", "Please try again."); }
  };
  const status = (e: string) => {
    const u = users.find((x) => (x.email ?? "").toLowerCase() === e);
    return u ? `Signed up · ${u.name ?? "no name yet"} · ${u.unlimited ? "Unlimited on" : "turning on…"}` : "Not signed up yet · gets Unlimited when they sign in";
  };
  return (
    <View testID="admin-unlimited">
      <Text style={u.help}>Add an email and that person gets Unlimited free, whether they sign in with email and password, Google or Apple, as long as the email matches.</Text>
      <View style={[a.search, { marginTop: 12 }]}>
        <TextInput style={a.searchInput} value={email} onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor="rgba(255,255,255,0.45)" autoCapitalize="none" keyboardType="email-address" onSubmitEditing={() => void add()} testID="admin-comp-email-input" />
        <TouchableOpacity style={u.addBtn} onPress={() => void add()} testID="admin-comp-email-add"><Text style={u.addTxt}>Add</Text></TouchableOpacity>
      </View>
      <Text style={a.count}>{emails.length} email{emails.length === 1 ? "" : "s"} on the list</Text>
      {emails.map((e) => (
        <View key={e} style={u.row} testID={`admin-comp-${e}`}>
          <View style={{ flex: 1 }}><Text style={a.name}>{e}</Text><Text style={a.meta}>{status(e)}</Text></View>
          <TouchableOpacity onPress={() => Alert.alert("Remove from list?", `${e} will lose free Unlimited.`, [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => void removeCompEmail(e) }])} testID={`admin-comp-remove-${e}`}>
            <Trash2 size={18} color={Colors.nope} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

export function AdminErrors() {
  const logs = useErrorLogs();
  const [open, setOpen] = useState<string | null>(null);
  if (logs.length === 0) return <Text style={u.help} testID="admin-errors-empty">No app errors recorded. When something goes wrong in the app or website, it shows up here with what it means and how to fix it.</Text>;
  return (
    <View testID="admin-errors">
      <Text style={a.count}>Latest {logs.length} errors</Text>
      {logs.map((l) => {
        const h = explainError(l.message);
        return (
          <TouchableOpacity key={l.id} style={u.err} onPress={() => setOpen(open === l.id ? null : l.id)} testID={`admin-error-${l.id}`}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Text style={[u.errTag, l.fatal && { backgroundColor: Colors.nope }]}>{l.fatal ? "CRASH" : "ERROR"} · {l.platform}</Text>
              <Text style={a.meta}>{l.createdAt ? fmt(l.createdAt) : ""}</Text>
            </View>
            <Text style={u.errMsg} numberOfLines={open === l.id ? undefined : 2}>{l.message}</Text>
            <Text style={u.label}>What it means</Text><Text style={u.txt}>{h.meaning}</Text>
            <Text style={u.label}>How to fix</Text><Text style={u.txt}>{h.fix}</Text>
            {open === l.id ? (
              <>
                <Text style={a.meta}>Screen: {l.screen || "unknown"} · App {l.version || "?"} · Member {l.uid ?? "signed out"}</Text>
                {l.stack ? <Text style={u.stack}>{l.stack.slice(0, 900)}</Text> : null}
                <TouchableOpacity style={[a.ghost, { alignSelf: "flex-start", marginTop: 8 }]} onPress={() => void deleteErrorLog(l.id)} testID={`admin-error-delete-${l.id}`}><Text style={a.ghostTxt}>Mark fixed (delete)</Text></TouchableOpacity>
              </>
            ) : <Text style={u.more}>Tap for details</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const u = StyleSheet.create({
  help: { color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 21 },
  addBtn: { backgroundColor: Colors.gold, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  addTxt: { color: Colors.indigo, fontWeight: "800" as const },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  err: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 14, marginTop: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  errTag: { color: "#FFF", backgroundColor: "rgba(232,194,122,0.35)", fontSize: 11, fontWeight: "800" as const, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: "hidden" },
  errMsg: { color: "#FFF", fontWeight: "700" as const, fontSize: 14, marginTop: 8 },
  label: { color: Colors.goldLight, fontSize: 11, fontWeight: "800" as const, letterSpacing: 1, marginTop: 10 },
  txt: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 19, marginTop: 2 },
  stack: { color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 8, fontFamily: "monospace" },
  more: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 8 },
});
