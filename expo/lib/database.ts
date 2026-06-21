import { supabase } from "./supabase";
import type { OnboardingData } from "@/providers/OnboardingProvider";

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  birthday: string | null;
  bio: string | null;
  genders: string[];
  seeking: string[];
  orientations: string[];
  looking_for: string | null;
  clan: string | null;
  dialect: string | null;
  hometown_country: string | null;
  hometown_state: string | null;
  hometown_city: string | null;
  work: string | null;
  education: string | null;
  interests: string[];
  lifestyle: Record<string, unknown>;
  extras: Record<string, unknown>;
  photos: string[];
  distance: number | null;
  distance_worldwide: boolean;
  distance_us_only: boolean;
  show_gender: boolean;
  show_orientation: boolean;
  photo_verified: boolean;
  updated_at: string;
};

export async function upsertProfile(data: OnboardingData): Promise<{ error: Error | null }> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: userError ?? new Error("Not authenticated") };

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? null,
    name: data.name ?? null,
    birthday: data.birthday ?? null,
    bio: data.bio ?? null,
    genders: data.genders,
    seeking: data.seeking,
    orientations: data.orientations,
    looking_for: data.lookingFor ?? null,
    clan: data.clan ?? null,
    dialect: data.dialect ?? null,
    hometown_country: data.hometownCountry ?? null,
    hometown_state: data.hometownState ?? null,
    hometown_city: data.hometownCity ?? null,
    work: data.work ?? null,
    education: data.education ?? null,
    interests: data.interests,
    lifestyle: data.lifestyle,
    extras: data.extras,
    photos: data.photos,
    distance: data.distance ?? null,
    distance_worldwide: data.distanceWorldwide ?? false,
    distance_us_only: data.distanceUSOnly ?? false,
    show_gender: data.showGender ?? true,
    show_orientation: data.showOrientation ?? true,
    photo_verified: data.photoVerified ?? false,
    updated_at: new Date().toISOString(),
  });

  return { error: error as Error | null };
}

export async function getProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { data: data as Profile | null, error: error as Error | null };
}
