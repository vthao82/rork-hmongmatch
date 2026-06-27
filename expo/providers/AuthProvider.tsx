import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState, useCallback } from "react";
import Constants from "expo-constants";
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

// OAuth web client ID from google-services.json (client_type: 3)
const WEB_CLIENT_ID = "1004199539174-a947opurbaftcplnl7igaof0hu76h7il.apps.googleusercontent.com";

// Detect if we're running in Expo Go (which can't do native Google Sign-In)
const isExpoGo = Constants.appOwnership === "expo";

// Lazy-load GoogleSignin only when not in Expo Go to avoid native-module errors
type GoogleSigninModule = {
  GoogleSignin: {
    configure: (options: { webClientId: string }) => void;
    hasPlayServices: () => Promise<boolean>;
    signIn: () => Promise<any>;
  };
  statusCodes: { SIGN_IN_CANCELLED: string };
};

let googleSigninModule: GoogleSigninModule | null = null;
let googleConfigured = false;

function getGoogleSignin(): GoogleSigninModule | null {
  if (isExpoGo) return null;
  if (googleSigninModule) return googleSigninModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    googleSigninModule = require("@react-native-google-signin/google-signin") as GoogleSigninModule;
    if (googleSigninModule && !googleConfigured) {
      googleSigninModule.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
      googleConfigured = true;
    }
    return googleSigninModule;
  } catch (e) {
    console.log("[auth] @react-native-google-signin not available", e);
    return null;
  }
}

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
  emailVerified: boolean;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signInWithApple: () => Promise<{ ok: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<EmailSignInResult>;
  signUpWithEmail: (email: string, password: string) => Promise<EmailSignUpResult>;
  resendVerificationEmail: () => Promise<{ ok: boolean; error?: string }>;
  reloadUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Treat Google/Apple users as auto-verified; only password users must verify
  const providerId = user?.providerData?.[0]?.providerId;
  const emailVerified =
    !!user?.emailVerified || (!!providerId && providerId !== "password");

  const signInWithGoogle = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (isExpoGo) {
      return {
        ok: false,
        error: "Google Sign-In requires the development build. Please sign up with email and password while testing in Expo Go.",
      };
    }
    const mod = getGoogleSignin();
    if (!mod) {
      return { ok: false, error: "Google Sign-In is not available on this build." };
    }
    try {
      await mod.GoogleSignin.hasPlayServices();
      const result = await mod.GoogleSignin.signIn();
      // The library returns { type: "success", data: { idToken, user } } in v13+,
      // or the user info directly in older versions.
      const idToken =
        result?.data?.idToken ??
        result?.idToken ??
        null;
      if (result?.type === "cancelled" || result?.type === "cancel") {
        return { ok: false, error: "Sign-in canceled." };
      }
      if (!idToken) {
        console.log("[auth] No idToken from GoogleSignin", result);
        return { ok: false, error: "No idToken from Google." };
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      return { ok: true };
    } catch (e: any) {
      const code = e?.code ?? "";
      if (code === mod.statusCodes.SIGN_IN_CANCELLED || code === "SIGN_IN_CANCELLED" || code === "-5") {
        return { ok: false, error: "Sign-in canceled." };
      }
      const msg = e instanceof Error ? e.message : "Google sign-in failed.";
      console.log("[auth] signInWithGoogle error", msg, e);
      return { ok: false, error: msg };
    }
  }, []);

  const signInWithApple = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    return {
      ok: false,
      error: "Apple Sign-In requires a development build on an iOS device. Coming soon.",
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<EmailSignInResult> => {
      try {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        // Auto-resend verification email if user hasn't verified yet
        if (!cred.user.emailVerified) {
          try {
            await sendEmailVerification(cred.user);
          } catch (e) {
            console.log("[auth] auto-resend verification failed", e);
          }
        }
        return { ok: true };
      } catch (e: any) {
        const code = e?.code ?? "";
        if (
          code === "auth/invalid-credential" ||
          code === "auth/wrong-password" ||
          code === "auth/user-not-found"
        ) {
          return { ok: false, error: "Wrong email or password. Try again or sign up." };
        }
        return { ok: false, error: e?.message ?? "Sign-in failed." };
      }
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<EmailSignUpResult> => {
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
    },
    []
  );

  const resendVerificationEmail = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      if (!auth.currentUser) return { ok: false, error: "Not signed in." };
      await sendEmailVerification(auth.currentUser);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Could not resend email." };
    }
  }, []);

  const reloadUser = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      // Force a state update with a fresh User object so consumers re-render
      setUser(auth.currentUser ? { ...auth.currentUser } as User : null);
    } catch (e) {
      console.log("[auth] reloadUser error", e);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Sign out of GoogleSignin too if available
      const mod = getGoogleSignin();
      if (mod) {
        try {
          // @ts-expect-error optional method
          await mod.GoogleSignin.signOut?.();
        } catch (_e) {
          /* ignore */
        }
      }
      await firebaseSignOut(auth);
    } catch (e) {
      console.log("[auth] signOut error", e);
    }
  }, []);

  return {
    user,
    loading,
    emailVerified,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    resendVerificationEmail,
    reloadUser,
    signOut,
  };
});
