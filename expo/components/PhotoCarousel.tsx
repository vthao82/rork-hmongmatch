import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
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

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ height, width, backgroundColor: "#000" }} testID="photo-carousel">
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} scrollEventThrottle={16}>
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
      <PhotoViewer photos={list} startIndex={index} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </View>
  );
}

const st = StyleSheet.create({
  counter: { position: "absolute", right: 16, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  counterTxt: { color: "#FFF", fontSize: 12, fontWeight: "700" as const },
});
