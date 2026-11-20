import { Platform } from "react-native";
import Constants from "expo-constants";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const sent = new Set<string>();
let screen = "";
export const setErrorScreen = (path: string) => { screen = path; };

/** Saves an app error for the admin page (deduped, max 15 per session). */
export function logError(err: unknown, fatal = false) {
  const e = err instanceof Error ? err : new Error(String(err));
  const message = (e.message || "Unknown error").slice(0, 600);
  if (sent.has(message) || sent.size >= 15) return;
  sent.add(message);
  addDoc(collection(db, "errorLogs"), {
    uid: auth.currentUser?.uid ?? null, message, stack: (e.stack ?? "").slice(0, 3000), platform: Platform.OS,
    screen, version: Constants.expoConfig?.version ?? "", fatal, createdAt: serverTimestamp(),
  }).catch(() => {});
}

export function installErrorLogging() {
  if (Platform.OS === "web") {
    window.addEventListener("error", (ev) => logError(ev.error ?? ev.message));
    window.addEventListener("unhandledrejection", (ev) => logError(ev.reason));
    return;
  }
  const g = globalThis as unknown as { ErrorUtils?: { getGlobalHandler: () => (e: unknown, f?: boolean) => void; setGlobalHandler: (h: (e: unknown, f?: boolean) => void) => void } };
  const prev = g.ErrorUtils?.getGlobalHandler();
  g.ErrorUtils?.setGlobalHandler((e, isFatal) => { logError(e, !!isFatal); prev?.(e, isFatal); });
}
