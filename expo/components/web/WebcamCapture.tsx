import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { Camera, X } from "lucide-react-native";
import Colors from "@/constants/colors";

type Props = { visible: boolean; onClose: () => void; onCapture: (dataUrl: string) => void };

/** Browsers: live webcam preview; "Take photo" grabs a still frame (no file uploads). */
export function WebcamCapture({ visible, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!visible) return;
    setState("loading");
    let stopped = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false })
      .then((stream) => {
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; void videoRef.current.play(); }
        setState("ready");
      })
      .catch((e) => { console.log("[webcam]", e); setState("error"); });
    if (!navigator.mediaDevices?.getUserMedia) setState("error");
    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [visible]);

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // Un-mirror so the saved selfie looks like everyone else sees you
    ctx.translate(c.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    onCapture(c.toDataURL("image/jpeg", 0.85));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.card} testID="webcam-capture">
          <View style={s.head}>
            <Text style={s.title}>Take a selfie</Text>
            <TouchableOpacity onPress={onClose} testID="webcam-close"><X size={22} color="#FFF" /></TouchableOpacity>
          </View>
          <View style={s.frame}>
            {React.createElement("video", { ref: videoRef, autoPlay: true, playsInline: true, muted: true, style: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: state === "ready" ? "block" : "none" } })}
            {state === "loading" && <ActivityIndicator color="#FFF" />}
            {state === "error" && (
              <Text style={s.err} testID="webcam-error">
                We couldn't reach a webcam. Allow camera access in your browser (the camera icon in the address bar), or finish sign-up and verify later from the Hmong Date phone app: Profile, then Verify your photos.
              </Text>
            )}
          </View>
          <Text style={s.tip}>Face the camera in good light, with your whole face in the frame.</Text>
          <TouchableOpacity style={[s.btn, state !== "ready" && { opacity: 0.4 }]} onPress={snap} disabled={state !== "ready"} testID="webcam-snap">
            <Camera size={18} color="#1a1404" />
            <Text style={s.btnTxt}>Take photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 520, backgroundColor: "#16060c", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(212,168,67,0.35)" },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { color: "#FFF", fontSize: 18, fontWeight: "800" as const },
  frame: { width: "100%", aspectRatio: 4 / 3, borderRadius: 16, overflow: "hidden", backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  err: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 21, textAlign: "center" as const, padding: 24 },
  tip: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 12, textAlign: "center" as const },
  btn: { marginTop: 16, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Colors.gold, borderRadius: 999, paddingVertical: 14 },
  btnTxt: { color: "#1a1404", fontSize: 15, fontWeight: "800" as const },
});
