import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { OnboardingData } from "@/providers/OnboardingProvider";

/**
 * Shape of a saved user profile in Firestore at `users/{userId}`.
 * Field names are camelCase to match Firestore convention and our app code.
 */
export type ProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  birthday: string | null;
  bio: string | null;
  genders: string[];
  genderDetail: string | null;
  showGender: boolean;
  orientations: string[];
  showOrientation: boolean;
  seeking: string[];
  lookingFor: string | null;
  clan: string | null;
  dialect: string | null;
  dialectOther: string | null;
  hometownCountry: string | null;
  hometownState: string | null;
  hometownCity: string | null;
  work: string | null;
  workOther: string | null;
  religion: string | null;
  religionOther: string | null;
  education: string | null;
  interests: string[];
  photos: string[];
  mainPhotoIndex: number;
  photoVerified: boolean;
  distance: number | null;
  distanceWorldwide: boolean;
  distanceUSOnly: boolean;
  lifestyle: Record<string, unknown>;
  extras: Record<string, unknown>;
  prompt: { q: string; a: string } | null;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
};

function toProfileRow(userId: string, d: OnboardingData): Omit<ProfileRow, "updatedAt" | "createdAt"> {
  return {
    id: userId,
    email: d.email ?? null,
    name: d.name ?? null,
    birthday: d.birthday ?? null,
    bio: d.bio ?? null,
    genders: d.genders ?? [],
    genderDetail: d.genderDetail ?? null,
    showGender: d.showGender ?? true,
    orientations: d.orientations ?? [],
    showOrientation: d.showOrientation ?? true,
    seeking: d.seeking ?? [],
    lookingFor: d.lookingFor ?? null,
    clan: d.clan ?? null,
    dialect: d.dialect ?? null,
    dialectOther: d.dialectOther ?? null,
    hometownCountry: d.hometownCountry ?? null,
    hometownState: d.hometownState ?? null,
    hometownCity: d.hometownCity ?? null,
    work: d.work ?? null,
    workOther: d.workOther ?? null,
    religion: d.religion ?? null,
    religionOther: d.religionOther ?? null,
    education: d.education ?? null,
    interests: d.interests ?? [],
    photos: d.photos ?? [],
    mainPhotoIndex: d.mainPhotoIndex ?? 0,
    photoVerified: d.photoVerified ?? false,
    distance: d.distance ?? null,
    distanceWorldwide: d.distanceWorldwide ?? false,
    distanceUSOnly: d.distanceUSOnly ?? false,
    lifestyle: (d.lifestyle ?? {}) as Record<string, unknown>,
    extras: (d.extras ?? {}) as Record<string, unknown>,
    prompt: d.prompt ?? null,
  };
}

/**
 * Save a user's profile to Firestore at `users/{userId}`.
 * Uses merge to preserve existing fields not present in this update.
 */
export async function syncProfile(
  userId: string,
  data: OnboardingData
): Promise<{ ok: boolean; error?: string }> {
  if (!userId) return { ok: false, error: "Missing userId" };
  try {
    const row = toProfileRow(userId, data);
    const ref = doc(db, "users", userId);

    // Check if doc exists to decide createdAt vs updatedAt
    const existing = await getDoc(ref);
    const payload: Record<string, unknown> = {
      ...row,
      updatedAt: serverTimestamp(),
    };
    if (!existing.exists()) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(ref, payload, { merge: true });
    console.log("[profileSync] saved users/", userId);
    return { ok: true };
  } catch (e: any) {
    const msg = e?.message ?? "Failed to save profile";
    console.log("[profileSync] error", msg, e);
    return { ok: false, error: msg };
  }
}

/**
 * Read a user's profile from Firestore. Returns null if it doesn't exist.
 */
export async function getProfile(userId: string): Promise<ProfileRow | null> {
  if (!userId) return null;
  try {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as ProfileRow;
  } catch (e) {
    console.log("[profileSync] getProfile error", e);
    return null;
  }
}
