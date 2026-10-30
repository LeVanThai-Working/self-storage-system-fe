import React from "react";
import { View } from "react-native";
import { Text } from "./text";
import { cn } from "@/lib/utils";

export type StatusTone =
  "yellow" | "orange" | "blue" | "purple" | "green" | "red" | "gray" | "brown";

export const TONE_CLASS: Record<StatusTone, { container: string; text: string }> = {
  yellow: {
    container: "bg-amber-100 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
  },
  orange: { container: "bg-cta-light dark:bg-cta/20", text: "text-cta-dark" },
  blue: { container: "bg-blue-100 dark:bg-blue-950/50", text: "text-blue-700 dark:text-blue-300" },
  purple: {
    container: "bg-violet-100 dark:bg-violet-950/50",
    text: "text-violet-700 dark:text-violet-300",
  },
  green: { container: "bg-brand-light dark:bg-brand/20", text: "text-brand" },
  red: { container: "bg-red-100 dark:bg-red-950/50", text: "text-red-700 dark:text-red-300" },
  gray: {
    container: "bg-neutral-100 dark:bg-neutral-800",
    text: "text-neutral-600 dark:text-neutral-300",
  },
  brown: {
    container: "bg-orange-100 dark:bg-orange-950/40",
    text: "text-orange-900 dark:text-orange-300",
  },
};

interface StatusPillProps {
  label: string;
  tone: StatusTone;
  className?: string;
}

/** Small colored status pill used for requests, tickets and incidents. */
export function StatusPill({ label, tone, className }: StatusPillProps) {
  const style = TONE_CLASS[tone];
  return (
    <View className={cn("self-start rounded-full px-2.5 py-0.5", style.container, className)}>
      <Text className={cn("text-[11px] font-bold", style.text)}>{label}</Text>
    </View>
  );
}
