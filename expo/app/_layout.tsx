import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { OnboardingProvider } from "@/providers/OnboardingProvider";
import { LikesProvider } from "@/providers/LikesProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";

SplashScreen.preventAutoHideAsync();
const qc = new QueryClient();

function RootLayoutNav() {
  return (
    <LinearGradient
      colors={[Colors.indigo, "#3c0a24", Colors.crimson]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Stack screenOptions={{ headerBackTitle: "Back", contentStyle: { backgroundColor: "transparent" }, headerShadowVisible: false, headerStyle: { backgroundColor: Colors.primaryDark }, headerTintColor: Colors.dark.text, animation: "slide_from_right" }}>
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
    </LinearGradient>
  );
}

export default function RootLayout() {
  useEffect(() => { SplashScreen.hideAsync(); }, []);
  return (
    <QueryClientProvider client={qc}>
      <SafeAreaProvider>
        <LanguageProvider>
          <OnboardingProvider>
          <LikesProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <StatusBar style="light" />
              <RootLayoutNav />
            </GestureHandlerRootView>
          </LikesProvider>
          </OnboardingProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
