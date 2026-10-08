/**
 * Map a user-entered last name to one of the 18 recognized Hmong clans.
 *
 * Normalizes case + accents + common parenthetical forms ("Lee (Ly)") and
 * matches against both the primary name and alternate spellings. Returns
 * null when the last name doesn't match a Hmong clan (e.g., a non-Hmong
 * surname) — the UI should treat null as "Other / not Hmong".
 */

/** Canonical display label for each clan + accepted alternate spellings. */
const CLAN_MAP: Array<{ label: string; aliases: string[] }> = [
  { label: "Chang", aliases: ["chang", "cha", "tsab"] },
  { label: "Cheng", aliases: ["cheng", "tcheng", "tseeb"] },
  { label: "Chue", aliases: ["chue", "tsw", "tswb", "ntshuab"] },
  { label: "Fang", aliases: ["fang", "faj"] },
  { label: "Hang", aliases: ["hang", "haam", "ham"] },
  { label: "Her", aliases: ["her", "herr", "haw", "heu"] },
  { label: "Khang", aliases: ["khang", "khaab"] },
  { label: "Kong", aliases: ["kong", "koo"] },
  { label: "Kue", aliases: ["kue", "kwm"] },
  { label: "Lee (Ly)", aliases: ["lee", "ly", "lis", "li"] },
  { label: "Lor (Lo)", aliases: ["lor", "lo", "lauj"] },
  { label: "Moua", aliases: ["moua", "muas"] },
  { label: "Pha", aliases: ["pha", "phab"] },
  { label: "Thao", aliases: ["thao", "thor", "thoj"] },
  { label: "Vang", aliases: ["vang", "vaj"] },
  { label: "Vue", aliases: ["vue", "vwj"] },
  { label: "Xiong", aliases: ["xiong", "xyooj"] },
  { label: "Yang", aliases: ["yang", "yaj"] },
];

function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    // Normalize accented characters (é → e, etc.)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Collapse whitespace + strip punctuation
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Try to auto-detect the Hmong clan from a last name.
 * Returns the canonical label (e.g., "Lee (Ly)") on match, null otherwise.
 */
export function clanFromLastName(lastName: string | undefined | null): string | null {
  if (!lastName) return null;
  const n = normalize(lastName);
  if (!n) return null;

  // Try full-string match first, then first-word match (handles "Vang Thao" → Vang)
  const candidates = [n, n.split(" ")[0] ?? ""];
  for (const cand of candidates) {
    if (!cand) continue;
    for (const clan of CLAN_MAP) {
      if (clan.aliases.includes(cand)) return clan.label;
    }
  }
  return null;
}

/** Full canonical list of Hmong clan labels (for display in dropdowns, etc.) */
export const ALL_CLANS: string[] = CLAN_MAP.map((c) => c.label);
