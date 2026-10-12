import React from "react";
import { View, Image } from "react-native";
import { Wrench, Headphones, Tag, CheckCircle2 } from "lucide-react-native";
import {
  AmenityTypeEnum,
  type PublicAmenityOfferingResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/stores/language.store";
import { formatVndPrice, getAmenityTypeLabel, getBillingUnitSuffix } from "../utils/storageFormat";

interface AmenityOfferingCardProps {
  offering: PublicAmenityOfferingResponse & {
    imageUrl?: string | null;
    images?: string[] | null;
  };
}

export function AmenityOfferingCard({ offering }: AmenityOfferingCardProps) {
  const { t } = useTranslation();
  const { amenity, pricePerUnit, billingUnit, availableQuantity } = offering;

  const isPhysical = amenity.type === AmenityTypeEnum.PHYSICAL;
  const isFree = pricePerUnit === 0;
  const thumbnailUri = offering.imageUrl || offering.images?.[0] || amenity.images?.[0] || null;

  return (
    <View className="w-full flex-row items-start gap-3.5 rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 shadow-sm">
      {/* 1. Left: Thumbnail Image */}
      <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-neutral-border/60 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : isPhysical ? (
          <Wrench size={26} color="#0B927E" />
        ) : (
          <Headphones size={26} color="#0B927E" />
        )}
      </View>

      {/* 2. Right: Amenity Details */}
      <View className="flex-1 justify-between gap-1.5">
        {/* Header Row: Name + Type & Price Badge */}
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="text-sm font-bold text-neutral-dark dark:text-neutral-100"
            >
              {amenity.name}
            </Text>
            <Text className="mt-0.5 text-[11px] font-semibold text-brand">
              {getAmenityTypeLabel(amenity.type, t)}
            </Text>
          </View>

          <Badge
            variant="outline"
            className={
              isFree
                ? "border-brand/40 bg-brand-light/50 dark:bg-brand/20"
                : "border-cta/40 bg-cta-light/50 dark:bg-cta/20"
            }
          >
            <Text className={`text-[11px] font-bold ${isFree ? "text-brand" : "text-cta"}`}>
              {isFree
                ? t("facilityDetail.freeAmenity")
                : `${formatVndPrice(pricePerUnit)} ${getBillingUnitSuffix(billingUnit, t)}`}
            </Text>
          </Badge>
        </View>

        {/* Description */}
        {amenity.description ? (
          <Text
            variant="muted"
            numberOfLines={2}
            className="text-xs leading-4 text-neutral-main dark:text-neutral-300"
          >
            {amenity.description}
          </Text>
        ) : null}

        {/* Tags */}
        {amenity.tags && amenity.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5">
            {amenity.tags.map((tag, idx) => (
              <View
                key={`${offering.id}-tag-${idx}`}
                className="flex-row items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5"
              >
                <Tag size={10} color="#647B80" />
                <Text className="text-[10px] text-neutral-main dark:text-neutral-300">{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Available Quantity */}
        <View className="flex-row items-center gap-1.5 border-t border-neutral-border/60 dark:border-neutral-800 pt-1.5">
          <CheckCircle2 size={12} color="#0B927E" />
          <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
            {t("facilityDetail.availableAmenityQty", { count: availableQuantity })}
          </Text>
        </View>
      </View>
    </View>
  );
}
