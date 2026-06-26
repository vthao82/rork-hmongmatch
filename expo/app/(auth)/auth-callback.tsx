import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";

// Firebase handles OAuth redirects natively via expo-auth-session.
// This screen is just a loading placeholder that redirects home.
export default function AuthCallbackScreen() {
  useEffect(() => {
    const t = setTimeout(() => router.replace("/"), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0719", justifyContent: "center", alignItems: "center" },
});
