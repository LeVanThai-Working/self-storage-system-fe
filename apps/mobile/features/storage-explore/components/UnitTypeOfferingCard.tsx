import React from "react";
import { View, Pressable, Image } from "react-native";
import {
  Warehouse,
  Ruler,
  Maximize2,
  CalendarClock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react-native";
import type { PublicUnitTypeOfferingResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/stores/language.store";
import {
  calculateEstimatedDeposit,
  formatVndPrice,
  getBillingUnitSuffix,
  getUnitCategoryLabel,
} from "../utils/storageFormat";

export type ExtendedUnitTypeOffering = PublicUnitTypeOfferingResponse & {
  images?: string[] | null;
  imageUrl?: string | null;
};

interface UnitTypeOfferingCardProps {
  offering: ExtendedUnitTypeOffering;
  onSelectOffering: (offering: PublicUnitTypeOfferingResponse) => void;
  compact?: boolean;
  cardWidth?: number;
}

export function UnitTypeOfferingCard({
  offering,
  onSelectOffering,
  compact = false,
  cardWidth,
}: UnitTypeOfferingCardProps) {
  const { t } = useTranslation();

  const {
    unitType,
    pricePerUnit,
    depositMultiplier,
    billingUnit,
    minRentalDays,
    availableUnitsCount,
  } = offering;

  const estimatedDeposit = calculateEstimatedDeposit(pricePerUnit, depositMultiplier);
  const isOutOfStock = availableUnitsCount <= 0;
  const isLowStock = availableUnitsCount >= 1 && availableUnitsCount <= 5;
  const isPlentyStock = availableUnitsCount > 5;

  const thumbnailUri = offering.imageUrl || offering.images?.[0] || unitType?.images?.[0] || null;

  // Compact vertical card for 3-cards-per-screen horizontal scroll on Facility Detail
  if (compact) {
    return (
      <Pressable
        disabled={isOutOfStock}
        onPress={() => onSelectOffering(offering)}
        style={cardWidth ? { width: cardWidth } : undefined}
        className={`rounded-2xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2.5 shadow-sm justify-between ${
          isOutOfStock ? "opacity-65" : "active:opacity-90"
        }`}
      >
        <View>
          {/* 1. Thumbnail Image */}
          <View className="relative mb-2 h-20 w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
            {thumbnailUri ? (
              <Image
                source={{ uri: thumbnailUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Warehouse size={22} color="#0B927E" />
            )}

            {/* Compact Stock Pill Overlay */}
            <View
              className={`absolute bottom-1 left-1 rounded-md px-1.5 py-0.5 ${
                isOutOfStock ? "bg-red-600/90" : isLowStock ? "bg-cta/90" : "bg-brand/90"
              }`}
            >
              <Text className="text-[9px] font-bold text-white" numberOfLines={1}>
                {isOutOfStock
                  ? t("facilityDetail.compactOut")
                  : t("facilityDetail.compactAvailable", { count: availableUnitsCount })}
              </Text>
            </View>
          </View>

          {/* 2. Unit Type Name */}
          <Text
            numberOfLines={1}
            className="text-xs font-bold text-neutral-dark dark:text-neutral-100"
          >
            {unitType.name}
          </Text>

          {/* 3. Area & Dimensions */}
          <Text
            numberOfLines={1}
            variant="muted"
            className="mt-0.5 text-[10px] font-medium text-neutral-main dark:text-neutral-400"
          >
            {unitType.area} m² • {unitType.dimensions.length}×{unitType.dimensions.width}×
            {unitType.dimensions.height}m
          </Text>
        </View>

        {/* 4. Price & Mini Action */}
        <View className="mt-2 border-t border-neutral-border/60 dark:border-neutral-800 pt-1.5">
          <Text numberOfLines={1} className="text-xs font-extrabold text-brand">
            {formatVndPrice(pricePerUnit)}
          </Text>
          <Text numberOfLines={1} variant="muted" className="text-[9px]">
            {getBillingUnitSuffix(billingUnit, t)}
          </Text>
        </View>
      </Pressable>
    );
  }

  // Full Card for the dedicated Paginated Offerings Screen
  return (
    <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      {/* 1. Thumbnail Image + Name + Category */}
      <View className="flex-row items-start gap-3 mb-3">
        <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-neutral-border/60 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Warehouse size={26} color="#0B927E" />
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-base font-bold text-neutral-dark dark:text-neutral-100">
              {unitType.name}
            </Text>
            {unitType.category ? (
              <Badge
                variant="outline"
                className="border-brand/40 bg-brand-light/40 dark:bg-brand/20"
              >
                <Text className="text-[11px] font-semibold text-brand">
                  {getUnitCategoryLabel(unitType.category, t)}
                </Text>
              </Badge>
            ) : null}
          </View>

          {/* Stock Availability Banner */}
          <View className="mt-2">
            {isPlentyStock && (
              <View className="flex-row items-center gap-1.5 self-start rounded-full border border-brand/30 bg-brand-light/50 dark:bg-brand/20 px-2.5 py-0.5">
                <CheckCircle2 size={12} color="#0B927E" />
                <Text className="text-[11px] font-bold text-brand">
                  {t("facilityDetail.stockPlenty", { count: availableUnitsCount })}
                </Text>
              </View>
            )}

            {isLowStock && (
              <View className="flex-row items-center gap-1.5 self-start rounded-full border border-cta/40 bg-cta-light/60 dark:bg-cta/20 px-2.5 py-0.5">
                <AlertTriangle size={12} color="#FF702E" />
                <Text className="text-[11px] font-bold text-cta">
                  {t("facilityDetail.stockLow", { count: availableUnitsCount })}
                </Text>
              </View>
            )}

            {isOutOfStock && (
              <View className="flex-row items-center gap-1.5 self-start rounded-full border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5">
                <XCircle size={12} color="#EF4444" />
                <Text className="text-[11px] font-bold text-red-600 dark:text-red-400">
                  {t("facilityDetail.stockOut")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 2. Dimensions, Area & Volume */}
      <View className="mb-3 gap-1.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 p-3 border border-neutral-border/60 dark:border-neutral-800">
        <View className="flex-row items-center gap-2">
          <Ruler size={14} color="#0B927E" />
          <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
            {t("facilityDetail.dimensions", {
              length: unitType.dimensions.length,
              width: unitType.dimensions.width,
              height: unitType.dimensions.height,
            })}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Maximize2 size={14} color="#0B927E" />
          <Text className="text-xs font-medium text-neutral-main dark:text-neutral-300">
            {t("facilityDetail.areaAndVolume", {
              area: unitType.area,
              volume: unitType.volume,
            })}
          </Text>
        </View>
      </View>

      {/* 3. Rental Conditions & Estimated Deposit */}
      <View className="mb-3.5 gap-1.5 px-1">
        <View className="flex-row items-center gap-2">
          <CalendarClock size={14} color="#647B80" />
          <Text className="text-xs text-neutral-main dark:text-neutral-300">
            {t("facilityDetail.minRentalDays", { days: minRentalDays })}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <ShieldCheck size={14} color="#0B927E" />
          <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
            {t("facilityDetail.estimatedDeposit", {
              amount: formatVndPrice(estimatedDeposit),
              multiplier: depositMultiplier,
            })}
          </Text>
        </View>
      </View>

      {/* 4. Price & CTA Button */}
      <View className="flex-row items-center justify-between border-t border-neutral-border/70 dark:border-neutral-800 pt-3">
        <View>
          <Text className="text-lg font-extrabold text-brand">{formatVndPrice(pricePerUnit)}</Text>
          <Text variant="muted" className="text-xs font-medium">
            {getBillingUnitSuffix(billingUnit, t)}
          </Text>
        </View>

        <Pressable
          disabled={isOutOfStock}
          onPress={() => onSelectOffering(offering)}
          className={`flex-row items-center gap-1.5 rounded-xl px-4 py-2.5 shadow-sm ${
            isOutOfStock
              ? "bg-neutral-200 dark:bg-neutral-800 opacity-60"
              : "bg-cta active:opacity-90"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              isOutOfStock ? "text-neutral-500 dark:text-neutral-400" : "text-white"
            }`}
          >
            {isOutOfStock
              ? t("facilityDetail.outOfStockBtn")
              : t("facilityDetail.selectAndBookBtn")}
          </Text>
          {!isOutOfStock && <ArrowRight size={14} color="#FFFFFF" />}
        </Pressable>
      </View>
    </View>
  );
}
