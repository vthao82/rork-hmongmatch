import React from "react";
import { Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { Heart, MessageCircle, User, Compass, Home } from "lucide-react-native";
import Colors from "@/constants/colors";
import InAppNotificationBanner from "@/components/InAppNotificationBanner";

export default function HmongDateTabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: "rgba(255,255,255,0.45)",
        tabBarStyle: {
          backgroundColor: "#0a0207",
          borderTopColor: "rgba(212,168,67,0.15)",
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          ...(Platform.OS === "web" ? { height: 64, paddingBottom: 10 } : {}),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" as const, letterSpacing: 0.5, marginTop: -2 },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: "Browse", tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: "Interests", tabBarIcon: ({ color, size }) => <Compass size={size} color={color} /> }} />
      <Tabs.Screen name="matches" options={{ title: "Likes", tabBarIcon: ({ color, size, focused }) => <Heart size={size} color={color} fill={focused ? color : "transparent"} /> }} />
      <Tabs.Screen name="messages" options={{ title: "Chat", tabBarIcon: ({ color, size, focused }) => <MessageCircle size={size} color={color} fill={focused ? color : "transparent"} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
    </Tabs>
    <InAppNotificationBanner />
    </View>
  );
}
