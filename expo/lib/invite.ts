import { Share } from "react-native";

export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.hmongdate.app";

export async function shareInvite(): Promise<void> {
  const message = `Join me on Hmong Date — the dating app made for Hmong singles. Download it here: ${PLAY_STORE_URL}`;
  try {
    await Share.share({ title: "Join me on Hmong Date", message, url: PLAY_STORE_URL });
  } catch (e) {
    console.log("[invite] share failed", e);
  }
}
