import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  const [status, setStatus] = useState<string>("Completing sign-in…");

  useEffect(() => {
    let cancelled = false;

    // When opened as a popup (web OAuth flow), exchange the auth code directly
    // in this window. Supabase stores the session in localStorage which is shared
    // with the main window on the same origin. After exchanging, close the popup;
    // the main window detects the session via polling.
    if (Platform.OS === "web" && typeof window !== "undefined" && window.opener) {
      const handlePopup = async () => {
        try {
          const code = typeof params.code === "string" ? params.code : undefined;
          const accessToken = typeof params.access_token === "string" ? params.access_token : undefined;
          const refreshToken = typeof params.refresh_token === "string" ? params.refresh_token : undefined;
          const error = typeof params.error === "string" ? params.error : undefined;

          if (!error) {
            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
            } else if (accessToken && refreshToken) {
              await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            }
          } else {
            console.log("[auth-callback] popup received error:", error, typeof params.error_description === "string" ? params.error_description : "");
          }
        } catch (e) {
          console.log("[auth-callback] popup exchange error", e);
        }
        try { window.close(); } catch (_e) { /* ignore */ }
      };
      handlePopup();
      return () => { cancelled = true; };
    }

    const handle = async () => {
      try {
        const code = typeof params.code === "string" ? params.code : undefined;
        const accessToken = typeof params.access_token === "string" ? params.access_token : undefined;
        const refreshToken = typeof params.refresh_token === "string" ? params.refresh_token : undefined;
        const error = typeof params.error === "string" ? params.error : undefined;
        const errorDescription = typeof params.error_description === "string" ? params.error_description : undefined;

        if (error) {
          if (!cancelled) setStatus("Sign-in failed: " + (errorDescription ?? error));
          setTimeout(() => { if (!cancelled) router.replace("/"); }, 1200);
          return;
        }

        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            if (!cancelled) setStatus("Sign-in failed: " + exErr.message);
            setTimeout(() => { if (!cancelled) router.replace("/"); }, 1200);
            return;
          }
          if (!cancelled) {
            setStatus("Signed in!");
            setTimeout(() => { if (!cancelled) router.replace("/(tabs)/discover"); }, 600);
          }
          return;
        }

        if (accessToken && refreshToken) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setErr) {
            if (!cancelled) setStatus("Sign-in failed: " + setErr.message);
            setTimeout(() => { if (!cancelled) router.replace("/"); }, 1200);
            return;
          }
          if (!cancelled) {
            setStatus("Signed in!");
            setTimeout(() => { if (!cancelled) router.replace("/(tabs)/discover"); }, 600);
          }
          return;
        }

        if (!cancelled) {
          setStatus("No sign-in data received. Please try again.");
          setTimeout(() => { if (!cancelled) router.replace("/"); }, 1500);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          setStatus("Something went wrong: " + msg);
          setTimeout(() => { if (!cancelled) router.replace("/"); }, 1500);
        }
      }
    };
    handle();
    return () => { cancelled = true; };
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c0719",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  text: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    textAlign: "center",
  },
});
