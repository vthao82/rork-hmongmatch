import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  query,
  orderBy,
  limit as fbLimit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  type Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useMyMatches } from "@/lib/discoverProfiles";

/** Deterministic match id for two users (sorted, joined by `_`). */
export function getMatchId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: number | null; // ms timestamp, may be null while server resolves
  read: boolean;
};

function tsToMs(t: unknown): number | null {
  if (!t) return null;
  // Firestore Timestamp has .toMillis()
  const ts = t as Timestamp;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  return null;
}

function rowToMessage(id: string, row: DocumentData, myUid: string): ChatMessage {
  const readBy: string[] = Array.isArray(row.readBy) ? (row.readBy as string[]) : [];
  return {
    id,
    senderId: (row.senderId as string) ?? "",
    text: (row.text as string) ?? "",
    createdAt: tsToMs(row.createdAt),
    read: readBy.includes(myUid),
  };
}

/** Subscribe to messages for a chat (between current user and otherUid). */
export function useChatMessages(otherUid: string | undefined | null) {
  const me = auth.currentUser;
  const matchId = me && otherUid ? getMatchId(me.uid, otherUid) : null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(!!matchId);

  useEffect(() => {
    if (!matchId || !me) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "matches", matchId, "messages"),
      orderBy("createdAt", "asc"),
      fbLimit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ChatMessage[] = [];
        snap.forEach((d) => list.push(rowToMessage(d.id, d.data(), me.uid)));
        setMessages(list);
        setLoading(false);
      },
      (err) => {
        console.log("[useChatMessages] error", err);
        setMessages([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [matchId, me?.uid]);

  return { messages, matchId, loading };
}

/** Send a message to the chat with `otherUid`. */
export async function sendChatMessage(
  otherUid: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const me = auth.currentUser;
  if (!me) return { ok: false, error: "Not signed in" };
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Empty message" };
  try {
    const matchId = getMatchId(me.uid, otherUid);
    await addDoc(collection(db, "matches", matchId, "messages"), {
      senderId: me.uid,
      text: trimmed,
      createdAt: serverTimestamp(),
      readBy: [me.uid],
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    console.log("[sendChatMessage] error", e);
    return { ok: false, error: msg };
  }
}

/** Mark a message as read by the current user. Best-effort, non-blocking. */
export async function markMessageRead(matchId: string, messageId: string): Promise<void> {
  const me = auth.currentUser;
  if (!me) return;
  try {
    await updateDoc(doc(db, "matches", matchId, "messages", messageId), {
      readBy: arrayUnion(me.uid),
    });
  } catch (e) {
    console.log("[markMessageRead] error", e);
  }
}

export type ChatThread = {
  otherUid: string;
  matchId: string;
  lastMessage: string | null;
  lastMessageAt: number | null;
  unreadCount: number;
};

/**
 * For every match, subscribe to the latest message to build a chat-list summary.
 * Returns one row per match (other user).
 */
export function useChatThreads(): { threads: ChatThread[]; loading: boolean } {
  const me = auth.currentUser;
  const { matchIds, loading: loadingMatches } = useMyMatches();
  const [byOther, setByOther] = useState<Record<string, ChatThread>>({});

  // Reset map when match list changes (to drop stale entries)
  useEffect(() => {
    setByOther((prev) => {
      const next: Record<string, ChatThread> = {};
      matchIds.forEach((other) => {
        next[other] =
          prev[other] ?? {
            otherUid: other,
            matchId: me ? getMatchId(me.uid, other) : "",
            lastMessage: null,
            lastMessageAt: null,
            unreadCount: 0,
          };
      });
      return next;
    });
  }, [matchIds.join("|"), me?.uid]);

  useEffect(() => {
    if (!me || matchIds.length === 0) return;
    const unsubs: Array<() => void> = [];
    matchIds.forEach((other) => {
      const matchId = getMatchId(me.uid, other);
      const q = query(
        collection(db, "matches", matchId, "messages"),
        orderBy("createdAt", "desc"),
        fbLimit(20)
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          let lastMessage: string | null = null;
          let lastMessageAt: number | null = null;
          let unread = 0;
          let idx = 0;
          snap.forEach((d) => {
            const row = d.data();
            const msg = rowToMessage(d.id, row, me.uid);
            if (idx === 0) {
              lastMessage = msg.text;
              lastMessageAt = msg.createdAt;
            }
            if (!msg.read && msg.senderId !== me.uid) unread++;
            idx++;
          });
          setByOther((prev) => ({
            ...prev,
            [other]: {
              otherUid: other,
              matchId,
              lastMessage,
              lastMessageAt,
              unreadCount: unread,
            },
          }));
        },
        (err) => console.log("[useChatThreads] err", err)
      );
      unsubs.push(unsub);
    });
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [matchIds.join("|"), me?.uid]);

  const threads = useMemo(() => {
    return Object.values(byOther).sort((a, b) => {
      const ta = a.lastMessageAt ?? 0;
      const tb = b.lastMessageAt ?? 0;
      return tb - ta;
    });
  }, [byOther]);

  return { threads, loading: loadingMatches };
}

/** Format a ms timestamp as a short relative label (Just now / 5m / 2h / Mon / Mar 12). */
export function formatRelative(ms: number | null | undefined): string {
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 60_000) return "Just now";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h`;
  const d = new Date(ms);
  if (diff < 7 * 24 * 60 * 60_000) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
