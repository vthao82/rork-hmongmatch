import { supabase } from "@/lib/supabase";
import type { OnboardingData } from "@/providers/OnboardingProvider";

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

/** Upsert the local onboarding data to the authenticated user's row in `profiles`. */
export async function syncProfile(userId: string, data: OnboardingData): Promise<{ ok: boolean; error?: string }> {
  try {
    const row: ProfileRow = {
      id: userId,
      name: data.name ?? null,
      birthday: data.birthday ?? null,
      bio: data.bio ?? null,
      gender: data.genders?.[0] ?? null,
      seeking: data.seeking ?? null,
      looking_for: data.lookingFor ?? null,
      clan: data.clan ?? null,
      dialect: data.dialect ?? null,
      dialect_other: data.dialectOther ?? null,
      hometown_country: data.hometownCountry ?? null,
      hometown_state: data.hometownState ?? null,
      hometown_city: data.hometownCity ?? null,
      work: data.work ?? null,
      religion: data.religion ?? null,
      education: data.education ?? null,
      interests: data.interests ?? [],
      photos: data.photos ?? [],
      main_photo_index: data.mainPhotoIndex ?? 0,
      photo_verified: data.photoVerified ?? false,
      distance: data.distance ?? null,
      distance_worldwide: data.distanceWorldwide ?? false,
      distance_us_only: data.distanceUSOnly ?? false,
      lifestyle: data.lifestyle ?? {},
      extras: data.extras ?? {},
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
    if (error) {
      console.log("[profileSync] upsert error", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown sync error";
    console.log("[profileSync] error", msg);
    return { ok: false, error: msg };
  }
}

/** Record a like or dislike interaction. Returns whether a match was created. */
export async function recordInteraction(
  fromUserId: string,
  toProfileId: string,
  action: "like" | "dislike",
): Promise<{ ok: boolean; matched?: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("interactions").upsert(
      { from_user: fromUserId, to_user: toProfileId, action },
      { onConflict: "from_user,to_user" },
    );
    if (error) return { ok: false, error: error.message };
    if (action === "like") {
      const { data: reverse } = await supabase
        .from("interactions")
        .select("action")
        .eq("from_user", toProfileId)
        .eq("to_user", fromUserId)
        .eq("action", "like")
        .maybeSingle();
      if (reverse) {
        const [a, b] = [fromUserId, toProfileId].sort();
        await supabase.from("matches").upsert(
          { user_a: a, user_b: b },
          { onConflict: "user_a,user_b" },
        );
        return { ok: true, matched: true };
      }
    }
    return { ok: true, matched: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown interaction error";
    return { ok: false, error: msg };
  }
}
