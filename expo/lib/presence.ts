import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { doc, onSnapshot, setDoc, serverTimestamp, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const HEARTBEAT_MS = 2 * 60 * 1000;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/** Writes lastActiveAt while the app is open (skipped when the member hides their status). */
export function usePresenceHeartbeat(uid: string | null | undefined, enabled: boolean) {
  useEffect(() => {
    if (!uid || !enabled) return;
    const beat = () => {
      if (AppState.currentState !== "active") return;
      setDoc(doc(db, "users", uid), { lastActiveAt: serverTimestamp() }, { merge: true }).catch((e) => console.log("[presence]", e));
    };
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") beat(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [uid, enabled]);
}

export function tsToMillis(v: unknown): number | null {
  const t = v as Timestamp | null | undefined;
  return t && typeof t.toMillis === "function" ? t.toMillis() : null;
}

export function isActiveNow(lastActiveAt: number | null | undefined, show: boolean | undefined): boolean {
  return show !== false && !!lastActiveAt && Date.now() - lastActiveAt < ONLINE_WINDOW_MS;
}

/** "Active now", "Active 12m ago", "Active 3h ago", "Active 2d ago" — or "" if hidden/unknown/over a week. */
export function activeLabel(lastActiveAt: number | null | undefined, show: boolean | undefined): string {
  if (show === false || !lastActiveAt) return "";
  const diff = Date.now() - lastActiveAt;
  if (diff < ONLINE_WINDOW_MS) return "Active now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days <= 7 ? `Active ${days}d ago` : "";
}

/** Live active-status label for one member (chat header, profile page). */
export function useActiveLabel(uid: string | null | undefined): string {
  const [state, setState] = useState<{ at: number | null; show: boolean }>({ at: null, show: true });
  const [, tick] = useState<number>(0);
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      doc(db, "users", uid),
      (s) => setState({ at: tsToMillis(s.data()?.lastActiveAt), show: s.data()?.showActiveStatus !== false }),
      (e) => console.log("[presence] watch error", e)
    );
    const timer = setInterval(() => tick((n) => n + 1), 60000);
    return () => { unsub(); clearInterval(timer); };
  }, [uid]);
  return activeLabel(state.at, state.show);
}
