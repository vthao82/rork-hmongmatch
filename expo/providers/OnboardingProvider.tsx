import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { syncProfile } from "@/lib/profileSync";

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
};

const KEY = "hmongmatch.onboarding.v1";
const DONE = "hmongmatch.onboarded.v1";

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

export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const [data, setData] = useState<OnboardingData>(defaults);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const [d, c] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(DONE)]);
        if (d && d !== "null") { try { setData({ ...defaults, ...JSON.parse(d) }); } catch (_e) { console.log("onboarding parse", _e); } }
        if (c === "1") setCompleted(true);
      } catch (e) {
        console.log("onboarding hydrate error", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const update = useCallback((patch: Partial<OnboardingData>) => {
    setData(prev => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const finish = useCallback(async () => {
    await AsyncStorage.setItem(DONE, "1");
    setCompleted(true);
    try {
      const userResp = await supabase.auth.getUser();
      const userId = userResp?.data?.user?.id;
      if (userId) {
        const res = await syncProfile(userId, data);
        if (!res.ok) console.log("[onboarding] profile sync failed", res.error);
      } else {
        console.log("[onboarding] no authenticated user, skipping profile sync");
      }
    } catch (e) {
      console.log("[onboarding] finish sync error", e);
    }
  }, [data]);

  const reset = useCallback(async () => {
    await AsyncStorage.multiRemove([KEY, DONE]);
    setData(defaults);
    setCompleted(false);
  }, []);

  return { data, update, finish, reset, hydrated, completed };
});
