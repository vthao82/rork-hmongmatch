import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/** Android draws edge-to-edge, so screens don't shrink for the keyboard; returns its height to pad scroll content. */
export function useKeyboardHeight(): number {
  const [h, setH] = useState<number>(0);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", (e) => setH(e.endCoordinates.height));
    const hide = Keyboard.addListener("keyboardDidHide", () => setH(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return h;
}
