import { Share } from "react-native";
import type { Profile } from "@/mocks/profiles";
import { PLAY_STORE_URL } from "@/lib/invite";
import { lookingForText } from "@/lib/profileLabels";

/** Share a short text card about a profile with family or friends. */
export async function shareWithFamily(p: Profile): Promise<void> {
  const lines = [
    `What do you think of ${p.name}${p.age ? `, ${p.age}` : ""}?`,
    [p.clan && p.clan !== "—" ? `${p.clan} clan` : null, p.location && p.location !== "Nearby" ? p.location : null].filter(Boolean).join(" · "),
    p.lookingFor ? lookingForText(p.lookingFor) : null,
    p.photos[0] ?? null,
    "",
    `I found them on Hmong Date: ${PLAY_STORE_URL}`,
  ].filter((l) => l !== null);
  try {
    await Share.share({ message: lines.join("\n") });
  } catch (e) {
    console.log("[share] family share failed", e);
  }
}
