import React from "react";
import { View, Pressable } from "react-native";
import { MapPin, X } from "lucide-react-native";
import type { SkuLocationsResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { buildLocationLabel } from "../utils/rackMapFormat";

interface LocateResultBannerProps {
  result: SkuLocationsResponse;
  currentStorageUnitId: string;
  onClear: () => void;
}

export function LocateResultBanner({
  result,
  currentStorageUnitId,
  onClear,
}: LocateResultBannerProps) {
  const { t } = useTranslation();
  const { sku, locations } = result;

  const describe = (location: SkuLocationsResponse["locations"][number]) => {
    const unitNumber = location.storageUnit?.unitNumber;
    const position = location.rackTier
      ? buildLocationLabel(unitNumber, location.rackTier.tierCode)
      : `${unitNumber ?? ""} · ${t("rackMap.form.floor")}`;
    if (location.storageUnit?.id === currentStorageUnitId) return position;
    return `${position} (${location.facility?.name ?? t("rackMap.locate.otherUnit")})`;
  };

  return (
    <View className="absolute inset-x-4 bottom-6 rounded-2xl border border-cta/50 bg-white dark:bg-neutral-900 p-3.5 shadow-lg gap-1.5">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1.5 flex-1">
          <MapPin size={14} color="#FF702E" />
          <Text className="flex-1 text-xs font-bold text-neutral-dark dark:text-neutral-100">
            {locations.length > 0
              ? t("rackMap.locate.result", { sku: sku.skuCode, count: locations.length })
              : t("rackMap.locate.resultNone", { sku: sku.skuCode })}
          </Text>
        </View>
        <Pressable
          onPress={onClear}
          className="flex-row items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2 py-1"
        >
          <X size={12} color="#647B80" />
          <Text className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
            {t("rackMap.locate.clear")}
          </Text>
        </Pressable>
      </View>
      {locations.map((location) => (
        <Text
          key={location.inventoryId}
          className="text-[11px] text-neutral-700 dark:text-neutral-300"
        >
          • <Text className="font-mono text-[11px] font-bold">{describe(location)}</Text>
          {"  "}
          {location.quantity} {sku.uom}
        </Text>
      ))}
    </View>
  );
}
