import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";

/** Free members can open this many different profiles per day from the Interests tab. */
export const CATEGORY_FREE_DAILY_CAP = 10;
const KEY = "hmongdate.category.views.v3";

function todayCentral(): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Time until free views reset (midnight US Central), e.g. "5h 12m". */
export function resetsInLabel(): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const left = 24 * 3600 - (get("hour") * 3600 + get("minute") * 60 + get("second"));
  const h = Math.floor(left / 3600);
  const m = Math.max(1, Math.ceil((left % 3600) / 60));
  return h > 0 ? `${h}h ${m === 60 ? 59 : m}m` : `${m}m`;
}

/** Re-renders every 30s so countdowns stay current. */
export function useResetsIn(): string {
  const [label, setLabel] = useState<string>(resetsInLabel());
  useEffect(() => {
    const t = setInterval(() => setLabel(resetsInLabel()), 30000);
    return () => clearInterval(t);
  }, []);
  return label;
}

type State = { uid: string; date: string; count: number };
const who = () => auth.currentUser?.uid ?? "signed-out";
let state: State = { uid: who(), date: todayCentral(), count: 0 };
let loadedFor = "";
const listeners = new Set<(s: State) => void>();

function current(): State {
  const uid = who();
  if (state.uid !== uid || state.date !== todayCentral()) state = { uid, date: todayCentral(), count: 0 };
  if (loadedFor !== uid) void load(uid);
  return state;
}

function save(next: State) {
  state = next;
  AsyncStorage.setItem(`${KEY}:${next.uid}`, JSON.stringify({ date: next.date, count: next.count })).catch(() => {});
  listeners.forEach((fn) => fn(next));
}

async function load(uid: string) {
  loadedFor = uid;
  try {
    const raw = await AsyncStorage.getItem(`${KEY}:${uid}`);
    const parsed = raw ? (JSON.parse(raw) as { date?: string; count?: number }) : null;
    const s = current();
    // Never lose views spent while storage was still loading
    if (parsed && s.uid === uid && parsed.date === s.date && typeof parsed.count === "number" && parsed.count > s.count) {
      save({ ...s, count: parsed.count });
    }
  } catch (_e) { /* non-fatal */ }
}

/** Use one free Interests view (every profile opened counts). Returns false when the free member is out of views. */
export function spendCategoryView(_profileId: string, isPaid: boolean): boolean {
  if (isPaid) return true;
  const s = current();
  if (s.count >= CATEGORY_FREE_DAILY_CAP) return false;
  save({ ...s, count: s.count + 1 });
  return true;
}

/** Live count of free Interests views left today. */
export function useCategoryViewsLeft(isPaid: boolean): number {
  const { user } = useAuth();
  const [s, setS] = useState<State>(current());
  useEffect(() => {
    listeners.add(setS);
    setS(current());
    return () => { listeners.delete(setS); };
  }, [user?.uid]);
  if (isPaid) return Infinity;
  const live = s.uid === who() && s.date === todayCentral() ? s.count : 0;
  return Math.max(0, CATEGORY_FREE_DAILY_CAP - live);
}
