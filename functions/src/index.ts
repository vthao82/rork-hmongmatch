import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { setGlobalOptions, logger } from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });
const db = getFirestore();
const expo = new Expo();

type Kind = "messages" | "matches" | "likes";

async function nameOf(uid: string): Promise<string> {
  const s = await db.doc(`users/${uid}`).get();
  return (s.get("name") as string) || "Someone";
}

/** Send one push, respecting the member's notification switches; drops dead tokens. */
async function sendTo(uid: string, kind: Kind, msg: Omit<ExpoPushMessage, "to">): Promise<void> {
  const ref = db.doc(`users/${uid}/private/push`);
  const snap = await ref.get();
  const token = snap.get("token") as string | undefined;
  const prefs = (snap.get("prefs") ?? {}) as Record<string, boolean>;
  if (!token || !Expo.isExpoPushToken(token)) return;
  if (prefs.push === false || prefs[kind] === false) return;
  try {
    const [ticket] = await expo.sendPushNotificationsAsync([{ to: token, sound: "default", channelId: "default", ...msg }]);
    if (ticket?.status === "error") {
      logger.warn("push error", { uid, ticket });
      if (ticket.details?.error === "DeviceNotRegistered") await ref.update({ token: FieldValue.delete() });
    }
  } catch (e) {
    logger.error("push send failed", e);
  }
}

const listOf = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

/** New chat message → push to the other person. */
export const onNewMessage = onDocumentCreated("matches/{matchId}/messages/{messageId}", async (event) => {
  const m = event.data?.data();
  if (!m) return;
  const match = (await db.doc(`matches/${event.params.matchId}`).get()).data();
  if (!match) return;
  if (listOf(match.blockedBy).length || listOf(match.unmatchedBy).length) return;
  const senderId = m.senderId as string;
  const recipient = listOf(match.userIds).find((u) => u !== senderId);
  if (!recipient) return;
  const text = typeof m.text === "string" && m.text.trim() ? m.text.trim() : "Sent you a photo";
  await sendTo(recipient, "messages", {
    title: await nameOf(senderId),
    body: text.length > 140 ? `${text.slice(0, 137)}...` : text,
    data: { type: "message", otherUid: senderId },
  });
});

/** Match created (or re-created after unmatch) → push to both people. */
export const onMatch = onDocumentWritten("matches/{matchId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!after) return;
  const a = after.createdAt as Timestamp | undefined;
  const b = before?.createdAt as Timestamp | undefined;
  if (!a || (b && b.isEqual(a))) return;
  if (listOf(after.unmatchedBy).length || listOf(after.blockedBy).length) return;
  const [u1, u2] = listOf(after.userIds);
  if (!u1 || !u2) return;
  const [n1, n2] = await Promise.all([nameOf(u1), nameOf(u2)]);
  await Promise.all([
    sendTo(u1, "matches", { title: "It's a match!", body: `You and ${n2} liked each other. Say hi!`, data: { type: "match", otherUid: u2 } }),
    sendTo(u2, "matches", { title: "It's a match!", body: `You and ${n1} liked each other. Say hi!`, data: { type: "match", otherUid: u1 } }),
  ]);
});

/** Someone liked you → push (skipped when it instantly became a match; that sends a match alert). */
export const onLike = onDocumentCreated("users/{uid}/likesReceived/{likerId}", async (event) => {
  const { uid, likerId } = event.params;
  const mine = await db.doc(`users/${uid}/swipes/${likerId}`).get();
  if (mine.get("liked") === true) return;
  const blocked = await db.doc(`users/${uid}/blocked/${likerId}`).get();
  if (blocked.exists) return;
  await sendTo(uid, "likes", {
    title: "Someone likes you",
    body: "Open Hmong Date to see who liked you.",
    data: { type: "like" },
  });
});
