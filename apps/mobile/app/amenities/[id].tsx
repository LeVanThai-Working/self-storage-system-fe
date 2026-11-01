import React, { useMemo } from "react";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Wrench,
  Headphones,
  Tag,
  Building2,
  MapPin,
  Clock,
  Phone,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react-native";
import { AmenityTypeEnum, type BillingUnitEnum } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeader } from "@/components/layout/DetailHeader";
import { SettingsButton } from "@/features/auth/components/SettingsButton";
import { useTranslation } from "@/stores/language.store";
import {
  usePublicAmenityDetail,
  useFacilityPublicDetail,
} from "@/features/storage-explore/hooks/useStorageExplore";
import { DetailImageCarousel } from "@/features/storage-explore/components/DetailImageCarousel";
import {
  formatVndPrice,
  getAmenityTypeLabel,
  getBillingUnitSuffix,
} from "@/features/storage-explore/utils/storageFormat";

export default function AmenityDetailScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    offeringId?: string;
    facilityId?: string;
    facilityName?: string;
    price?: string;
    billingUnit?: string;
  }>();

  const amenityId = params.id;
  const facilityId = params.facilityId;
  const initialPrice = params.price ? Number(params.price) : undefined;
  const initialBillingUnit = params.billingUnit as BillingUnitEnum | undefined;

  // 1. Fetch Amenity Master Detail
  const {
    data: amenity,
    isLoading: isAmenityLoading,
    isError: isAmenityError,
    refetch: refetchAmenity,
  } = usePublicAmenityDetail(amenityId);

  // 2. Fetch Facility Detail (if facilityId provided) to enrich offering context
  const {
    data: facilityDetailData,
    isLoading: isFacilityLoading,
    refetch: refetchFacility,
  } = useFacilityPublicDetail(facilityId);

  const facility = facilityDetailData?.facility;

  const amenityOfferings = facilityDetailData?.amenityOfferings;
  const paramOfferingId = params.offeringId;

  // Find offering matching this amenity within the facility if available
  const matchedOffering = useMemo(() => {
    if (!amenityOfferings) return null;
    return amenityOfferings.find(
      (offering) =>
        (paramOfferingId && offering.id === paramOfferingId) ||
        offering.amenity?.id === amenityId ||
        (offering as any).amenityId === amenityId
    );
  }, [amenityOfferings, paramOfferingId, amenityId]);

  const pricePerUnit = matchedOffering ? matchedOffering.pricePerUnit : initialPrice;
  const billingUnit = (matchedOffering ? matchedOffering.billingUnit : initialBillingUnit) as
    BillingUnitEnum | undefined;
  const availableQuantity = matchedOffering?.availableQuantity;

  const isPhysical = amenity?.type === AmenityTypeEnum.PHYSICAL;
  const isFree = pricePerUnit === 0;

  const isLoading = isAmenityLoading || (Boolean(facilityId) && isFacilityLoading && !amenity);

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

  const handleViewFacility = () => {
    if (!facilityId) return;
    router.push({
      pathname: "/facilities/[id]" as any,
      params: { id: facilityId },
    });
  };

  const onRefresh = () => {
    refetchAmenity();
    if (facilityId) {
      refetchFacility();
    }
  };

  // Image list for carousel
  const carouselImages = useMemo(() => {
    if (!amenity) return [];
    if (amenity.images && amenity.images.length > 0) {
      return amenity.images;
    }
    return [];
  }, [amenity]);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* ── Top Header ────────────────────────────────────────── */}
      <DetailHeader
        title={amenity?.name || t("amenityDetail.title")}
        subtitle={facility?.name}
        onBack={handleBack}
        rightElement={<SettingsButton variant="brand" />}
      />

      {/* ── Loading Skeleton ──────────────────────────────────── */}
      {isLoading ? (
        <ScrollView contentContainerClassName="p-4 gap-4" showsVerticalScrollIndicator={false}>
          <Skeleton className="h-56 w-full rounded-3xl" />
          <View className="rounded-3xl bg-white dark:bg-neutral-900 p-5 gap-3 border border-neutral-border dark:border-neutral-800">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/3 rounded-lg" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </View>
          <View className="rounded-3xl bg-white dark:bg-neutral-900 p-5 gap-3 border border-neutral-border dark:border-neutral-800">
            <Skeleton className="h-5 w-1/2 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </View>
        </ScrollView>
      ) : isAmenityError || !amenity ? (
        /* ── Error State ──────────────────────────────────────── */
        <View className="flex-1 items-center justify-center p-6 text-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
            <AlertCircle size={32} color="#EF4444" />
          </View>
          <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
            {locale === "en" ? "Amenity not found" : "Không tìm thấy tiện ích"}
          </Text>
          <Text variant="muted" className="mt-1 text-center text-xs">
            {locale === "en"
              ? "The amenity information might have been updated or is no longer available."
              : "Thông tin tiện ích có thể đã được cập nhật hoặc không còn khả dụng."}
          </Text>
          <Pressable
            onPress={handleBack}
            className="mt-5 rounded-2xl bg-brand px-5 py-2.5 active:opacity-90"
          >
            <Text className="text-xs font-bold text-white">
              {locale === "en" ? "Go Back" : "Quay lại"}
            </Text>
          </Pressable>
        </View>
      ) : (
        /* ── Amenity Detail Content ────────────────────────────── */
        <ScrollView
          contentContainerClassName="p-4 pb-14 gap-4"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        >
          {/* 1. Image Carousel */}
          <DetailImageCarousel
            images={carouselImages}
            fallbackIcon="facility"
            fallbackLabel={amenity.name}
            height={220}
          />

          {/* 2. Primary Information Card */}
          <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm gap-3.5">
            {/* Title & Type Badge */}
            <View className="gap-1.5">
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-brand-light/70 dark:bg-brand/20">
                  {isPhysical ? (
                    <Wrench size={18} color="#0B927E" />
                  ) : (
                    <Headphones size={18} color="#0B927E" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-neutral-dark dark:text-neutral-100">
                    {amenity.name}
                  </Text>
                  <Text className="text-xs font-semibold text-brand">
                    {getAmenityTypeLabel(amenity.type, t)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Pricing / Cost Highlight */}
            {pricePerUnit !== undefined && (
              <View className="rounded-2xl border border-cta/30 bg-cta-light/30 dark:bg-cta/10 p-3.5 flex-row items-center justify-between">
                <View className="gap-0.5">
                  <Text className="text-xs font-medium text-neutral-muted dark:text-neutral-400">
                    {t("amenityDetail.pricing")}
                  </Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text className="text-xl font-extrabold text-cta">
                      {isFree ? t("amenityDetail.free") : formatVndPrice(pricePerUnit)}
                    </Text>
                    {!isFree && billingUnit && (
                      <Text className="text-xs font-semibold text-neutral-main dark:text-neutral-300">
                        {getBillingUnitSuffix(billingUnit, t)}
                      </Text>
                    )}
                  </View>
                </View>

                {availableQuantity != null && (
                  <View className="items-end">
                    <Text className="text-xs font-medium text-neutral-muted dark:text-neutral-400">
                      {t("amenityDetail.quantityStatus")}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <CheckCircle2 size={13} color="#0B927E" />
                      <Text className="text-xs font-bold text-brand">
                        {availableQuantity > 0
                          ? t("amenityDetail.availableQty", { count: availableQuantity })
                          : t("amenityDetail.unlimitedQty")}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Description */}
            <View className="border-t border-neutral-border/60 dark:border-neutral-800 pt-3 gap-1.5">
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                {t("amenityDetail.description")}
              </Text>
              <Text
                variant="muted"
                className="text-xs leading-5 text-neutral-main dark:text-neutral-300"
              >
                {amenity.description ||
                  (locale === "en"
                    ? "No detailed description available for this amenity."
                    : "Chưa có mô tả chi tiết cho tiện ích này.")}
              </Text>
            </View>

            {/* Tags */}
            {amenity.tags && amenity.tags.length > 0 && (
              <View className="border-t border-neutral-border/60 dark:border-neutral-800 pt-3 gap-2">
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                  {t("amenityDetail.tags")}
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {amenity.tags.map((tag, idx) => (
                    <View
                      key={`tag-${idx}`}
                      className="flex-row items-center gap-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1"
                    >
                      <Tag size={11} color="#647B80" />
                      <Text className="text-xs text-neutral-main dark:text-neutral-300">{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* 3. Facility Information Card (if applicable) */}
          {facility && (
            <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm gap-3">
              <View className="flex-row items-center justify-between border-b border-neutral-border/60 dark:border-neutral-800 pb-3">
                <View className="flex-row items-center gap-2">
                  <Building2 size={18} color="#0B927E" />
                  <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                    {t("amenityDetail.facility")}
                  </Text>
                </View>

                <Pressable
                  onPress={handleViewFacility}
                  className="flex-row items-center gap-1 active:opacity-70"
                >
                  <Text className="text-xs font-bold text-brand">
                    {t("amenityDetail.viewFacility")}
                  </Text>
                  <ArrowRight size={13} color="#0B927E" />
                </Pressable>
              </View>

              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {facility.name}
              </Text>

              {/* Address */}
              <View className="flex-row items-start gap-2">
                <MapPin size={15} color="#0B927E" className="mt-0.5" />
                <Text
                  variant="muted"
                  className="flex-1 text-xs leading-4 text-neutral-main dark:text-neutral-300"
                >
                  {facility.address}
                </Text>
              </View>

              {/* Operating Hours & Hotline */}
              <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
                {facility.operatingHours && (
                  <View className="flex-row items-center gap-1.5">
                    <Clock size={13} color="#647B80" />
                    <Text className="text-xs text-neutral-main dark:text-neutral-300">
                      {facility.operatingHours.open} – {facility.operatingHours.close}
                    </Text>
                  </View>
                )}

                {facility.phone && (
                  <View className="flex-row items-center gap-1.5">
                    <Phone size={13} color="#647B80" />
                    <Text className="text-xs text-neutral-main dark:text-neutral-300">
                      {facility.phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
