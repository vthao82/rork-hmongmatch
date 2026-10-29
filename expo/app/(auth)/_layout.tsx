import React, { useEffect } from "react";
import { Stack, usePathname } from "expo-router";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useAuth } from "@/providers/AuthProvider";
import { ENROLLMENT_STEPS } from "@/constants/enrollment";


export default function AuthLayout() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data, update, hydrated, completed } = useOnboarding();

  useEffect(() => {
    const step = pathname.split("/").filter(Boolean).pop() ?? "";
    if (!user || !hydrated || completed || !ENROLLMENT_STEPS.includes(step)) return;
    if (data.resumeStep !== step) update({ resumeStep: step });
  }, [pathname, user, hydrated, completed, data.resumeStep, update]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0c0719" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="rules" />
      <Stack.Screen name="name" />
      <Stack.Screen name="birthday" />
      <Stack.Screen name="gender" />
      <Stack.Screen name="clan" />
      <Stack.Screen name="dialect" />
      <Stack.Screen name="hometown" />
      <Stack.Screen name="orientation" />
      <Stack.Screen name="religion" />
      <Stack.Screen name="seeking" />
      <Stack.Screen name="looking-for" />
      <Stack.Screen name="distance" />
      <Stack.Screen name="work" />
      <Stack.Screen name="education" />
      <Stack.Screen name="photo-verify" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="lifestyle" />
      <Stack.Screen name="extras" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="bio" />
      <Stack.Screen name="location" />
      <Stack.Screen name="complete" />
      <Stack.Screen name="auth-callback" />
    </Stack>
  );
}
