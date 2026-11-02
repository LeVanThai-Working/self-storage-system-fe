import React from "react";
import { View, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { Warehouse, Ruler, Maximize2, Box, ArrowRight, ChevronRight } from "lucide-react-native";
import type { PublicUnitTypeOfferingResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { usePublicUnitTypes } from "../hooks/useStorageExplore";
import { formatVndPrice, getBillingUnitSuffix, getUnitCategoryLabel } from "../utils/storageFormat";

export type ExtendedUnitTypeOffering = PublicUnitTypeOfferingResponse & {
  images?: string[] | null;
  imageUrl?: string | null;
};

interface UnitTypeOfferingCardProps {
  offering: ExtendedUnitTypeOffering;
  onSelectOffering?: (offering: PublicUnitTypeOfferingResponse) => void;
  facilityId?: string;
  facilityName?: string;
  compact?: boolean;
  cardWidth?: number;
}

export function UnitTypeOfferingCard({
  offering,
  onSelectOffering,
  facilityId,
  facilityName,
}: UnitTypeOfferingCardProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const { unitType, pricePerUnit, billingUnit, availableUnitsCount } = offering;

  const isOutOfStock = availableUnitsCount <= 0;

  // Retrieve master unit type in case offering snapshot lacks images
  const { data: unitTypesData } = usePublicUnitTypes();
  const matchedUnitType = unitTypesData?.items?.find(
    (ut) => ut.id === (offering as any).unitTypeId || ut.id === unitType?.id
  );

  const thumbnailUri =
    offering.imageUrl ||
    offering.images?.[0] ||
    (unitType as any)?.imageUrl ||
    (unitType as any)?.images?.[0] ||
    matchedUnitType?.imageUrl ||
    matchedUnitType?.images?.[0] ||
    null;

  const handleViewDetail = () => {
    router.push({
      pathname: "/offerings/[id]" as any,
      params: {
        id: offering.id,
        facilityId: facilityId || offering.facilityId,
        facilityName: facilityName || (offering as any).facility?.name,
      },
    });
  };

  const handleBook = () => {
    if (isOutOfStock) return;
    if (onSelectOffering) {
      onSelectOffering(offering);
    } else {
      router.push({
        pathname: "/(tabs)/book" as any,
        params: {
          facilityId: facilityId || offering.facilityId,
          unitTypeId: offering.unitType.id,
          offeringId: offering.id,
        },
      });
    }
  };

  const dimText = `${unitType.dimensions.length}m × ${unitType.dimensions.width}m × ${unitType.dimensions.height}m`;

  return (
    <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 shadow-sm">
      <View className="flex-row items-start gap-3.5">
        {/* 1. Left Thumbnail Image */}
        <Pressable
          onPress={handleViewDetail}
          className="h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-neutral-border/60 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 active:opacity-90"
        >
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Warehouse size={32} color="#0B927E" />
          )}
        </Pressable>

        {/* 2. Right Info Body */}
        <View className="flex-1 justify-between gap-1.5">
          {/* Title full line */}
          <Pressable onPress={handleViewDetail} hitSlop={4}>
            <Text
              numberOfLines={1}
              className="text-base font-bold text-neutral-dark dark:text-neutral-100"
            >
              {unitType.name}
            </Text>
          </Pressable>

          {/* Dòng "Loại: <Loại kho>" */}
          {unitType.category ? (
            <Text className="text-xs text-neutral-main dark:text-neutral-300">
              <Text className="text-neutral-muted dark:text-neutral-400">
                {locale === "en" ? "Type: " : "Loại: "}
              </Text>
              <Text className="font-semibold text-neutral-dark dark:text-neutral-100">
                {getUnitCategoryLabel(unitType.category, t)}
              </Text>
            </Text>
          ) : null}

          {/* Dimensions, Area & Volume */}
          <View className="gap-0.5 pt-0.5">
            <View className="flex-row items-center gap-1.5">
              <Ruler size={13} color="#0B927E" />
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                {dimText}
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Maximize2 size={12} color="#647B80" />
                <Text className="text-xs font-semibold text-neutral-main dark:text-neutral-300">
                  {unitType.area} m²
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Box size={12} color="#647B80" />
                <Text className="text-xs font-semibold text-neutral-main dark:text-neutral-300">
                  {unitType.volume} m³
                </Text>
              </View>
            </View>
          </View>

          {/* Dòng Số lượng */}
          <Text className="text-xs mt-0.5">
            <Text className="text-neutral-muted dark:text-neutral-400">
              {locale === "en" ? "Quantity: " : "Số lượng: "}
            </Text>
            {isOutOfStock ? (
              <Text className="font-semibold text-red-500">
                {locale === "en" ? "Temporarily out of stock" : "Tạm thời hết phòng"}
              </Text>
            ) : (
              <Text className="font-semibold text-brand">
                {locale === "en"
                  ? `${availableUnitsCount} available`
                  : `Còn ${availableUnitsCount} phòng trống`}
              </Text>
            )}
          </Text>

          {/* Pricing Highlight & Quantity status (replacing deposit) */}
          <View className="mt-1 border-t border-neutral-border/60 dark:border-neutral-800 pt-1.5">
            <View className="flex-row items-baseline gap-1">
              <Text className="text-base font-extrabold text-brand">
                {formatVndPrice(pricePerUnit)}
              </Text>
              <Text variant="muted" className="text-xs font-semibold">
                {getBillingUnitSuffix(billingUnit, t)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Bottom Row: 2 Action Buttons ("Xem chi tiết" & "Đặt chỗ") */}
      <View className="mt-3 flex-row items-center gap-2 border-t border-neutral-border/60 dark:border-neutral-800 pt-2.5">
        <Pressable
          onPress={handleViewDetail}
          className="flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-2 active:opacity-80"
        >
          <Text className="text-xs font-semibold text-brand">
            {t("storageExplore.viewUnitTypeDetailBtn")}
          </Text>
          <ChevronRight size={14} color="#0B927E" />
        </Pressable>

        <Pressable
          disabled={isOutOfStock}
          onPress={handleBook}
          className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 ${
            isOutOfStock
              ? "bg-neutral-200 dark:bg-neutral-800 opacity-60"
              : "bg-cta shadow-sm active:opacity-90"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              isOutOfStock ? "text-neutral-500 dark:text-neutral-400" : "text-white"
            }`}
          >
            {isOutOfStock
              ? locale === "en"
                ? "Temporarily out of stock"
                : "Tạm thời đã hết"
              : t("facilityDetail.selectAndBookBtn")}
          </Text>
          {!isOutOfStock && <ArrowRight size={13} color="#FFFFFF" />}
        </Pressable>
      </View>
    </View>
  );
}
