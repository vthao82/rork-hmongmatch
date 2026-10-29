import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

const KEY = "hmongmatch.likes.v1";
const PREM = "hmongmatch.premium.v1";
const LIKED = "hmongmatch.liked.v2";
const REWIND = "hmongmatch.rewind.v1";
export const DAILY_LIMIT = 10;
export const REWIND_LIMIT = 10;

type Stored = { date: string; used: number };

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export const [LikesProvider, useLikes] = createContextHook(() => {
  const [used, setUsed] = useState<number>(0);
  const [premium, setPremium] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [rewindUsed, setRewindUsed] = useState<number>(0);
  // Per-account storage so counts and liked lists never carry over between accounts on one phone
  const { user } = useAuth();
  const sfx = user?.uid ? `:${user.uid}` : ":signed-out";

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    setUsed(0); setPremium(false); setLikedIds([]); setRewindUsed(0);
    (async () => {
      try {
        const [s, p, l, r] = await Promise.all([
          AsyncStorage.getItem(KEY + sfx),
          AsyncStorage.getItem(PREM + sfx),
          AsyncStorage.getItem(LIKED + sfx),
          AsyncStorage.getItem(REWIND + sfx),
        ]);
        if (cancelled) return;
        if (s && s !== "null") {
          try { const parsed = JSON.parse(s) as Stored; if (parsed?.date === today()) setUsed(parsed.used); else setUsed(0); } catch (_e) { setUsed(0); }
        }
        if (p === "1") setPremium(true);
        if (l && l !== "null") {
          try { setLikedIds(JSON.parse(l) as string[]); } catch (_e) { setLikedIds([]); }
        }
        if (r && r !== "null") {
          try { const parsed = JSON.parse(r) as Stored; if (parsed?.date === today()) setRewindUsed(parsed.used); else setRewindUsed(0); } catch (_e) { setRewindUsed(0); }
        }
      } catch (e) {
        console.log("likes hydrate error", e);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [sfx]);

  const persist = useCallback(async (next: number) => {
    const v: Stored = { date: today(), used: next };
    await AsyncStorage.setItem(KEY + sfx, JSON.stringify(v)).catch(() => {});
  }, [sfx]);

  const persistRewind = useCallback(async (next: number) => {
    const v: Stored = { date: today(), used: next };
    await AsyncStorage.setItem(REWIND + sfx, JSON.stringify(v)).catch(() => {});
  }, [sfx]);

  const persistLiked = useCallback(async (ids: string[]) => {
    await AsyncStorage.setItem(LIKED + sfx, JSON.stringify(ids)).catch(() => {});
  }, [sfx]);

  const canLike = premium || used < DAILY_LIMIT;
  const remaining = premium ? Infinity : Math.max(0, DAILY_LIMIT - used);
  const rewindRemaining = premium ? Infinity : Math.max(0, REWIND_LIMIT - rewindUsed);
  const canRewind = premium || rewindUsed < REWIND_LIMIT;

  const consume = useCallback((profileId?: string): boolean => {
    if (!premium && used >= DAILY_LIMIT) return false;
    if (!premium) {
      const next = used + 1;
      setUsed(next);
      persist(next);
    }
    if (profileId) {
      setLikedIds(prev => {
        if (prev.includes(profileId)) return prev;
        const next = [profileId, ...prev].slice(0, 200);
        persistLiked(next);
        return next;
      });
    }
    return true;
  }, [premium, used, persist, persistLiked]);

  const rewind = useCallback((profileId?: string): boolean => {
    if (!premium && rewindUsed >= REWIND_LIMIT) return false;
    if (!premium) {
      const next = rewindUsed + 1;
      setRewindUsed(next);
      persistRewind(next);
    }
    if (profileId) {
      setLikedIds(prev => {
        const next = prev.filter(id => id !== profileId);
        persistLiked(next);
        return next;
      });
    }
    return true;
  }, [premium, rewindUsed, persistRewind, persistLiked]);

  const setPremiumOn = useCallback(async () => {
    setPremium(true);
    await AsyncStorage.setItem(PREM + sfx, "1").catch(() => {});
  }, [sfx]);

  const resetDaily = useCallback(async () => {
    setUsed(0);
    setRewindUsed(0);
    await persist(0);
    await persistRewind(0);
  }, [persist, persistRewind]);

  return { used, remaining, canLike, premium, consume, setPremiumOn, resetDaily, hydrated, likedIds, rewind, canRewind, rewindRemaining, rewindUsed };
});
