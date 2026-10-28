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
