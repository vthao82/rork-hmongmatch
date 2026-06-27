import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import Colors from "@/constants/colors";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export default function Index() {
  const { hydrated, completed } = useOnboarding();
  const { hydrated: langHydrated } = useLanguage();
  if (!hydrated || !langHydrated) {
    return (
      <View style={s.c} testID="boot-loader">
        <ActivityIndicator color={Colors.crimson} />
      </View>
    );
  }
  if (completed) return <Redirect href="/discover" />;
  return <Redirect href="/(auth)/login" />;
}

const s = StyleSheet.create({
  c: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.dark.bg },
});
