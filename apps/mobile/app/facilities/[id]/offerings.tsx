import React, { useState, useCallback, useRef } from "react";
import { View, FlatList, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Warehouse, ArrowUpDown, AlertCircle } from "lucide-react-native";
import {
  UnitTypeCategoryEnum,
  type PublicUnitTypeOfferingResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsButton } from "@/features/auth/components/SettingsButton";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import {
  useFacilityAvailableOfferingsPaginated,
  type OfferingSortKey,
} from "@/features/storage-explore/hooks/useStorageExplore";
import { useReservationHandoffStore } from "@/features/storage-explore/stores/reservationHandoff.store";
import { UnitTypeOfferingCard } from "@/features/storage-explore/components/UnitTypeOfferingCard";
import { FacilityPagination } from "@/features/storage-explore/components/FacilityPagination";
import { getUnitCategoryLabel } from "@/features/storage-explore/utils/storageFormat";

const PAGE_LIMIT = 5;

const CATEGORIES: (UnitTypeCategoryEnum | "ALL")[] = [
  "ALL",
  UnitTypeCategoryEnum.LOCKER,
  UnitTypeCategoryEnum.SMALL,
  UnitTypeCategoryEnum.MEDIUM,
  UnitTypeCategoryEnum.LARGE,
  UnitTypeCategoryEnum.CLIMATE_CONTROLLED,
];

export default function FacilityAvailableOfferingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const flatListRef = useRef<FlatList<PublicUnitTypeOfferingResponse>>(null);

  const params = useLocalSearchParams<{
    id?: string;
    facilityId?: string;
    facilityName?: string;
  }>();
  const facilityId = params.id || params.facilityId;

  const { isAuthenticated } = useAuthStore();
  const setHandoffPayload = useReservationHandoffStore((s) => s.setHandoffPayload);

  const [page, setPage] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<UnitTypeCategoryEnum | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<OfferingSortKey>("price_asc");

  const {
    facility,
    amenityOfferings,
    items,
    totalItems,
    pagination,
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useFacilityAvailableOfferingsPaginated({
    facilityId,
    page,
    limit: PAGE_LIMIT,
    category: selectedCategory,
    sortKey,
  });

  const displayFacilityName =
    facility?.name || params.facilityName || t("facilityDetail.screenTitle");

  const sortOptions: { key: OfferingSortKey; label: string }[] = [
    { key: "price_asc", label: t("facilityDetail.sortPriceAsc") },
    { key: "price_desc", label: t("facilityDetail.sortPriceDesc") },
    { key: "area_asc", label: t("facilityDetail.sortAreaAsc") },
    { key: "area_desc", label: t("facilityDetail.sortAreaDesc") },
    { key: "available_desc", label: t("facilityDetail.sortAvailableDesc") },
  ];

  const handleSelectOffering = useCallback(
    (offering: PublicUnitTypeOfferingResponse) => {
      if (offering.availableUnitsCount <= 0) return;

      const resolvedFacilityId = facility?.id || facilityId || offering.facilityId;
      const payload = {
        facilityId: resolvedFacilityId,
        facilityName: displayFacilityName,
        unitTypeId: offering.unitTypeId,
        offering,
        availableAmenities: amenityOfferings,
      };

      if (!isAuthenticated) {
        setHandoffPayload(payload, { pendingRedirectAfterLogin: true });
        toast.info(t("facilityDetail.loginRequiredForBooking"));
        router.push("/(auth)/login" as any);
        return;
      }

      setHandoffPayload(payload, { pendingRedirectAfterLogin: false });
      router.push({
        pathname: "/(tabs)/reservations" as any,
        params: {
          facilityId: payload.facilityId,
          facilityName: payload.facilityName,
          unitTypeId: payload.unitTypeId,
          facilityUnitTypeOfferingId: offering.id,
          mode: "create",
        },
      });
    },
    [
      facility,
      facilityId,
      displayFacilityName,
      amenityOfferings,
      isAuthenticated,
      setHandoffPayload,
      toast,
      t,
      router,
    ]
  );

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (facilityId) {
      router.replace({
        pathname: "/facilities/[id]" as any,
        params: { id: facilityId, facilityId },
      });
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  const renderHeader = () => (
    <View className="mb-4 gap-3.5">
      {/* Facility Context & Available Offerings Count */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <Warehouse size={18} color="#0B927E" />
          <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100 flex-1">
            {t("facilityDetail.availableOfferingsPageTitle")}
          </Text>
        </View>
        <Badge variant="outline" className="border-brand/40 bg-brand-light/40 dark:bg-brand/20">
          <Text className="text-xs font-bold text-brand">
            {t("facilityDetail.unitOfferingsCount", { count: totalItems })}
          </Text>
        </Badge>
      </View>

      {/* Category & Sort Filter Box */}
      <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label =
              cat === "ALL" ? t("storageExplore.categoryAll") : getUnitCategoryLabel(cat, t);
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`rounded-xl border px-3 py-1.5 ${
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

        {/* Sort Chips */}
        <View className="gap-1.5">
          <View className="flex-row items-center gap-1.5">
            <ArrowUpDown size={13} color="#0B927E" />
            <Text className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
              {t("facilityDetail.sortLabel")}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {sortOptions.map((opt) => {
              const isSelected = sortKey === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    setSortKey(opt.key);
                    setPage(1);
                  }}
                  className={`rounded-xl border px-3 py-1.5 ${
                    isSelected
                      ? "border-brand bg-brand-light dark:bg-brand/25"
                      : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? "text-brand" : "text-neutral-dark dark:text-neutral-300"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="gap-4">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <Skeleton className="h-52 w-full rounded-3xl" />
        </View>
      );
    }

    if (isError) {
      return (
        <View className="items-center justify-center rounded-3xl border border-red-200 dark:border-red-900 bg-white dark:bg-neutral-900 p-8">
          <AlertCircle size={32} color="#EF4444" />
          <Text className="mt-3 text-center text-base font-bold text-neutral-dark dark:text-neutral-100">
            {t("facilityDetail.errorTitle")}
          </Text>
          <Pressable onPress={() => refetch()} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
            <Text className="text-xs font-bold text-white">{t("storageExplore.retry")}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View className="items-center justify-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8">
        <Warehouse size={32} color="#647B80" />
        <Text variant="muted" className="mt-2 text-center text-xs leading-5">
          {t("facilityDetail.noOfferingsMatch")}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (isLoading || items.length === 0) {
      return <View className="h-6" />;
    }

    return (
      <FacilityPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        hasPrevPage={pagination.hasPrevPage}
        hasNextPage={pagination.hasNextPage}
        onPageChange={handlePageChange}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 bg-neutral-bg dark:bg-neutral-900 px-4 py-3">
        <View className="flex-row items-center gap-3 flex-1">
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            className="items-center justify-center p-1 active:opacity-70"
          >
            <ArrowLeft size={20} color="#0B927E" />
          </Pressable>
          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="text-base font-bold text-neutral-dark dark:text-neutral-100"
            >
              {displayFacilityName}
            </Text>
            <Text numberOfLines={1} variant="muted" className="text-[11px]">
              {t("facilityDetail.availableOfferingsSubtitle")}
            </Text>
          </View>
        </View>
        <SettingsButton />
      </View>

      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-4">
            <UnitTypeOfferingCard offering={item} onSelectOffering={handleSelectOffering} />
          </View>
        )}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={renderFooter()}
        contentContainerClassName="p-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#0B927E"
            colors={["#0B927E"]}
          />
        }
      />
    </SafeAreaView>
  );
}
