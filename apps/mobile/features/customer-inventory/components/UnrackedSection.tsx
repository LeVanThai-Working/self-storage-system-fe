import React from "react";
import { View, Pressable } from "react-native";
import { ChevronRight, MapPin, PackageOpen, PackagePlus } from "lucide-react-native";
import type { TreeTierItem } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { sumItemsQuantity } from "../utils/rackMapFormat";
import { TierHighlightPulse } from "./TierHighlightPulse";

interface UnrackedSectionProps {
  items: TreeTierItem[];
  onPress: () => void;
  /** Floor location label, e.g. "HN01-A101-FLOOR". */
  locationLabel?: string;
  /** Shows a "stock in to the floor" button (units without racks keep everything on the floor). */
  onStockIn?: () => void;
  /** The SKU found by "find items" is stored on the floor of this unit. */
  highlighted?: boolean;
  /** A "find items" result is shown elsewhere, so this card fades out. */
  dimmed?: boolean;
}

export function UnrackedSection({
  items,
  onPress,
  locationLabel,
  onStockIn,
  highlighted = false,
  dimmed = false,
}: UnrackedSectionProps) {
  const { t } = useTranslation();

  return (
    <View
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-neutral-900 ${
        highlighted ? "border-cta" : "border-neutral-border dark:border-neutral-800"
      } ${dimmed ? "opacity-40" : ""}`}
    >
      <Pressable onPress={onPress} className="flex-row items-center gap-3 p-4 active:opacity-90">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand/20">
          <PackageOpen size={20} color="#0B927E" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {t("rackMap.unracked.summary", { qty: sumItemsQuantity(items) })}
          </Text>
          {locationLabel ? (
            <Text numberOfLines={1} className="mt-0.5 font-mono text-[11px] font-bold text-brand">
              {locationLabel}
            </Text>
          ) : null}
          <Text numberOfLines={1} variant="muted" className="mt-0.5 text-[11px]">
            {items.length > 0
              ? items.map((item) => item.sku.skuCode).join(", ")
              : t("rackMap.unracked.empty")}
          </Text>
        </View>
        {highlighted ? (
          <View className="flex-row items-center gap-1 rounded-full bg-cta px-2 py-0.5">
            <MapPin size={11} color="#FFFFFF" />
            <Text className="text-[10px] font-bold text-white">{t("rackMap.locate.here")}</Text>
          </View>
        ) : (
          <ChevronRight size={18} color="#647B80" />
        )}
      </Pressable>
      {onStockIn ? (
        <Pressable
          onPress={onStockIn}
          className="mx-4 mb-4 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 active:opacity-90"
        >
          <PackagePlus size={14} color="#FFFFFF" />
          <Text className="text-xs font-bold text-white">{t("rackMap.unracked.stockIn")}</Text>
        </Pressable>
      ) : null}
      {highlighted ? <TierHighlightPulse className="rounded-3xl" /> : null}
    </View>
  );
}
