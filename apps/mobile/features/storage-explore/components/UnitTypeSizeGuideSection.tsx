import React, { useState } from "react";
import { View, ScrollView, Pressable, TextInput, Image } from "react-native";
import { useRouter } from "expo-router";
import { Boxes, Ruler, Maximize2, Box, ArrowRight, X } from "lucide-react-native";
import { UnitTypeCategoryEnum, type UnitTypeResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { usePublicUnitTypes } from "../hooks/useStorageExplore";
import { getUnitCategoryLabel } from "../utils/storageFormat";

interface UnitTypeSizeGuideSectionProps {
  onSelectFacilityId?: (facilityId: string) => void;
}

const CATEGORIES: (UnitTypeCategoryEnum | "ALL")[] = [
  "ALL",
  UnitTypeCategoryEnum.LOCKER,
  UnitTypeCategoryEnum.SMALL,
  UnitTypeCategoryEnum.MEDIUM,
  UnitTypeCategoryEnum.LARGE,
  UnitTypeCategoryEnum.CLIMATE_CONTROLLED,
];

export function UnitTypeSizeGuideSection(_props: UnitTypeSizeGuideSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();

  // Unit Type Filter State
  const [selectedCategory, setSelectedCategory] = useState<UnitTypeCategoryEnum | "ALL">("ALL");
  const [minAreaInput, setMinAreaInput] = useState("");
  const [maxAreaInput, setMaxAreaInput] = useState("");
  const [appliedArea, setAppliedArea] = useState<{ minArea?: number; maxArea?: number }>({});

  const unitTypesQuery = usePublicUnitTypes({
    category: selectedCategory === "ALL" ? undefined : selectedCategory,
    minArea: appliedArea.minArea,
    maxArea: appliedArea.maxArea,
  });

  const unitTypes = unitTypesQuery.data?.items ?? [];

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

  const handleViewUnitTypeDetail = (unitType: UnitTypeResponse) => {
    router.push({
      pathname: "/unit-types/[id]" as any,
      params: { id: unitType.id },
    });
  };

  return (
    <View className="gap-4">
      {/* 1. Unit Types Handbook Filter Header */}
      <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
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
        <Text variant="muted" className="text-xs leading-5 mb-3.5">
          {t("storageExplore.sizeGuideSubtitle")}
        </Text>

        {/* Category Filter Chips (LOCKER, SMALL, MEDIUM, LARGE, CLIMATE_CONTROLLED) */}
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

      {/* 2. Concise Unit Type Cards (1 Thumbnail + Dimensions + View Detail CTA) */}
      {unitTypesQuery.isLoading ? (
        <View key="unit-types-loading" className="gap-3">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
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
        <View key="unit-types-list" className="gap-3">
          {unitTypes.map((ut) => {
            const dimText = `${ut.dimensions.length}m × ${ut.dimensions.width}m × ${ut.dimensions.height}m`;
            const thumbnailUri = ut.images?.[0] || null;

            return (
              <Pressable
                key={ut.id}
                onPress={() => handleViewUnitTypeDetail(ut)}
                className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 shadow-sm active:opacity-95"
              >
                <View className="flex-row items-center gap-3.5">
                  {/* 1. Single Thumbnail Image */}
                  <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-neutral-border/60 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                    {thumbnailUri ? (
                      <Image
                        source={{ uri: thumbnailUri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Boxes size={28} color="#0B927E" />
                    )}
                  </View>

                  {/* 2. Name, Category, Dimensions & CTA */}
                  <View className="flex-1 justify-between gap-2">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text
                        numberOfLines={1}
                        className="flex-1 text-base font-bold text-neutral-dark dark:text-neutral-100"
                      >
                        {ut.name}
                      </Text>

                      {ut.category ? (
                        <View className="rounded-full border border-brand/40 bg-brand-light/60 dark:bg-brand/20 px-2.5 py-0.5">
                          <Text className="text-[11px] font-semibold text-brand">
                            {getUnitCategoryLabel(ut.category, t)}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Dimensions, Area & Volume */}
                    <View className="gap-1">
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
                            {ut.area} m²
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Box size={12} color="#647B80" />
                          <Text className="text-xs font-semibold text-neutral-main dark:text-neutral-300">
                            {ut.volume} m³
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* CTA Button: View Detail */}
                    <Pressable
                      onPress={() => handleViewUnitTypeDetail(ut)}
                      className="mt-0.5 flex-row items-center justify-center gap-1.5 self-start rounded-xl bg-cta px-3.5 py-2 shadow-sm active:opacity-90"
                    >
                      <Text className="text-xs font-bold text-white">
                        {t("storageExplore.viewUnitTypeDetailBtn")}
                      </Text>
                      <ArrowRight size={13} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
