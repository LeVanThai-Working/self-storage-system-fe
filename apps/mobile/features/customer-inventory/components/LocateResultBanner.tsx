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

/** Floating orange pill shown while located tiers are highlighted on the map. */
export function LocateResultBanner({ result, onClear }: LocateResultBannerProps) {
  const { t } = useTranslation();

  return (
    <View className="absolute inset-x-4 bottom-6 flex-row items-center gap-2 rounded-full bg-cta py-2.5 pl-4 pr-2 shadow-lg">
      <MapPin size={16} color="#FFFFFF" />
      <Text numberOfLines={1} className="flex-1 text-xs font-bold text-white">
        {t("rackMap.locate.highlighting", {
          sku: result.sku.skuCode,
          count: result.locations.length,
        })}
      </Text>
      <Pressable
        onPress={onClear}
        className="flex-row items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 active:opacity-80"
      >
        <X size={12} color="#FFFFFF" />
        <Text className="text-[11px] font-bold text-white">{t("rackMap.locate.clear")}</Text>
      </Pressable>
    </View>
  );
}
