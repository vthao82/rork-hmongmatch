import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { setGlobalOptions, logger } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });
const db = getFirestore();
const expo = new Expo();

type Kind = "messages" | "matches" | "likes" | "events";

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
  const comment = (event.data?.get("comment") as string | undefined)?.trim();
  await sendTo(uid, "likes", {
    title: "Someone likes you",
    body: comment ? "Someone liked you and left a comment. Open Hmong Date to see it." : "Open Hmong Date to see who liked you.",
    data: { type: "like" },
  });
});

const FRIENDS_PER_REWARD = 3;
const REWARD_MS = 7 * 24 * 60 * 60 * 1000;

/** Unique, readable invite code like VANG4821. */
async function createInviteCode(uid: string, clan: unknown): Promise<string> {
  const prefix = (typeof clan === "string" ? clan : "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "HMNG";
  for (let i = 0; i < 20; i++) {
    const code = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
    const ref = db.doc(`invites/${code}`);
    const ok = await db.runTransaction(async (tx) => {
      if ((await tx.get(ref)).exists) return false;
      tx.set(ref, { uid, createdAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (ok) return code;
  }
  throw new Error("Could not create a unique invite code");
}

/**
 * Users: give every member an invite code, and credit the inviter exactly once when a
 * referred friend finishes sign-up. Every 3 friends = 7 more days of free Unlimited.
 */
export const onUserWrite = onDocumentWritten("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after.data();
  if (!after) return;
  const userRef = db.doc(`users/${uid}`);

  // Admin "Unlimited list": grant once the member's sign-in email is on it
  if (after.compChecked !== true) {
    try {
      const email = (await getAuth().getUser(uid)).email?.toLowerCase();
      const listed = email ? (await db.doc(`compEmails/${email}`).get()).exists : false;
      await userRef.update(listed ? { compChecked: true, complimentaryUnlimited: true, compSource: "admin-list" } : { compChecked: true });
    } catch (e) {
      logger.error("comp check failed", { uid, e });
    }
  }

  if (!after.inviteCode) {
    try {
      await userRef.update({ inviteCode: await createInviteCode(uid, after.clan) });
    } catch (e) {
      logger.error("invite code failed", { uid, e });
    }
  }

  const code = typeof after.referredByCode === "string" ? after.referredByCode.trim().toUpperCase() : "";
  if (!code || after.onboardingComplete !== true || after.referralCredited) return;

  await db.runTransaction(async (tx) => {
    const me = await tx.get(userRef);
    if (me.get("referralCredited")) return;
    const invite = await tx.get(db.doc(`invites/${code}`));
    const inviterUid = invite.get("uid") as string | undefined;
    if (!inviterUid || inviterUid === uid) {
      tx.update(userRef, { referralCredited: "invalid" });
      return;
    }
    const inviterRef = db.doc(`users/${inviterUid}`);
    const inviter = await tx.get(inviterRef);
    if (!inviter.exists) {
      tx.update(userRef, { referralCredited: "invalid" });
      return;
    }
    const count = ((inviter.get("referralCount") as number) ?? 0) + 1;
    const update: Record<string, unknown> = { referralCount: count };
    if (count % FRIENDS_PER_REWARD === 0) {
      const current = (inviter.get("referralUnlimitedUntil") as Timestamp | undefined)?.toMillis() ?? 0;
      update.referralUnlimitedUntil = Timestamp.fromMillis(Math.max(current, Date.now()) + REWARD_MS);
    }
    tx.update(inviterRef, update);
    tx.set(db.doc(`users/${inviterUid}/referrals/${uid}`), { name: after.name ?? null, code, createdAt: FieldValue.serverTimestamp() });
    tx.update(userRef, { referralCredited: true, referredBy: inviterUid });
  });

  const credited = (await userRef.get()).get("referredBy") as string | undefined;
  if (credited) {
    const inv = await db.doc(`users/${credited}`).get();
    const count = (inv.get("referralCount") as number) ?? 0;
    const earned = count % FRIENDS_PER_REWARD === 0;
    await sendTo(credited, "matches", {
      title: earned ? "You earned a free week of Unlimited!" : "A friend joined Hmong Date",
      body: earned ? `${count} friends joined with your code. Enjoy Unlimited for 7 days.` : `${count % FRIENDS_PER_REWARD} of ${FRIENDS_PER_REWARD} friends joined with your code.`,
      data: { type: "referral" },
    });
  }
});

/** New event suggestion → alert every admin so it can be reviewed. */
export const onEventSuggested = onDocumentCreated("events/{eventId}", async (event) => {
  const e = event.data?.data();
  if (!e || e.status !== "pending") return;
  const admins = await db.collection("users").where("isAdmin", "==", true).get();
  await Promise.all(admins.docs.map((a) => sendTo(a.id, "events", {
    title: "New event to review",
    body: `${e.title ?? "An event"} — ${[e.city, e.state].filter(Boolean).join(", ")}`,
    data: { type: "event", eventId: event.params.eventId },
  })));
});

const centralDay = (ms: number) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric" }).format(new Date(ms));

/** Reply on an event comment → push to the person who wrote the comment being replied to. */
export const onEventComment = onDocumentCreated("events/{eventId}/comments/{commentId}", async (event) => {
  const c = event.data?.data();
  const target = typeof c?.replyTo === "string" ? c.replyTo : c?.parentId;
  if (!c || typeof target !== "string") return;
  const { eventId } = event.params;
  const parent = await db.doc(`events/${eventId}/comments/${target}`).get();
  const parentUid = parent.get("uid") as string | undefined;
  if (!parentUid || parentUid === c.uid) return;
  if ((await db.doc(`users/${parentUid}/blocked/${c.uid}`).get()).exists) return;
  const title = ((await db.doc(`events/${eventId}`).get()).get("title") as string) || "an event";
  const text = String(c.text ?? "").trim();
  await sendTo(parentUid, "events", {
    title: `${await nameOf(c.uid)} replied to you`,
    body: `On ${title}: ${text.length > 120 ? `${text.slice(0, 117)}...` : text}`,
    data: { type: "event", eventId },
  });
});

/** 6 PM US Central: remind everyone going to an event that starts tomorrow. */
export const eventReminders = onSchedule({ schedule: "0 18 * * *", timeZone: "America/Chicago" }, async () => {
  const now = Date.now();
  const snap = await db.collection("events").where("status", "==", "approved").get();
  const due = snap.docs.filter((d) => {
    const at = d.get("startsAt") as number;
    return typeof at === "number" && at > now && at <= now + 24 * 3600 * 1000 && d.get("reminderSent") !== true;
  });
  for (const d of due) {
    const e = d.data();
    const place = [e.venue, e.city].filter(Boolean).join(", ");
    await Promise.all(listOf(e.going).map((uid) => sendTo(uid, "events", {
      title: `Tomorrow: ${e.title ?? "your event"}`,
      body: `${centralDay(e.startsAt)}${e.timeText ? ` · ${e.timeText}` : ""}${place ? ` · ${place}` : ""}. See you there!`,
      data: { type: "event", eventId: d.id },
    })));
    await d.ref.update({ reminderSent: true });
    logger.info("event reminder sent", { eventId: d.id, people: listOf(e.going).length });
  }
});


/** Public, member-free copy of approved events for the signed-out website. */
export const onEventMirror = onDocumentWritten("events/{eventId}", async (event) => {
  const ref = db.doc(`publicEvents/${event.params.eventId}`);
  const e = event.data?.after.data();
  if (!e || e.status !== "approved") { await ref.delete().catch(() => {}); return; }
  await ref.set({
    title: e.title ?? "", description: e.description ?? "", venue: e.venue ?? "", city: e.city ?? "", state: e.state ?? "",
    dateText: e.dateText ?? "", timeText: e.timeText ?? "", startsAt: e.startsAt ?? 0, goingCount: listOf(e.going).length,
  });
});

async function requireAdmin(uid: string | undefined) {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  if ((await db.doc(`users/${uid}`).get()).get("isAdmin") !== true) throw new HttpsError("permission-denied", "Admins only.");
}

/** Admin: every account with sign-up date, last sign-in, last active and status. */
export const adminListUsers = onCall({ memory: "512MiB", timeoutSeconds: 120 }, async (req) => {
  await requireAdmin(req.auth?.uid);
  const docs = new Map((await db.collection("users").get()).docs.map((d) => [d.id, d.data()]));
  const out: Record<string, unknown>[] = [];
  let token: string | undefined;
  do {
    const page = await getAuth().listUsers(1000, token);
    for (const u of page.users) {
      const d = docs.get(u.uid) ?? {};
      out.push({
        uid: u.uid, email: u.email ?? null, name: d.name ?? u.displayName ?? null, photo: Array.isArray(d.photos) ? d.photos[0] ?? null : null,
        provider: u.providerData[0]?.providerId ?? "password", createdAt: Date.parse(u.metadata.creationTime),
        lastSignIn: u.metadata.lastSignInTime ? Date.parse(u.metadata.lastSignInTime) : null,
        lastActive: d.lastActiveAt?.toMillis?.() ?? null, disabled: u.disabled, onboarded: d.onboardingComplete === true,
        unlimited: d.complimentaryUnlimited === true || d.complimentary === true || d.tier === "unlimited", isAdmin: d.isAdmin === true,
        state: d.hometownState ?? null, referralCount: d.referralCount ?? 0,
      });
    }
    token = page.pageToken;
  } while (token);
  return { users: out };
});

/** Admin: block (can't sign in, hidden) or unblock an account. */
export const adminSetBlocked = onCall(async (req) => {
  await requireAdmin(req.auth?.uid);
  const uid = String(req.data?.uid ?? "");
  const blocked = req.data?.blocked === true;
  if (!uid || uid === req.auth?.uid) throw new HttpsError("invalid-argument", "Pick another member.");
  await getAuth().updateUser(uid, { disabled: blocked });
  if (blocked) await getAuth().revokeRefreshTokens(uid);
  await db.doc(`users/${uid}`).set({ blockedByAdmin: blocked }, { merge: true });
  return { ok: true };
});

/** Admin "Unlimited list": adding an email grants an existing member right away; removing takes it back. */
export const onCompEmailWrite = onDocumentWritten("compEmails/{email}", async (event) => {
  const email = event.params.email;
  let uid: string;
  try { uid = (await getAuth().getUserByEmail(email)).uid; } catch { return; }
  const ref = db.doc(`users/${uid}`);
  if (event.data?.after.exists) await ref.set({ complimentaryUnlimited: true, compSource: "admin-list", compChecked: true }, { merge: true });
  else if ((await ref.get()).get("compSource") === "admin-list") await ref.set({ complimentaryUnlimited: false, compSource: null }, { merge: true });
});
