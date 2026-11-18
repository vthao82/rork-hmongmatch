import { useEffect, useState } from "react";
import { Alert, Dimensions, Platform, type AlertButton } from "react-native";

/** Width of the app column in browsers: wide on computers, phone-width on small windows. */
export const WEB_FRAME_WIDTH = typeof window !== "undefined" && window.innerWidth >= 1024 ? 1240 : 480;

export type WebAlert = { title: string; message?: string; buttons: AlertButton[] };
let show: ((a: WebAlert | null) => void) | null = null;
export const registerWebAlert = (fn: ((a: WebAlert | null) => void) | null) => { show = fn; };

if (Platform.OS === "web") {
  // Screens size themselves from the window; keep them inside the phone-width column
  const get = Dimensions.get.bind(Dimensions);
  Dimensions.get = ((dim: "window" | "screen") => {
    const d = get(dim);
    return { ...d, width: Math.min(d.width, WEB_FRAME_WIDTH) };
  }) as typeof Dimensions.get;

  // react-native-web's Alert does nothing; show our own dialog instead
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const list = buttons && buttons.length ? buttons : [{ text: "OK" }];
    if (show) show({ title, message, buttons: list });
    else window.alert([title, message].filter(Boolean).join("\n\n"));
  };
}

/** True on desktop-size browser windows (used for the side-by-side chat). */
export function useWideWeb(): boolean {
  const get = () => Platform.OS === "web" && typeof window !== "undefined" && window.innerWidth >= 1024;
  const [wide, setWide] = useState<boolean>(get);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const on = () => setWide(get());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return wide;
}
