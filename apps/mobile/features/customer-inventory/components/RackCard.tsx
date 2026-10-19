import React from "react";
import { View } from "react-native";
import { Layers } from "lucide-react-native";
import type { TreeRack, TreeTier } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { TierCell } from "./TierCell";

interface RackCardProps {
  rack: TreeRack;
  unitNumber?: string;
  onTierPress: (tier: TreeTier) => void;
}

export function RackCard({ rack, unitNumber, onTierPress }: RackCardProps) {
  const { t } = useTranslation();
  const occupied = rack.tiers.filter((tier) => tier.items.length > 0).length;

  return (
    <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-brand-light dark:bg-brand/20">
            <Layers size={16} color="#0B927E" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {t("rackMap.rackTitle", { code: rack.rackCode })}
            </Text>
            {rack.name ? (
              <Text numberOfLines={1} variant="muted" className="text-[11px]">
                {rack.name}
              </Text>
            ) : null}
          </View>
        </View>
        <Text className="text-[11px] font-semibold text-neutral-muted">
          {t("rackMap.rackUsage", { used: occupied, total: rack.tiers.length })}
        </Text>
      </View>

      <View className="gap-2">
        {rack.tiers.map((tier) => (
          <TierCell key={tier.id} tier={tier} unitNumber={unitNumber} onPress={onTierPress} />
        ))}
      </View>
    </View>
  );
}
