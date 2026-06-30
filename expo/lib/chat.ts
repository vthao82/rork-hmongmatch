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
  setDoc,
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

/**
 * Ensure a /matches/{matchId} doc exists for the current user + otherUid.
 * Only fires for seed-* test profiles (real users get a match doc only via
 * a mutual swipe — see recordSwipe()). Idempotent via setDoc + merge.
 * 🚨 REMOVE BEFORE PRODUCTION — see banner below scheduleBotReply().
 */
async function ensureSeedMatch(otherUid: string): Promise<void> {
  if (!otherUid.startsWith("seed-")) return;
  const me = auth.currentUser;
  if (!me) return;
  const matchId = getMatchId(me.uid, otherUid);
  try {
    await setDoc(
      doc(db, "matches", matchId),
      {
        userIds: [me.uid, otherUid].sort(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.log("[ensureSeedMatch] failed", e);
  }
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
    // For seed-* test profiles, create the parent match doc first — otherwise
    // Firestore rules deny the read subscription (isMatchParticipant() fails
    // when the match doc doesn't exist).
    let cancelled = false;
    let unsub: (() => void) | null = null;
    const start = async () => {
      if (otherUid && otherUid.startsWith("seed-")) {
        await ensureSeedMatch(otherUid);
      }
      if (cancelled) return;
      const q = query(
        collection(db, "matches", matchId, "messages"),
        orderBy("createdAt", "asc"),
        fbLimit(200)
      );
      unsub = onSnapshot(
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
    };
    void start();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [matchId, me?.uid, otherUid]);

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
    // For seed-* test profiles, make sure the parent /matches/{matchId} doc
    // exists so Firestore rules allow the message write. No-op for real users
    // (they get a match doc via mutual swipe in recordSwipe()).
    if (otherUid.startsWith("seed-")) {
      await ensureSeedMatch(otherUid);
    }
    await addDoc(collection(db, "matches", matchId, "messages"), {
      senderId: me.uid,
      text: trimmed,
      createdAt: serverTimestamp(),
      readBy: [me.uid],
    });
    // If chatting with a seed-* test profile, schedule an auto-reply so the
    // user can validate the full chat loop solo. Production users (non-seed
    // uids) get no auto-reply.
    if (otherUid.startsWith("seed-")) {
      scheduleBotReply(otherUid, me.uid);
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    console.log("[sendChatMessage] error", e);
    return { ok: false, error: msg };
  }
}

const BOT_REPLIES = [
  "Hey 😊",
  "Tell me more about yourself!",
  "What are you up to today?",
  "That's interesting — go on?",
  "Haha I love that. What else?",
  "Where in Minnesota are you from?",
  "Same here! Big mood.",
  "Are you free this weekend?",
  "I love trying new restaurants — got any favorites?",
  "What do you do for fun?",
];

// ============================================================
// 🚨 REMOVE BEFORE PRODUCTION
// ------------------------------------------------------------
// The block below (BOT_REPLIES, pickReply, scheduleBotReply, and the
// `if (otherUid.startsWith("seed-")) scheduleBotReply(...)` call inside
// sendChatMessage) exists ONLY to let the founder solo-test chat against
// seed accounts. Before App Store / Play submission:
//   1. Delete the call site inside sendChatMessage()
//   2. Delete scheduleBotReply() and BOT_REPLIES
//   3. In firestore.rules, remove the bot-reply OR clause from
//      `match /matches/{matchId}/messages/{messageId}` so the only
//      allowed shape is `senderId == request.auth.uid`.
// Real users have Firebase Auth UIDs that NEVER start with "seed-", so
// this code is dormant for them — but defense in depth: take it out.
// ============================================================
function pickReply(): string {
  return BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
}

/** Schedule a single bot reply ~2-5s after a user message. Best-effort. */
function scheduleBotReply(seedUid: string, myUid: string): void {
  const delayMs = 1800 + Math.floor(Math.random() * 3000);
  setTimeout(async () => {
    try {
      const matchId = getMatchId(seedUid, myUid);
      await addDoc(collection(db, "matches", matchId, "messages"), {
        senderId: seedUid,
        text: pickReply(),
        createdAt: serverTimestamp(),
        readBy: [seedUid],
      });
    } catch (e) {
      console.log("[scheduleBotReply] failed", e);
    }
  }, delayMs);
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
