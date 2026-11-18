import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import { OAuthProvider, signInWithCredential, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AppleModule = typeof import("expo-apple-authentication");
let mod: AppleModule | null = null;

// Lazy-load so builds without the native module don't crash.
function load(): AppleModule | null {
  if (Platform.OS !== "ios") return null;
  if (mod) return mod;
  try {
    mod = require("expo-apple-authentication") as AppleModule;
    return mod;
  } catch {
    return null;
  }
}

export async function appleSignInAvailable(): Promise<boolean> {
  const a = load();
  if (!a) return false;
  try { return await a.isAvailableAsync(); } catch { return false; }
}

export async function appleSignIn(): Promise<{ ok: boolean; error?: string }> {
  const a = load();
  if (!a) return { ok: false, error: "Sign in with Apple is only available on iPhone." };
  try {
    const rawNonce = Crypto.randomUUID();
    const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    const res = await a.signInAsync({
      requestedScopes: [a.AppleAuthenticationScope.FULL_NAME, a.AppleAuthenticationScope.EMAIL],
      nonce: hashed,
    });
    if (!res.identityToken) return { ok: false, error: "Apple didn't return a sign-in token. Please try again." };
    const cred = new OAuthProvider("apple.com").credential({ idToken: res.identityToken, rawNonce });
    const { user } = await signInWithCredential(auth, cred);
    // Apple shares the name only on the very first sign-in
    const name = [res.fullName?.givenName, res.fullName?.familyName].filter(Boolean).join(" ");
    if (name && !user.displayName) await updateProfile(user, { displayName: name }).catch(() => {});
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "ERR_REQUEST_CANCELED") return { ok: false, error: "Sign-in canceled" };
    console.log("[apple] sign-in error", e?.code, e?.message);
    return { ok: false, error: e?.message ?? "Apple sign-in failed." };
  }
}
