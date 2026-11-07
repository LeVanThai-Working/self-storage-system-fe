import React from "react";
import { View, Pressable } from "react-native";
import { MapPin } from "lucide-react-native";
import type { SkuLocationsResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";

interface LocateResultBannerProps {
  result: SkuLocationsResponse;
  onClear: () => void;
}

/** Bottom bar shown while located tiers are highlighted on the map. */
export function LocateResultBanner({ result, onClear }: LocateResultBannerProps) {
  const { t } = useTranslation();

  return (
    <View className="absolute inset-x-0 bottom-0 flex-row items-center gap-2 border-t border-cta/30 bg-cta-light px-4 pb-6 pt-4 dark:bg-neutral-900">
      <MapPin size={16} color="#D34D0F" />
      <Text numberOfLines={1} className="flex-1 text-xs font-bold text-cta-dark">
        {t("rackMap.locate.highlighting", {
          sku: result.sku.skuCode,
          count: result.locations.length,
        })}
      </Text>
      <Pressable onPress={onClear} hitSlop={8} className="active:opacity-70">
        <Text className="text-xs font-bold text-cta-dark">{t("rackMap.locate.clear")}</Text>
      </Pressable>
    </View>
  );
}
