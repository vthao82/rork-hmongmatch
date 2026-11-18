import React from "react";
import { View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import { usePathname, Redirect } from "expo-router";
import RedBackground from "@/components/RedBackground";
import { WEB_FRAME_WIDTH } from "@/lib/webSetup";
import { WebAlertHost } from "@/components/web/WebAlertHost";

/** On desktop browsers the app sits in a phone-width column over the red background; the landing page stays full width. */
export function WebFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { loading, user } = useAuth();
  if (Platform.OS !== "web") return <>{children}</>;
  // Browsers restore the sign-in a moment after load; wait so deep links don't read data signed out
  if (loading) return <View style={[s.page, { justifyContent: "center" }]}><RedBackground /><ActivityIndicator color="#FFF" /></View>;
  if (!user && PRIVATE.some((p) => path === p || path.startsWith(`${p}/`))) return <Redirect href="/" />;
  const full = path === "/";
  return (
    <View style={s.page}>
      <RedBackground />
      <View style={full ? s.full : s.column}>{children}</View>
      <WebAlertHost />
    </View>
  );
}

const PRIVATE = ["/explore", "/interests", "/likes", "/profile", "/user", "/chat", "/events", "/settings", "/subscription", "/category", "/profile-stack", "/edit-profile", "/blocked", "/unmatched", "/date-safety", "/report", "/feedback"];

const s = StyleSheet.create({
  page: { flex: 1, alignItems: "center", overflow: "hidden" },
  full: { flex: 1, width: "100%" },
  column: { flex: 1, width: "100%", maxWidth: WEB_FRAME_WIDTH, overflow: "hidden", boxShadow: "0 0 60px rgba(0,0,0,0.45)" } as object,
});
