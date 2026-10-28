/**
 * Native push notifications (expo-notifications).
 * Token + preferences live in users/{uid}/private/push; Cloud Functions in /functions send the pushes.
 * Native module is loaded lazily so an older APK without it doesn't crash.
 */
import { useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

type NotificationsModule = typeof import("expo-notifications");
let N: NotificationsModule | null = null;
let isDevice = true;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  N = require("expo-notifications") as NotificationsModule;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  isDevice = (require("expo-device") as typeof import("expo-device")).isDevice;
} catch {
  N = null;
}

export type PushPrefs = { push: boolean; matches: boolean; messages: boolean; likes: boolean; promos: boolean };
export const DEFAULT_PUSH_PREFS: PushPrefs = { push: true, matches: true, messages: true, likes: true, promos: false };

/** Chat currently on screen — its message alerts are skipped while the app is open. */
let activeChatUid: string | null = null;
export function setActiveChat(uid: string | null) { activeChatUid = uid; }

if (N) {
  N.setNotificationHandler({
    handleNotification: async (n) => {
      const data = (n.request.content.data ?? {}) as { type?: string; otherUid?: string };
      const hide = data.type === "message" && !!data.otherUid && data.otherUid === activeChatUid;
      return { shouldShowBanner: !hide, shouldShowList: !hide, shouldPlaySound: !hide, shouldSetBadge: false };
    },
  });
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!N || !isDevice || Platform.OS === "web") return null;
  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync("default", {
      name: "Messages & matches",
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: "#C0152F",
    });
  }
  const existing = await N.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") status = (await N.requestPermissionsAsync()).status;
  if (status !== "granted") return null;
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  const token = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data;
}

/** Ask permission (first time), then save this device's push token for the signed-in member. */
export async function syncPushToken(): Promise<void> {
  const me = auth.currentUser;
  if (!me) return;
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) return;
    await setDoc(doc(db, "users", me.uid, "private", "push"), { token, platform: Platform.OS, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.log("[syncPushToken] error", e);
  }
}

export async function loadPushPrefs(): Promise<PushPrefs> {
  const me = auth.currentUser;
  if (!me) return DEFAULT_PUSH_PREFS;
  try {
    const s = await getDoc(doc(db, "users", me.uid, "private", "push"));
    return { ...DEFAULT_PUSH_PREFS, ...((s.data()?.prefs as Partial<PushPrefs>) ?? {}) };
  } catch {
    return DEFAULT_PUSH_PREFS;
  }
}

export async function savePushPrefs(prefs: PushPrefs): Promise<void> {
  const me = auth.currentUser;
  if (!me) return;
  await setDoc(doc(db, "users", me.uid, "private", "push"), { prefs, updatedAt: serverTimestamp() }, { merge: true }).catch((e) => console.log("[push prefs]", e));
}

/** Opens the right screen when a push is tapped (including cold start). */
export function usePushRouting() {
  const router = useRouter();
  useEffect(() => {
    if (!N) return;
    const go = (data: { type?: string; otherUid?: string } | undefined) => {
      if (!data?.type) return;
      if (data.type === "message" && data.otherUid) router.push(`/chat/${data.otherUid}`);
      else if (data.type === "match" && data.otherUid) router.push(`/chat/${data.otherUid}`);
      else if (data.type === "like") router.push("/(tabs)/matches" as never);
    };
    N.getLastNotificationResponseAsync().then((r) => go(r?.notification.request.content.data as never)).catch(() => {});
    const sub = N.addNotificationResponseReceivedListener((r) => go(r.notification.request.content.data as never));
    return () => sub.remove();
  }, [router]);
}
