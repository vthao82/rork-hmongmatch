import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { tsToMillis } from "@/lib/presence";

const TYPING_TTL_MS = 6000;
const PING_EVERY_MS = 3000;

/** Returns a function to call on every keystroke (throttled) and on send (stop=true). */
export function useTypingPinger(matchId: string | null, myUid: string | null | undefined) {
  const last = useRef<number>(0);
  return (stop?: boolean) => {
    if (!matchId || !myUid) return;
    const now = Date.now();
    if (!stop && now - last.current < PING_EVERY_MS) return;
    last.current = stop ? 0 : now;
    setDoc(doc(db, "matches", matchId, "typing", myUid), { typing: !stop, at: serverTimestamp() }).catch(() => {});
  };
}

/** Record that I've seen this chat up to now (only when I share read receipts). */
export function markChatSeen(matchId: string | null, myUid: string | null | undefined) {
  if (!matchId || !myUid) return;
  setDoc(doc(db, "matches", matchId, "reads", myUid), { at: serverTimestamp() }).catch(() => {});
}

/** When the other person last opened this chat (ms), or null. */
export function useOtherSeenAt(matchId: string | null, otherUid: string | null | undefined, enabled: boolean): number | null {
  const [at, setAt] = useState<number | null>(null);
  useEffect(() => {
    if (!matchId || !otherUid || !enabled) { setAt(null); return; }
    return onSnapshot(
      doc(db, "matches", matchId, "reads", otherUid),
      (s) => setAt(tsToMillis(s.data()?.at)),
      () => setAt(null)
    );
  }, [matchId, otherUid, enabled]);
  return at;
}

/** True while the other person is typing in this chat. */
export function useOtherTyping(matchId: string | null, otherUid: string | null | undefined): boolean {
  const [state, setState] = useState<{ typing: boolean; at: number | null }>({ typing: false, at: null });
  const [, tick] = useState<number>(0);
  useEffect(() => {
    if (!matchId || !otherUid) return;
    const unsub = onSnapshot(
      doc(db, "matches", matchId, "typing", otherUid),
      (s) => setState({ typing: s.data()?.typing === true, at: tsToMillis(s.data()?.at) ?? Date.now() }),
      () => setState({ typing: false, at: null })
    );
    const timer = setInterval(() => tick((n) => n + 1), 2000);
    return () => { unsub(); clearInterval(timer); };
  }, [matchId, otherUid]);
  return state.typing && !!state.at && Date.now() - state.at < TYPING_TTL_MS;
}
