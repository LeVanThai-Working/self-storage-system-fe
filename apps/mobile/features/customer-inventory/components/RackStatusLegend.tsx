import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import type { TierDisplayStatus } from "../utils/rackMapFormat";

const LEGEND: { status: TierDisplayStatus; dotClassName: string; labelKey: string }[] = [
  { status: "occupied", dotClassName: "bg-brand", labelKey: "rackMap.status.occupied" },
  {
    status: "available",
    dotClassName:
      "border border-neutral-300 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800",
    labelKey: "rackMap.status.available",
  },
  { status: "maintenance", dotClassName: "bg-cta", labelKey: "rackMap.status.maintenance" },
  { status: "inactive", dotClassName: "bg-red-500", labelKey: "rackMap.status.inactive" },
];

export function RackStatusLegend() {
  const { t } = useTranslation();

  return (
    <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1.5">
      {LEGEND.map((entry) => (
        <View key={entry.status} className="flex-row items-center gap-1.5">
          <View className={`h-2.5 w-2.5 rounded-full ${entry.dotClassName}`} />
          <Text className="text-[11px] text-neutral-600 dark:text-neutral-300">
            {t(entry.labelKey)}
          </Text>
        </View>
      ))}
    </View>
  );
}
