import React from "react";
import { View, Pressable } from "react-native";
import { Lock, Wrench } from "lucide-react-native";
import { RackTierStatusEnum, type TreeTier } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { buildLocationLabel, getTierVisual, getTierWeight } from "../utils/rackMapFormat";

const MAX_VISIBLE_CHIPS = 2;

interface TierCellProps {
  tier: TreeTier;
  unitNumber?: string;
  onPress: (tier: TreeTier) => void;
}

export function TierCell({ tier, unitNumber, onPress }: TierCellProps) {
  const { t } = useTranslation();
  const visual = getTierVisual(tier.status);
  const weight = getTierWeight(tier);
  const visibleItems = tier.items.slice(0, MAX_VISIBLE_CHIPS);
  const hiddenCount = tier.items.length - visibleItems.length;

  return (
    <Pressable
      onPress={() => onPress(tier)}
      className={`rounded-2xl px-3.5 py-3 gap-2 active:opacity-80 ${visual.containerClassName}`}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1.5 flex-1">
          {tier.status === RackTierStatusEnum.MAINTENANCE ? (
            <Wrench size={13} color="#D34D0F" />
          ) : tier.status === RackTierStatusEnum.INACTIVE ? (
            <Lock size={13} color="#647B80" />
          ) : null}
          <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
            {t("rackMap.tierTitle", { number: tier.tierNumber })}
          </Text>
          <Text numberOfLines={1} className="flex-1 font-mono text-[11px] text-neutral-muted">
            {buildLocationLabel(unitNumber, tier.tierCode)}
          </Text>
        </View>
        {weight.level === "over" || weight.level === "near" ? (
          <View
            className={`rounded-full px-2 py-0.5 ${
              weight.level === "over" ? "bg-cta" : "bg-cta-light"
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                weight.level === "over" ? "text-white" : "text-cta-dark"
              }`}
            >
              {t(weight.level === "over" ? "rackMap.weight.over" : "rackMap.weight.nearFull")}
            </Text>
          </View>
        ) : null}
      </View>

      {visual.locked ? (
        <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
          {t(visual.labelKey)}
        </Text>
      ) : tier.items.length === 0 ? (
        <Text variant="muted" className="text-[11px]">
          {t("rackMap.empty")}
        </Text>
      ) : (
        <View className="flex-row flex-wrap gap-1.5">
          {visibleItems.map((item) => (
            <View
              key={item.inventoryId}
              className="rounded-lg border border-brand/30 bg-white dark:bg-neutral-900 px-2 py-0.5"
            >
              <Text className="text-[11px] font-bold text-brand-dark dark:text-brand-light">
                {t("rackMap.itemChip", { code: item.sku.skuCode, qty: item.quantity })}
              </Text>
            </View>
          ))}
          {hiddenCount > 0 ? (
            <View className="rounded-lg bg-brand-light dark:bg-brand/20 px-2 py-0.5">
              <Text className="text-[11px] font-bold text-brand">
                {t("rackMap.moreItems", { count: hiddenCount })}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
