import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

/**
 * Two-tier subscription model:
 *   - "free"      : everyone starts here
 *   - "unlimited" : single paid tier ($19.99/mo) that unlocks all premium gates
 *
 * NOTE: RevenueCat is not wired in production yet — `purchaseUnlimited()` is a
 * stubbed promise that resolves true. When RevenueCat is hooked up natively
 * (post-App-Store accounts) replace the body of `purchaseUnlimited` with the
 * real entitlement check; the rest of the app already trusts `tier`.
 */
export type Tier = "free" | "unlimited";

export const UNLIMITED_PRICE = "$19.99 / mo";
export const UNLIMITED_PRICE_LABEL = "$19.99/mo";

export const FREE_LIMITS = {
  likes: 10,
  swipes: 25,
  rewinds: 10,
  messages: 5,
  boostMin: 30,
  boostsPerMonth: 1,
};

export const UNLIMITED_LIMITS = {
  boostMin: 60,
  boostsPerMonth: 2,
};

const KEY = "hmongdate.tier.v1";
const USAGE_KEY = "hmongdate.usage.v1";

type Usage = {
  date: string;
  likes: number;
  dislikes: number;
  swipes: number;
  rewinds: number;
  messages: number;
  boostUsedAt?: number;
  boostActiveUntil?: number;
  /** Timestamps (ms) of each boost START in the trailing 30 days. */
  boostHistory?: number[];
  seenIds: string[];
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const DISLIKE_START = 10;

function emptyUsage(): Usage {
  return { date: today(), likes: 0, dislikes: DISLIKE_START, swipes: 0, rewinds: 0, messages: 0, boostHistory: [], seenIds: [] };
}

// Migrate any legacy stored tier value ("plus"/"gold") to "unlimited".
function normalizeTier(raw: string | null): Tier {
  if (!raw) return "free";
  if (raw === "free") return "free";
  // anything else (plus / gold / unlimited) → unlimited
  return "unlimited";
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
        const normalized = normalizeTier(t);
        setTier(normalized);
        // If we migrated a legacy value, persist the new canonical name
        if (t && t !== normalized) {
          try { await AsyncStorage.setItem(KEY, normalized); } catch (_e) {}
        }
        if (u && u !== "null") {
          try { const parsed = JSON.parse(u) as Usage; if (parsed?.date === today()) setUsage({ ...emptyUsage(), ...parsed }); else setUsage(emptyUsage()); } catch (_e) { setUsage(emptyUsage()); }
        }
      } catch (e) { console.log("tier hydrate", e); }
      finally { setHydrated(true); }
    })();
  }, []);

  const persistUsage = useCallback(async (u: Usage) => {
    try { await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(u)); } catch (e) { console.log("usage persist", e); }
  }, []);

  const setTierAndPersist = useCallback(async (t: Tier) => {
    setTier(t);
    try { await AsyncStorage.setItem(KEY, t); } catch (e) { console.log("tier save", e); }
  }, []);

  /**
   * Stubbed purchase flow. Native RevenueCat will replace this body.
   * For now we simply mark the user as Unlimited locally so all gated UI unlocks
   * end-to-end for testing.
   */
  const purchaseUnlimited = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    // TODO(RevenueCat): replace stub with `Purchases.purchasePackage(...)`.
    await setTierAndPersist("unlimited");
    return { ok: true };
  }, [setTierAndPersist]);

  const restorePurchases = useCallback(async (): Promise<{ ok: boolean; entitled: boolean }> => {
    // TODO(RevenueCat): replace stub with `Purchases.restorePurchases()` and
    // inspect `customerInfo.entitlements.active["unlimited"]`.
    return { ok: true, entitled: tier === "unlimited" };
  }, [tier]);

  // Legacy alias used by older screens. Still expects a tier argument but we now
  // coerce to "unlimited" regardless of input.
  const upgrade = useCallback(async (_legacyTier?: string) => {
    await setTierAndPersist("unlimited");
  }, [setTierAndPersist]);

  const isPaid = tier === "unlimited";

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

  const consumeLike = useCallback((_profileId?: string): boolean => {
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

  const markSeen = useCallback((profileId: string) => {
    if (!profileId) return;
    const seen = Array.from(new Set([...usage.seenIds, profileId])).slice(-500);
    const next: Usage = { ...usage, seenIds: seen };
    setUsage(next);
    persistUsage(next);
  }, [usage, persistUsage]);

  const consumeDislike = useCallback((): boolean => {
    const next: Usage = { ...usage, dislikes: usage.dislikes + 1 };
    setUsage(next);
    persistUsage(next);
    return true;
  }, [usage, persistUsage]);

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
    const now = Date.now();
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    // Prune boosts older than 30 days
    const recent = (usage.boostHistory ?? []).filter((ts) => now - ts < monthMs);
    const cap = isPaid ? UNLIMITED_LIMITS.boostsPerMonth : FREE_LIMITS.boostsPerMonth;
    if (recent.length >= cap) return false;
    const minutes = isPaid ? UNLIMITED_LIMITS.boostMin : FREE_LIMITS.boostMin;
    const next: Usage = {
      ...usage,
      boostUsedAt: now,
      boostActiveUntil: now + minutes * 60 * 1000,
      boostHistory: [...recent, now],
    };
    setUsage(next);
    persistUsage(next);
    return true;
  }, [isPaid, usage, persistUsage]);

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
    purchaseUnlimited,
    restorePurchases,
    usage,
    remaining,
    consumeLike,
    consumeDislike,
    consumeSwipe,
    markSeen,
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
