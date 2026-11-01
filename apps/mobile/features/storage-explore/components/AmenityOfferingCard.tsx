import React from "react";
import { View, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Wrench, Headphones, Tag, Eye } from "lucide-react-native";
import {
  AmenityTypeEnum,
  type PublicAmenityOfferingResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { formatVndPrice, getAmenityTypeLabel, getBillingUnitSuffix } from "../utils/storageFormat";

interface AmenityOfferingCardProps {
  offering: PublicAmenityOfferingResponse & {
    imageUrl?: string | null;
    images?: string[] | null;
  };
  facilityId?: string;
  facilityName?: string;
}

export function AmenityOfferingCard({
  offering,
  facilityId,
  facilityName,
}: AmenityOfferingCardProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { amenity, pricePerUnit, billingUnit } = offering;

  const isPhysical = amenity.type === AmenityTypeEnum.PHYSICAL;
  const isFree = pricePerUnit === 0;
  const thumbnailUri =
    offering.imageUrl ||
    offering.images?.[0] ||
    amenity.images?.[0] ||
    (amenity as any).imageUrl ||
    null;

  const handleViewDetail = () => {
    router.push({
      pathname: "/amenities/[id]" as any,
      params: {
        id: amenity.id,
        offeringId: offering.id,
        facilityId: facilityId || offering.facilityId,
        facilityName: facilityName,
        price: pricePerUnit != null ? String(pricePerUnit) : undefined,
        billingUnit: billingUnit,
      },
    });
  };

  return (
    <View className="w-full rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 shadow-sm">
      <View className="flex-row items-start gap-3.5">
        {/* 1. Left: Thumbnail Image */}
        <Pressable
          onPress={handleViewDetail}
          className="h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-neutral-border/60 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 active:opacity-90"
        >
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
        </Pressable>

        {/* 2. Right: Amenity Details */}
        <View className="flex-1 justify-between gap-1">
          {/* Name full line + Type */}
          <Pressable onPress={handleViewDetail} hitSlop={4} className="gap-0.5">
            <Text
              numberOfLines={1}
              className="text-base font-bold text-neutral-dark dark:text-neutral-100"
            >
              {amenity.name}
            </Text>
            <Text className="text-[11px] font-semibold text-brand">
              {getAmenityTypeLabel(amenity.type, t)}
            </Text>
          </Pressable>

          {/* Dòng điểm nhấn giá / (lần | số lượng | thời gian) */}
          <View className="flex-row items-baseline gap-1 my-0.5">
            <Text className="text-base font-extrabold text-cta">
              {isFree ? t("facilityDetail.freeAmenity") : formatVndPrice(pricePerUnit)}
            </Text>
            {!isFree && (
              <Text className="text-xs font-semibold text-neutral-main dark:text-neutral-300">
                {getBillingUnitSuffix(billingUnit, t)}
              </Text>
            )}
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
            <View className="flex-row flex-wrap gap-1.5 mt-0.5">
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
        </View>
      </View>

      {/* 3. Action: "Xem chi tiết" Button */}
      <View className="mt-3 border-t border-neutral-border/60 dark:border-neutral-800 pt-2 flex-row justify-end">
        <Pressable
          onPress={handleViewDetail}
          className="flex-row items-center gap-1.5 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-1.5 active:opacity-80"
        >
          <Eye size={13} color="#0B927E" />
          <Text className="text-xs font-bold text-brand">
            {locale === "en" ? "View Details" : "Xem chi tiết"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
