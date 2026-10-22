import React from "react";
import { View } from "react-native";
import { Layers, Package, Tag } from "lucide-react-native";
import type { StorageUnitInventoryTreeSummary } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { RackStatusLegend } from "./RackStatusLegend";

interface RackMapSummaryBarProps {
  summary: StorageUnitInventoryTreeSummary;
  showTiers: boolean;
}

export function RackMapSummaryBar({ summary, showTiers }: RackMapSummaryBarProps) {
  const { t } = useTranslation();
  const fillPercent =
    summary.totalTiers > 0 ? Math.round((summary.occupiedTiers / summary.totalTiers) * 100) : 0;

  const stats = [
    {
      key: "quantity",
      Icon: Package,
      value: String(summary.totalQuantity),
      label: t("rackMap.summary.totalQuantity"),
    },
    {
      key: "skus",
      Icon: Tag,
      value: String(summary.totalSkus),
      label: t("rackMap.summary.totalSkus"),
    },
    ...(showTiers
      ? [
          {
            key: "tiers",
            Icon: Layers,
            value: `${summary.occupiedTiers}/${summary.totalTiers}`,
            label: t("rackMap.summary.tiersUsed"),
          },
        ]
      : []),
  ];

  return (
    <View className="gap-3.5 rounded-3xl border border-neutral-border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row">
        {stats.map((stat, index) => (
          <View
            key={stat.key}
            className={`flex-1 gap-1 ${
              index > 0 ? "border-l border-neutral-border pl-3 dark:border-neutral-800" : ""
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <stat.Icon size={16} color="#0B927E" />
              <Text className="text-xl font-extrabold text-neutral-dark dark:text-neutral-100">
                {stat.value}
              </Text>
            </View>
            <Text variant="muted" className="text-[11px] leading-4">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {showTiers ? (
        <>
          <View className="flex-row items-center gap-2.5">
            <View className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <View className="h-2 rounded-full bg-brand" style={{ width: `${fillPercent}%` }} />
            </View>
            <Text className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              {fillPercent}%
            </Text>
          </View>
          <RackStatusLegend />
        </>
      ) : null}
    </View>
  );
}
