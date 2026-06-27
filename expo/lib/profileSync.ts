import type { OnboardingData } from "@/providers/OnboardingProvider";

/**
 * Shape of a saved user profile. Kept as a reference for the upcoming
 * Firestore migration (Phase 4). Field names are snake_case for now to
 * minimize churn when we wire Firestore up; rename freely then.
 */
export type ProfileRow = {
  id: string;
  name: string | null;
  birthday: string | null;
  bio: string | null;
  gender: string | null;
  seeking: string[] | null;
  looking_for: string | null;
  clan: string | null;
  dialect: string | null;
  dialect_other: string | null;
  hometown_country: string | null;
  hometown_state: string | null;
  hometown_city: string | null;
  work: string | null;
  religion: string | null;
  education: string | null;
  interests: string[] | null;
  photos: string[] | null;
  main_photo_index: number | null;
  photo_verified: boolean | null;
  distance: number | null;
  distance_worldwide: boolean | null;
  distance_us_only: boolean | null;
  lifestyle: Record<string, unknown> | null;
  extras: Record<string, unknown> | null;
  updated_at?: string;
};

/**
 * TODO (Phase 4 — Firestore): wire this up to write the profile row to
 * Firestore at `users/{userId}`. For now it's a no-op so the rest of the
 * onboarding flow keeps working with local AsyncStorage state.
 */
export async function syncProfile(
  _userId: string,
  _data: OnboardingData
): Promise<{ ok: boolean; error?: string }> {
  console.log("[profileSync] no-op — Firestore integration pending (Phase 4)");
  return { ok: true };
}
