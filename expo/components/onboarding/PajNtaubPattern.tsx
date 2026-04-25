import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Path, Rect, G } from "react-native-svg";
import Colors from "@/constants/colors";

type Props = { opacity?: number; color?: string; testID?: string };

function PajNtaubPattern({ opacity = 0.06, color = Colors.gold, testID }: Props) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]} testID={testID}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="hmong" patternUnits="userSpaceOnUse" width={48} height={48}>
            <G stroke={color} strokeWidth={1.2} fill="none">
              <Path d="M24 4 L44 24 L24 44 L4 24 Z" />
              <Path d="M24 14 L34 24 L24 34 L14 24 Z" />
              <Path d="M24 20 L28 24 L24 28 L20 24 Z" fill={color} />
              <Path d="M0 0 L8 8 M48 0 L40 8 M0 48 L8 40 M48 48 L40 40" />
            </G>
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hmong)" />
      </Svg>
    </View>
  );
}

export default memo(PajNtaubPattern);
