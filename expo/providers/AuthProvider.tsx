import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

function extractParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!url) return out;
  const parsePairs = (segment: string) => {
    segment.split("&").forEach((pair) => {
      if (!pair) return;
      const eq = pair.indexOf("=");
      const k = eq >= 0 ? pair.slice(0, eq) : pair;
      const v = eq >= 0 ? pair.slice(eq + 1) : "";
      if (!k) return;
      try {
        out[decodeURIComponent(k)] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    });
  };
  try {
    const qIdx = url.indexOf("?");
    const hIdx = url.indexOf("#");
    if (qIdx >= 0) {
      const end = hIdx > qIdx ? hIdx : url.length;
      parsePairs(url.slice(qIdx + 1, end));
    }
    if (hIdx >= 0) {
      parsePairs(url.slice(hIdx + 1));
    }
  } catch (e) {
    console.log("[auth] url parse error", e);
  }
  return out;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    }).catch((e) => {
      console.log("[auth] getSession error", e);
      if (mounted) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const redirectTo = Linking.createURL("auth-callback");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        return { ok: false, error: error?.message ?? "Failed to start sign-in" };
      }
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.location.href = data.url;
        return { ok: true };
      }
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== "success" || !res.url) {
        return { ok: false, error: "Sign-in canceled" };
      }
      const params = extractParams(res.url);
      if (params.code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(params.code);
        if (exErr) return { ok: false, error: exErr.message };
      } else if (params.access_token && params.refresh_token) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (setErr) return { ok: false, error: setErr.message };
      } else {
        return { ok: false, error: "No auth code returned" };
      }
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown sign-in error";
      console.log("[auth] signInWithGoogle error", msg);
      return { ok: false, error: msg };
    }
  }, []);

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.log("[auth] signOut error", e); }
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    signInWithGoogle,
    signOut,
  };
});
