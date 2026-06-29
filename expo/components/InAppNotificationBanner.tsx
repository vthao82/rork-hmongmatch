import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { Heart, MessageCircle, Sparkles, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useLikes } from "@/providers/LikesProvider";
import { useMyMatches } from "@/lib/discoverProfiles";
import { useChatThreads } from "@/lib/chat";

const DISMISSED_KEY = "hmongdate.inapp.banner.dismissed.v1";

/**
 * In-app notification banner shown on app open / tab change when there's new
 * activity (new match, new like, new unread message). Auto-dismisses on tap.
 * This is the no-native-push version of the notification system; native push
 * via expo-notifications + FCM can be added later without changing this banner.
 */
export default function InAppNotificationBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const ins = useSafeAreaInsets();
  const { likedIds } = useLikes();
  const { matchIds } = useMyMatches();
  const { threads } = useChatThreads();
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [lastShown, setLastShown] = useState<number>(0);
  const opacity = useRef(new Animated.Value(0)).current;

  const totalUnread = useMemo(
    () => threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0),
    [threads]
  );

  const summary = useMemo(() => {
    // Priority: messages > matches > likes
    if (totalUnread > 0) {
      return {
        icon: <MessageCircle size={18} color="#FFF" />,
        text: totalUnread === 1 ? "You have a new message" : `You have ${totalUnread} new messages`,
        onTap: () => router.push("/(tabs)/messages" as never),
      };
    }
    if (matchIds.length > 0) {
      return {
        icon: <Sparkles size={18} color="#FFF" />,
        text: matchIds.length === 1 ? "You have a new match" : `You have ${matchIds.length} matches`,
        onTap: () => router.push("/(tabs)/matches" as never),
      };
    }
    if (likedIds.length > 0) {
      return {
        icon: <Heart size={18} color="#FFF" fill="#FFF" />,
        text: `You have ${likedIds.length} like${likedIds.length === 1 ? "" : "s"}`,
        onTap: () => router.push("/(tabs)/matches" as never),
      };
    }
    return null;
  }, [totalUnread, matchIds.length, likedIds.length, router]);

  // Show banner once per app-foreground burst, only on top-level tabs
  const onTab = pathname?.startsWith("/(tabs)") || pathname === "/" || (pathname?.split("/").filter(Boolean).length ?? 0) <= 1;
  const shouldShow = !dismissed && !!summary && onTab && Date.now() - lastShown > 30_000;

  useEffect(() => {
    if (shouldShow) {
      setLastShown(Date.now());
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 140 }).start();
      const t = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setDismissed(true));
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [shouldShow, opacity]);

  if (!summary || dismissed) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[s.wrap, { top: ins.top + 8, opacity }]}>
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.9}
        onPress={() => {
          summary.onTap();
          setDismissed(true);
        }}
        testID="inapp-banner"
      >
        <View style={s.iconWrap}>{summary.icon}</View>
        <Text style={s.text} numberOfLines={2}>{summary.text}</Text>
        <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} testID="dismiss-banner">
          <X size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

void DISMISSED_KEY;

const s = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    ...(Platform.OS === "android" ? { elevation: 20 } : {}),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, color: "#FFF", fontSize: 14, fontWeight: "700" as const },
});
