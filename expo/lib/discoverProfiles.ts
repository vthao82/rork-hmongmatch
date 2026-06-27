import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { Profile } from "@/mocks/profiles";

const QUEUE_LIMIT = 50;

function calcAge(birthday: string | null | undefined): number {
  if (!birthday) return 0;
  // Accept MM/DD/YYYY or ISO
  const d = new Date(birthday);
  if (Number.isNaN(d.getTime())) {
    // Try MM/DD/YYYY
    const parts = birthday.split("/");
    if (parts.length === 3) {
      const m = Number(parts[0]) - 1;
      const day = Number(parts[1]);
      const y = Number(parts[2]);
      const d2 = new Date(y, m, day);
      if (!Number.isNaN(d2.getTime())) return ageFromDate(d2);
    }
    return 0;
  }
  return ageFromDate(d);
}

function ageFromDate(d: Date): number {
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function locationLabel(row: DocumentData): string {
  const city = row.hometownCity as string | null | undefined;
  const state = row.hometownState as string | null | undefined;
  const country = row.hometownCountry as string | null | undefined;
  return [city, state, country].filter(Boolean).join(", ") || "Nearby";
}

function rowToProfile(id: string, row: DocumentData): Profile {
  return {
    id,
    name: (row.name as string) ?? "Anonymous",
    age: calcAge(row.birthday as string),
    clan: (row.clan as string) ?? "—",
    location: locationLabel(row),
    distance: "Nearby",
    bio: (row.bio as string) ?? "",
    photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
    interests: Array.isArray(row.interests) ? (row.interests as string[]) : [],
    languages: row.dialect ? [row.dialect as string] : [],
    lookingFor: (row.lookingFor as string) ?? "",
    isOnline: false,
    lastActive: "",
    verified: !!row.photoVerified,
  };
}

/**
 * Hook: fetches discoverable profiles for the current user from Firestore.
 * Excludes self and anyone the current user has already swiped on.
 */
export function useDiscoverProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = auth.currentUser;
      if (!me) {
        setProfiles([]);
        return;
      }

      // Fetch users (up to QUEUE_LIMIT) and the current user's prior swipes in parallel
      const [usersSnap, swipesSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), limit(QUEUE_LIMIT))),
        getDocs(collection(db, "users", me.uid, "swipes")),
      ]);

      const seen = new Set<string>(swipesSnap.docs.map((d) => d.id));
      seen.add(me.uid); // never show yourself

      const list: Profile[] = [];
      usersSnap.forEach((d) => {
        if (seen.has(d.id)) return;
        const row = d.data();
        // Require at least one photo so swipe cards look right
        const hasPhotos = Array.isArray(row.photos) && row.photos.length > 0;
        if (!hasPhotos) return;
        list.push(rowToProfile(d.id, row));
      });

      setProfiles(list);
    } catch (e: any) {
      console.log("[discover] load error", e);
      setError(e?.message ?? "Failed to load profiles");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profiles, loading, error, reload: load };
}

/**
 * Hook: fetches ALL profiles from Firestore (including the current user).
 * Used by Likes/Chat tabs to look up names + photos by user id.
 */
export function useAllProfiles() {
  const [byId, setById] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const map: Record<string, Profile> = {};
      snap.forEach((d) => {
        map[d.id] = rowToProfile(d.id, d.data());
      });
      setById(map);
    } catch (e) {
      console.log("[useAllProfiles] error", e);
      setById({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { byId, loading, reload: load };
}

/**
 * Hook: subscribe to matches involving the current user.
 * Each match doc lives at /matches/{sortedUid1_sortedUid2} with userIds: string[].
 */
export function useMyMatches() {
  const [matchIds, setMatchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = auth.currentUser;
      if (!me) {
        setMatchIds([]);
        return;
      }
      const q = query(collection(db, "matches"), where("userIds", "array-contains", me.uid));
      const snap = await getDocs(q);
      const ids: string[] = [];
      snap.forEach((d) => {
        const ids2 = d.data().userIds as string[];
        const otherId = ids2.find((x) => x !== me.uid);
        if (otherId) ids.push(otherId);
      });
      setMatchIds(ids);
    } catch (e) {
      console.log("[useMyMatches] error", e);
      setMatchIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { matchIds, loading, reload: load };
}

/**
 * Record a swipe and (if mutual) create a match.
 * Returns { isMatch: true } when the other user already liked you.
 */
export async function recordSwipe(
  targetUserId: string,
  liked: boolean
): Promise<{ ok: boolean; isMatch?: boolean; matchId?: string; error?: string }> {
  const me = auth.currentUser;
  if (!me) return { ok: false, error: "Not signed in" };
  if (!targetUserId) return { ok: false, error: "Missing target" };

  try {
    // Save my swipe at users/{me}/swipes/{target}
    const mySwipeRef = doc(db, "users", me.uid, "swipes", targetUserId);
    await setDoc(mySwipeRef, {
      liked,
      createdAt: serverTimestamp(),
    });

    if (!liked) return { ok: true, isMatch: false };

    // If liked, check if the target user has already liked me back
    const theirSwipeRef = doc(db, "users", targetUserId, "swipes", me.uid);
    const theirSnap = await getDoc(theirSwipeRef);
    if (theirSnap.exists() && theirSnap.data()?.liked === true) {
      // It's a match — create a deterministic matchId so we don't double-create
      const ids = [me.uid, targetUserId].sort();
      const matchId = `${ids[0]}_${ids[1]}`;
      const matchRef = doc(db, "matches", matchId);
      await setDoc(
        matchRef,
        {
          userIds: ids,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      return { ok: true, isMatch: true, matchId };
    }

    return { ok: true, isMatch: false };
  } catch (e: any) {
    console.log("[discover] recordSwipe error", e);
    return { ok: false, error: e?.message ?? "Swipe failed" };
  }
}
