import React from "react";
import { View, Pressable } from "react-native";
import { ChevronRight, Circle, Lock, Package, TriangleAlert, Wrench } from "lucide-react-native";
import type { TreeTier } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { getTierBarVariant, type TierBarVariant } from "../utils/rackMapFormat";
import { TierHighlightPulse } from "./TierHighlightPulse";

const BAR_STYLE: Record<
  TierBarVariant,
  { container: string; text: string; extraBg: string; extraText: string; iconColor: string }
> = {
  occupied: {
    container: "bg-brand",
    text: "text-white",
    extraBg: "bg-white/25",
    extraText: "text-white",
    iconColor: "#FFFFFF",
  },
  warning: {
    container: "border border-cta bg-cta-light dark:bg-cta/20",
    text: "text-cta-dark",
    extraBg: "bg-white/80",
    extraText: "text-cta-dark",
    iconColor: "#D34D0F",
  },
  available: {
    container: "bg-neutral-100 dark:bg-neutral-800",
    text: "text-neutral-muted",
    extraBg: "bg-white",
    extraText: "text-neutral-muted",
    iconColor: "#94A3B8",
  },
  maintenance: {
    container: "border border-dashed border-cta/60 bg-cta-light/60 dark:bg-cta/15",
    text: "text-cta-dark",
    extraBg: "bg-white/80",
    extraText: "text-cta-dark",
    iconColor: "#D34D0F",
  },
  inactive: {
    container: "border border-red-200 bg-red-100 dark:border-red-900 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    extraBg: "bg-white/80",
    extraText: "text-red-700",
    iconColor: "#DC2626",
  },
};

interface TierCellProps {
  tier: TreeTier;
  highlighted?: boolean;
  onPress: (tier: TreeTier) => void;
}

/** One shelf of the 2D rack: a colored bar showing the main item and the tier state. */
export function TierCell({ tier, highlighted = false, onPress }: TierCellProps) {
  const { t } = useTranslation();
  const variant = getTierBarVariant(tier);
  const style = BAR_STYLE[variant];
  const firstItem = tier.items[0];
  const extraCount = tier.items.length - 1;

  const label = firstItem
    ? t("rackMap.itemChip", { code: firstItem.sku.skuCode, qty: firstItem.quantity })
    : variant === "maintenance"
      ? t("rackMap.status.maintenance")
      : variant === "inactive"
        ? t("rackMap.status.inactive")
        : t("rackMap.empty");

  const leadingIcon =
    variant === "available" ? (
      <Circle size={14} color={style.iconColor} />
    ) : variant === "maintenance" && !firstItem ? (
      <Wrench size={14} color={style.iconColor} />
    ) : (
      <Package size={14} color={style.iconColor} />
    );

  const trailingIcon =
    variant === "occupied" ? (
      <ChevronRight size={16} color={style.iconColor} />
    ) : variant === "warning" ? (
      <TriangleAlert size={16} color={style.iconColor} />
    ) : variant === "maintenance" && firstItem ? (
      <Wrench size={15} color={style.iconColor} />
    ) : variant === "inactive" ? (
      <Lock size={15} color={style.iconColor} />
    ) : null;

  return (
    <Pressable
      onPress={() => onPress(tier)}
      className={`h-11 flex-row items-center gap-2 rounded-xl px-3 active:opacity-80 ${style.container}`}
    >
      {leadingIcon}
      <Text numberOfLines={1} className={`flex-shrink text-xs font-bold ${style.text}`}>
        {label}
      </Text>
      {firstItem && extraCount > 0 ? (
        <View className={`rounded-full px-1.5 py-0.5 ${style.extraBg}`}>
          <Text className={`text-[10px] font-bold ${style.extraText}`}>
            {t("rackMap.moreItems", { count: extraCount })}
          </Text>
        </View>
      ) : null}
      <View className="flex-1" />
      {trailingIcon}
      {highlighted ? <TierHighlightPulse /> : null}
    </Pressable>
  );
}
