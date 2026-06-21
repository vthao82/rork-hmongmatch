import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState, useCallback, useRef } from "react";
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
  signInWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
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

async function handleAuthRedirectUrl(url: string): Promise<boolean> {
  const params = extractParams(url);
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) { console.log("[auth] exchangeCodeForSession error", error.message); return false; }
    return true;
  }
  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) { console.log("[auth] setSession error", error.message); return false; }
    return true;
  }
  return false;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const pendingResolve = useRef<((ok: boolean) => void) | null>(null);

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

    const { data: subData } = supabase.auth.onAuthStateChange((_event, s) => {
      try {
        setSession(s);
        if (s && pendingResolve.current) {
          pendingResolve.current(true);
          pendingResolve.current = null;
        }
      } catch (e) { console.log("[auth] onAuthStateChange error", e); }
    });

    const handleDeepLink = (ev: { url: string }) => {
      const url = ev?.url ?? "";
      if (!url.includes("auth-callback")) return;
      handleAuthRedirectUrl(url);
    };

    let linkSub: { remove: () => void } | null = null;
    try {
      linkSub = Linking.addEventListener("url", handleDeepLink);
    } catch (e) {
      console.log("[auth] Linking.addEventListener error", e);
    }

    return () => {
      try { mounted = false; subData.subscription.unsubscribe(); linkSub?.remove(); } catch (_e) {}
    };
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
      if (res.type === "success" && res.url) {
        const ok = await handleAuthRedirectUrl(res.url);
        if (!ok) return { ok: false, error: "Failed to complete sign-in" };
        return { ok: true };
      }
      if (res.type === "cancel") {
        return { ok: false, error: "Sign-in canceled" };
      }
      // Browser didn't return cleanly — wait for deep-link fallback
      return new Promise<boolean>((resolve) => {
        let settled = false;
        const done = (ok: boolean) => {
          if (settled) return;
          settled = true;
          if (pendingResolve.current === resolve) pendingResolve.current = null;
          resolve(ok);
        };
        pendingResolve.current = (ok: boolean) => { clearTimeout(tm); done(ok); };
        const tm = setTimeout(() => { done(false); }, 30000);
      }).then((ok) => ok ? { ok: true } : { ok: false, error: "Sign-in timed out" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown sign-in error";
      console.log("[auth] signInWithGoogle error", msg);
      return { ok: false, error: msg };
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        const msg = error.message;
        if (msg.includes("Invalid login credentials")) {
          return { ok: false, error: "Wrong email or password. Try again or sign up." };
        }
        return { ok: false, error: msg };
      }
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown sign-in error";
      console.log("[auth] signInWithEmail error", msg);
      return { ok: false, error: msg };
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) {
        const msg = error.message;
        if (msg.includes("already registered") || msg.includes("already exists")) {
          return { ok: false, error: "An account with this email already exists. Sign in instead." };
        }
        return { ok: false, error: msg };
      }
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown sign-up error";
      console.log("[auth] signUpWithEmail error", msg);
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
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
});
