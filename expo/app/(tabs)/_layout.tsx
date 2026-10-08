import React, { useMemo } from "react";
import { Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { Heart, MessageCircle, User, Compass, Home } from "lucide-react-native";
import Colors from "@/constants/colors";
import InAppNotificationBanner from "@/components/InAppNotificationBanner";
import { useChatThreads } from "@/lib/chat";

export default function HmongDateTabLayout() {
  const { threads } = useChatThreads();
  // Total unread messages across every active thread — surfaces on the Chat
  // tab icon so the user knows someone is waiting on them.
  const unread = useMemo(
    () => threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0),
    [threads]
  );
  const chatBadge: string | number | undefined =
    unread > 99 ? "99+" : unread > 0 ? unread : undefined;

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
        tabBarBadgeStyle: { backgroundColor: Colors.crimson, color: "#fff", fontWeight: "700" as const, fontSize: 10, minWidth: 18, height: 18, lineHeight: 14, paddingHorizontal: 4 },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: "Explore", tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: "Interests", tabBarIcon: ({ color, size }) => <Compass size={size} color={color} /> }} />
      <Tabs.Screen name="matches" options={{ title: "Likes", tabBarIcon: ({ color, size, focused }) => <Heart size={size} color={color} fill={focused ? color : "transparent"} /> }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size, focused }) => <MessageCircle size={size} color={color} fill={focused ? color : "transparent"} />,
          tabBarBadge: chatBadge,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
    </Tabs>
    <InAppNotificationBanner />
    </View>
  );
}
