import React, { memo, ReactNode } from "react";
import { View, StyleSheet, StatusBar, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import PajNtaubPattern from "./PajNtaubPattern";
import ProgressBar from "./ProgressBar";
import BackButton from "./BackButton";

type Props = {
  children: ReactNode;
  step?: number;
  total?: number;
  showPattern?: boolean;
  gradient?: readonly [string, string, ...string[]];
  scroll?: boolean;
  footer?: ReactNode;
  topRight?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  testID?: string;
};

const RED_GRADIENT = [Colors.indigo, "#3c0a24", Colors.crimson] as const;

function OnboardingScreen({ children, step, total, showPattern = true, gradient, scroll = true, footer, topRight, showBack = true, onBack, testID }: Props) {
  const colors = gradient ?? RED_GRADIENT;
  const Content = scroll ? ScrollView : View;
  return (
    <View style={s.root} testID={testID}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      {showPattern && <PajNtaubPattern opacity={0.05} />}
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        {showBack && (
          <View style={s.backRow}>
            <BackButton onPress={onBack} />
          </View>
        )}
        {typeof step === "number" && typeof total === "number" && (
          <View style={s.progressRow}>
            <View style={s.progressFill}>
              <ProgressBar step={step} total={total} />
            </View>
            {topRight && <View>{topRight}</View>}
          </View>
        )}
        {!step && topRight && <View style={[s.topRight, { paddingHorizontal: 20, paddingTop: 6 }]}>{topRight}</View>}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.kb}>
          <Content
            contentContainerStyle={scroll ? s.scrollContent : undefined}
            style={scroll ? s.flex : s.flex}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </Content>
          {footer && <SafeAreaView edges={["bottom"]} style={s.footer}>{footer}</SafeAreaView>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark.bg },
  safe: { flex: 1 },
  flex: { flex: 1 },
  kb: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 },
  backRow: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4, flexDirection: "row", alignItems: "center" },
  progressRow: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  progressFill: { flex: 1 },
  topRight: { position: "absolute", right: 20, top: 0 },
  footer: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18 },
});

export default memo(OnboardingScreen);
