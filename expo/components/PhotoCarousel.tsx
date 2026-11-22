import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Image } from "expo-image";
import { PhotoViewer } from "@/components/PhotoViewer";

type Props = { photos: string[]; counterTop?: number };

/** Full-width swipeable gallery showing each whole photo (never cropped); tap to zoom. */
export function PhotoCarousel({ photos, counterTop = 16 }: Props) {
  const { width, height: screenH } = useWindowDimensions();
  const height = Math.round(Math.min((width * 4) / 3, screenH * 0.72));
  const [index, setIndex] = useState<number>(0);
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const list = photos.filter(Boolean);
  const ref = useRef<ScrollView>(null);
  // Browsers have no swipe with a mouse, so show arrows
  const go = (d: number) => {
    const i = (index + d + list.length) % list.length;
    ref.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ height, width, backgroundColor: "#000" }} testID="photo-carousel">
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} scrollEventThrottle={16}>
        {list.map((uri, i) => (
          <Pressable key={`${uri}-${i}`} onPress={() => setViewerOpen(true)} testID={`carousel-photo-${i}`}>
            <Image source={{ uri }} style={{ width, height }} contentFit="contain" transition={200} />
          </Pressable>
        ))}
      </ScrollView>
      {list.length > 1 && (
        <View style={[st.counter, { top: counterTop }]} pointerEvents="none" testID="photo-counter">
          <Text style={st.counterTxt}>{index + 1}/{list.length}</Text>
        </View>
      )}
      {Platform.OS === "web" && list.length > 1 && (
        <>
          <Pressable style={[st.arrow, { left: 16 }]} onPress={() => go(-1)} testID="carousel-prev"><ChevronLeft size={26} color="#FFF" /></Pressable>
          <Pressable style={[st.arrow, { right: 16 }]} onPress={() => go(1)} testID="carousel-next"><ChevronRight size={26} color="#FFF" /></Pressable>
        </>
      )}
      <PhotoViewer photos={list} startIndex={index} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </View>
  );
}

const st = StyleSheet.create({
  counter: { position: "absolute", right: 16, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  arrow: { position: "absolute", top: "50%" as unknown as number, marginTop: -24, width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  counterTxt: { color: "#FFF", fontSize: 12, fontWeight: "700" as const },
});
