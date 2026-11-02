import React, { useState } from "react";
import { View, ScrollView, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { Boxes, Ruler, Maximize2, Box, ArrowRight } from "lucide-react-native";
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
  const { t, locale } = useTranslation();
  const router = useRouter();

  // Category filter state (No area filter)
  const [selectedCategory, setSelectedCategory] = useState<UnitTypeCategoryEnum | "ALL">("ALL");

  const unitTypesQuery = usePublicUnitTypes({
    category: selectedCategory === "ALL" ? undefined : selectedCategory,
  });

  const unitTypes = unitTypesQuery.data?.items ?? [];

  const handleViewUnitTypeDetail = (unitType: UnitTypeResponse) => {
    router.push({
      pathname: "/unit-types/[id]" as any,
      params: { id: unitType.id },
    });
  };

  return (
    <View className="gap-4">
      {/* 1. Unit Types Handbook Header & Category Chips */}
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

        {/* Category Filter Chips (Tất cả, Tủ Locker, Kho Nhỏ, Kho Vừa, Kho Lớn, Kho Điều hòa) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pb-1"
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
      </View>

      {/* 2. Unit Type Cards */}
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
            const thumbnailUri = ut.imageUrl || ut.images?.[0] || null;

            return (
              <Pressable
                key={ut.id}
                onPress={() => handleViewUnitTypeDetail(ut)}
                className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 shadow-sm active:opacity-95"
              >
                <View className="flex-row items-center gap-3.5">
                  {/* Thumbnail Image */}
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

                  {/* Info: Title full line -> "Loại: <Loại kho>" -> Specs -> CTA */}
                  <View className="flex-1 justify-between gap-1.5">
                    {/* Title full line */}
                    <Text
                      numberOfLines={1}
                      className="text-base font-bold text-neutral-dark dark:text-neutral-100"
                    >
                      {ut.name}
                    </Text>

                    {/* Dòng "Loại: <Loại kho>" */}
                    {ut.category ? (
                      <Text className="text-xs text-neutral-main dark:text-neutral-300">
                        <Text className="text-neutral-muted dark:text-neutral-400">
                          {locale === "en" ? "Type: " : "Loại: "}
                        </Text>
                        <Text className="font-semibold text-neutral-dark dark:text-neutral-100">
                          {getUnitCategoryLabel(ut.category, t)}
                        </Text>
                      </Text>
                    ) : null}

                    {/* Dimensions, Area & Volume */}
                    <View className="gap-1 pt-0.5">
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

                    {/* CTA Button */}
                    <Pressable
                      onPress={() => handleViewUnitTypeDetail(ut)}
                      className="mt-1 flex-row items-center justify-center gap-1.5 self-start rounded-xl bg-cta px-3.5 py-1.5 shadow-sm active:opacity-90"
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
