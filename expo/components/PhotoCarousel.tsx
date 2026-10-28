import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { Image } from "expo-image";

type Props = { photos: string[]; height: number; counterTop?: number };

/** Full-width swipeable photo gallery with a "1/4" counter. */
export function PhotoCarousel({ photos, height, counterTop = 16 }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState<number>(0);
  const list = photos.filter(Boolean);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ height, width }} testID="photo-carousel">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
      >
        {list.map((uri, i) => (
          <Image key={`${uri}-${i}`} source={{ uri }} style={{ width, height }} contentFit="cover" transition={200} testID={`carousel-photo-${i}`} />
        ))}
      </ScrollView>
      {list.length > 1 && (
        <View style={[st.counter, { top: counterTop }]} pointerEvents="none" testID="photo-counter">
          <Text style={st.counterTxt}>{index + 1}/{list.length}</Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  counter: { position: "absolute", right: 16, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  counterTxt: { color: "#FFF", fontSize: 12, fontWeight: "700" as const },
});
