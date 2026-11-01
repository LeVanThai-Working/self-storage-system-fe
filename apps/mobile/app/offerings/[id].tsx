import React, { useMemo } from "react";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Warehouse,
  Ruler,
  Maximize2,
  Box,
  CalendarClock,
  Building2,
  MapPin,
  Clock,
  Phone,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from "lucide-react-native";
import {
  UnitTypeCategoryEnum,
  UnitTypeStatusEnum,
  type PublicUnitTypeOfferingResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeader } from "@/components/layout/DetailHeader";
import { SettingsButton } from "@/features/auth/components/SettingsButton";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import {
  useFacilityPublicDetail,
  usePublicOfferingDetail,
  usePublicUnitTypeDetail,
} from "@/features/storage-explore/hooks/useStorageExplore";
import { useReservationHandoffStore } from "@/features/storage-explore/stores/reservationHandoff.store";
import { DetailImageCarousel } from "@/features/storage-explore/components/DetailImageCarousel";
import {
  calculateEstimatedDeposit,
  formatVndPrice,
  getBillingUnitSuffix,
  getUnitCategoryLabel,
} from "@/features/storage-explore/utils/storageFormat";

export default function OfferingDetailScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{
    id?: string;
    facilityId?: string;
    facilityName?: string;
  }>();
  const offeringId = params.id;
  const initialFacilityId = params.facilityId;

  const { isAuthenticated } = useAuthStore();
  const setHandoffPayload = useReservationHandoffStore((s) => s.setHandoffPayload);

  // 1. Fetch offering detail directly
  const {
    data: offeringApiData,
    isLoading: isOfferingLoading,
    isError: isOfferingError,
    refetch: refetchOffering,
  } = usePublicOfferingDetail(offeringId);

  // Resolved facility ID
  const facilityId =
    initialFacilityId ||
    (offeringApiData as any)?.facilityId ||
    (offeringApiData as any)?.facility?.id;

  // 2. Fetch facility public detail to get enriched stock count and amenities
  const {
    data: facilityDetailData,
    isLoading: isFacilityLoading,
    refetch: refetchFacility,
  } = useFacilityPublicDetail(facilityId);

  const facility = facilityDetailData?.facility || (offeringApiData as any)?.facility;
  const amenityOfferings = facilityDetailData?.amenityOfferings ?? [];

  const unitTypeOfferings = facilityDetailData?.unitTypeOfferings;

  // Find enriched offering from facility detail if available (for exact availableUnitsCount)
  const rawOffering = useMemo(() => {
    if (unitTypeOfferings && offeringId) {
      const match = unitTypeOfferings.find((o) => o.id === offeringId);
      if (match) return match;
    }
    return offeringApiData;
  }, [unitTypeOfferings, offeringApiData, offeringId]);

  const isLoading = isOfferingLoading || (!rawOffering && isFacilityLoading);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (facilityId) {
      router.replace({
        pathname: "/facilities/[id]" as any,
        params: { id: facilityId },
      });
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  const unitType = rawOffering?.unitType;
  const unitTypeId = (rawOffering as any)?.unitTypeId || unitType?.id;
  const { data: masterUnitType } = usePublicUnitTypeDetail(unitTypeId);
  const pricePerUnit = rawOffering?.pricePerUnit ?? 0;
  const depositMultiplier = rawOffering?.depositMultiplier ?? 1;
  const billingUnit = rawOffering?.billingUnit;
  const minRentalDays = rawOffering?.minRentalDays ?? 30;
  const availableUnitsCount = (rawOffering as any)?.availableUnitsCount ?? 0;

  const estimatedDeposit = calculateEstimatedDeposit(pricePerUnit, depositMultiplier);
  const isOutOfStock = availableUnitsCount <= 0;
  const isLowStock = availableUnitsCount >= 1 && availableUnitsCount <= 5;
  const isPlentyStock = availableUnitsCount > 5;

  // Collect images safely (from offering, unitType snapshot, and master unitType)
  const images = useMemo(() => {
    const list: string[] = [];
    const offAny = rawOffering as any;
    if (offAny?.images && Array.isArray(offAny.images)) {
      list.push(...offAny.images.filter(Boolean));
    }
    if (offAny?.imageUrl && !list.includes(offAny.imageUrl)) {
      list.push(offAny.imageUrl);
    }
    const utAny = unitType as any;
    if (utAny?.images && Array.isArray(utAny.images)) {
      list.push(...utAny.images.filter(Boolean));
    }
    if (utAny?.imageUrl && !list.includes(utAny.imageUrl)) {
      list.push(utAny.imageUrl);
    }
    // Retrieve images from master unitType if offering snapshot lacks images
    if (masterUnitType?.images && Array.isArray(masterUnitType.images)) {
      for (const img of masterUnitType.images) {
        if (img && !list.includes(img)) list.push(img);
      }
    }
    if (masterUnitType?.imageUrl && !list.includes(masterUnitType.imageUrl)) {
      list.push(masterUnitType.imageUrl);
    }
    return list;
  }, [rawOffering, unitType, masterUnitType]);

  const normalizedOffering: PublicUnitTypeOfferingResponse | null = useMemo(() => {
    if (!rawOffering || !unitType) return null;
    const offAny = rawOffering as any;
    const utAny = unitType as any;
    return {
      id: rawOffering.id,
      facilityId: facilityId || offAny.facilityId || offAny.facility?.id || "",
      unitTypeId: offAny.unitTypeId || utAny.id,
      unitType: {
        id: utAny.id,
        name: utAny.name,
        category: utAny.category || UnitTypeCategoryEnum.SMALL,
        dimensions: utAny.dimensions,
        area: utAny.area,
        volume: utAny.volume,
        description: utAny.description,
        status: utAny.status || UnitTypeStatusEnum.ACTIVE,
        images:
          images.length > 0 ? images : utAny.images || (utAny.imageUrl ? [utAny.imageUrl] : []),
        features: utAny.features,
      },
      pricePerUnit: rawOffering.pricePerUnit,
      depositMultiplier: rawOffering.depositMultiplier,
      billingUnit: rawOffering.billingUnit,
      minRentalDays: rawOffering.minRentalDays,
      status: rawOffering.status,
      availableUnitsCount,
    };
  }, [rawOffering, unitType, facilityId, availableUnitsCount, images]);

  const handleBookNow = () => {
    if (!facility || !normalizedOffering) return;
    if (isOutOfStock) {
      toast.warning(t("facilityDetail.stockOut"));
      return;
    }

    const payload = {
      facilityId: facility.id,
      facilityName: facility.name,
      unitTypeId: normalizedOffering.unitTypeId,
      offering: normalizedOffering,
      availableAmenities: amenityOfferings,
    };

    if (!isAuthenticated) {
      setHandoffPayload(payload, { pendingRedirectAfterLogin: true });
      toast.info(t("facilityDetail.loginPrompt"));
      router.push("/(auth)/login" as any);
      return;
    }

    setHandoffPayload(payload);
    router.push("/reservations/create" as any);
  };

  const utAny = unitType as any;
  const offAny = rawOffering as any;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Top Header */}
      <DetailHeader
        title={unitType?.name || t("offeringDetail.title")}
        subtitle={facility?.name}
        onBack={handleBack}
        rightElement={<SettingsButton variant="brand" />}
      />

      {isLoading ? (
        <ScrollView contentContainerClassName="p-4 gap-4">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </ScrollView>
      ) : isOfferingError || !rawOffering || !unitType ? (
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
                onPress={() => {
                  refetchOffering();
                  refetchFacility();
                }}
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
        <>
          <ScrollView
            contentContainerClassName="p-4 pb-24 gap-5"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => {
                  refetchOffering();
                  refetchFacility();
                }}
                tintColor="#0B927E"
                colors={["#0B927E"]}
              />
            }
          >
            {/* 1. Image Carousel */}
            <DetailImageCarousel
              images={images}
              fallbackIcon="unitType"
              fallbackLabel={unitType.name}
              height={224}
            />

            {/* 2. Title, Type & Stock Pill */}
            <View className="gap-2 px-1">
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

              {/* Stock Status Pill */}
              <View className="pt-1">
                {isPlentyStock && (
                  <View className="flex-row items-center gap-1.5 self-start rounded-full border border-brand/30 bg-brand-light/50 dark:bg-brand/20 px-3 py-1">
                    <CheckCircle2 size={13} color="#0B927E" />
                    <Text className="text-xs font-bold text-brand">
                      {t("offeringDetail.stockCount", { count: availableUnitsCount })}
                    </Text>
                  </View>
                )}

                {isLowStock && (
                  <View className="flex-row items-center gap-1.5 self-start rounded-full border border-cta/40 bg-cta-light/60 dark:bg-cta/20 px-3 py-1">
                    <AlertTriangle size={13} color="#FF702E" />
                    <Text className="text-xs font-bold text-cta">
                      {t("facilityDetail.stockLow", { count: availableUnitsCount })}
                    </Text>
                  </View>
                )}

                {isOutOfStock && (
                  <View className="flex-row items-center gap-1.5 self-start rounded-full border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-1">
                    <XCircle size={13} color="#EF4444" />
                    <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                      {t("offeringDetail.outOfStock")}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* 3. Specifications Card */}
            <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
              <View className="flex-row items-center gap-2 border-b border-neutral-border/60 dark:border-neutral-800 pb-2.5">
                <Warehouse size={17} color="#0B927E" />
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100 uppercase tracking-wider">
                  {t("offeringDetail.packageInfo")}
                </Text>
              </View>

              <View className="gap-2.5">
                <View className="flex-row items-center gap-2">
                  <Ruler size={16} color="#0B927E" />
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {t("storageExplore.dimensionsLabel")}: {unitType.dimensions.length}m ×{" "}
                    {unitType.dimensions.width}m × {unitType.dimensions.height}m
                  </Text>
                </View>

                <View className="flex-row items-center gap-6">
                  <View className="flex-row items-center gap-1.5">
                    <Maximize2 size={15} color="#0B927E" />
                    <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                      {t("storageExplore.areaLabel")}: {unitType.area} m²
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    <Box size={15} color="#0B927E" />
                    <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                      {t("storageExplore.volumeLabel")}: {unitType.volume} m³
                    </Text>
                  </View>
                </View>

                {utAny.features && utAny.features.length > 0 && (
                  <View className="pt-2 border-t border-neutral-border/60 dark:border-neutral-800">
                    <Text className="mb-2 text-xs font-bold text-neutral-dark dark:text-neutral-200">
                      {t("storageExplore.featuresLabel")}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {utAny.features.map((feat: string, idx: number) => (
                        <View
                          key={`feat-${idx}`}
                          className="flex-row items-center gap-1.5 rounded-xl border border-brand/30 bg-brand-light/40 dark:bg-brand/20 px-2.5 py-1"
                        >
                          <Sparkles size={11} color="#0B927E" />
                          <Text className="text-xs font-semibold text-brand">{feat}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {utAny.description ? (
                  <View className="pt-2 border-t border-neutral-border/60 dark:border-neutral-800">
                    <Text variant="muted" className="text-xs leading-5">
                      {utAny.description}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* 4. Pricing & Rental Terms Card */}
            <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
              <View className="flex-row items-center gap-2 border-b border-neutral-border/60 dark:border-neutral-800 pb-2.5">
                <CalendarClock size={17} color="#FF702E" />
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100 uppercase tracking-wider">
                  {t("offeringDetail.pricingConditions")}
                </Text>
              </View>

              <View className="gap-2.5">
                <View className="flex-row items-center justify-between">
                  <Text variant="muted" className="text-xs">
                    {t("offeringDetail.pricePerUnit")}
                  </Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text className="text-base font-extrabold text-brand">
                      {formatVndPrice(pricePerUnit)}
                    </Text>
                    {billingUnit && (
                      <Text variant="muted" className="text-xs font-semibold">
                        {getBillingUnitSuffix(billingUnit, t)}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text variant="muted" className="text-xs">
                    {t("offeringDetail.depositMultiplier")}
                  </Text>
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {t("offeringDetail.depositMultiplierVal", { count: depositMultiplier })}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text variant="muted" className="text-xs">
                    {t("offeringDetail.estimatedDeposit")}
                  </Text>
                  <Text className="text-xs font-bold text-cta">
                    {formatVndPrice(estimatedDeposit)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text variant="muted" className="text-xs">
                    {t("offeringDetail.minRentalDays")}
                  </Text>
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {t("offeringDetail.minRentalDaysVal", { count: minRentalDays })}
                  </Text>
                </View>

                {offAny.notes ? (
                  <View className="pt-2 border-t border-neutral-border/60 dark:border-neutral-800">
                    <Text className="mb-1 text-xs font-bold text-neutral-dark dark:text-neutral-200">
                      {t("offeringDetail.notes")}
                    </Text>
                    <Text variant="muted" className="text-xs leading-5">
                      {offAny.notes}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* 5. Facility Provider Card */}
            {facility ? (
              <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
                <View className="flex-row items-center justify-between border-b border-neutral-border/60 dark:border-neutral-800 pb-2.5">
                  <View className="flex-row items-center gap-2">
                    <Building2 size={17} color="#0B927E" />
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100 uppercase tracking-wider">
                      {t("offeringDetail.facilityInfo")}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/facilities/[id]" as any,
                        params: { id: facility.id },
                      })
                    }
                    className="flex-row items-center gap-1"
                  >
                    <Text className="text-xs font-bold text-brand">
                      {t("offeringDetail.viewFacility")}
                    </Text>
                    <ArrowRight size={13} color="#0B927E" />
                  </Pressable>
                </View>

                <View className="gap-2">
                  <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                    {facility.name}
                  </Text>

                  {facility.address && (
                    <View className="flex-row items-start gap-2">
                      <MapPin size={14} color="#0B927E" />
                      <Text className="flex-1 text-xs text-neutral-main dark:text-neutral-300">
                        {facility.address}, {facility.city}
                      </Text>
                    </View>
                  )}

                  {facility.operatingHours && (
                    <View className="flex-row items-center gap-2">
                      <Clock size={14} color="#0B927E" />
                      <Text className="text-xs text-neutral-main dark:text-neutral-300">
                        {facility.operatingHours.open} – {facility.operatingHours.close}
                      </Text>
                    </View>
                  )}

                  {facility.phone && (
                    <View className="flex-row items-center gap-2">
                      <Phone size={14} color="#0B927E" />
                      <Text className="text-xs text-neutral-main dark:text-neutral-300">
                        {facility.phone}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-border dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 px-5 py-3.5 backdrop-blur-md shadow-lg flex-row items-center justify-between">
            <View>
              <Text variant="muted" className="text-[11px]">
                {t("offeringDetail.pricePerUnit")}
              </Text>
              <View className="flex-row items-baseline gap-1">
                <Text className="text-lg font-extrabold text-brand">
                  {formatVndPrice(pricePerUnit)}
                </Text>
                {billingUnit && (
                  <Text variant="muted" className="text-xs font-semibold">
                    {getBillingUnitSuffix(billingUnit, t)}
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              disabled={isOutOfStock}
              onPress={handleBookNow}
              className={`flex-row items-center gap-2 rounded-2xl px-6 py-3 shadow-md ${
                isOutOfStock
                  ? "bg-neutral-300 dark:bg-neutral-800 opacity-60"
                  : "bg-cta active:opacity-90"
              }`}
            >
              <Text
                className={`text-xs font-bold ${isOutOfStock ? "text-neutral-500" : "text-white"}`}
              >
                {isOutOfStock ? t("offeringDetail.outOfStock") : t("offeringDetail.bookNow")}
              </Text>
              {!isOutOfStock && <ArrowRight size={14} color="#FFFFFF" />}
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
