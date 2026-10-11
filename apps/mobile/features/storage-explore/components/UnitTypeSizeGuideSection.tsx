import React, { useState } from "react";
import { View, ScrollView, Pressable, TextInput, Image } from "react-native";
import {
  Boxes,
  Ruler,
  Maximize2,
  Box,
  Sparkles,
  Search,
  Building2,
  MapPin,
  ArrowRight,
  X,
  Tag,
} from "lucide-react-native";
import {
  UnitTypeCategoryEnum,
  type UnitTypeResponse,
  type FacilityUnitTypeOfferingResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { usePublicUnitTypes, useCrossFacilityOfferings } from "../hooks/useStorageExplore";
import {
  calculateEstimatedDeposit,
  formatVndPrice,
  getBillingUnitSuffix,
  getUnitCategoryLabel,
} from "../utils/storageFormat";

interface UnitTypeSizeGuideSectionProps {
  onSelectFacilityId: (facilityId: string) => void;
}

const CATEGORIES: (UnitTypeCategoryEnum | "ALL")[] = [
  "ALL",
  UnitTypeCategoryEnum.LOCKER,
  UnitTypeCategoryEnum.SMALL,
  UnitTypeCategoryEnum.MEDIUM,
  UnitTypeCategoryEnum.LARGE,
  UnitTypeCategoryEnum.CLIMATE_CONTROLLED,
];

export function UnitTypeSizeGuideSection({ onSelectFacilityId }: UnitTypeSizeGuideSectionProps) {
  const { t } = useTranslation();

  // Unit Type Filter State
  const [selectedCategory, setSelectedCategory] = useState<UnitTypeCategoryEnum | "ALL">("ALL");
  const [minAreaInput, setMinAreaInput] = useState("");
  const [maxAreaInput, setMaxAreaInput] = useState("");
  const [appliedArea, setAppliedArea] = useState<{ minArea?: number; maxArea?: number }>({});

  // Cross-facility Offering Lookup State
  const [selectedUnitType, setSelectedUnitType] = useState<UnitTypeResponse | null>(null);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [appliedPriceRange, setAppliedPriceRange] = useState<{
    minPrice?: number;
    maxPrice?: number;
  }>({});

  const unitTypesQuery = usePublicUnitTypes({
    category: selectedCategory === "ALL" ? undefined : selectedCategory,
    minArea: appliedArea.minArea,
    maxArea: appliedArea.maxArea,
  });

  const offeringsQuery = useCrossFacilityOfferings({
    unitTypeId: selectedUnitType?.id,
    minPrice: appliedPriceRange.minPrice,
    maxPrice: appliedPriceRange.maxPrice,
    enabled: true,
  });

  const unitTypes = unitTypesQuery.data?.items ?? [];
  const offerings = offeringsQuery.data?.items ?? [];

  const handleApplyArea = () => {
    const min = minAreaInput.trim() !== "" ? Number(minAreaInput) : undefined;
    const max = maxAreaInput.trim() !== "" ? Number(maxAreaInput) : undefined;
    setAppliedArea({
      minArea: min !== undefined && !Number.isNaN(min) ? min : undefined,
      maxArea: max !== undefined && !Number.isNaN(max) ? max : undefined,
    });
  };

  const handleClearArea = () => {
    setMinAreaInput("");
    setMaxAreaInput("");
    setAppliedArea({});
  };

  const handleApplyPriceFilter = () => {
    const min = minPriceInput.trim() !== "" ? Number(minPriceInput.replace(/\D/g, "")) : undefined;
    const max = maxPriceInput.trim() !== "" ? Number(maxPriceInput.replace(/\D/g, "")) : undefined;
    setAppliedPriceRange({
      minPrice: min !== undefined && !Number.isNaN(min) ? min : undefined,
      maxPrice: max !== undefined && !Number.isNaN(max) ? max : undefined,
    });
  };

  const handleClearPriceFilter = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    setAppliedPriceRange({});
    setSelectedUnitType(null);
  };

  return (
    <View className="gap-5">
      {/* 1. Unit Types & Size Guide Header Card */}
      <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <View className="flex-row items-center gap-2.5 mb-1.5">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-light dark:bg-brand/20">
            <Boxes size={18} color="#0B927E" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
              {t("storageExplore.sizeGuideTitle")}
            </Text>
          </View>
        </View>
        <Text variant="muted" className="text-xs leading-5 mb-4">
          {t("storageExplore.sizeGuideSubtitle")}
        </Text>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pb-1"
          className="mb-3"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label =
              cat === "ALL" ? t("storageExplore.categoryAll") : getUnitCategoryLabel(cat, t);
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`rounded-xl border px-3.5 py-2 ${
                  isSelected
                    ? "border-brand bg-brand"
                    : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? "text-white" : "text-neutral-main dark:text-neutral-300"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Min/Max Area Filter */}
        <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3 border border-neutral-border/60 dark:border-neutral-800">
          <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200 mb-2">
            {t("storageExplore.areaFilterLabel")}
          </Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={minAreaInput}
              onChangeText={setMinAreaInput}
              placeholder={t("storageExplore.minAreaPlaceholder")}
              placeholderTextColor="#8C9E9E"
              keyboardType="numeric"
              className="flex-1 rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-dark dark:text-neutral-100"
            />
            <Text className="text-xs text-neutral-400">–</Text>
            <TextInput
              value={maxAreaInput}
              onChangeText={setMaxAreaInput}
              placeholder={t("storageExplore.maxAreaPlaceholder")}
              placeholderTextColor="#8C9E9E"
              keyboardType="numeric"
              className="flex-1 rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-dark dark:text-neutral-100"
            />
            <Pressable
              onPress={handleApplyArea}
              className="rounded-xl bg-brand px-3 py-2.5 active:opacity-90"
            >
              <Text className="text-xs font-bold text-white">
                {t("storageExplore.applyAreaFilter")}
              </Text>
            </Pressable>
            {(appliedArea.minArea !== undefined || appliedArea.maxArea !== undefined) && (
              <Pressable
                onPress={handleClearArea}
                className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-2.5"
              >
                <X size={14} color="#647B80" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* 2. Unit Types List */}
      {unitTypesQuery.isLoading ? (
        <View key="unit-types-loading" className="gap-3">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
        </View>
      ) : unitTypes.length === 0 ? (
        <View
          key="unit-types-empty"
          className="items-center justify-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8"
        >
          <Boxes size={32} color="#647B80" />
          <Text variant="muted" className="mt-2 text-center text-xs">
            {t("storageExplore.unitTypesEmpty")}
          </Text>
        </View>
      ) : (
        <View key="unit-types-list" className="gap-3.5">
          {unitTypes.map((ut) => {
            const isSelectedForLookup = selectedUnitType?.id === ut.id;
            const dimText = `${ut.dimensions.length}m × ${ut.dimensions.width}m × ${ut.dimensions.height}m`;

            return (
              <View
                key={ut.id}
                className={`rounded-3xl border p-5 ${
                  isSelectedForLookup
                    ? "border-brand bg-brand-light dark:bg-neutral-800"
                    : "border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900"
                }`}
              >
                {/* Header: Name + Category */}
                <View className="flex-row items-start justify-between gap-2 mb-2">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                      {ut.name}
                    </Text>
                    {ut.description ? (
                      <Text
                        variant="muted"
                        className="mt-1 text-xs leading-4 text-neutral-main dark:text-neutral-300"
                      >
                        {ut.description}
                      </Text>
                    ) : null}
                  </View>

                  {ut.category ? (
                    <View className="rounded-full border border-brand bg-brand-light dark:bg-brand-dark px-2.5 py-0.5">
                      <Text className="text-xs font-semibold text-brand dark:text-white">
                        {getUnitCategoryLabel(ut.category, t)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Optional Images Strip */}
                {ut.images && ut.images.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2 py-2"
                  >
                    {ut.images.map((imgUrl, idx) => (
                      <Image
                        key={`${ut.id}-img-${idx}`}
                        source={{ uri: imgUrl }}
                        className="h-20 w-28 rounded-xl bg-neutral-100 dark:bg-neutral-800"
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                )}

                {/* Dimensions, Area & Volume Specs */}
                <View className="my-3 flex-row flex-wrap gap-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 p-3 border border-neutral-border/50 dark:border-neutral-800">
                  <View className="flex-row items-center gap-1.5 mr-3">
                    <Ruler size={14} color="#0B927E" />
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                      {dimText}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 mr-3">
                    <Maximize2 size={13} color="#0B927E" />
                    <Text className="text-xs font-semibold text-neutral-main dark:text-neutral-300">
                      {ut.area} m²
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Box size={13} color="#0B927E" />
                    <Text className="text-xs font-semibold text-neutral-main dark:text-neutral-300">
                      {ut.volume} m³
                    </Text>
                  </View>
                </View>

                {/* Features List */}
                {ut.features && ut.features.length > 0 && (
                  <View className="mb-3.5 flex-row flex-wrap gap-1.5">
                    {ut.features.map((feat, idx) => (
                      <View
                        key={`${ut.id}-feat-${idx}`}
                        className="flex-row items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1"
                      >
                        <Sparkles size={11} color="#0B927E" />
                        <Text className="text-xs text-neutral-dark dark:text-neutral-300">
                          {feat}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Lookup Cross-facility Offerings Button */}
                <Pressable
                  onPress={() => setSelectedUnitType(isSelectedForLookup ? null : ut)}
                  className={`flex-row items-center justify-center gap-2 rounded-xl py-2.5 px-4 border ${
                    isSelectedForLookup
                      ? "border-brand bg-brand"
                      : "border-brand bg-brand-light/40 dark:bg-brand/20"
                  }`}
                >
                  <Search size={14} color={isSelectedForLookup ? "#FFFFFF" : "#0B927E"} />
                  <Text
                    className={`text-xs font-bold ${
                      isSelectedForLookup ? "text-white" : "text-brand"
                    }`}
                  >
                    {t("storageExplore.lookupOfferingsBtn")}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {/* 3. Cross-Facility Offering Lookup Section (GET /facility-unit-type-offerings) */}
      <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <View className="flex-row items-center gap-2.5 mb-1.5">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-cta-light dark:bg-cta/20">
            <Tag size={18} color="#FF702E" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
              {t("storageExplore.crossOfferingTitle")}
            </Text>
          </View>
        </View>
        <Text variant="muted" className="text-xs leading-5 mb-3.5">
          {t("storageExplore.crossOfferingSubtitle")}
        </Text>

        {/* Active Selected Unit Type Pill */}
        <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 px-3.5 py-2.5 border border-neutral-border/60 dark:border-neutral-800">
          <View className="flex-1">
            <Text className="text-[11px] text-neutral-400">
              {t("storageExplore.selectedUnitTypeLabel")}
            </Text>
            <Text className="text-xs font-bold text-brand">
              {selectedUnitType
                ? `${selectedUnitType.name} (${selectedUnitType.area} m²)`
                : t("storageExplore.allUnitTypes")}
            </Text>
          </View>
          {selectedUnitType && (
            <Pressable
              onPress={() => setSelectedUnitType(null)}
              hitSlop={8}
              className="rounded-full p-1"
            >
              <X size={16} color="#647B80" />
            </Pressable>
          )}
        </View>

        {/* Price Range Inputs (minPrice - maxPrice) */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200 mb-2">
            {t("storageExplore.priceRangeLabel")}
          </Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={minPriceInput}
              onChangeText={setMinPriceInput}
              placeholder={t("storageExplore.minPricePlaceholder")}
              placeholderTextColor="#8C9E9E"
              keyboardType="numeric"
              className="flex-1 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-xs text-neutral-dark dark:text-neutral-100"
            />
            <Text className="text-xs text-neutral-400">–</Text>
            <TextInput
              value={maxPriceInput}
              onChangeText={setMaxPriceInput}
              placeholder={t("storageExplore.maxPricePlaceholder")}
              placeholderTextColor="#8C9E9E"
              keyboardType="numeric"
              className="flex-1 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-xs text-neutral-dark dark:text-neutral-100"
            />
          </View>
          <View className="mt-2.5 flex-row gap-2">
            <Pressable
              onPress={handleApplyPriceFilter}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-cta py-2.5 active:opacity-90"
            >
              <Search size={14} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">
                {t("storageExplore.searchOfferingsBtn")}
              </Text>
            </Pressable>

            {(selectedUnitType ||
              appliedPriceRange.minPrice !== undefined ||
              appliedPriceRange.maxPrice !== undefined) && (
              <Pressable
                onPress={handleClearPriceFilter}
                className="items-center justify-center rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2.5"
              >
                <Text className="text-xs font-semibold text-neutral-main dark:text-neutral-300">
                  {t("storageExplore.clearAreaFilter")}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Cross-facility Offerings Result List */}
        {offeringsQuery.isLoading ? (
          <View key="offerings-loading" className="gap-2.5">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </View>
        ) : offerings.length === 0 ? (
          <View
            key="offerings-empty"
            className="items-center justify-center rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-6"
          >
            <Text variant="muted" className="text-center text-xs">
              {t("storageExplore.offeringsEmpty")}
            </Text>
          </View>
        ) : (
          <View key="offerings-list" className="gap-3">
            {offerings.map((item: FacilityUnitTypeOfferingResponse) => {
              const estDeposit = calculateEstimatedDeposit(
                item.pricePerUnit,
                item.depositMultiplier
              );
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelectFacilityId(item.facility.id)}
                  className="rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-4"
                >
                  <View className="flex-row items-start justify-between gap-2 mb-2">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Building2 size={14} color="#0B927E" />
                        <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                          {item.facility.name}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <MapPin size={12} color="#647B80" />
                        <Text variant="muted" className="text-xs flex-1" numberOfLines={1}>
                          {item.facility.city} • {item.facility.address}
                        </Text>
                      </View>
                    </View>

                    <View className="rounded-full border border-brand bg-brand-light dark:bg-brand-dark px-2.5 py-0.5">
                      <Text className="text-xs font-semibold text-brand dark:text-white">
                        {item.unitType.name}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between border-t border-neutral-border/60 dark:border-neutral-700/60 pt-2.5 mt-1">
                    <View>
                      <View className="flex-row items-baseline gap-1">
                        <Text className="text-base font-extrabold text-brand">
                          {formatVndPrice(item.pricePerUnit)}
                        </Text>
                        <Text variant="muted" className="text-xs">
                          {getBillingUnitSuffix(item.billingUnit, t)}
                        </Text>
                      </View>
                      <Text variant="muted" className="text-[11px] mt-0.5">
                        {t("storageExplore.minRentalDays", { days: item.minRentalDays })} •{" "}
                        {t("storageExplore.depositMultiplier", {
                          multiplier: item.depositMultiplier,
                          amount: formatVndPrice(estDeposit),
                        })}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1 rounded-xl bg-brand px-3 py-2">
                      <Text className="text-xs font-bold text-white">
                        {t("storageExplore.goToFacilityDetail")}
                      </Text>
                      <ArrowRight size={13} color="#FFFFFF" />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
