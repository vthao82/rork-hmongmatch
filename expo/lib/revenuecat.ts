/**
 * RevenueCat wrapper — Android-only for now.
 *
 * iOS keys are not configured yet (waiting on Apple Developer account),
 * so `initRevenueCat` no-ops on iOS. When you're ready to ship iOS:
 *   1. Add `EXPO_PUBLIC_RC_IOS_KEY=appl_...` to `.env`
 *   2. Rebuild the EAS dev client
 * No code changes needed here — the runtime picks it up.
 *
 * Entitlement identifier used across the RevenueCat dashboard: "unlimited".
 * Product identifier we sell: "unlimited_monthly" (configured in Play Console
 * and linked to the "unlimited" entitlement in the RevenueCat dashboard).
 */

import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

const ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "";
const IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "";

/** RevenueCat entitlement identifier for the paid tier. */
export const UNLIMITED_ENTITLEMENT = "unlimited";

let configured = false;

/**
 * Initialize the RevenueCat SDK. Safe to call multiple times — subsequent
 * calls are no-ops. Should be invoked once at app boot (root layout).
 */
export function initRevenueCat(): void {
  if (configured) return;
  if (Platform.OS === "web") return;

  const key = Platform.OS === "ios" ? IOS_KEY : ANDROID_KEY;
  if (!key) {
    console.log(`[revenuecat] no key for ${Platform.OS} — SDK not configured`);
    return;
  }

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: key });
    configured = true;
    console.log(`[revenuecat] configured for ${Platform.OS}`);
  } catch (e) {
    console.log("[revenuecat] configure failed", e);
  }
}

export function isRevenueCatConfigured(): boolean {
  return configured;
}

/** Alias the RevenueCat customer to the Firebase UID so purchases follow the user. */
export async function identifyRevenueCatUser(firebaseUid: string): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logIn(firebaseUid);
  } catch (e) {
    console.log("[revenuecat] logIn failed", e);
  }
}

/** Reset RevenueCat to an anonymous user (call on sign-out). */
export async function forgetRevenueCatUser(): Promise<void> {
  if (!configured) return;
  try {
    // Only call logOut if there's a non-anonymous user to log out.
    // On app boot, Firebase's onAuthStateChanged fires with null before
    // hydration completes, which would otherwise trigger a "Called logOut but
    // the current user is anonymous" error from RC's native side.
    const currentId = await Purchases.getAppUserID();
    if (currentId.startsWith("$RCAnonymousID:")) return;
    await Purchases.logOut();
  } catch (e) {
    console.log("[revenuecat] logOut error", e);
  }
}

/**
 * Fetch the current offering (the one you mark "Current" in the RevenueCat
 * dashboard). Returns null if RevenueCat isn't configured or the offering
 * hasn't been set up yet.
 */
export async function fetchCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.log("[revenuecat] getOfferings failed", e);
    return null;
  }
}

/** Convenience: is the "unlimited" entitlement currently active for this user? */
export function hasUnlimitedEntitlement(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  return !!info.entitlements.active[UNLIMITED_ENTITLEMENT];
}

/**
 * Buy a specific package (from the Current offering). Returns:
 *   { ok: true, entitled: true }   → purchase succeeded, entitlement active
 *   { ok: true, entitled: false }  → purchase succeeded but no entitlement (shouldn't happen if RevenueCat is configured correctly)
 *   { ok: false, cancelled: true } → user cancelled the sheet
 *   { ok: false, error: "..." }    → real failure
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ ok: boolean; entitled?: boolean; cancelled?: boolean; error?: string }> {
  if (!configured) {
    return { ok: false, error: "Purchases not available on this device." };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, entitled: hasUnlimitedEntitlement(customerInfo) };
  } catch (e: any) {
    if (e?.userCancelled) return { ok: false, cancelled: true };
    console.log("[revenuecat] purchasePackage error", e);
    return { ok: false, error: e?.message ?? "Purchase failed" };
  }
}

/**
 * Restore purchases made under this store account. Returns whether the
 * "unlimited" entitlement is now active.
 */
export async function restorePurchases(): Promise<{ ok: boolean; entitled: boolean; error?: string }> {
  if (!configured) return { ok: false, entitled: false, error: "Purchases not available" };
  try {
    const info = await Purchases.restorePurchases();
    return { ok: true, entitled: hasUnlimitedEntitlement(info) };
  } catch (e: any) {
    console.log("[revenuecat] restore error", e);
    return { ok: false, entitled: false, error: e?.message ?? "Restore failed" };
  }
}

/** One-shot fetch of the current customer info (for boot-time entitlement sync). */
export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.log("[revenuecat] getCustomerInfo failed", e);
    return null;
  }
}

/** Subscribe to entitlement changes (renewals, cancellations, etc.). */
export function onCustomerInfoUpdate(cb: (info: CustomerInfo) => void): () => void {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => {
    try {
      Purchases.removeCustomerInfoUpdateListener(cb);
    } catch (_e) {}
  };
}
