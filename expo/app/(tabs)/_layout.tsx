import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Heart, MessageCircle, Flame, User, Compass } from "lucide-react-native";
import Colors from "@/constants/colors";

function Dot() {
  return <View style={bs.dot} />;
}
const bs = StyleSheet.create({
  dot: { position: "absolute", top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
});

export default function HmongMatchTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: "transparent" },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#9a9aa5",
        tabBarStyle: {
          backgroundColor: Colors.primaryDark,
          borderTopColor: "rgba(192,21,47,0.4)",
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          ...(Platform.OS === "web" ? { height: 64, paddingBottom: 10 } : {}),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const, marginTop: -2 },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: "Swipe", tabBarIcon: ({ color, size, focused }) => <Flame size={size} color={color} fill={focused ? color : "transparent"} /> }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: ({ color, size }) => <View><Compass size={size} color={color} /><Dot /></View> }} />
      <Tabs.Screen name="matches" options={{ title: "Likes", tabBarIcon: ({ color, size, focused }) => <Heart size={size} color={color} fill={focused ? Colors.accent : "transparent"} /> }} />
      <Tabs.Screen name="messages" options={{ title: "Chat", tabBarIcon: ({ color, size, focused }) => <MessageCircle size={size} color={color} fill={focused ? color : "transparent"} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
    </Tabs>
  );
}
