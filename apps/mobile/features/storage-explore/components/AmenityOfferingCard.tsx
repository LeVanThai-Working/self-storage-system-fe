import React from "react";
import { View, ScrollView, Image } from "react-native";
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
  offering: PublicAmenityOfferingResponse;
}

export function AmenityOfferingCard({ offering }: AmenityOfferingCardProps) {
  const { t } = useTranslation();
  const { amenity, pricePerUnit, billingUnit, availableQuantity } = offering;

  const isPhysical = amenity.type === AmenityTypeEnum.PHYSICAL;
  const isFree = pricePerUnit === 0;

  return (
    <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      {/* Header Row: Icon, Name, Type Badge */}
      <View className="flex-row items-start justify-between gap-2.5 mb-2">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-light dark:bg-brand/20">
            {isPhysical ? (
              <Wrench size={17} color="#0B927E" />
            ) : (
              <Headphones size={17} color="#0B927E" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {amenity.name}
            </Text>
            <Text className="text-[11px] font-semibold text-brand mt-0.5">
              {getAmenityTypeLabel(amenity.type, t)}
            </Text>
          </View>
        </View>

        {/* Price Badge */}
        <Badge
          variant="outline"
          className={
            isFree
              ? "border-brand/40 bg-brand-light/50 dark:bg-brand/20"
              : "border-cta/40 bg-cta-light/50 dark:bg-cta/20"
          }
        >
          <Text className={`text-xs font-bold ${isFree ? "text-brand" : "text-cta"}`}>
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
          className="mb-2.5 text-xs leading-4 text-neutral-main dark:text-neutral-300"
        >
          {amenity.description}
        </Text>
      ) : null}

      {/* Images Strip */}
      {amenity.images && amenity.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 py-1.5"
          className="mb-2"
        >
          {amenity.images.map((imgUrl, idx) => (
            <Image
              key={`${offering.id}-img-${idx}`}
              source={{ uri: imgUrl }}
              className="h-16 w-24 rounded-xl bg-neutral-100 dark:bg-neutral-800"
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {/* Tags */}
      {amenity.tags && amenity.tags.length > 0 && (
        <View className="mb-2.5 flex-row flex-wrap gap-1.5">
          {amenity.tags.map((tag, idx) => (
            <View
              key={`${offering.id}-tag-${idx}`}
              className="flex-row items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5"
            >
              <Tag size={10} color="#647B80" />
              <Text className="text-[11px] text-neutral-main dark:text-neutral-300">{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Available Quantity */}
      <View className="flex-row items-center gap-1.5 border-t border-neutral-border/60 dark:border-neutral-800 pt-2.5">
        <CheckCircle2 size={13} color="#0B927E" />
        <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
          {t("facilityDetail.availableAmenityQty", { count: availableQuantity })}
        </Text>
      </View>
    </View>
  );
}
