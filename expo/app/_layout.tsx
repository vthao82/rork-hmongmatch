import React, { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Cinzel_400Regular, Cinzel_600SemiBold, Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import Colors from "@/constants/colors";
import { OnboardingProvider } from "@/providers/OnboardingProvider";
import { LikesProvider } from "@/providers/LikesProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { TierProvider } from "@/providers/TierProvider";

SplashScreen.preventAutoHideAsync();
const qc = new QueryClient();

function applyDefaultFont() {
  // @ts-expect-error - default props for global font override
  const TextAny = Text as unknown as { defaultProps?: { style?: unknown } };
  TextAny.defaultProps = TextAny.defaultProps || {};
  TextAny.defaultProps.style = [{ fontFamily: "Cinzel_400Regular" }, TextAny.defaultProps.style];

  // @ts-expect-error - same for inputs
  const InputAny = TextInput as unknown as { defaultProps?: { style?: unknown } };
  InputAny.defaultProps = InputAny.defaultProps || {};
  InputAny.defaultProps.style = [{ fontFamily: "Cinzel_400Regular" }, InputAny.defaultProps.style];
}

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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cinzel_400Regular, Cinzel_600SemiBold, Cinzel_700Bold });
  useEffect(() => {
    if (fontsLoaded) {
      applyDefaultFont();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={qc}>
      <SafeAreaProvider>
        <LanguageProvider>
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
        </LanguageProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
