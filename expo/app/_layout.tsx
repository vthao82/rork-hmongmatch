import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { OnboardingProvider } from "@/providers/OnboardingProvider";
import { LikesProvider } from "@/providers/LikesProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { TierProvider } from "@/providers/TierProvider";
import { AuthProvider } from "@/providers/AuthProvider";

try { SplashScreen.preventAutoHideAsync(); } catch (e) { console.log("[splash] preventAutoHideAsync error", e); }
const qc = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", contentStyle: { backgroundColor: Colors.background }, headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text, animation: "slide_from_right" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="user/[id]" options={{ title: "Profile" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
      <Stack.Screen name="subscription" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="report" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="photo-verify" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function AppContent() {
  useEffect(() => {
    try {
      SplashScreen.hideAsync();
    } catch (e) {
      console.log("[splash] hideAsync error", e);
    }
  }, []);
  return (
    <QueryClientProvider client={qc}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
          <OnboardingProvider>
            <TierProvider>
              <LikesProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <StatusBar style="light" />
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </LikesProvider>
            </TierProvider>
          </OnboardingProvider>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
