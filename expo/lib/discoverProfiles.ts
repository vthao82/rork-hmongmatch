import { useEffect, useState, useCallback, useMemo } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { Profile } from "@/mocks/profiles";
import { useBlocks } from "@/providers/BlockProvider";
import { tsToMillis, isActiveNow, activeLabel } from "@/lib/presence";

const QUEUE_LIMIT = 500;

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
  const lastActiveAt = tsToMillis(row.lastActiveAt);
  const showActiveStatus = row.showActiveStatus !== false;
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
    languages: row.dialect === "other" ? (row.dialectOther ? [row.dialectOther as string] : []) : row.dialect ? [row.dialect as string] : [],
    lookingFor: (row.lookingFor as string) ?? "",
    isOnline: isActiveNow(lastActiveAt, showActiveStatus),
    lastActive: activeLabel(lastActiveAt, showActiveStatus),
    lastActiveAt,
    showActiveStatus,
    createdAtMs: tsToMillis(row.createdAt),
    verified: !!row.photoVerified,
    hometownCity: (row.hometownCity as string) ?? null,
    hometownState: (row.hometownState as string) ?? null,
    genders: Array.isArray(row.genders) ? (row.genders as string[]) : [],
    seeking: Array.isArray(row.seeking) ? (row.seeking as string[]) : [],
  };
}

const SEEK_TO_GENDER: Record<string, string> = { men: "man", women: "woman", beyond: "beyond" };

/** True if someone with `theirGenders` fits the viewer's `mySeeking` choice. Empty/"everyone" = show all. */
export function fitsSeeking(mySeeking: string[] | undefined, theirGenders: string[] | undefined): boolean {
  const seek = (mySeeking ?? []).map((x) => x.toLowerCase());
  if (seek.length === 0 || seek.includes("everyone")) return true;
  const genders = (theirGenders ?? []).map((x) => x.toLowerCase());
  return seek.some((s) => genders.includes(SEEK_TO_GENDER[s] ?? s));
}

function norm(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}

/**
 * Sort by location proximity (state/city match against the current user).
 * 1) Same city + same state → highest priority
 * 2) Same state → next
 * 3) Everyone else → last (stable within group)
 */
function sortByLocation(list: Profile[], myCity: string | null, myState: string | null): Profile[] {
  const me = { city: norm(myCity), state: norm(myState) };
  if (!me.city && !me.state) return list;
  const score = (p: Profile): number => {
    const pc = norm(p.hometownCity ?? null);
    const ps = norm(p.hometownState ?? null);
    if (me.city && me.state && pc === me.city && ps === me.state) return 3;
    if (me.state && ps === me.state) return 2;
    return 1;
  };
  return [...list].sort((a, b) => score(b) - score(a));
}

/**
 * Hook: fetches discoverable profiles for the current user from Firestore.
 * Excludes self and anyone the current user has already swiped on.
 */
export function useDiscoverProfiles() {
  const { hidden } = useBlocks();
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

      // Fetch users (any signed-in user can read) and the current user's prior swipes.
      // Run them separately so a failure on one (e.g. missing swipes rule) doesn't
      // block the other.
      let usersSnap;
      try {
        usersSnap = await getDocs(query(collection(db, "users"), limit(QUEUE_LIMIT)));
      } catch (e: any) {
        console.log("[discover] users query failed", e);
        throw e;
      }

      let swipeIds = new Set<string>();
      try {
        const swipesSnap = await getDocs(collection(db, "users", me.uid, "swipes"));
        swipesSnap.forEach((d) => swipeIds.add(d.id));
      } catch (e) {
        // Non-fatal — show all profiles if we can't read swipes
        console.log("[discover] swipes query failed (continuing)", e);
      }

      // Load my own profile so we can sort others by location proximity
      let myCity: string | null = null;
      let myState: string | null = null;
      let mySeeking: string[] = [];
      try {
        const meSnap = await getDoc(doc(db, "users", me.uid));
        if (meSnap.exists()) {
          const r = meSnap.data();
          myCity = (r.hometownCity as string) ?? null;
          myState = (r.hometownState as string) ?? null;
          mySeeking = Array.isArray(r.seeking) ? (r.seeking as string[]) : [];
        }
      } catch (e) {
        console.log("[discover] my profile fetch failed (continuing)", e);
      }

      const seen = swipeIds;
      seen.add(me.uid); // never show yourself

      const list: Profile[] = [];
      usersSnap.forEach((d) => {
        if (seen.has(d.id)) return;
        // Hide dev-only seed profiles from real users (their uids start with
        // "seed-"). Firebase Auth uids never start with "seed-", so real users
        // are unaffected. Delete these docs from Firestore before launch if
        // you want a fully clean database — see docs/DELETE_SEEDS.md.
        if (d.id.startsWith("seed-")) return;
        const row = d.data();
        // Require at least one photo so swipe cards look right
        const hasPhotos = Array.isArray(row.photos) && row.photos.length > 0;
        if (!hasPhotos) return;
        if (!fitsSeeking(mySeeking, row.genders as string[])) return;
        list.push(rowToProfile(d.id, row));
      });

      const sorted = sortByLocation(list, myCity, myState);
      setProfiles(sorted);
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

  const visible = useMemo(() => profiles.filter((p) => !hidden.has(p.id)), [profiles, hidden]);
  return { profiles: visible, loading, error, reload: load };
}

/**
 * Hook: fetches ALL profiles from Firestore (including the current user).
 * Used by Likes/Chat tabs to look up names + photos by user id.
 */
export function useAllProfiles() {
  const { hidden } = useBlocks();
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

  // Blocked people (either direction) disappear from every lookup in the app
  const visible = useMemo(() => {
    if (hidden.size === 0) return byId;
    const out: Record<string, Profile> = {};
    Object.entries(byId).forEach(([k, v]) => { if (!hidden.has(k)) out[k] = v; });
    return out;
  }, [byId, hidden]);
  return { byId: visible, loading, reload: load };
}

/**
 * Hook: subscribe to matches involving the current user.
 * Each match doc lives at /matches/{sortedUid1_sortedUid2} with userIds: string[].
 */
export type MatchInfo = { matchId: string; otherId: string; createdAt: number | null; celebratedBy: string[]; unmatchedBy: string[] };

export function useMyMatches() {
  const { hidden } = useBlocks();
  const [all, setAll] = useState<MatchInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setAll([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, "matches"), where("userIds", "array-contains", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: MatchInfo[] = [];
        snap.forEach((d) => {
          const r = d.data();
          const otherId = (r.userIds as string[]).find((x) => x !== uid);
          if (otherId) {
            list.push({
              matchId: d.id,
              otherId,
              createdAt: tsToMillis(r.createdAt),
              celebratedBy: Array.isArray(r.celebratedBy) ? (r.celebratedBy as string[]) : [],
              unmatchedBy: Array.isArray(r.unmatchedBy) ? (r.unmatchedBy as string[]) : [],
            });
          }
        });
        setAll(list);
        setLoading(false);
      },
      (e) => {
        console.log("[useMyMatches] error", e);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid]);

  const matches = useMemo(() => all.filter((m) => !hidden.has(m.otherId) && m.unmatchedBy.length === 0), [all, hidden]);
  // People I unmatched (Settings → Unmatched people lets me undo)
  const unmatchedByMe = useMemo(() => all.filter((m) => !!uid && m.unmatchedBy.includes(uid) && !hidden.has(m.otherId)), [all, hidden, uid]);
  const matchIds = useMemo(() => matches.map((m) => m.otherId), [matches]);
  return { matchIds, matches, unmatchedByMe, loading };
}

/** Hook: live list of user ids who liked the current user and haven't been swiped on yet. */
export function useLikedMe() {
  const [likerIds, setLikerIds] = useState<string[]>([]);
  const [mySwiped, setMySwiped] = useState<Set<string>>(new Set());
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsubLikes = onSnapshot(
      collection(db, "users", uid, "likesReceived"),
      (snap) => setLikerIds(snap.docs.map((d) => d.id)),
      (e) => console.log("[useLikedMe] error", e)
    );
    const unsubMine = onSnapshot(
      collection(db, "users", uid, "swipes"),
      (snap) => setMySwiped(new Set(snap.docs.map((d) => d.id))),
      (e) => console.log("[useLikedMe] my swipes error", e)
    );
    return () => {
      unsubLikes();
      unsubMine();
    };
  }, [uid]);

  return { likerIds: likerIds.filter((id) => !mySwiped.has(id)) };
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
      likerId: me.uid,
      targetId: targetUserId,
      createdAt: serverTimestamp(),
    });

    // Mirror likes into the target's inbox so their "Likes You" list is live
    const inboxRef = doc(db, "users", targetUserId, "likesReceived", me.uid);
    if (liked) await setDoc(inboxRef, { likerId: me.uid, createdAt: serverTimestamp() });
    else await deleteDoc(inboxRef).catch(() => {});

    if (!liked) return { ok: true, isMatch: false };

    // If liked, check if the target user has already liked me back
    const theirSwipeRef = doc(db, "users", targetUserId, "swipes", me.uid);
    const theirSnap = await getDoc(theirSwipeRef);
    if (theirSnap.exists() && theirSnap.data()?.liked === true) {
      // It's a match — create a deterministic matchId so we don't double-create
      const ids = [me.uid, targetUserId].sort();
      const matchId = `${ids[0]}_${ids[1]}`;
      const matchRef = doc(db, "matches", matchId);
      const existing = await getDoc(matchRef);
      const ex = existing.exists() ? existing.data() : null;
      const unmatchedBy: string[] = Array.isArray(ex?.unmatchedBy) ? ex!.unmatchedBy : [];
      if (!ex || !ex.createdAt) {
        await setDoc(matchRef, { userIds: ids, createdAt: serverTimestamp(), unmatchedBy: [], celebratedBy: [] }, { merge: true });
        return { ok: true, isMatch: true, matchId };
      }
      // Liking again only undoes MY unmatch; if they unmatched me it stays hidden
      if (unmatchedBy.includes(me.uid)) await updateDoc(matchRef, { unmatchedBy: arrayRemove(me.uid) });
      const stillUnmatched = unmatchedBy.some((u) => u !== me.uid);
      return { ok: true, isMatch: !stillUnmatched, matchId };
    }

    return { ok: true, isMatch: false };
  } catch (e: any) {
    console.log("[discover] recordSwipe error", e);
    return { ok: false, error: e?.message ?? "Swipe failed" };
  }
}

/** Unmatch: hides the chat for both people (messages are kept and return if they match again). */
export async function unmatchUser(otherUid: string): Promise<boolean> {
  const me = auth.currentUser;
  if (!me || !otherUid) return false;
  try {
    const ids = [me.uid, otherUid].sort();
    await updateDoc(doc(db, "matches", ids.join("_")), { unmatchedBy: arrayUnion(me.uid) });
    return true;
  } catch (e) {
    console.log("[unmatch] error", e);
    return false;
  }
}

/** Undo my unmatch — the chat returns unless the other person also unmatched. */
export async function rematchUser(otherUid: string): Promise<boolean> {
  const me = auth.currentUser;
  if (!me || !otherUid) return false;
  try {
    await updateDoc(doc(db, "matches", [me.uid, otherUid].sort().join("_")), { unmatchedBy: arrayRemove(me.uid) });
    return true;
  } catch (e) {
    console.log("[rematch] error", e);
    return false;
  }
}

/**
 * Delete a previously recorded swipe (used by Rewind on the paid tier).
 * This lets the disliked/liked user appear in Discover again later.
 * Best-effort; failures are logged and ignored.
 */
export async function deleteSwipe(targetUserId: string): Promise<void> {
  const me = auth.currentUser;
  if (!me || !targetUserId) return;
  try {
    await deleteDoc(doc(db, "users", me.uid, "swipes", targetUserId));
    await deleteDoc(doc(db, "users", targetUserId, "likesReceived", me.uid)).catch(() => {});
  } catch (e) {
    console.log("[discover] deleteSwipe error", e);
  }
}
