import { Alert, Dimensions, Platform, type AlertButton } from "react-native";

/** Phone-width column the app renders in on desktop browsers. */
export const WEB_FRAME_WIDTH = 480;

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
