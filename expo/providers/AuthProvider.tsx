import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

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
    return {
      ok: false,
      error: "Google Sign-In is coming soon. Please use email and password for now.",
    };
  }, []);

  const signInWithApple = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    return {
      ok: false,
      error: "Apple Sign-In is coming soon. Please use email and password for now.",
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
      setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null);
    } catch (e) {
      console.log("[auth] reloadUser error", e);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
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
