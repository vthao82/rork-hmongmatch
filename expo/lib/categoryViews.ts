import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Free members can open this many different profiles per day from the Interests tab. */
export const CATEGORY_FREE_DAILY_CAP = 10;
const KEY = "hmongdate.category.viewed.v2";

function todayCentral(): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

type State = { date: string; ids: string[] };
let state: State = { date: todayCentral(), ids: [] };
let loaded = false;
const listeners = new Set<(s: State) => void>();

function current(): State {
  if (state.date !== todayCentral()) state = { date: todayCentral(), ids: [] };
  return state;
}

function save(next: State) {
  state = next;
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  listeners.forEach((fn) => fn(next));
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as State) : null;
    if (parsed && parsed.date === todayCentral() && Array.isArray(parsed.ids)) save(parsed);
  } catch (_e) { /* non-fatal */ }
}

/**
 * Use one free Interests view for `profileId`. Profiles already opened today are free.
 * Returns false (and uses nothing) when the free member is out of views.
 */
export function spendCategoryView(profileId: string, isPaid: boolean): boolean {
  if (isPaid) return true;
  const s = current();
  if (s.ids.includes(profileId)) return true;
  if (s.ids.length >= CATEGORY_FREE_DAILY_CAP) return false;
  save({ date: s.date, ids: [...s.ids, profileId] });
  return true;
}

/** Live count of free Interests views left today. */
export function useCategoryViewsLeft(isPaid: boolean): number {
  const [s, setS] = useState<State>(current());
  useEffect(() => {
    load();
    listeners.add(setS);
    setS(current());
    return () => { listeners.delete(setS); };
  }, []);
  if (isPaid) return Infinity;
  const ids = s.date === todayCentral() ? s.ids : [];
  return Math.max(0, CATEGORY_FREE_DAILY_CAP - ids.length);
}
