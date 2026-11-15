import type { Profile } from "@/mocks/profiles";
import type { OnboardingData } from "@/providers/OnboardingProvider";

const n = (v?: string | null) => (v ?? "").trim().toLowerCase();

function dayHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Score how well someone fits me, with the human-readable reasons. */
export function compatibility(me: OnboardingData, p: Profile): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  if (me.lookingFor && p.lookingFor === me.lookingFor) { score += 3; reasons.push("Looking for the same thing"); }
  if (n(me.hometownState) && n(p.hometownState) === n(me.hometownState)) {
    score += 3;
    if (n(me.hometownCity) && n(p.hometownCity) === n(me.hometownCity)) { score += 2; reasons.push(`Both in ${p.hometownCity}`); }
    else reasons.push(`Both in ${p.hometownState}`);
  }
  if (me.dialect && me.dialect !== "other" && p.languages?.[0] === me.dialect) { score += 2; reasons.push(`Both speak ${me.dialect === "green" ? "Green" : "White"} Hmong`); }
  const shared = (p.interests ?? []).filter((i) => (me.interests ?? []).includes(i));
  if (shared.length) { score += Math.min(shared.length, 5); reasons.push(shared.length === 1 ? `You both like ${shared[0]}` : `${shared.length} shared interests`); }
  if (p.verified) score += 1;
  if ((p.prompts?.length ?? 0) > 0) score += 1;
  return { score, reasons };
}

/** One pick per day: the best fit, with a stable tie-break so it doesn't change on refresh. */
export function mostCompatibleToday(me: OnboardingData, candidates: Profile[]): { profile: Profile; reasons: string[] } | null {
  const today = new Date().toISOString().slice(0, 10);
  let best: { profile: Profile; reasons: string[]; score: number; tie: number } | null = null;
  for (const p of candidates) {
    const { score, reasons } = compatibility(me, p);
    const tie = dayHash(today + p.id);
    if (!best || score > best.score || (score === best.score && tie > best.tie)) best = { profile: p, reasons, score, tie };
  }
  return best ? { profile: best.profile, reasons: best.reasons } : null;
}
