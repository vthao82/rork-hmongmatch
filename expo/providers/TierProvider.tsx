import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type Tier = "free" | "plus" | "gold";

export const FREE_LIMITS = {
  likes: 10,
  swipes: 25,
  rewinds: 10,
  messages: 5,
  boostMin: 30,
};

const KEY = "hmongdate.tier.v1";
const USAGE_KEY = "hmongdate.usage.v1";

type Usage = {
  date: string;
  likes: number;
  swipes: number;
  rewinds: number;
  messages: number;
  boostUsedAt?: number;
  boostActiveUntil?: number;
  seenIds: string[];
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function emptyUsage(): Usage {
  return { date: today(), likes: 0, swipes: 0, rewinds: 0, messages: 0, seenIds: [] };
}

export const [TierProvider, useTier] = createContextHook(() => {
  const [tier, setTier] = useState<Tier>("free");
  const [usage, setUsage] = useState<Usage>(emptyUsage());
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [show75Modal, setShow75Modal] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(USAGE_KEY)]);
        if (t === "plus" || t === "gold") setTier(t);
        if (u) {
          const parsed = JSON.parse(u) as Usage;
          if (parsed.date === today()) setUsage({ ...emptyUsage(), ...parsed });
          else setUsage(emptyUsage());
        }
      } catch (e) { console.log("tier hydrate", e); }
      finally { setHydrated(true); }
    })();
  }, []);

  const persistUsage = useCallback(async (u: Usage) => {
    try { await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(u)); } catch (e) { console.log("usage persist", e); }
  }, []);

  const upgrade = useCallback(async (t: Tier) => {
    setTier(t);
    try { await AsyncStorage.setItem(KEY, t); } catch (e) { console.log("tier save", e); }
  }, []);

  const isPaid = tier !== "free";

  const checkAndPrompt = useCallback((next: Usage) => {
    if (isPaid) return;
    const overLikes = next.likes >= FREE_LIMITS.likes;
    const overSwipes = next.swipes >= FREE_LIMITS.swipes;
    const overRewinds = next.rewinds >= FREE_LIMITS.rewinds;
    const overMsgs = next.messages >= FREE_LIMITS.messages;
    if (overLikes || overSwipes || overRewinds || overMsgs) {
      setShowLimitModal(true);
      return;
    }
    const pct =
      next.likes / FREE_LIMITS.likes * 100 >= 75 ||
      next.swipes / FREE_LIMITS.swipes * 100 >= 75 ||
      next.rewinds / FREE_LIMITS.rewinds * 100 >= 75 ||
      next.messages / FREE_LIMITS.messages * 100 >= 75;
    if (pct) setShow75Modal(true);
  }, [isPaid]);

  const consumeLike = useCallback((profileId?: string): boolean => {
    if (!isPaid && usage.likes >= FREE_LIMITS.likes) {
      setShowLimitModal(true);
      return false;
    }
    const next: Usage = { ...usage, likes: usage.likes + 1 };
    setUsage(next);
    persistUsage(next);
    checkAndPrompt(next);
    return true;
  }, [isPaid, usage, persistUsage, checkAndPrompt]);

  const consumeSwipe = useCallback((profileId?: string): boolean => {
    if (!isPaid && usage.swipes >= FREE_LIMITS.swipes) {
      setShowLimitModal(true);
      return false;
    }
    const seen = profileId ? Array.from(new Set([...usage.seenIds, profileId])).slice(-500) : usage.seenIds;
    const next: Usage = { ...usage, swipes: usage.swipes + 1, seenIds: seen };
    setUsage(next);
    persistUsage(next);
    checkAndPrompt(next);
    return true;
  }, [isPaid, usage, persistUsage, checkAndPrompt]);

  const consumeRewind = useCallback((): boolean => {
    if (!isPaid && usage.rewinds >= FREE_LIMITS.rewinds) {
      setShowLimitModal(true);
      return false;
    }
    const next: Usage = { ...usage, rewinds: usage.rewinds + 1 };
    setUsage(next);
    persistUsage(next);
    checkAndPrompt(next);
    return true;
  }, [isPaid, usage, persistUsage, checkAndPrompt]);

  const consumeMessage = useCallback((): boolean => {
    if (!isPaid && usage.messages >= FREE_LIMITS.messages) {
      setShowLimitModal(true);
      return false;
    }
    const next: Usage = { ...usage, messages: usage.messages + 1 };
    setUsage(next);
    persistUsage(next);
    checkAndPrompt(next);
    return true;
  }, [isPaid, usage, persistUsage, checkAndPrompt]);

  const startBoost = useCallback((): boolean => {
    const minutes = tier === "gold" ? 60 : tier === "plus" ? 60 : 30;
    const now = Date.now();
    if (!isPaid) {
      // free tier: 1 boost per month
      const monthMs = 30 * 24 * 60 * 60 * 1000;
      if (usage.boostUsedAt && now - usage.boostUsedAt < monthMs) return false;
    }
    const next: Usage = { ...usage, boostUsedAt: now, boostActiveUntil: now + minutes * 60 * 1000 };
    setUsage(next);
    persistUsage(next);
    return true;
  }, [tier, isPaid, usage, persistUsage]);

  const stopBoost = useCallback(() => {
    const next: Usage = { ...usage, boostActiveUntil: undefined };
    setUsage(next);
    persistUsage(next);
  }, [usage, persistUsage]);

  const boostActive = !!(usage.boostActiveUntil && usage.boostActiveUntil > Date.now());

  const remaining = {
    likes: isPaid ? Infinity : Math.max(0, FREE_LIMITS.likes - usage.likes),
    swipes: isPaid ? Infinity : Math.max(0, FREE_LIMITS.swipes - usage.swipes),
    rewinds: isPaid ? Infinity : Math.max(0, FREE_LIMITS.rewinds - usage.rewinds),
    messages: isPaid ? Infinity : Math.max(0, FREE_LIMITS.messages - usage.messages),
  };

  return {
    tier,
    isPaid,
    upgrade,
    usage,
    remaining,
    consumeLike,
    consumeSwipe,
    consumeRewind,
    consumeMessage,
    startBoost,
    stopBoost,
    boostActive,
    showLimitModal,
    setShowLimitModal,
    show75Modal,
    setShow75Modal,
    hydrated,
  };
});
