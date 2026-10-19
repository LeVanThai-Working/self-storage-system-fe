import React from "react";
import { View, Pressable } from "react-native";
import { ChevronRight, PackageOpen } from "lucide-react-native";
import type { TreeTierItem } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { sumItemsQuantity } from "../utils/rackMapFormat";

interface UnrackedSectionProps {
  items: TreeTierItem[];
  onPress: () => void;
}

export function UnrackedSection({ items, onPress }: UnrackedSectionProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-3xl border border-neutral-border bg-white p-4 shadow-sm active:opacity-90 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand/20">
        <PackageOpen size={20} color="#0B927E" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {t("rackMap.unracked.summary", { qty: sumItemsQuantity(items) })}
        </Text>
        <Text numberOfLines={1} variant="muted" className="mt-0.5 text-[11px]">
          {items.length > 0
            ? items.map((item) => item.sku.skuCode).join(", ")
            : t("rackMap.unracked.empty")}
        </Text>
      </View>
      <ChevronRight size={18} color="#647B80" />
    </Pressable>
  );
}
