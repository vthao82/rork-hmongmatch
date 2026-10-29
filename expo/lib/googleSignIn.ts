import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";

const WEB_CLIENT_ID = "1004199539174-a947opurbaftcplnl7igaof0hu76h7il.apps.googleusercontent.com";

type GoogleModule = typeof import("@react-native-google-signin/google-signin");
let mod: GoogleModule | null = null;

// Lazy-load so older app builds without the native module don't crash on startup.
function load(): GoogleModule | null {
  if (mod) return mod;
  try {
    mod = require("@react-native-google-signin/google-signin") as GoogleModule;
    mod.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    return mod;
  } catch (e) {
    console.log("[google] native module unavailable", e);
    return null;
  }
}

export async function googleSignIn(): Promise<{ ok: boolean; error?: string }> {
  const g = load();
  if (!g) return { ok: false, error: "Please update the app to the latest version to use Google sign-in." };
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = g;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return { ok: false, error: "Sign-in canceled" };
    const idToken = res.data.idToken;
    if (!idToken) return { ok: false, error: "Google didn't return a sign-in token. Please try again." };
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return { ok: true };
  } catch (e: any) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS) return { ok: false, error: "Sign-in canceled" };
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return { ok: false, error: "Google Play Services is not available on this device." };
    }
    console.log("[google] sign-in error", e?.code, e?.message);
    return { ok: false, error: e?.message ?? "Google sign-in failed." };
  }
}

export async function googleSignOut(): Promise<void> {
  const g = load();
  if (!g) return;
  try { await g.GoogleSignin.signOut(); } catch {}
}
