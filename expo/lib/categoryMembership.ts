/** Fields that decide which Interest cards someone belongs to. */
export type MemberFields = {
  categories?: string[];
  interests?: string[];
  lookingFor?: string | null;
  clan?: string | null;
  dialect?: string | null;
  education?: string | null;
  work?: string | null;
  hometownState?: string | null;
  religion?: string | null;
};

const STATE_NAMES: Record<string, string> = { mn: "minnesota", ca: "california", wi: "wisconsin", nc: "north carolina" };
const WORK_IDS: Record<string, string[]> = { ft: ["full-time"], pt: ["part-time"], wfh: ["wfh"], "own-biz": ["own-business"] };
const EDU_NAMES: Record<string, string[]> = { hs: ["high school"], college: ["in college"], bachelor: ["bachelors", "bachelor"], masters: ["masters", "in grad school"], phd: ["phd"], trade: ["trade school"] };
const lc = (v?: string | null) => (v ?? "").toString().toLowerCase();

export const cardKey = (groupId: string, cardId: string) => `${groupId}:${cardId}`;

/** True when the card comes from their profile answers (clan, dialect, etc.), not a manual add. */
export function memberByProfile(f: MemberFields, groupId: string, cardId: string): boolean {
  switch (groupId) {
    case "goals": return f.lookingFor === cardId;
    case "clan": return lc(f.clan) === cardId;
    case "dialect": return lc(f.dialect) === cardId;
    case "education": return !!f.education && (EDU_NAMES[cardId] ?? [cardId]).includes(lc(f.education));
    case "work": return !!f.work && (WORK_IDS[cardId] ?? [cardId]).includes(lc(f.work));
    case "state": { const s = lc(f.hometownState); return !!s && (s === cardId || s === STATE_NAMES[cardId]); }
    case "religion": return !!f.religion && lc(f.religion) === cardId;
    case "lifestyle": return false;
    default: return false;
  }
}

/** Member of a card: from their profile answers, a manual add, or (older profiles) a matching interest. */
export function memberOf(f: MemberFields, groupId: string, cardId: string, title: string): boolean {
  if (!groupId || !cardId) return (f.interests ?? []).includes(title);
  return memberByProfile(f, groupId, cardId) || (f.categories ?? []).includes(cardKey(groupId, cardId)) || (f.interests ?? []).includes(title);
}
