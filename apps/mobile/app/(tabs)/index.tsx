import React, { useMemo, useState, useCallback, useRef } from "react";
import { View, FlatList, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { RotateCcw, Building2, Boxes, AlertCircle, Filter } from "lucide-react-native";
import type { FacilityResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useDebounce } from "@/features/storage-explore/hooks/useDebounce";
import {
  useFacilitiesExplore,
  usePublicAmenities,
  type FacilitySortBy,
  type SortOrder,
} from "@/features/storage-explore/hooks/useStorageExplore";
import { FacilityCard } from "@/features/storage-explore/components/FacilityCard";
import { FacilityFilterModal } from "@/features/storage-explore/components/FacilityFilterModal";
import { UnitTypeSizeGuideSection } from "@/features/storage-explore/components/UnitTypeSizeGuideSection";
import { HeroBannerCarousel } from "@/features/storage-explore/components/HeroBannerCarousel";
import { FacilityPagination } from "@/features/storage-explore/components/FacilityPagination";
import { useExploreSearchStore } from "@/features/storage-explore/stores/exploreSearch.store";

const PAGE_LIMIT = 6;

export default function StorageExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const flatListRef = useRef<FlatList<FacilityResponse>>(null);

  // Shared Search, Page & Active Section Tab State (linked with CustomerTabHeader)
  const { search, page, activeTab, setPage, setActiveTab, resetSearch } = useExploreSearchStore();

  // Section 1.1: Multi-criteria Filter & Sort State
  const debouncedSearch = useDebounce(search, 400);
  const [city, setCity] = useState<string>("");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [matchAll, setMatchAll] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<FacilitySortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);

  // 1. Fetch active amenities for filter sheet
  const amenitiesQuery = usePublicAmenities();
  const amenities = useMemo(() => amenitiesQuery.data?.items ?? [], [amenitiesQuery.data]);

  // 2. Orchestrate GET /facilities vs GET /facilities/search-by-amenity with numbered pagination (limit = 6)
  const facilitiesExplore = useFacilitiesExplore({
    search: debouncedSearch,
    city,
    selectedAmenityIds,
    matchAll,
    sortBy,
    sortOrder,
    page,
    limit: PAGE_LIMIT,
  });

  // Extract unique cities from loaded facilities for quick filter suggestions
  const suggestedCities = useMemo(() => {
    const set = new Set<string>();
    facilitiesExplore.items.forEach((f) => {
      if (f.city) set.add(f.city);
    });
    return Array.from(set);
  }, [facilitiesExplore.items]);

  // Count active non-default filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim() !== "") count += 1;
    if (city.trim() !== "") count += 1;
    if (selectedAmenityIds.length > 0) count += selectedAmenityIds.length;
    if (sortBy !== "createdAt" || sortOrder !== "desc") count += 1;
    return count;
  }, [search, city, selectedAmenityIds, sortBy, sortOrder]);

  // Reset all filters & sort to default
  const handleResetFilters = useCallback(() => {
    resetSearch();
    setCity("");
    setSelectedAmenityIds([]);
    setMatchAll(false);
    setSortBy("createdAt");
    setSortOrder("desc");
  }, [resetSearch]);

  // Navigate to FacilityPublicDetailScreen with { facilityId: item.id }
  const handleNavigateToFacility = useCallback(
    (facilityId: string) => {
      router.push({
        pathname: "/facilities/[id]" as any,
        params: { id: facilityId, facilityId },
      });
    },
    [router]
  );

  const handlePressFacilityCard = useCallback(
    (facility: FacilityResponse) => {
      handleNavigateToFacility(facility.id);
    },
    [handleNavigateToFacility]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    },
    [setPage]
  );

  // Selected amenity names for summary pills
  const selectedAmenityNames = useMemo(() => {
    if (selectedAmenityIds.length === 0) return [];
    const map = new Map(amenities.map((a) => [a.id, a.name]));
    return selectedAmenityIds.map((id) => map.get(id) ?? id);
  }, [selectedAmenityIds, amenities]);

  const renderHeader = () => (
    <View className="pb-3">
      {/* 1. Hero Banner (tự động trượt mỗi 10s + hỗ trợ khách hàng chủ động vuốt ngang) */}
      <HeroBannerCarousel />

      {/* 2. Segmented Switcher: Danh sách Cơ sở vs Cẩm nang Kích thước & Giá */}
      <View className="mb-4 flex-row rounded-2xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1">
        <Pressable
          onPress={() => setActiveTab("facilities")}
          className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
            activeTab === "facilities" ? "bg-brand" : "bg-transparent"
          }`}
        >
          <Building2 size={15} color={activeTab === "facilities" ? "#FFFFFF" : "#647B80"} />
          <Text
            className={`text-xs font-bold ${
              activeTab === "facilities" ? "text-white" : "text-neutral-main dark:text-neutral-300"
            }`}
          >
            {t("storageExplore.tabFacilities")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("sizeGuide")}
          className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
            activeTab === "sizeGuide" ? "bg-brand" : "bg-transparent"
          }`}
        >
          <Boxes size={15} color={activeTab === "sizeGuide" ? "#FFFFFF" : "#647B80"} />
          <Text
            className={`text-xs font-bold ${
              activeTab === "sizeGuide" ? "text-white" : "text-neutral-main dark:text-neutral-300"
            }`}
          >
            {t("storageExplore.tabSizeGuide")}
          </Text>
        </Pressable>
      </View>

      {activeTab === "facilities" ? (
        <View key="section-facilities-header">
          {/* 3. Hàng tiêu đề danh sách cơ sở + Nút Filter bên tay phải */}
          <View className="mb-2.5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {t("storageExplore.facilitiesSectionTitle")}
              </Text>
              {!facilitiesExplore.isLoading ? (
                <Text variant="muted" className="text-xs font-medium">
                  ({facilitiesExplore.totalItems})
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={() => setIsFilterModalVisible(true)}
              hitSlop={10}
              className="flex-row items-center gap-1.5 py-1"
            >
              <Filter size={14} color="#0B927E" />
              <Text className="text-right text-xs font-bold text-brand">
                {activeFiltersCount > 0
                  ? `${t("storageExplore.filterButton")} (${activeFiltersCount})`
                  : t("storageExplore.filterButton")}
              </Text>
            </Pressable>
          </View>

          {/* Active Filter Summary & Reset Filters Button */}
          {activeFiltersCount > 0 ? (
            <View
              key="active-filter-summary"
              className="mb-3 flex-row flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand bg-brand-light dark:bg-neutral-900 px-3.5 py-2.5"
            >
              <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
                {search.trim() !== "" ? (
                  <View className="rounded-full border border-brand bg-white dark:bg-neutral-800 px-2.5 py-0.5">
                    <Text className="text-xs font-semibold text-brand">
                      &ldquo;{search.trim()}&rdquo;
                    </Text>
                  </View>
                ) : null}

                {city !== "" ? (
                  <View className="rounded-full border border-brand bg-white dark:bg-neutral-800 px-2.5 py-0.5">
                    <Text className="text-xs font-semibold text-brand">{city}</Text>
                  </View>
                ) : null}

                {selectedAmenityNames.map((name, idx) => (
                  <View
                    key={`selected-amenity-pill-${idx}`}
                    className="rounded-full border border-brand bg-white dark:bg-neutral-800 px-2.5 py-0.5"
                  >
                    <Text
                      numberOfLines={1}
                      className="max-w-[160px] text-xs font-semibold text-brand"
                    >
                      {name}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={handleResetFilters}
                className="flex-row items-center gap-1 rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1.5"
              >
                <RotateCcw size={12} color="#EF4444" />
                <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                  {t("storageExplore.resetFilters")}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        /* Section 1.2: Unit Types & Size Guide + Cross-facility Offering Lookup */
        <UnitTypeSizeGuideSection
          key="section-size-guide"
          onSelectFacilityId={handleNavigateToFacility}
        />
      )}
    </View>
  );

  const renderEmptyComponent = () => {
    if (activeTab !== "facilities") return null;

    if (facilitiesExplore.isLoading) {
      return (
        <View key="facilities-loading" className="gap-4">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </View>
      );
    }

    if (facilitiesExplore.isError) {
      return (
        <View
          key="facilities-error"
          className="items-center justify-center rounded-3xl border border-red-200 dark:border-red-900 bg-white dark:bg-neutral-900 p-8"
        >
          <AlertCircle size={36} color="#EF4444" />
          <Text className="mt-3 text-center text-base font-bold text-neutral-dark dark:text-neutral-100">
            {t("storageExplore.errorTitle")}
          </Text>
          <Pressable
            onPress={() => facilitiesExplore.refetch()}
            className="mt-4 rounded-xl bg-brand px-5 py-2.5"
          >
            <Text className="text-xs font-bold text-white">{t("storageExplore.retry")}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View
        key="facilities-empty"
        className="items-center justify-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8"
      >
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand-dark">
          <Building2 size={28} color="#0B927E" />
        </View>
        <Text className="mt-3 text-center text-base font-bold text-neutral-dark dark:text-neutral-100">
          {t("storageExplore.emptyTitle")}
        </Text>
        <Text variant="muted" className="mt-1.5 max-w-xs text-center text-xs leading-5">
          {t("storageExplore.emptyDesc")}
        </Text>

        {activeFiltersCount > 0 ? (
          <Pressable
            onPress={handleResetFilters}
            className="mt-4 flex-row items-center gap-1.5 rounded-xl bg-brand px-5 py-3"
          >
            <RotateCcw size={14} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">{t("storageExplore.clearFilters")}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  const renderFooterComponent = () => {
    if (
      activeTab !== "facilities" ||
      facilitiesExplore.isLoading ||
      facilitiesExplore.items.length === 0
    ) {
      return <View key="footer-spacer" className="h-6" />;
    }

    return (
      <FacilityPagination
        key="footer-pagination"
        page={facilitiesExplore.pagination.page || page}
        totalPages={facilitiesExplore.pagination.totalPages || 1}
        hasPrevPage={facilitiesExplore.pagination.hasPrevPage}
        hasNextPage={facilitiesExplore.pagination.hasNextPage}
        onPageChange={handlePageChange}
      />
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <FlatList
        ref={flatListRef}
        data={activeTab === "facilities" ? facilitiesExplore.items : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-4">
            <FacilityCard facility={item} onPress={handlePressFacilityCard} />
          </View>
        )}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmptyComponent()}
        ListFooterComponent={renderFooterComponent()}
        contentContainerClassName="p-4 pb-12"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={facilitiesExplore.isRefetching}
            onRefresh={() => {
              facilitiesExplore.refetch();
              amenitiesQuery.refetch();
            }}
            tintColor="#0B927E"
            colors={["#0B927E"]}
          />
        }
      />

      {/* Multi-criteria Filter Modal (City + Amenities + Sort) */}
      <FacilityFilterModal
        key={`filter-modal-${isFilterModalVisible ? "open" : "closed"}-${city}-${selectedAmenityIds.join(",")}-${matchAll}-${sortBy}-${sortOrder}`}
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        city={city}
        selectedAmenityIds={selectedAmenityIds}
        matchAll={matchAll}
        sortBy={sortBy}
        sortOrder={sortOrder}
        amenities={amenities}
        isAmenitiesLoading={amenitiesQuery.isLoading}
        suggestedCities={suggestedCities}
        onApply={(next) => {
          setCity(next.city);
          setSelectedAmenityIds(next.selectedAmenityIds);
          setMatchAll(next.matchAll);
          setSortBy(next.sortBy);
          setSortOrder(next.sortOrder);
          setPage(1);
        }}
        onReset={handleResetFilters}
      />
    </SafeAreaView>
  );
}
