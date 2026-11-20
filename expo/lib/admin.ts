import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { collection, getDocs, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, functions } from "@/lib/firebase";

export type AdminUser = {
  uid: string; email: string | null; name: string | null; photo: string | null; provider: string;
  createdAt: number; lastSignIn: number | null; lastActive: number | null; disabled: boolean; onboarded: boolean;
  unlimited: boolean; isAdmin: boolean; state: string | null; referralCount: number;
};
export type ErrorLog = { id: string; uid: string | null; message: string; stack: string; platform: string; screen: string; version: string; fatal: boolean; createdAt: number };

const ms = (t: unknown): number | null => (t as { toMillis?: () => number })?.toMillis?.() ?? null;

// Reads members straight from the database; the sign-in tool only adds extra detail when reachable.
export async function listUsers(): Promise<{ users: AdminUser[]; full: boolean }> {
  const fromDb: AdminUser[] = (await getDocs(collection(db, "users"))).docs.map((s) => {
    const d = s.data();
    return {
      uid: s.id, email: d.email ?? null, name: d.fullName ?? d.name ?? null, photo: Array.isArray(d.photos) ? d.photos[0] ?? null : null,
      provider: "", createdAt: ms(d.createdAt) ?? ms(d.updatedAt) ?? 0, lastSignIn: null, lastActive: ms(d.lastActiveAt),
      disabled: d.blockedByAdmin === true, onboarded: d.onboardingComplete === true,
      unlimited: d.complimentaryUnlimited === true || d.complimentary === true || d.tier === "unlimited", isAdmin: d.isAdmin === true,
      state: d.hometownState ?? null, referralCount: d.referralCount ?? 0,
    };
  });
  try {
    const r = await httpsCallable<unknown, { users: AdminUser[] }>(functions, "adminListUsers", { timeout: 60000 })({});
    const dbById = new Map(fromDb.map((u) => [u.uid, u]));
    return { users: r.data.users.map((u) => ({ ...dbById.get(u.uid), ...u, name: u.name ?? dbById.get(u.uid)?.name ?? null })), full: true };
  } catch (e) {
    console.warn("[admin] adminListUsers unavailable, using database list", e);
    return { users: fromDb, full: false };
  }
}
export const setBlocked = (uid: string, blocked: boolean) => httpsCallable(functions, "adminSetBlocked")({ uid, blocked });

export function useCompEmails(): string[] {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => onSnapshot(collection(db, "compEmails"), (s) => setList(s.docs.map((d) => d.id).sort()), () => {}), []);
  return list;
}
export const addCompEmail = (email: string) => setDoc(doc(db, "compEmails", email.trim().toLowerCase()), { addedBy: auth.currentUser?.uid ?? null, createdAt: serverTimestamp() });
export const removeCompEmail = (email: string) => deleteDoc(doc(db, "compEmails", email));

export function useErrorLogs(): ErrorLog[] {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  useEffect(() => onSnapshot(query(collection(db, "errorLogs"), orderBy("createdAt", "desc"), limit(100)), (s) => setLogs(s.docs.map((d) => {
    const x = d.data();
    return { id: d.id, uid: x.uid ?? null, message: x.message ?? "", stack: x.stack ?? "", platform: x.platform ?? "", screen: x.screen ?? "", version: x.version ?? "", fatal: x.fatal === true, createdAt: x.createdAt?.toMillis?.() ?? 0 };
  })), () => {}), []);
  return logs;
}
export const deleteErrorLog = (id: string) => deleteDoc(doc(db, "errorLogs", id));

const HINTS: { test: RegExp; meaning: string; fix: string }[] = [
  { test: /permission|insufficient/i, meaning: "The app tried to read or save data the security rules don't allow for that member.", fix: "Usually harmless after sign-out. If it repeats for signed-in members, send me the screen name so I can adjust the rules." },
  { test: /network|fetch|offline|timeout|unavailable/i, meaning: "The member's phone lost internet or Firebase was briefly unreachable.", fix: "Nothing to fix unless many members see it at once; the app retries on its own." },
  { test: /undefined is not an object|cannot read propert|null is not an object|is not a function/i, meaning: "A screen expected some information that was missing (often an old or incomplete profile).", fix: "Send me the message and screen; I'll add a safe default so that screen can't break." },
  { test: /storage|upload/i, meaning: "A photo upload failed.", fix: "Often a weak connection or a very large photo. Ask the member to try again on Wi-Fi." },
  { test: /auth|credential|sign.?in|token/i, meaning: "A sign-in problem (expired session or a cancelled Google/Apple sign-in).", fix: "Ask the member to sign out and back in. Repeated cases may mean a login setting needs checking." },
  { test: /purchase|revenuecat|billing/i, meaning: "Something went wrong with a subscription purchase.", fix: "Check RevenueCat for that member; they can tap Restore purchases on the Unlimited screen." },
];
export function explainError(message: string): { meaning: string; fix: string } {
  return HINTS.find((h) => h.test.test(message)) ?? { meaning: "An unexpected app error.", fix: "If it shows up more than a few times, send me the message and screen so I can fix it." };
}

export function ago(ms: number | null): string {
  if (!ms) return "never";
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}
export const fmt = (ms: number) => new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
