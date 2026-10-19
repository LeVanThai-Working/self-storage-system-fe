import React from "react";
import { View } from "react-native";
import { RackTierStatusEnum } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { getTierVisual } from "../utils/rackMapFormat";

const LEGEND_STATUSES = [
  RackTierStatusEnum.AVAILABLE,
  RackTierStatusEnum.OCCUPIED,
  RackTierStatusEnum.MAINTENANCE,
  RackTierStatusEnum.INACTIVE,
];

export function RackStatusLegend() {
  const { t } = useTranslation();

  return (
    <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
      {LEGEND_STATUSES.map((status) => {
        const visual = getTierVisual(status);
        return (
          <View key={status} className="flex-row items-center gap-1.5">
            <View className={`h-3.5 w-3.5 rounded ${visual.containerClassName}`} />
            <Text className="text-[11px] text-neutral-600 dark:text-neutral-300">
              {t(visual.labelKey)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
