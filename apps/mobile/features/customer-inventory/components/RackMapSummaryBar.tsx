import React from "react";
import { View } from "react-native";
import type { StorageUnitInventoryTreeSummary } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";

interface RackMapSummaryBarProps {
  summary: StorageUnitInventoryTreeSummary;
  showTiers: boolean;
}

export function RackMapSummaryBar({ summary, showTiers }: RackMapSummaryBarProps) {
  const { t } = useTranslation();
  const fillPercent =
    summary.totalTiers > 0 ? Math.round((summary.occupiedTiers / summary.totalTiers) * 100) : 0;

  const stats = [
    { key: "quantity", label: t("rackMap.summary.totalQuantity"), value: summary.totalQuantity },
    { key: "skus", label: t("rackMap.summary.totalSkus"), value: summary.totalSkus },
    ...(showTiers
      ? [
          {
            key: "tiers",
            label: t("rackMap.summary.tiersUsed"),
            value: `${summary.occupiedTiers}/${summary.totalTiers}`,
          },
        ]
      : []),
  ];

  return (
    <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
      <View className="flex-row gap-2">
        {stats.map((stat) => (
          <View
            key={stat.key}
            className="flex-1 rounded-2xl bg-brand-bg dark:bg-brand/10 px-3 py-2.5 items-center"
          >
            <Text className="text-lg font-extrabold text-brand">{stat.value}</Text>
            <Text variant="muted" numberOfLines={1} className="text-[11px]">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {showTiers ? (
        <View className="gap-1">
          <View className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <View className="h-2 rounded-full bg-brand" style={{ width: `${fillPercent}%` }} />
          </View>
          <Text variant="muted" className="text-[11px]">
            {t("rackMap.summary.fillRate", { percent: fillPercent })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
