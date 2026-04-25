import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const KEY = "hmongmatch.likes.v1";
const PREM = "hmongmatch.premium.v1";
export const DAILY_LIMIT = 10;

type Stored = { date: string; used: number };

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export const [LikesProvider, useLikes] = createContextHook(() => {
  const [used, setUsed] = useState<number>(0);
  const [premium, setPremium] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([
          AsyncStorage.getItem(KEY),
          AsyncStorage.getItem(PREM),
        ]);
        if (s) {
          const parsed = JSON.parse(s) as Stored;
          if (parsed.date === today()) setUsed(parsed.used);
          else setUsed(0);
        }
        if (p === "1") setPremium(true);
      } catch (e) {
        console.log("likes hydrate error", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: number) => {
    const v: Stored = { date: today(), used: next };
    await AsyncStorage.setItem(KEY, JSON.stringify(v)).catch(() => {});
  }, []);

  const canLike = premium || used < DAILY_LIMIT;
  const remaining = premium ? Infinity : Math.max(0, DAILY_LIMIT - used);

  const consume = useCallback((): boolean => {
    if (premium) return true;
    if (used >= DAILY_LIMIT) return false;
    const next = used + 1;
    setUsed(next);
    persist(next);
    return true;
  }, [premium, used, persist]);

  const setPremiumOn = useCallback(async () => {
    setPremium(true);
    await AsyncStorage.setItem(PREM, "1").catch(() => {});
  }, []);

  const resetDaily = useCallback(async () => {
    setUsed(0);
    await persist(0);
  }, [persist]);

  return { used, remaining, canLike, premium, consume, setPremiumOn, resetDaily, hydrated };
});
