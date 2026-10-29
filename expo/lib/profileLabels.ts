const LOOKING_FOR: Record<string, string> = {
  long: "Looking for long-term relationship",
  "long-open": "Looking for long-term, open to short-term relationship",
  "short-open": "Looking for short-term, open to long-term relationship",
  short: "Looking for short-term relationship",
  friends: "Looking for new friends",
  unsure: "Still figuring out what they're looking for",
};

const DIALECT: Record<string, string> = { green: "Green", white: "White" };

export function lookingForText(id?: string): string {
  if (!id) return "";
  return LOOKING_FOR[id] ?? `Looking for ${id}`;
}

export function dialectText(languages?: string[]): string {
  const d = languages?.[0];
  if (!d || d === "other") return "";
  return `Speaks ${DIALECT[d] ?? d} dialect`;
}
