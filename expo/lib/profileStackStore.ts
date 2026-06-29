import { useEffect, useState } from "react";

/**
 * Tiny module-level store for handing a list of profile IDs to the
 * /profile-stack route without stuffing the URL with comma-separated UIDs.
 *
 * Caller:
 *   setProfileStack(["uid1", "uid2", ...], startIndex)
 *   router.push("/profile-stack")
 *
 * The store is intentionally non-persistent — refreshing the app clears it.
 */
type Stack = {
  ids: string[];
  startIndex: number;
  /** Optional title for the screen ("Likes You" / "Top Picks" / "Christian"). */
  title?: string;
};

let current: Stack | null = null;
const listeners = new Set<(s: Stack | null) => void>();

export function setProfileStack(ids: string[], startIndex: number = 0, title?: string): void {
  current = { ids, startIndex, title };
  listeners.forEach((fn) => fn(current));
}

export function getProfileStack(): Stack | null {
  return current;
}

export function clearProfileStack(): void {
  current = null;
  listeners.forEach((fn) => fn(null));
}

export function useProfileStack(): Stack | null {
  const [snap, setSnap] = useState<Stack | null>(current);
  useEffect(() => {
    const fn = (s: Stack | null) => setSnap(s);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return snap;
}
