import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import type { TierDisplayStatus } from "../utils/rackMapFormat";

const BADGE_STYLE: Record<
  TierDisplayStatus,
  { container: string; text: string; labelKey: string }
> = {
  available: {
    container: "bg-neutral-100 dark:bg-neutral-800",
    text: "text-neutral-600 dark:text-neutral-300",
    labelKey: "rackMap.status.available",
  },
  occupied: {
    container: "bg-brand-light dark:bg-brand/20",
    text: "text-brand",
    labelKey: "rackMap.status.occupied",
  },
  maintenance: {
    container: "bg-cta-light dark:bg-cta/20",
    text: "text-cta-dark",
    labelKey: "rackMap.status.maintenance",
  },
  inactive: {
    container: "bg-red-100 dark:bg-red-950/50",
    text: "text-red-700 dark:text-red-300",
    labelKey: "rackMap.status.inactive",
  },
};

export function TierStatusBadge({ status }: { status: TierDisplayStatus }) {
  const { t } = useTranslation();
  const style = BADGE_STYLE[status];

  return (
    <View className={`rounded-full px-2.5 py-0.5 ${style.container}`}>
      <Text className={`text-[11px] font-bold ${style.text}`}>{t(style.labelKey)}</Text>
    </View>
  );
}
