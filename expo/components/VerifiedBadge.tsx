import React from "react";
import { BadgeCheck } from "lucide-react-native";
import Colors from "@/constants/colors";

/**
 * Photo-verification badge that always appears next to a user's name.
 * Blue = verified (took a selfie during onboarding).
 * Orange = unverified (skipped or hasn't done it yet).
 */
export default function VerifiedBadge({
  verified,
  size = 18,
}: {
  verified: boolean;
  size?: number;
}) {
  const color = verified ? Colors.verified : Colors.unverified;
  return <BadgeCheck size={size} color={color} fill={color} />;
}
