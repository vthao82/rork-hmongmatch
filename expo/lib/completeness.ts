import type { OnboardingData } from "@/providers/OnboardingProvider";

export type CompletenessTask = { id: "photos" | "bio" | "prompts" | "verify" | "interests" | "work"; title: string; sub: string; pct: number };

/** Weighted profile completeness with the next tasks that add the most. */
export function profileCompleteness(d: OnboardingData): { pct: number; tasks: CompletenessTask[] } {
  const photos = d.photos?.length ?? 0;
  const prompts = (d.prompts ?? []).filter((p) => p.a?.trim()).length;
  const checks: (CompletenessTask & { done: boolean })[] = [
    { id: "photos", title: "Add more photos", sub: `You have ${photos} of 4. Profiles with 4+ photos get more likes.`, pct: 25, done: photos >= 4 },
    { id: "prompts", title: prompts ? "Answer another prompt" : "Answer a prompt", sub: "Add a prompt to get up to 2x more likes and better first messages.", pct: 20, done: prompts >= 2 },
    { id: "verify", title: "Verify your photos", sub: "Get the blue check so people know you're real.", pct: 20, done: !!d.photoVerified },
    { id: "bio", title: "Write a short bio", sub: "A few lines about you can lead to 25% more matches.", pct: 15, done: !!d.bio?.trim() },
    { id: "interests", title: "Add interests", sub: "Pick at least 3 so we can find people like you.", pct: 10, done: (d.interests?.length ?? 0) >= 3 },
    { id: "work", title: "Add work or school", sub: "Helps start conversations.", pct: 10, done: !!(d.work || d.education) },
  ];
  const pct = checks.reduce((sum, c) => sum + (c.done ? c.pct : 0), 0);
  return { pct, tasks: checks.filter((c) => !c.done).map(({ done: _d, ...t }) => t) };
}
