import React, { useMemo, useState, useCallback } from "react";
import { View, ScrollView, Pressable, RefreshControl, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  FileText,
  Warehouse,
  Sparkles,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react-native";
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
import { useFacilityPublicDetail } from "@/features/storage-explore/hooks/useStorageExplore";
import { useReservationHandoffStore } from "@/features/storage-explore/stores/reservationHandoff.store";
import { UnitTypeOfferingCard } from "@/features/storage-explore/components/UnitTypeOfferingCard";
import { AmenityOfferingCard } from "@/features/storage-explore/components/AmenityOfferingCard";
import { getUnitCategoryLabel } from "@/features/storage-explore/utils/storageFormat";

type OfferingSortKey = "price_asc" | "price_desc" | "area_asc" | "area_desc" | "available_desc";

const CATEGORIES: (UnitTypeCategoryEnum | "ALL")[] = [
  "ALL",
  UnitTypeCategoryEnum.LOCKER,
  UnitTypeCategoryEnum.SMALL,
  UnitTypeCategoryEnum.MEDIUM,
  UnitTypeCategoryEnum.LARGE,
  UnitTypeCategoryEnum.CLIMATE_CONTROLLED,
];

export default function FacilityPublicDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string; facilityId?: string }>();
  const facilityId = params.id || params.facilityId;

  const { isAuthenticated } = useAuthStore();
  const setHandoffPayload = useReservationHandoffStore((s) => s.setHandoffPayload);

  // Client-side Filter & Sort State for Section 2.2
  const [selectedCategory, setSelectedCategory] = useState<UnitTypeCategoryEnum | "ALL">("ALL");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<OfferingSortKey>("price_asc");

  // Single data source: GET /facilities/{id}/public-detail
  const { data, isLoading, isRefetching, isError, isNotFoundError, refetch } =
    useFacilityPublicDetail(facilityId);

  const facility = data?.facility;
  const rawUnitOfferings = useMemo(() => data?.unitTypeOfferings ?? [], [data?.unitTypeOfferings]);
  const amenityOfferings = useMemo(() => data?.amenityOfferings ?? [], [data?.amenityOfferings]);

  // Client-side Filter & Sort using useMemo (Section 2.2)
  const filteredAndSortedOfferings = useMemo(() => {
    const filtered = rawUnitOfferings.filter((item) => {
      if (selectedCategory !== "ALL" && item.unitType?.category !== selectedCategory) {
        return false;
      }
      if (onlyAvailable && item.availableUnitsCount <= 0) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "price_asc":
          return a.pricePerUnit - b.pricePerUnit;
        case "price_desc":
          return b.pricePerUnit - a.pricePerUnit;
        case "area_asc":
          return (a.unitType?.area ?? 0) - (b.unitType?.area ?? 0);
        case "area_desc":
          return (b.unitType?.area ?? 0) - (a.unitType?.area ?? 0);
        case "available_desc":
          return b.availableUnitsCount - a.availableUnitsCount;
        default:
          return 0;
      }
    });

    return sorted;
  }, [rawUnitOfferings, selectedCategory, onlyAvailable, sortKey]);

  const sortOptions: { key: OfferingSortKey; label: string }[] = [
    { key: "price_asc", label: t("facilityDetail.sortPriceAsc") },
    { key: "price_desc", label: t("facilityDetail.sortPriceDesc") },
    { key: "area_asc", label: t("facilityDetail.sortAreaAsc") },
    { key: "area_desc", label: t("facilityDetail.sortAreaDesc") },
    { key: "available_desc", label: t("facilityDetail.sortAvailableDesc") },
  ];

  // Section 2.4: Handoff to Reservation
  const handleSelectOffering = useCallback(
    (offering: PublicUnitTypeOfferingResponse) => {
      if (!facility || offering.availableUnitsCount <= 0) return;

      const payload = {
        facilityId: facility.id,
        facilityName: facility.name,
        unitTypeId: offering.unitTypeId,
        offering,
        availableAmenities: amenityOfferings,
      };

      if (!isAuthenticated) {
        // Save parameters and redirect to Login; auto-redirect to Reservation after login
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
        },
      });
    },
    [facility, amenityOfferings, isAuthenticated, setHandoffPayload, toast, t, router]
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Custom Top Header with Back Button & Settings (Language + Theme Switcher) */}
      <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 bg-neutral-bg dark:bg-neutral-900 px-4 py-3">
        <View className="flex-row items-center gap-3 flex-1">
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-800"
          >
            <ArrowLeft size={18} color="#0B927E" />
          </Pressable>
          <Text
            numberOfLines={1}
            className="flex-1 text-base font-bold text-neutral-dark dark:text-neutral-100"
          >
            {facility?.name || t("facilityDetail.screenTitle")}
          </Text>
        </View>
        <SettingsButton />
      </View>

      {/* Loading Skeleton State */}
      {isLoading ? (
        <ScrollView contentContainerClassName="p-4 gap-4">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </ScrollView>
      ) : isError || !facility ? (
        /* 404 (MESSAGE_CODE_104) or General Error State */
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-full max-w-sm items-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/50">
              <AlertCircle size={32} color="#EF4444" />
            </View>
            <Text className="mt-4 text-center text-lg font-bold text-neutral-dark dark:text-neutral-100">
              {isNotFoundError ? t("facilityDetail.notFoundTitle") : t("facilityDetail.errorTitle")}
            </Text>
            <Text variant="muted" className="mt-2 text-center text-xs leading-5">
              {isNotFoundError ? t("facilityDetail.notFoundDesc") : t("common.error")}
            </Text>

            <View className="mt-6 w-full gap-2.5">
              {!isNotFoundError && (
                <Pressable
                  onPress={() => refetch()}
                  className="items-center justify-center rounded-xl bg-brand py-3 shadow-sm active:opacity-90"
                >
                  <Text className="text-xs font-bold text-white">{t("storageExplore.retry")}</Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleBack}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-3"
              >
                <ArrowLeft size={15} color="#0B927E" />
                <Text className="text-xs font-bold text-brand">
                  {t("facilityDetail.backToList")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="p-4 pb-14 gap-6"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor="#0B927E"
              colors={["#0B927E"]}
            />
          }
        >
          {/* ── Section 2.1: Facility Header / Info Section ────────────────── */}
          <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <View className="flex-row items-start justify-between gap-3 mb-4">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand">
                  <Building2 size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
                    {facility.name}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <MapPin size={13} color="#0B927E" />
                    <Text className="text-xs font-semibold text-brand">{facility.city}</Text>
                  </View>
                </View>
              </View>

              <Badge
                variant="outline"
                className="border-brand/40 bg-brand-light/40 dark:bg-brand/20"
              >
                <Text className="text-xs font-semibold text-brand">{facility.city}</Text>
              </Badge>
            </View>

            {/* Info Rows */}
            <View className="gap-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-4 border border-neutral-border/60 dark:border-neutral-800">
              {/* Detailed Address */}
              <View className="flex-row items-start gap-2.5">
                <MapPin size={15} color="#0B927E" />
                <View className="flex-1">
                  <Text className="text-[11px] font-semibold uppercase text-neutral-400">
                    {t("facilityDetail.addressLabel")}
                  </Text>
                  <Text className="text-xs font-medium text-neutral-dark dark:text-neutral-100 mt-0.5 leading-4">
                    {facility.address}, {facility.city}
                  </Text>
                </View>
              </View>

              {/* Operating Hours */}
              <View className="flex-row items-start gap-2.5">
                <Clock size={15} color="#0B927E" />
                <View className="flex-1">
                  <Text className="text-[11px] font-semibold uppercase text-neutral-400">
                    {t("facilityDetail.operatingHoursLabel")}
                  </Text>
                  <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-100 mt-0.5">
                    {facility.operatingHours
                      ? `${facility.operatingHours.open} – ${facility.operatingHours.close}`
                      : t("facilityDetail.contactForHours")}
                  </Text>
                </View>
              </View>

              {/* Contact Info (Phone & Email) */}
              {(facility.phone || facility.email) && (
                <View className="flex-row flex-wrap gap-4 border-t border-neutral-border/60 dark:border-neutral-700/60 pt-3">
                  {facility.phone ? (
                    <View className="flex-row items-center gap-2">
                      <Phone size={14} color="#0B927E" />
                      <View>
                        <Text className="text-[10px] font-semibold uppercase text-neutral-400">
                          {t("facilityDetail.phoneLabel")}
                        </Text>
                        <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-100">
                          {facility.phone}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {facility.email ? (
                    <View className="flex-row items-center gap-2">
                      <Mail size={14} color="#0B927E" />
                      <View>
                        <Text className="text-[10px] font-semibold uppercase text-neutral-400">
                          {t("facilityDetail.emailLabel")}
                        </Text>
                        <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-100">
                          {facility.email}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            {/* Detailed Description */}
            {facility.description ? (
              <View className="mt-4 pt-3 border-t border-neutral-border/60 dark:border-neutral-800">
                <View className="flex-row items-center gap-1.5 mb-1.5">
                  <FileText size={14} color="#647B80" />
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                    {t("facilityDetail.descriptionLabel")}
                  </Text>
                </View>
                <Text
                  variant="muted"
                  className="text-xs leading-5 text-neutral-main dark:text-neutral-300"
                >
                  {facility.description}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ── Section 2.2: Unit Type Offerings, Pricing & Availability ──── */}
          <View className="gap-3.5">
            {/* Section Title */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1">
                <Warehouse size={18} color="#0B927E" />
                <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100 flex-1">
                  {t("facilityDetail.unitOfferingsTitle")}
                </Text>
              </View>
              <Badge
                variant="outline"
                className="border-brand/40 bg-brand-light/40 dark:bg-brand/20"
              >
                <Text className="text-xs font-bold text-brand">
                  {t("facilityDetail.unitOfferingsCount", {
                    count: filteredAndSortedOfferings.length,
                  })}
                </Text>
              </Badge>
            </View>

            {/* Client-side Filter & Sort Controls Box */}
            <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3.5">
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
                      onPress={() => setSelectedCategory(cat)}
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

              {/* Toggle: Only Show Available Units (availableUnitsCount > 0) */}
              <View className="flex-row items-center justify-between rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 px-3.5 py-2.5 border border-neutral-border/60 dark:border-neutral-800">
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                  {t("facilityDetail.onlyAvailableToggle")}
                </Text>
                <Switch
                  value={onlyAvailable}
                  onValueChange={setOnlyAvailable}
                  trackColor={{ false: "#D1D5DB", true: "#0B927E" }}
                  thumbColor="#FFFFFF"
                />
              </View>

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
                        onPress={() => setSortKey(opt.key)}
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

            {/* Offerings Cards List */}
            {filteredAndSortedOfferings.length === 0 ? (
              <View className="items-center justify-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8">
                <Warehouse size={32} color="#647B80" />
                <Text variant="muted" className="mt-2 text-center text-xs">
                  {t("facilityDetail.noOfferingsMatch")}
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {filteredAndSortedOfferings.map((offering) => (
                  <UnitTypeOfferingCard
                    key={offering.id}
                    offering={offering}
                    onSelectOffering={handleSelectOffering}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ── Section 2.3: Facility Amenity Offerings ───────────────────── */}
          <View className="gap-3.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1">
                <Sparkles size={18} color="#0B927E" />
                <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100 flex-1">
                  {t("facilityDetail.amenitiesSectionTitle")}
                </Text>
              </View>
              <Badge
                variant="outline"
                className="border-brand/40 bg-brand-light/40 dark:bg-brand/20"
              >
                <Text className="text-xs font-bold text-brand">
                  {t("facilityDetail.amenitiesCount", {
                    count: amenityOfferings.length,
                  })}
                </Text>
              </Badge>
            </View>

            {amenityOfferings.length === 0 ? (
              <View className="items-center justify-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
                <Text variant="muted" className="text-center text-xs">
                  {t("facilityDetail.noAmenities")}
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {amenityOfferings.map((amenityItem) => (
                  <AmenityOfferingCard key={amenityItem.id} offering={amenityItem} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
