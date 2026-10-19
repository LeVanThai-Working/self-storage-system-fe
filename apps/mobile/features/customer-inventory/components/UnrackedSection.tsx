import React from "react";
import { View, Pressable } from "react-native";
import { ChevronRight, PackageOpen } from "lucide-react-native";
import type { TreeTierItem } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";

interface UnrackedSectionProps {
  items: TreeTierItem[];
  onPress: () => void;
}

export function UnrackedSection({ items, onPress }: UnrackedSectionProps) {
  const { t } = useTranslation();
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3 active:opacity-90"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
            <PackageOpen size={16} color="#647B80" />
          </View>
          <Text className="flex-1 text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {t("rackMap.unracked.title")}
          </Text>
        </View>
        <ChevronRight size={16} color="#647B80" />
      </View>

      {items.length === 0 ? (
        <Text variant="muted" className="text-[11px]">
          {t("rackMap.unracked.empty")}
        </Text>
      ) : (
        <View className="gap-1.5">
          {items.map((item) => (
            <View key={item.inventoryId} className="flex-row items-center justify-between">
              <Text
                numberOfLines={1}
                className="flex-1 text-xs text-neutral-700 dark:text-neutral-200"
              >
                <Text className="text-xs font-bold">{item.sku.skuCode}</Text> · {item.sku.name}
              </Text>
              <Text className="text-xs font-bold text-brand">
                {item.quantity} {item.sku.uom}
              </Text>
            </View>
          ))}
          <Text variant="muted" className="text-[11px]">
            {t("rackMap.unracked.total", { qty: totalQuantity })}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
