import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

export type EmailSignUpResult = {
  ok: boolean;
  error?: string;
  emailConfirmationRequired?: boolean;
};

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<EmailSignUpResult>;
  resendVerificationEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
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

    // Handle cold-start deep links — when the OS launches the app fresh
    // to handle a redirect URL (common after system-browser OAuth flows).
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl && initialUrl.includes("auth-callback")) {
        handleAuthRedirectUrl(initialUrl);
      }
    }).catch((e) => {
      console.log("[auth] getInitialURL error", e);
    });

    return () => {
      try { mounted = false; subData.subscription.unsubscribe(); linkSub?.remove(); } catch (_e) {}
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const redirectTo = Linking.createURL("auth-callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account", access_type: "offline" },
        },
      });

      if (error || !data?.url) {
        console.log("[auth] signInWithOAuth error:", error?.message);
        return { ok: false, error: error?.message ?? "Failed to start sign-in" };
      }

      // openAuthSessionAsync opens an in-app browser that follows the
      // OAuth redirect chain (Supabase → Google → Supabase → app).
      // On success the redirect URL with the auth code is captured.
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (res.type === "success" && res.url) {
        const ok = await handleAuthRedirectUrl(res.url);
        if (ok) return { ok: true };
      }

      // Fallback for cloud simulators and cold-start scenarios:
      // The deep-link handler or auth-callback screen may have already
      // exchanged the code and established a session. Poll briefly.
      for (let i = 0; i < 8; i++) {
        await new Promise<void>((r) => setTimeout(r, 500));
        const { data: sessData } = await supabase.auth.getSession();
        if (sessData.session) return { ok: true };
      }

      if (res.type === "cancel") return { ok: false, error: "Sign-in canceled" };
      return { ok: false, error: "Sign-in was interrupted — please try again" };
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

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<EmailSignUpResult> => {
    try {
      const trimmed = email.trim();
      const emailRedirectTo = Linking.createURL("auth-callback");
      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: { emailRedirectTo },
      });
      if (error) {
        const msg = error.message;
        if (msg.includes("already registered") || msg.includes("already exists")) {
          return { ok: false, error: "An account with this email already exists. Sign in instead." };
        }
        return { ok: false, error: msg };
      }
      // If session is null, email confirmation is required
      const emailConfirmationRequired = !data.session;
      return { ok: true, emailConfirmationRequired };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown sign-up error";
      console.log("[auth] signUpWithEmail error", msg);
      return { ok: false, error: msg };
    }
  }, []);

  const resendVerificationEmail = useCallback(async (email: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const emailRedirectTo = Linking.createURL("auth-callback");
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo },
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.log("[auth] resendVerificationEmail error", msg);
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
    resendVerificationEmail,
    signOut,
  };
});
