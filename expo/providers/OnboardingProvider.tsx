import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useRef } from "react";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { syncProfile } from "@/lib/profileSync";
import { useAuth } from "@/providers/AuthProvider";

export type GenderId = "man" | "woman" | "beyond";
export type SeekingId = "men" | "women" | "beyond" | "everyone";
export type LookingForId = "long" | "long-open" | "short-open" | "short" | "friends" | "unsure";
export type DialectId = "green" | "white" | "other";
export type WorkId = "wfh" | "full-time" | "part-time" | "school" | "government" | "labor" | "other";

export type Lifestyle = {
  drink?: string;
  smoke?: string;
  workout?: string;
  pets?: string[];
};

export type Extras = {
  communication?: string;
  love?: string;
  zodiac?: string;
};

export type OnboardingData = {
  method?: "google" | "phone" | "email";
  email?: string;
  phone?: string;
  phoneE164?: string;
  name?: string;
  lastName?: string;
  birthday?: string;
  genders: GenderId[];
  genderDetail?: string;
  showGender?: boolean;
  orientations: string[];
  showOrientation?: boolean;
  seeking: SeekingId[];
  lookingFor?: LookingForId;
  distance?: number;
  distanceWorldwide?: boolean;
  distanceUSOnly?: boolean;
  searchByDistance?: boolean;
  clan?: string;
  dialect?: DialectId;
  dialectOther?: string;
  hometownCountry?: string;
  hometownState?: string;
  hometownCity?: string;
  work?: WorkId;
  workOther?: string;
  religion?: string;
  religionOther?: string;
  mainPhotoIndex?: number;
  photoVerified?: boolean;
  likedIds?: string[];
  education?: string;
  interests: string[];
  lifestyle: Lifestyle;
  extras: Extras;
  photos: string[];
  bio?: string;
  prompt?: { q: string; a: string };
  locationGranted?: boolean;
  /** Last enrollment screen reached — used to resume an unfinished sign-up. */
  resumeStep?: string;
  /** Show "Active now" / "Active 2h ago" to others (default on). */
  showActiveStatus?: boolean;
  /** Send and see "Seen" read receipts in chat (default on). */
  showReadReceipts?: boolean;
};

const LEGACY_KEY = "hmongmatch.onboarding.v1";
const LEGACY_DONE = "hmongmatch.onboarded.v1";
const dataKey = (uid: string) => `hmongmatch.onboarding.v2:${uid}`;
const doneKey = (uid: string) => `hmongmatch.onboarded.v2:${uid}`;

const defaults: OnboardingData = {
  interests: [],
  photos: [],
  genders: [],
  orientations: [],
  seeking: [],
  showGender: true,
  showOrientation: true,
  distance: 50,
  distanceWorldwide: false,
  distanceUSOnly: false,
  searchByDistance: true,
  likedIds: [],
  lifestyle: {},
  extras: {},
};

/** Firestore rejects `undefined`; JSON round-trip strips it. */
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Turn a saved Firestore profile back into local onboarding data (drops Timestamps + server-only fields). */
function fromProfileRow(row: Record<string, unknown>): Partial<OnboardingData> {
  const out: Record<string, unknown> = {};
  Object.entries(row).forEach(([k, v]) => {
    if (["id", "fullName", "verificationSelfie", "onboardingComplete"].includes(k)) return;
    if (v && typeof v === "object" && typeof (v as { toDate?: unknown }).toDate === "function") return;
    if (v === null) return;
    out[k] = v;
  });
  return out as Partial<OnboardingData>;
}

function isProfileComplete(row: Record<string, unknown> | undefined): boolean {
  if (!row) return false;
  if (row.onboardingComplete === true) return true;
  const photos = Array.isArray(row.photos) ? row.photos : [];
  return !!row.name && photos.length > 0;
}

async function readJson(key: string): Promise<Partial<OnboardingData> | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw || raw === "null") return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;
  const [data, setData] = useState<OnboardingData>(defaults);
  const [completed, setCompleted] = useState<boolean>(false);
  // uid whose data is currently loaded ("" = signed-out state is ready)
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const uidRef = useRef<string | null>(null);
  const completedRef = useRef<boolean>(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  uidRef.current = uid;
  completedRef.current = completed;

  useEffect(() => {
    if (authLoading) return;
    if (!uid) {
      setData(defaults);
      setCompleted(false);
      setHydratedFor("");
      return;
    }
    let cancelled = false;
    setHydratedFor(null);
    (async () => {
      let local = await readJson(dataKey(uid)).catch(() => null);
      let localDone = (await AsyncStorage.getItem(doneKey(uid)).catch(() => null)) === "1";
      // One-time migration from the old device-wide keys
      const legacy = await readJson(LEGACY_KEY).catch(() => null);
      if (legacy || (await AsyncStorage.getItem(LEGACY_DONE).catch(() => null))) {
        if (!local && legacy) local = legacy;
        await AsyncStorage.multiRemove([LEGACY_KEY, LEGACY_DONE]).catch(() => {});
      }

      let profile: Record<string, unknown> | undefined;
      let draft: Partial<OnboardingData> | undefined;
      try {
        const [p, d] = await Promise.all([
          getDoc(doc(db, "users", uid)),
          getDoc(doc(db, "users", uid, "private", "onboarding")),
        ]);
        profile = p.exists() ? p.data() : undefined;
        draft = d.exists() ? (d.data().data as Partial<OnboardingData>) : undefined;
      } catch (e) {
        console.log("[onboarding] remote hydrate error (using local)", e);
      }
      if (cancelled) return;

      const done = isProfileComplete(profile) || localDone;
      const next: OnboardingData = done
        ? { ...defaults, ...(local ?? {}), ...(profile ? fromProfileRow(profile) : {}) }
        : { ...defaults, ...(draft ?? {}), ...(local ?? {}) };
      setData(next);
      setCompleted(done);
      setHydratedFor(uid);
      AsyncStorage.setItem(dataKey(uid), JSON.stringify(next)).catch(() => {});
      if (done) AsyncStorage.setItem(doneKey(uid), "1").catch(() => {});
    })();
    return () => { cancelled = true; };
  }, [uid, authLoading]);

  const update = useCallback((patch: Partial<OnboardingData>) => {
    setData(prev => {
      const next = { ...prev, ...patch };
      const id = uidRef.current;
      if (id) {
        AsyncStorage.setItem(dataKey(id), JSON.stringify(next)).catch(() => {});
        if (completedRef.current) {
          // Existing members: keep their public profile in sync (debounced)
          if (syncTimer.current) clearTimeout(syncTimer.current);
          syncTimer.current = setTimeout(() => {
            syncProfile(id, next).then((r) => { if (!r.ok) console.log("[onboarding] profile sync failed", r.error); });
          }, 800);
        } else {
          // Sign-up in progress: save a draft so it can be resumed on any device
          setDoc(doc(db, "users", id, "private", "onboarding"), { data: clean(next), updatedAt: serverTimestamp() })
            .catch((e) => console.log("[onboarding] draft save error", e));
        }
      }
      return next;
    });
  }, []);

  const finish = useCallback(async () => {
    const id = uidRef.current;
    setCompleted(true);
    if (!id) {
      console.log("[onboarding] no authenticated user, skipping profile sync");
      return;
    }
    await AsyncStorage.setItem(doneKey(id), "1");
    try {
      const res = await syncProfile(id, data);
      if (!res.ok) console.log("[onboarding] profile sync failed", res.error);
      else await deleteDoc(doc(db, "users", id, "private", "onboarding")).catch(() => {});
    } catch (e) {
      console.log("[onboarding] finish sync error", e);
    }
  }, [data]);

  /** Wipe this device's saved data for the signed-in user (used after account deletion). */
  const reset = useCallback(async (id: string | null = uidRef.current) => {
    if (id) await AsyncStorage.multiRemove([dataKey(id), doneKey(id)]);
    setData(defaults);
    setCompleted(false);
  }, []);

  const hydrated = !authLoading && hydratedFor === (uid ?? "");
  return { data, update, finish, reset, hydrated, completed };
});
