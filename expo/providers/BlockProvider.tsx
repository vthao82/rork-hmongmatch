import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
const getMatchId = (a: string, b: string) => [a, b].sort().join("_");
import { useAuth } from "@/providers/AuthProvider";

export type BlockedEntry = { uid: string; name: string; photo: string | null };

/** Live block lists: people I blocked + people who blocked me. Both are hidden everywhere. */
export const [BlockProvider, useBlocks] = createContextHook(() => {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [blocked, setBlocked] = useState<BlockedEntry[]>([]);
  const [blockedBy, setBlockedBy] = useState<string[]>([]);

  useEffect(() => {
    if (!uid) {
      setBlocked([]);
      setBlockedBy([]);
      return;
    }
    const u1 = onSnapshot(
      collection(db, "users", uid, "blocked"),
      (s) => setBlocked(s.docs.map((d) => ({ uid: d.id, name: (d.data().name as string) ?? "Member", photo: (d.data().photo as string) ?? null }))),
      (e) => console.log("[blocks] blocked error", e)
    );
    const u2 = onSnapshot(
      collection(db, "users", uid, "blockedBy"),
      (s) => setBlockedBy(s.docs.map((d) => d.id)),
      (e) => console.log("[blocks] blockedBy error", e)
    );
    return () => { u1(); u2(); };
  }, [uid]);

  const hidden = useMemo(() => new Set<string>([...blocked.map((b) => b.uid), ...blockedBy]), [blocked, blockedBy]);
  return { blocked, hidden };
});

export async function blockUser(me: string, other: { id: string; name: string; photos?: string[] }): Promise<boolean> {
  try {
    await setDoc(doc(db, "users", me, "blocked", other.id), { name: other.name, photo: other.photos?.[0] ?? null, createdAt: serverTimestamp() });
    await setDoc(doc(db, "users", other.id, "blockedBy", me), { createdAt: serverTimestamp() });
    // Stops new messages server-side (rules check match.blockedBy)
    await updateDoc(doc(db, "matches", getMatchId(me, other.id)), { blockedBy: arrayUnion(me) }).catch(() => {});
    // Withdraw any pending like so they don't see me in "Likes You"
    await deleteDoc(doc(db, "users", other.id, "likesReceived", me)).catch(() => {});
    return true;
  } catch (e) {
    console.log("[blocks] block error", e);
    return false;
  }
}

export async function unblockUser(me: string, otherUid: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "users", me, "blocked", otherUid));
    await deleteDoc(doc(db, "users", otherUid, "blockedBy", me));
    await updateDoc(doc(db, "matches", getMatchId(me, otherUid)), { blockedBy: arrayRemove(me) }).catch(() => {});
    return true;
  } catch (e) {
    console.log("[blocks] unblock error", e);
    return false;
  }
}
