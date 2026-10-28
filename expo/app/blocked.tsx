import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { useBlocks, unblockUser } from "@/providers/BlockProvider";
import { useAuth } from "@/providers/AuthProvider";

export default function BlockedUsersScreen() {
  const { blocked } = useBlocks();
  const { user } = useAuth();

  const onUnblock = (uid: string, name: string) => {
    if (!user) return;
    Alert.alert(`Unblock ${name}?`, "They'll be able to see you and message you again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        onPress: async () => {
          const ok = await unblockUser(user.uid, uid);
          if (!ok) Alert.alert("Couldn't unblock", "Please try again.");
        },
      },
    ]);
  };

  return (
    <View style={s.ct}>
      <Stack.Screen options={{ title: "Blocked users" }} />
      <FlatList
        data={blocked}
        keyExtractor={(b) => b.uid}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={s.empty} testID="blocked-empty">You haven't blocked anyone.</Text>}
        renderItem={({ item }) => (
          <View style={s.row} testID={`blocked-${item.uid}`}>
            {item.photo ? <Image source={{ uri: item.photo }} style={s.av} contentFit="cover" /> : <View style={s.av} />}
            <Text style={s.name} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity style={s.btn} onPress={() => onUnblock(item.uid, item.name)} testID={`unblock-${item.uid}`}>
              <Text style={s.btnTxt}>Unblock</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.background },
  empty: { color: Colors.textSecondary, textAlign: "center", marginTop: 48, fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  av: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceAlt },
  name: { flex: 1, fontSize: 16, fontWeight: "600" as const, color: Colors.text },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Colors.primary },
  btnTxt: { color: Colors.primary, fontWeight: "700" as const, fontSize: 14 },
});
