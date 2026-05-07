import React from "react";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0c0719" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="language" />
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
      <Stack.Screen name="account-picker" options={{ presentation: "transparentModal", animation: "fade" }} />
    </Stack>
  );
}
