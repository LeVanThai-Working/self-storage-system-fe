import React from "react";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Ruler,
  Maximize2,
  Box,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeader } from "@/components/layout/DetailHeader";
import { SettingsButton } from "@/features/auth/components/SettingsButton";
import { useTranslation } from "@/stores/language.store";
import { usePublicUnitTypeDetail } from "@/features/storage-explore/hooks/useStorageExplore";
import { DetailImageCarousel } from "@/features/storage-explore/components/DetailImageCarousel";
import { getUnitCategoryLabel } from "@/features/storage-explore/utils/storageFormat";

export default function UnitTypePublicDetailScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const unitTypeId = params.id;

  const {
    data: unitType,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = usePublicUnitTypeDetail(unitTypeId);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  const images = React.useMemo(() => {
    if (!unitType) return [];
    const list: string[] = [];
    if (Array.isArray(unitType.images)) {
      list.push(...unitType.images.filter(Boolean));
    }
    if (unitType.imageUrl && !list.includes(unitType.imageUrl)) {
      list.unshift(unitType.imageUrl);
    }
    return list;
  }, [unitType]);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Top Header */}
      <DetailHeader
        title={unitType?.name || t("storageExplore.unitTypeDetailTitle")}
        onBack={handleBack}
        rightElement={<SettingsButton variant="brand" />}
      />

      {isLoading ? (
        <ScrollView contentContainerClassName="p-4 gap-4">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </ScrollView>
      ) : isError || !unitType ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-full max-w-sm items-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/50">
              <AlertCircle size={32} color="#EF4444" />
            </View>
            <Text className="mt-4 text-center text-lg font-bold text-neutral-dark dark:text-neutral-100">
              {t("common.error")}
            </Text>
            <View className="mt-6 w-full gap-2.5">
              <Pressable
                onPress={() => refetch()}
                className="items-center justify-center rounded-xl bg-brand py-3 shadow-sm active:opacity-90"
              >
                <Text className="text-xs font-bold text-white">{t("storageExplore.retry")}</Text>
              </Pressable>
              <Pressable
                onPress={handleBack}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-3"
              >
                <ArrowLeft size={15} color="#0B927E" />
                <Text className="text-xs font-bold text-brand">{t("common.back")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="p-4 pb-14 gap-5"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor="#0B927E"
              colors={["#0B927E"]}
            />
          }
        >
          {/* 1. Carousel xem ảnh */}
          <DetailImageCarousel
            images={images}
            fallbackIcon="unitType"
            fallbackLabel={unitType.name}
            height={224}
          />

          {/* 2. Thông tin loại kho (Name, Loại: <Loại kho>, Dimensions, Area, Volume, Features) */}
          <View className="gap-3.5 px-1">
            {/* Title full line & Loại: <Loại kho> */}
            <View className="gap-1">
              <Text className="text-xl font-extrabold text-neutral-dark dark:text-neutral-100">
                {unitType.name}
              </Text>
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
            </View>

            {/* Dimensions, Area & Volume Specs */}
            <View className="gap-2.5 pt-1">
              <View className="flex-row items-center gap-2.5">
                <Ruler size={16} color="#0B927E" />
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {t("storageExplore.dimensionsLabel")}: {unitType.dimensions.length}m ×{" "}
                  {unitType.dimensions.width}m × {unitType.dimensions.height}m
                </Text>
              </View>

              <View className="flex-row flex-wrap items-center gap-x-6 gap-y-2">
                <View className="flex-row items-center gap-2">
                  <Maximize2 size={15} color="#0B927E" />
                  <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                    {t("storageExplore.areaLabel")}: {unitType.area} m²
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  <Box size={15} color="#0B927E" />
                  <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                    {t("storageExplore.volumeLabel")}: {unitType.volume} m³
                  </Text>
                </View>
              </View>
            </View>

            {/* Key Features */}
            {unitType.features && unitType.features.length > 0 ? (
              <View className="pt-2">
                <Text className="mb-2 text-xs font-bold text-neutral-dark dark:text-neutral-200">
                  {t("storageExplore.featuresLabel")}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {unitType.features.map((feat, idx) => (
                    <View
                      key={`${unitType.id}-feat-${idx}`}
                      className="flex-row items-center gap-1.5 rounded-xl border border-brand/30 bg-brand-light/40 dark:bg-brand/20 px-3 py-1.5"
                    >
                      <Sparkles size={12} color="#0B927E" />
                      <Text className="text-xs font-semibold text-brand">{feat}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* 3. Description (Mô tả chi tiết) */}
          {unitType.description ? (
            <View className="border-t border-neutral-border/70 dark:border-neutral-800 pt-4 px-1">
              <View className="mb-1.5 flex-row items-center gap-1.5">
                <FileText size={14} color="#0B927E" />
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                  {t("facilityDetail.descriptionLabel")}
                </Text>
              </View>
              <Text
                variant="muted"
                className="text-xs leading-5 text-neutral-main dark:text-neutral-300"
              >
                {unitType.description}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
