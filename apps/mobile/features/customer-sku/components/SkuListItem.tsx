import React from "react";
import { Pressable, View } from "react-native";
import { Barcode } from "lucide-react-native";
import { CustomerSkuStatusEnum, type CustomerSkuResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { SkuThumb } from "@/features/customer-inventory/components/SkuThumb";
import type { SkuStockTotal } from "@/features/customer-inventory/hooks/useCustomerInventory";
import { formatSkuSpec } from "../utils/skuFormat";

interface SkuListItemProps {
  sku: CustomerSkuResponse;
  stock?: SkuStockTotal;
  onPress: () => void;
}

/** Catalog row (C10): picture, name, code, barcode, spec line, category tag and stock. */
export function SkuListItem({ sku, stock, onPress }: SkuListItemProps) {
  const { t } = useTranslation();
  const inactive = sku.status === CustomerSkuStatusEnum.INACTIVE;
  const spec = formatSkuSpec(sku);
  const quantity = stock?.quantity ?? 0;

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row gap-3 rounded-3xl border border-neutral-border bg-white p-3 active:opacity-80 dark:border-neutral-800 dark:bg-neutral-900",
        inactive && "opacity-70"
      )}
    >
      <SkuThumb imageUrl={sku.imageUrl} size="md" />

      <View className="flex-1 gap-0.5">
        <Text
          numberOfLines={1}
          className="text-sm font-bold text-neutral-dark dark:text-neutral-100"
        >
          {sku.name}
        </Text>
        <Text className="text-[11px] font-bold text-neutral-muted">{sku.skuCode}</Text>
        {sku.barcode ? (
          <View className="flex-row items-center gap-1">
            <Barcode size={11} color="#647B80" />
            <Text variant="muted" className="text-[10px]">
              {sku.barcode}
            </Text>
          </View>
        ) : null}
        {spec ? (
          <Text variant="muted" numberOfLines={1} className="text-[10px]">
            {spec}
          </Text>
        ) : null}
        <View className="mt-1 flex-row gap-1.5">
          {inactive ? (
            <Text className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-muted dark:bg-neutral-800">
              {t("sku.status.inactive")}
            </Text>
          ) : sku.category ? (
            <Text className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand dark:bg-brand/20">
              {sku.category}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="items-end justify-between">
        <Text
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-bold",
            quantity > 0
              ? "bg-brand-light text-brand dark:bg-brand/20"
              : "bg-neutral-100 text-neutral-muted dark:bg-neutral-800"
          )}
        >
          {quantity} {sku.uom}
        </Text>
        <Text variant="muted" className="text-[10px]">
          {t("sku.locationCount", { count: stock?.locationCount ?? 0 })}
        </Text>
      </View>
    </Pressable>
  );
}
