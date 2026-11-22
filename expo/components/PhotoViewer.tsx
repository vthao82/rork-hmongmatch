import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView, FlatList } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_ZOOM = 4;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function ZoomableImage({ uri, width, height, onZoomChange }: { uri: string; width: number; height: number; onZoomChange: (z: boolean) => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const base = useRef({ s: 1, x: 0, y: 0 });
  const cur = useRef({ s: 1, x: 0, y: 0 });
  const [zoomed, setZoomed] = useState<boolean>(false);

  const setZoom = (z: boolean) => { setZoomed(z); onZoomChange(z); };
  const bound = (s: number) => ({ x: (width * (s - 1)) / 2, y: (height * (s - 1)) / 2 });
  const apply = (s: number, x: number, y: number, animate: boolean) => {
    cur.current = { s, x, y };
    base.current = { s, x, y };
    if (animate) {
      Animated.parallel([
        Animated.spring(scale, { toValue: s, useNativeDriver: true }),
        Animated.spring(tx, { toValue: x, useNativeDriver: true }),
        Animated.spring(ty, { toValue: y, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(s); tx.setValue(x); ty.setValue(y);
    }
    setZoom(s > 1.01);
  };

  const gesture = useMemo(() => {
    const pinch = Gesture.Pinch().runOnJS(true)
      .onUpdate((e) => {
        const s = clamp(base.current.s * e.scale, 1, MAX_ZOOM);
        cur.current.s = s;
        scale.setValue(s);
      })
      .onEnd(() => {
        const s = cur.current.s;
        const b = bound(s);
        apply(s <= 1.01 ? 1 : s, clamp(cur.current.x, -b.x, b.x), clamp(cur.current.y, -b.y, b.y), true);
      });
    const pan = Gesture.Pan().runOnJS(true).enabled(zoomed)
      .onUpdate((e) => {
        const x = base.current.x + e.translationX;
        const y = base.current.y + e.translationY;
        cur.current.x = x; cur.current.y = y;
        tx.setValue(x); ty.setValue(y);
      })
      .onEnd(() => {
        const b = bound(cur.current.s);
        apply(cur.current.s, clamp(cur.current.x, -b.x, b.x), clamp(cur.current.y, -b.y, b.y), true);
      });
    const doubleTap = Gesture.Tap().numberOfTaps(2).runOnJS(true)
      .onEnd(() => { if (base.current.s > 1.01) apply(1, 0, 0, true); else apply(2.5, 0, 0, true); });
    return Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomed, width, height]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height, overflow: "hidden" }} collapsable={false}>
        <Animated.View style={{ width, height, transform: [{ translateX: tx }, { translateY: ty }, { scale }] }}>
          <Image source={{ uri }} style={{ width, height }} contentFit="contain" transition={150} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

type Props = { photos: string[]; startIndex: number; visible: boolean; onClose: () => void };

/** Full-screen photo viewer: swipe between photos, pinch or double-tap to zoom. */
export function PhotoViewer(props: Props) {
  return Platform.OS === "web" ? <WebPhotoViewer {...props} /> : <NativePhotoViewer {...props} />;
}

/** Browsers: one photo at a time in a fixed-size frame, with arrow buttons and keyboard arrows. */
function WebPhotoViewer({ photos, startIndex, visible, onClose }: Props) {
  const [index, setIndex] = useState<number>(startIndex);
  const n = photos.length;
  const go = (d: number) => setIndex((i) => (i + d + n) % n);
  useEffect(() => { if (visible) setIndex(startIndex); }, [visible, startIndex]);
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, n]);
  if (!n) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.webBackdrop} testID="photo-viewer">
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={st.webFrame}>
          <Image source={{ uri: photos[index] }} style={st.webImg} contentFit="contain" transition={150} testID="photo-viewer-image" />
        </View>
        {n > 1 && (
          <>
            <TouchableOpacity style={[st.arrow, { left: 24 }]} onPress={() => go(-1)} testID="photo-viewer-prev"><ChevronLeft size={30} color="#FFF" /></TouchableOpacity>
            <TouchableOpacity style={[st.arrow, { right: 24 }]} onPress={() => go(1)} testID="photo-viewer-next"><ChevronRight size={30} color="#FFF" /></TouchableOpacity>
            <View style={[st.counter, { top: 24 }]} testID="photo-viewer-counter"><Text style={st.counterTxt}>{index + 1}/{n}</Text></View>
          </>
        )}
        <TouchableOpacity style={[st.close, { top: 20 }]} onPress={onClose} testID="photo-viewer-close"><X size={22} color="#FFF" /></TouchableOpacity>
      </View>
    </Modal>
  );
}

function NativePhotoViewer({ photos, startIndex, visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const ins = useSafeAreaInsets();
  const [index, setIndex] = useState<number>(startIndex);
  const [zoomed, setZoomed] = useState<boolean>(false);

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose} onShow={() => setIndex(startIndex)} statusBarTranslucent>
      <GestureHandlerRootView style={st.root}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          scrollEnabled={!zoomed}
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(u, i) => `${u}-${i}`}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => <ZoomableImage uri={item} width={width} height={height} onZoomChange={setZoomed} />}
        />
        <TouchableOpacity style={[st.close, { top: ins.top + 10 }]} onPress={onClose} testID="photo-viewer-close" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={22} color="#FFF" />
        </TouchableOpacity>
        {photos.length > 1 && (
          <View style={[st.counter, { top: ins.top + 14 }]} testID="photo-viewer-counter">
            <Text style={st.counterTxt}>{index + 1}/{photos.length}</Text>
          </View>
        )}
        <Text style={[st.hint, { bottom: ins.bottom + 18 }]}>Pinch or double-tap to zoom</Text>
      </GestureHandlerRootView>
    </Modal>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  close: { position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  counter: { position: "absolute", right: 16, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  counterTxt: { color: "#FFF", fontSize: 12, fontWeight: "700" as const },
  webBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  webFrame: { width: "min(860px, 80vw)" as unknown as number, height: "82vh" as unknown as number, borderRadius: 16, overflow: "hidden", backgroundColor: "#000" },
  webImg: { width: "100%", height: "100%" },
  arrow: { position: "absolute", top: "50%" as unknown as number, marginTop: -28, width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  hint: { position: "absolute", alignSelf: "center", color: "rgba(255,255,255,0.55)", fontSize: 12 },
});
