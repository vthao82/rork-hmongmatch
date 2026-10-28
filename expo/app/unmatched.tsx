import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { useMyMatches, useAllProfiles, rematchUser } from "@/lib/discoverProfiles";

export default function UnmatchedScreen() {
  const router = useRouter();
  const { unmatchedByMe } = useMyMatches();
  const { byId } = useAllProfiles();

  const onRematch = (otherId: string, name: string, theyUnmatched: boolean) => {
    Alert.alert(`Match with ${name} again?`, "Your chat and messages will come back.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Match again",
        onPress: async () => {
          if (!(await rematchUser(otherId))) { Alert.alert("Couldn't undo", "Please try again."); return; }
          if (theyUnmatched) Alert.alert("Undone on your side", `${name} has also unmatched, so the chat stays hidden unless they match again.`);
          else Alert.alert("Matched again", `Your chat with ${name} is back.`, [
            { text: "OK", style: "cancel" },
            { text: "Open chat", onPress: () => router.push(`/chat/${otherId}`) },
          ]);
        },
      },
    ]);
  };

  return (
    <View style={s.ct}>
      <Stack.Screen options={{ title: "Unmatched people" }} />
      <FlatList
        data={unmatchedByMe}
        keyExtractor={(m) => m.matchId}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={s.sub}>People you unmatched. Match again to bring your chat back.</Text>}
        ListEmptyComponent={<Text style={s.empty} testID="unmatched-empty">You haven't unmatched anyone.</Text>}
        renderItem={({ item }) => {
          const p = byId[item.otherId];
          const name = p?.name ?? "Member";
          const theyUnmatched = item.unmatchedBy.includes(item.otherId);
          return (
            <View style={s.row} testID={`unmatched-${item.otherId}`}>
              {p?.photos?.[0] ? <Image source={{ uri: p.photos[0] }} style={s.av} contentFit="cover" /> : <View style={s.av} />}
              <Text style={s.name} numberOfLines={1}>{name}</Text>
              <TouchableOpacity style={s.btn} onPress={() => onRematch(item.otherId, name, theyUnmatched)} testID={`rematch-${item.otherId}`}>
                <Text style={s.btnTxt}>Match again</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  ct: { flex: 1, backgroundColor: Colors.background },
  sub: { color: Colors.textSecondary, fontSize: 13, marginBottom: 8 },
  empty: { color: Colors.textSecondary, textAlign: "center", marginTop: 48, fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  av: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceAlt },
  name: { flex: 1, fontSize: 16, fontWeight: "600" as const, color: Colors.text },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.primary },
  btnTxt: { color: "#FFF", fontWeight: "700" as const, fontSize: 14 },
});
