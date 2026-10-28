import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import Colors from "@/constants/colors";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";

export default function Index() {
  const { hydrated, completed } = useOnboarding();
  const { hydrated: langHydrated } = useLanguage();
  const { user, emailVerified } = useAuth();
  if (!hydrated || !langHydrated) {
    return (
      <View style={s.c} testID="boot-loader">
        <ActivityIndicator color={Colors.crimson} />
      </View>
    );
  }
  // Signed-in members go straight in; everyone else goes through login, which resumes unfinished sign-ups
  if (completed && user && emailVerified) return <Redirect href="/discover" />;
  return <Redirect href="/(auth)/login" />;
}

const s = StyleSheet.create({
  c: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.dark.bg },
});
