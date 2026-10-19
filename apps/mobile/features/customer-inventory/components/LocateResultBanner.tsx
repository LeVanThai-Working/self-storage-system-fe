import React from "react";
import { View, Pressable } from "react-native";
import { MapPin, X } from "lucide-react-native";
import type { SkuLocationsResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";

interface LocateResultBannerProps {
  result: SkuLocationsResponse;
  onClear: () => void;
}

/** Floating pill shown while located tiers are highlighted on the map. */
export function LocateResultBanner({ result, onClear }: LocateResultBannerProps) {
  const { t } = useTranslation();

  return (
    <View className="absolute inset-x-4 bottom-6 flex-row items-center gap-2 rounded-full border border-cta/40 bg-white py-2 pl-4 pr-2 shadow-lg dark:bg-neutral-900">
      <MapPin size={15} color="#FF702E" />
      <Text
        numberOfLines={1}
        className="flex-1 text-xs font-semibold text-neutral-dark dark:text-neutral-100"
      >
        {t("rackMap.locate.highlighting", {
          sku: result.sku.skuCode,
          count: result.locations.length,
        })}
      </Text>
      <Pressable
        onPress={onClear}
        className="flex-row items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 active:opacity-80 dark:bg-neutral-800"
      >
        <X size={12} color="#647B80" />
        <Text className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
          {t("rackMap.locate.clear")}
        </Text>
      </Pressable>
    </View>
  );
}
