/**
 * Cloud Function: send a push notification when a new chat message arrives.
 *
 * DEPLOYMENT (one-time):
 *   1. cd /app/rork-hmongmatch && firebase init functions  (choose existing project hmong-date, TypeScript)
 *   2. Replace the generated functions/src/index.ts with the body below
 *   3. cd functions && npm install firebase-admin firebase-functions expo-server-sdk
 *   4. firebase deploy --only functions
 *
 * After this fires, the receiver's phone gets a real OS-level push even when
 * the app is closed (assuming expo-notifications is installed in the app and
 * users have granted permission — see /app/rork-hmongmatch/expo/lib/notifications.ts).
 *
 * Resources:
 *   - Expo push API: https://docs.expo.dev/push-notifications/sending-notifications/
 *   - Firebase Functions v2: https://firebase.google.com/docs/functions
 */

// ============================================================
// PASTE INTO functions/src/index.ts AFTER `firebase init functions`
// ============================================================
/*
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

initializeApp();
const db = getFirestore();
const expo = new Expo();

export const onNewMessage = onDocumentCreated(
  "matches/{matchId}/messages/{messageId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const senderId = data.senderId as string;
    const text = (data.text ?? "") as string;

    const matchSnap = await db.collection("matches").doc(event.params.matchId).get();
    const userIds = (matchSnap.data()?.userIds ?? []) as string[];
    const recipientUid = userIds.find((u) => u !== senderId);
    if (!recipientUid) return;

    const recipientDoc = await db.collection("users").doc(recipientUid).get();
    const pushToken = recipientDoc.data()?.pushToken as string | undefined;
    if (!pushToken || !Expo.isExpoPushToken(pushToken)) return;

    const senderDoc = await db.collection("users").doc(senderId).get();
    const senderName = (senderDoc.data()?.name as string) ?? "Someone";

    const messages: ExpoPushMessage[] = [{
      to: pushToken,
      sound: "default",
      title: senderName,
      body: text.slice(0, 100),
      data: { type: "message", matchId: event.params.matchId, senderId },
    }];

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (e) {
        console.error("[onNewMessage] push send error", e);
      }
    }
  }
);

// Companion: send a push when a new match is created
export const onNewMatch = onDocumentCreated("matches/{matchId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;
  const userIds = (data.userIds ?? []) as string[];
  if (userIds.length !== 2) return;

  const userDocs = await Promise.all(userIds.map((u) => db.collection("users").doc(u).get()));
  for (let i = 0; i < userIds.length; i++) {
    const recipient = userDocs[i].data();
    const other = userDocs[1 - i].data();
    const token = recipient?.pushToken as string | undefined;
    if (!token || !Expo.isExpoPushToken(token)) continue;
    try {
      await expo.sendPushNotificationsAsync([{
        to: token,
        sound: "default",
        title: "It's a match!",
        body: `You and ${other?.name ?? "someone"} liked each other`,
        data: { type: "match", matchId: event.params.matchId },
      }]);
    } catch (e) {
      console.error("[onNewMatch] push send error", e);
    }
  }
});
*/
