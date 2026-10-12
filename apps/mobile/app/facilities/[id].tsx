import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Clock,
  Phone,
  Mail,
  FileText,
  Warehouse,
  Sparkles,
  AlertCircle,
} from "lucide-react-native";
import type { PublicUnitTypeOfferingResponse } from "@self-storage-system-fe/shared";
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
import { DetailImageCarousel } from "@/features/storage-explore/components/DetailImageCarousel";

const MAX_PREVIEW_OFFERINGS = 5;
const CARD_GAP = 8;

export default function FacilityPublicDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string; facilityId?: string }>();
  const facilityId = params.id || params.facilityId;

  const { isAuthenticated } = useAuthStore();
  const setHandoffPayload = useReservationHandoffStore((s) => s.setHandoffPayload);

  const [sectionWidth, setSectionWidth] = useState<number>(
    Math.max(Dimensions.get("window").width - 32, 280)
  );

  // Single data source: GET /facilities/{id}/public-detail
  const { data, isLoading, isRefetching, isError, isNotFoundError, refetch } =
    useFacilityPublicDetail(facilityId);

  const facility = data?.facility as
    | (NonNullable<typeof data>["facility"] & {
        images?: string[] | null;
        imageUrl?: string | null;
      })
    | undefined;
  const rawUnitOfferings = useMemo(() => data?.unitTypeOfferings ?? [], [data?.unitTypeOfferings]);
  const amenityOfferings = useMemo(() => data?.amenityOfferings ?? [], [data?.amenityOfferings]);

  // Show at most 5 storage offerings on the Facility Detail preview
  const previewOfferings = useMemo(
    () => rawUnitOfferings.slice(0, MAX_PREVIEW_OFFERINGS),
    [rawUnitOfferings]
  );

  // Calculate card width so at most 3 cards fit on the screen at once
  const compactCardWidth = useMemo(
    () => Math.max(Math.floor((sectionWidth - CARD_GAP * 2) / 3), 96),
    [sectionWidth]
  );

  // Collect images for Facility Carousel
  const facilityImages = useMemo(() => {
    if (!facility) return [];
    const list: string[] = [];
    if (Array.isArray(facility.images)) {
      list.push(...facility.images.filter(Boolean));
    }
    if (facility.imageUrl && !list.includes(facility.imageUrl)) {
      list.unshift(facility.imageUrl);
    }
    return list;
  }, [facility]);

  const handleSectionLayout = (event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    if (width > 0 && width !== sectionWidth) {
      setSectionWidth(width);
    }
  };

  // Navigate to dedicated Paginated Offerings Screen for this facilityId
  const handleSeeMoreOfferings = useCallback(() => {
    if (!facility) return;
    router.push({
      pathname: "/facilities/[id]/offerings" as any,
      params: {
        id: facility.id,
        facilityId: facility.id,
        facilityName: facility.name,
      },
    });
  }, [facility, router]);

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
      {/* Custom Top Header with Back Button & Settings */}
      <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 bg-neutral-bg dark:bg-neutral-900 px-4 py-3">
        <View className="flex-row items-center gap-3 flex-1">
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            className="items-center justify-center p-1 active:opacity-70"
          >
            <ArrowLeft size={20} color="#0B927E" />
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
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
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
          {/* ── Section 2.1: Facility Info (Unboxed: Carousel -> Info -> Description) ── */}
          <View onLayout={handleSectionLayout} className="gap-4">
            {/* 1. Carousel xem ảnh */}
            <DetailImageCarousel
              images={facilityImages}
              fallbackIcon="facility"
              fallbackLabel={facility.name}
              height={216}
            />

            {/* 2. Thông tin cơ sở (Không nằm trong Card) */}
            <View className="gap-3 px-1">
              <View className="flex-row items-start justify-between gap-3">
                <Text className="flex-1 text-xl font-extrabold text-neutral-dark dark:text-neutral-100">
                  {facility.name}
                </Text>
                <Badge
                  variant="outline"
                  className="border-brand/40 bg-brand-light/40 dark:bg-brand/20"
                >
                  <Text className="text-xs font-semibold text-brand">{facility.city}</Text>
                </Badge>
              </View>

              {/* Địa chỉ */}
              <View className="flex-row items-start gap-2.5">
                <MapPin size={16} color="#0B927E" />
                <Text className="flex-1 text-xs font-medium leading-4 text-neutral-dark dark:text-neutral-200">
                  {facility.address}, {facility.city}
                </Text>
              </View>

              {/* Giờ hoạt động */}
              <View className="flex-row items-center gap-2.5">
                <Clock size={16} color="#0B927E" />
                <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                  {t("facilityDetail.operatingHoursLabel")}:{" "}
                  {facility.operatingHours
                    ? `${facility.operatingHours.open} – ${facility.operatingHours.close}`
                    : t("facilityDetail.contactForHours")}
                </Text>
              </View>

              {/* Điện thoại & Email */}
              {(facility.phone || facility.email) && (
                <View className="flex-row flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                  {facility.phone ? (
                    <View className="flex-row items-center gap-2">
                      <Phone size={15} color="#0B927E" />
                      <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                        {facility.phone}
                      </Text>
                    </View>
                  ) : null}

                  {facility.email ? (
                    <View className="flex-row items-center gap-2">
                      <Mail size={15} color="#0B927E" />
                      <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                        {facility.email}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            {/* 3. Description (Mô tả chi tiết) */}
            {facility.description ? (
              <View className="border-t border-neutral-border/70 dark:border-neutral-800 pt-3.5 px-1">
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
                  {facility.description}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ── Section 2.2: Storage Packages (Max 5, Horizontal Scroll, 3 per screen) ── */}
          <View className="gap-3">
            {/* Section Title + Borderless/Background-less "See more ->" Button */}
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-2 flex-1">
                <Warehouse size={18} color="#0B927E" />
                <Text
                  numberOfLines={1}
                  className="flex-1 text-base font-bold text-neutral-dark dark:text-neutral-100"
                >
                  {t("facilityDetail.unitOfferingsTitle")}
                </Text>
              </View>

              <Pressable
                onPress={handleSeeMoreOfferings}
                hitSlop={10}
                className="flex-row items-center gap-1 bg-transparent border-0 py-1 active:opacity-70"
              >
                <Text className="text-xs font-bold text-brand">{t("facilityDetail.seeMore")}</Text>
                <ArrowRight size={14} color="#0B927E" />
              </Pressable>
            </View>

            {/* Horizontal Scroll of up to 5 compact storage cards (max 3 visible per screen) */}
            {previewOfferings.length === 0 ? (
              <View className="items-center justify-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
                <Warehouse size={28} color="#647B80" />
                <Text variant="muted" className="mt-2 text-center text-xs">
                  {t("facilityDetail.noOfferingsMatch")}
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={compactCardWidth + CARD_GAP}
                contentContainerStyle={{ gap: CARD_GAP }}
              >
                {previewOfferings.map((offering) => (
                  <UnitTypeOfferingCard
                    key={offering.id}
                    offering={offering}
                    onSelectOffering={handleSelectOffering}
                    compact
                    cardWidth={compactCardWidth}
                  />
                ))}
              </ScrollView>
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
