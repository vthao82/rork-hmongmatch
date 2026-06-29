/**
 * Native push notifications scaffold.
 *
 * STATUS: JS-side code is ready. The native module (`expo-notifications`)
 * is NOT yet in package.json — adding it requires an EAS dev-build rebuild.
 * Until then this file gracefully no-ops and the InAppNotificationBanner
 * (foreground-only) is the user-facing notification surface.
 *
 * ============================================================
 * TO ENABLE NATIVE PUSH (do this when you're ready for a 20-min rebuild):
 * ============================================================
 * 1. Install the deps:
 *      bunx expo install expo-notifications expo-device
 * 2. Add to app.json under "plugins":
 *      ["expo-notifications", {
 *        "icon": "./assets/images/notification-icon.png",
 *        "color": "#C0152F"
 *      }]
 * 3. Set up FCM credentials in Firebase Console:
 *      Project settings → Cloud Messaging → enable "Cloud Messaging API (Legacy)"
 *      OR set up FCM v1 + Service Account.
 *      Upload the google-services.json to /app/rork-hmongmatch/expo/.
 * 4. Rebuild & re-install the EAS dev build:
 *      eas build --profile development --platform android
 *      eas build:run -p android
 * 5. Uncomment the body of registerForPushNotificationsAsync() and
 *    schedulePushNotification() below.
 * 6. Deploy the Cloud Function in /app/rork-hmongmatch/functions/onNewMessage.ts
 *    (template provided) so server-side pushes fire on new chat messages.
 *
 * Without those steps, calling these functions does nothing. The app continues
 * to use the InAppNotificationBanner for in-app notifications.
 */
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Native module not yet wired — see steps above to enable.
  // Once enabled, this becomes:
  //
  //   import * as Notifications from "expo-notifications";
  //   import * as Device from "expo-device";
  //
  //   if (!Device.isDevice) return null;
  //   const { status: existingStatus } = await Notifications.getPermissionsAsync();
  //   let finalStatus = existingStatus;
  //   if (existingStatus !== "granted") {
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     finalStatus = status;
  //   }
  //   if (finalStatus !== "granted") return null;
  //   const token = (await Notifications.getExpoPushTokenAsync({
  //     projectId: "<your-expo-project-id>",
  //   })).data;
  //   return token;
  return null;
}

/**
 * Save the user's push token to Firestore so the Cloud Function can target it.
 * No-op until registerForPushNotificationsAsync() returns a real token.
 */
export async function syncPushToken(): Promise<void> {
  const me = auth.currentUser;
  if (!me) return;
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) return;
    await setDoc(
      doc(db, "users", me.uid),
      { pushToken: token, pushTokenUpdatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.log("[syncPushToken] error", e);
  }
}

/**
 * Schedule a local notification (fires even if app is backgrounded).
 * No-op until expo-notifications is installed.
 */
export async function scheduleLocalNotification(_title: string, _body: string): Promise<void> {
  // Once enabled:
  //   import * as Notifications from "expo-notifications";
  //   await Notifications.scheduleNotificationAsync({
  //     content: { title: _title, body: _body, sound: "default" },
  //     trigger: null, // immediate
  //   });
  return;
}
