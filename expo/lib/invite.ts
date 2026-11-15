import { useEffect, useState } from "react";
import { Share } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";

export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.hmongdate.app";
export const FRIENDS_PER_REWARD = 3;

export async function shareInvite(code?: string | null): Promise<void> {
  const message = `Join me on Hmong Date — the dating app made for Hmong singles.${code ? ` Use my invite code ${code} when you sign up.` : ""} Download it here: ${PLAY_STORE_URL}`;
  try {
    await Share.share({ title: "Join me on Hmong Date", message, url: PLAY_STORE_URL });
  } catch (e) {
    console.log("[invite] share failed", e);
  }
}

/** My invite code and how many friends have joined with it (tracked by the server). */
export function useMyReferral(): { code: string | null; count: number; rewardUntil: number } {
  const { user } = useAuth();
  const [state, setState] = useState<{ code: string | null; count: number; rewardUntil: number }>({ code: null, count: 0, rewardUntil: 0 });
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), (s) => {
      const d = s.data() ?? {};
      setState({
        code: typeof d.inviteCode === "string" ? d.inviteCode : null,
        count: typeof d.referralCount === "number" ? d.referralCount : 0,
        rewardUntil: typeof d.referralUnlimitedUntil?.toMillis === "function" ? d.referralUnlimitedUntil.toMillis() : 0,
      });
    }, () => {});
  }, [user?.uid]);
  return state;
}
