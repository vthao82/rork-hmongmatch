import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = "611154447714-cf6es6ga7s8chqg3kch0m7scj6it3tvu.apps.googleusercontent.com";

export type EmailSignInResult = {
  ok: boolean;
  error?: string;
};

export type EmailSignUpResult = {
  ok: boolean;
  error?: string;
  emailConfirmationRequired?: boolean;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<EmailSignInResult>;
  signUpWithEmail: (email: string, password: string) => Promise<EmailSignUpResult>;
  resendVerificationEmail: () => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [_request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: "1004199539174-a947opurbaftcplnl7igaof0hu76h7il.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.io/@anonymous/8g9q9xcaqktiqbyw1ssbb",
    selectAccount: true,
  });

  useEffect(() => {
    if (_request?.redirectUri) {
      console.log("[auth] Google OAuth redirect URI:", _request.redirectUri);
    }
  }, [_request]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token, access_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token ?? null, access_token);
      signInWithCredential(auth, credential).catch((e) => {
        console.log("[auth] signInWithCredential error", e);
      });
    }
  }, [response]);

  const signInWithGoogle = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const result = await promptAsync();
      if (result.type === "success") return { ok: true };
      if (result.type === "cancel" || result.type === "dismiss") return { ok: false, error: "Sign-in canceled." };
      return { ok: false, error: "Google sign-in failed. Please try again." };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown sign-in error";
      console.log("[auth] signInWithGoogle error", msg);
      return { ok: false, error: msg };
    }
  }, [promptAsync]);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<EmailSignInResult> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { ok: true };
    } catch (e: any) {
      const code = e?.code ?? "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        return { ok: false, error: "Wrong email or password. Try again or sign up." };
      }
      return { ok: false, error: e?.message ?? "Sign-in failed." };
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<EmailSignUpResult> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(cred.user);
      return { ok: true, emailConfirmationRequired: true };
    } catch (e: any) {
      const code = e?.code ?? "";
      if (code === "auth/email-already-in-use") {
        return { ok: false, error: "An account with this email already exists. Sign in instead." };
      }
      if (code === "auth/weak-password") {
        return { ok: false, error: "Password must be at least 6 characters." };
      }
      return { ok: false, error: e?.message ?? "Sign-up failed." };
    }
  }, []);

  const resendVerificationEmail = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      if (!auth.currentUser) return { ok: false, error: "Not signed in." };
      await sendEmailVerification(auth.currentUser);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Could not resend email." };
    }
  }, []);

  const signOut = useCallback(async () => {
    try { await firebaseSignOut(auth); } catch (e) { console.log("[auth] signOut error", e); }
  }, []);

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resendVerificationEmail,
    signOut,
  };
});
