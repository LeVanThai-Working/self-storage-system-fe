import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable, TextInput, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/stores/toast.store";
import { useTranslation } from "@/stores/language.store";
import { useReservationHandoffStore } from "@/features/storage-explore/stores/reservationHandoff.store";
import {
  useFacilitiesExplore,
  useFacilityPublicDetail,
} from "@/features/storage-explore/hooks/useStorageExplore";
import {
  getBillingUnitSuffix,
  getUnitCategoryLabel,
} from "@/features/storage-explore/utils/storageFormat";
import {
  AmenityTypeEnum,
  RentalTargetTypeEnum,
  type MessageLocale,
  type PublicAmenityOfferingResponse,
  type PublicUnitTypeOfferingResponse,
} from "@self-storage-system-fe/shared";
import {
  AlertTriangle,
  Building2,
  Boxes,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  CheckCircle2,
  Check,
  Layers,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react-native";
import {
  useCreateReservation,
  useAvailableUnits,
  useAvailableTimeSlots,
} from "../hooks/useReservations";
import { MobileMapLayoutModal } from "./MobileMapLayoutModal";
import { MobileRackPicker } from "./MobileRackPicker";
import {
  formatRentalDurationDays,
  formatVnd,
  getTodayDateInput,
  parseAndValidateStartDate,
  requiresAdvanceDayForCategory,
  resolveReservationErrorMessage,
} from "../utils/reservationFormat";

interface CreateReservationViewProps {
  initialFacilityId?: string;
  initialOfferingId?: string;
  initialUnitTypeId?: string;
  initialUnitId?: string;
  onSuccessNavigate?: (reservationId: string) => void;
}

export function CreateReservationView({
  initialFacilityId,
  initialOfferingId,
  initialUnitTypeId,
  initialUnitId,
  onSuccessNavigate,
}: CreateReservationViewProps) {
  const router = useRouter();
  const toast = useToast();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const isEn = currentLocale === "en";

  const { handoffPayload, clearHandoffPayload } = useReservationHandoffStore();

  // Determine active facilityId (from handoffPayload, route param, manual picker, or first loaded facility)
  const [manualFacilityId, setManualFacilityId] = useState<string | undefined>(initialFacilityId);
  const [manualOfferingId, setManualOfferingId] = useState<string | undefined>(initialOfferingId);

  // Fallback fetch public facilities if user opened Create screen directly without selecting a facility
  const facilitiesQuery = useFacilitiesExplore({
    selectedAmenityIds: [],
    matchAll: true,
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  });

  const activeFacilityId =
    handoffPayload?.facilityId ||
    manualFacilityId ||
    initialFacilityId ||
    facilitiesQuery.items[0]?.id;

  // Fallback fetch `GET /facilities/{facilityId}/public-detail` when handoffPayload is not present or needs enrichment
  const facilityDetailQuery = useFacilityPublicDetail(activeFacilityId);

  const resolvedFacilityName =
    handoffPayload?.facilityName ||
    facilityDetailQuery.data?.facility?.name ||
    facilitiesQuery.items.find((f) => f.id === activeFacilityId)?.name ||
    "";

  const resolvedFacilityAddress =
    facilityDetailQuery.data?.facility?.address ||
    facilitiesQuery.items.find((f) => f.id === activeFacilityId)?.address ||
    "";

  const availableOfferings = useMemo<PublicUnitTypeOfferingResponse[]>(() => {
    const list = facilityDetailQuery.data?.unitTypeOfferings ?? [];
    return list.filter((item) => item.availableUnitsCount > 0);
  }, [facilityDetailQuery.data?.unitTypeOfferings]);

  // Determine active Offering
  const selectedOffering = useMemo<PublicUnitTypeOfferingResponse | null>(() => {
    if (handoffPayload?.offering && handoffPayload.facilityId === activeFacilityId) {
      return handoffPayload.offering;
    }
    if (manualOfferingId) {
      const match = availableOfferings.find((o) => o.id === manualOfferingId);
      if (match) return match;
    }
    if (initialOfferingId) {
      const match = availableOfferings.find((o) => o.id === initialOfferingId);
      if (match) return match;
    }
    if (initialUnitTypeId) {
      const match = availableOfferings.find((o) => o.unitTypeId === initialUnitTypeId);
      if (match) return match;
    }
    return availableOfferings[0] ?? null;
  }, [
    handoffPayload,
    activeFacilityId,
    manualOfferingId,
    initialOfferingId,
    initialUnitTypeId,
    availableOfferings,
  ]);

  // Available Amenities with `availableQuantity > 0` (Section 1.3)
  const availableAmenities = useMemo<PublicAmenityOfferingResponse[]>(() => {
    const raw =
      handoffPayload?.facilityId === activeFacilityId && handoffPayload?.availableAmenities?.length
        ? handoffPayload.availableAmenities
        : (facilityDetailQuery.data?.amenityOfferings ?? []);
    return raw.filter(
      (item) => item.amenity?.type === AmenityTypeEnum.SERVICE || (item.availableQuantity ?? 0) > 0
    );
  }, [handoffPayload, activeFacilityId, facilityDetailQuery.data?.amenityOfferings]);

  const minRentalDays = Math.max(1, selectedOffering?.minRentalDays ?? 1);
  const selectedCategory = selectedOffering?.unitType?.category;
  const requiresAdvanceDay = requiresAdvanceDayForCategory(selectedCategory);

  // Form State (Sections 1.2 - 1.4)
  const [customStartDateInput, setCustomStartDateInput] = useState<string | null>(null);
  const startDateInput = customStartDateInput ?? getTodayDateInput(requiresAdvanceDay ? 1 : 0);

  const [customRentalDuration, setCustomRentalDuration] = useState<number | null>(null);
  const [amenityQuantities, setAmenityQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>("");

  // Storage Unit Selection & 2D Map Layout
  const availableUnitsQuery = useAvailableUnits(activeFacilityId, selectedOffering?.unitTypeId);
  const availableUnits = availableUnitsQuery.data ?? [];
  const targetUnitId = initialUnitId || handoffPayload?.storageUnitId || null;
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(targetUnitId);
  const [prevTargetUnitId, setPrevTargetUnitId] = useState(targetUnitId);
  if (targetUnitId !== prevTargetUnitId) {
    setPrevTargetUnitId(targetUnitId);
    if (targetUnitId) {
      setSelectedUnitId(targetUnitId);
    }
  }
  const activeUnitId = selectedUnitId || (availableUnits.length > 0 ? availableUnits[0].id : null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Warehouse Rack Selection
  const isWarehouseRack = selectedOffering?.unitType?.category === "warehouse_rack";
  const [selectedRackIds, setSelectedRackIds] = useState<string[]>([]);

  // Check-in Date & Time Slot
  const [checkInDateInput, setCheckInDateInput] = useState<string>(() => getTodayDateInput(0));
  const availableSlotsQuery = useAvailableTimeSlots(activeFacilityId, checkInDateInput);
  const availableSlots = availableSlotsQuery.data ?? [];
  const [selectedSlotName, setSelectedSlotName] = useState<string | null>(null);
  const activeSlotName =
    selectedSlotName || (availableSlots.find((s) => s.isAvailable)?.slotName ?? null);

  // Terms and Immediate Forfeit Warning (< 24h)
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showForfeitModal, setShowForfeitModal] = useState(false);

  const isImmediateForfeit = Boolean(checkInDateInput && checkInDateInput <= getTodayDateInput(0));

  const [dateError, setDateError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);

  const rentalDuration = customRentalDuration === null ? minRentalDays : customRentalDuration;

  const toggleAmenity = (offeringId: string, maxQty: number) => {
    setAmenityQuantities((prev) => {
      const next = { ...prev };
      if (next[offeringId]) {
        delete next[offeringId];
      } else if (maxQty >= 1) {
        next[offeringId] = 1;
      }
      return next;
    });
  };

  const updateAmenityQuantity = (offeringId: string, delta: number, maxQty: number) => {
    setAmenityQuantities((prev) => {
      const current = prev[offeringId] ?? 0;
      const nextVal = current + delta;
      const next = { ...prev };
      if (nextVal <= 0) {
        delete next[offeringId];
      } else {
        next[offeringId] = Math.min(maxQty, Math.max(1, nextVal));
      }
      return next;
    });
  };

  // Section 1.5: Exact Pricing Formulas matching Backend calculation
  const basePrice = selectedOffering?.pricePerUnit ?? 0;
  const depositMultiplier = selectedOffering?.depositMultiplier || 1;
  const depositAmount = basePrice * depositMultiplier;

  const amenitiesTotal = useMemo(() => {
    return availableAmenities.reduce((sum, item) => {
      const qty = amenityQuantities[item.id] ?? 0;
      return sum + (item.pricePerUnit || 0) * qty;
    }, 0);
  }, [availableAmenities, amenityQuantities]);

  const totalAmount = depositAmount + amenitiesTotal;

  const createMutation = useCreateReservation();

  const handleSubmit = async () => {
    setDateError(null);
    setDurationError(null);

    if (!activeFacilityId || !selectedOffering) {
      toast.error(
        isEn
          ? "Please select a storage facility and unit package first."
          : "Vui lòng chọn cơ sở kho và gói loại kho trước khi đặt chỗ."
      );
      return;
    }

    const parsedDate = parseAndValidateStartDate(startDateInput, selectedCategory);
    if (!parsedDate.isValidFormat) {
      setDateError(
        isEn
          ? "Invalid date format. Please use YYYY-MM-DD."
          : "Định dạng ngày không hợp lệ. Vui lòng nhập theo YYYY-MM-DD."
      );
      return;
    }
    if (!parsedDate.isNotInPast) {
      setDateError(
        isEn
          ? "Start date cannot be in the past."
          : "Ngày bắt đầu thuê không được nằm trong quá khứ."
      );
      return;
    }
    if (!parsedDate.isSatisfyingAdvanceDay) {
      setDateError(
        isEn
          ? "For Small, Medium, and Large storage units, the expected move-in date must be at least 1 day after today (to allow time for order processing)."
          : "Đối với kho loại Small, Medium, Large thì ngày dự kiến bắt đầu thuê sẽ phải là sau 1 ngày hiện tại (để chừa thời gian tiếp nhận đơn)."
      );
      return;
    }

    if (!Number.isInteger(rentalDuration) || rentalDuration < minRentalDays) {
      setDurationError(
        isEn
          ? `Minimum rental duration for this package is ${minRentalDays} days.`
          : `Thời gian thuê tối thiểu của gói kho này là ${minRentalDays} ngày.`
      );
      return;
    }

    const validAmenityIds = new Set(availableAmenities.map((item) => item.id));
    const amenitiesPayload = Object.entries(amenityQuantities)
      .filter(([id, qty]) => validAmenityIds.has(id) && qty >= 1)
      .map(([facilityAmenityOfferingId, quantity]) => ({
        facilityAmenityOfferingId,
        quantity,
      }));

    if (!activeUnitId) {
      toast.error(
        isEn
          ? "Please select a free storage unit below."
          : "Vui lòng chọn một phòng kho trống trong danh sách bên dưới."
      );
      return;
    }

    if (!activeSlotName) {
      toast.error(
        isEn ? "Please select a check-in time slot." : "Vui lòng chọn một khung giờ hẹn check-in."
      );
      return;
    }

    if (!termsAccepted) {
      toast.error(
        isEn
          ? "Please accept the Terms & Policies before proceeding."
          : "Vui lòng đồng ý với Điều khoản & Chính sách trước khi tiếp tục."
      );
      return;
    }

    if (isWarehouseRack && selectedRackIds.length === 0) {
      toast.error(
        isEn
          ? "Please select at least one storage rack to rent."
          : "Vui lòng chọn ít nhất 1 kệ kho để thuê."
      );
      return;
    }

    if (isImmediateForfeit && !showForfeitModal) {
      setShowForfeitModal(true);
      return;
    }

    setShowForfeitModal(false);

    try {
      const res = await createMutation.mutateAsync({
        facilityId: activeFacilityId,
        storageUnitId: activeUnitId,
        rentalTargetType: isWarehouseRack
          ? RentalTargetTypeEnum.STORAGE_RACK
          : RentalTargetTypeEnum.STORAGE_UNIT,
        rentedRackIds: isWarehouseRack && selectedRackIds.length > 0 ? selectedRackIds : undefined,
        checkInDate: new Date(`${checkInDateInput}T00:00:00+07:00`).toISOString(),
        checkInTimeSlot: activeSlotName,
        facilityUnitTypeOfferingId: selectedOffering.id,
        startDate: parsedDate.isoString,
        rentalDuration,
        amenities: amenitiesPayload,
        notes: notes.trim() ? notes.trim() : undefined,
        termsAccepted: true,
      });

      toast.success(
        isEn
          ? `Reservation #${res.data.reservationCode} submitted!`
          : `Gửi yêu cầu đặt chỗ #${res.data.reservationCode} thành công!`
      );

      if (onSuccessNavigate) {
        onSuccessNavigate(res.data.id);
      } else {
        router.push({
          pathname: "/reservations/[id]" as any,
          params: { id: res.data.id },
        });
      }

      clearHandoffPayload();
    } catch (error) {
      const resolved = resolveReservationErrorMessage(error, currentLocale, "reservation");
      toast.error(resolved.message);
    }
  };

  const quickDateOptions = requiresAdvanceDay
    ? [
        { label: isEn ? "Tomorrow" : "Ngày mai", value: getTodayDateInput(1) },
        { label: isEn ? "+2 Days" : "+2 ngày", value: getTodayDateInput(2) },
        { label: isEn ? "+3 Days" : "+3 ngày", value: getTodayDateInput(3) },
        { label: isEn ? "+7 Days" : "+7 ngày", value: getTodayDateInput(7) },
      ]
    : [
        { label: isEn ? "Today" : "Hôm nay", value: getTodayDateInput(0) },
        { label: isEn ? "Tomorrow" : "Ngày mai", value: getTodayDateInput(1) },
        { label: isEn ? "+3 Days" : "+3 ngày", value: getTodayDateInput(3) },
        { label: isEn ? "+7 Days" : "+7 ngày", value: getTodayDateInput(7) },
      ];

  const quickDurationPresets = useMemo(() => {
    const candidates = minRentalDays < 30 ? [minRentalDays, 30, 90, 180, 360] : [30, 90, 180, 360];
    const uniqueDays = Array.from(new Set(candidates.filter((d) => d >= minRentalDays))).slice(
      0,
      4
    );

    return uniqueDays.map((days) => {
      if (days % 30 === 0) {
        const months = days / 30;
        return {
          days,
          label: isEn
            ? `${months} ${months === 1 ? "month" : "months"} (${days} days)`
            : `${months} tháng (${days} ngày)`,
        };
      }
      return {
        days,
        label: isEn ? `${days} ${days === 1 ? "day" : "days"}` : `${days} ngày`,
      };
    });
  }, [minRentalDays, isEn]);

  const selectedAmenityCount = useMemo(() => {
    return availableAmenities.filter((item) => (amenityQuantities[item.id] ?? 0) > 0).length;
  }, [availableAmenities, amenityQuantities]);

  return (
    <ScrollView contentContainerClassName="p-4 pb-16 gap-4" showsVerticalScrollIndicator={false}>
      {/* ── Section 1.1: Selected Facility & Offering Summary ── */}
      <View
        key="section-1-facility"
        className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Building2 size={18} color="#0B927E" />
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {isEn ? "1. Facility & Storage Package" : "1. Cơ sở & Gói kho đã chọn"}
            </Text>
          </View>

          {handoffPayload ? (
            <Pressable
              key="change-handoff-btn"
              onPress={() => {
                clearHandoffPayload();
                setCustomRentalDuration(null);
              }}
              className="flex-row items-center gap-1 rounded-lg border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1"
            >
              <RefreshCw size={11} color="#647B80" />
              <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                {isEn ? "Change" : "Thay đổi"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* If no handoffPayload, allow selecting from active facilities & offerings */}
        {!handoffPayload ? (
          <View key="manual-facility-picker" className="mb-3 gap-3">
            <View>
              <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                {isEn ? "Select Facility:" : "Chọn cơ sở kho:"}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                {facilitiesQuery.items.map((fac) => {
                  const isSelected = fac.id === activeFacilityId;
                  return (
                    <Pressable
                      key={fac.id}
                      onPress={() => {
                        setManualFacilityId(fac.id);
                        setManualOfferingId(undefined);
                        setCustomRentalDuration(null);
                        setAmenityQuantities({});
                      }}
                      className={`rounded-xl border px-3.5 py-2 ${
                        isSelected
                          ? "border-brand bg-brand-light/40 dark:bg-brand/20"
                          : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? "text-brand" : "text-neutral-dark dark:text-neutral-200"
                        }`}
                      >
                        {fac.name}
                      </Text>
                      <Text variant="muted" className="text-[10px]">
                        {fac.city}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {facilityDetailQuery.isLoading ? (
              <Skeleton key="offering-picker-skeleton" className="h-24 w-full rounded-2xl" />
            ) : availableOfferings.length > 0 ? (
              <View key="offering-picker-list">
                <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                  {isEn ? "Select Available Package:" : "Chọn gói loại kho còn trống:"}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2"
                >
                  {availableOfferings.map((off) => {
                    const isSelected = selectedOffering?.id === off.id;
                    return (
                      <Pressable
                        key={off.id}
                        onPress={() => {
                          setManualOfferingId(off.id);
                          const nextMin = Math.max(1, off.minRentalDays ?? 1);
                          setCustomRentalDuration((prev) =>
                            prev === null ? null : Math.max(nextMin, prev)
                          );
                        }}
                        className={`w-48 rounded-2xl border p-3 ${
                          isSelected
                            ? "border-brand bg-brand-light/40 dark:bg-brand/20"
                            : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? "text-brand" : "text-neutral-dark dark:text-neutral-100"
                          }`}
                          numberOfLines={1}
                        >
                          {off.unitType.name}
                        </Text>
                        <Text variant="muted" className="text-[11px] mt-0.5">
                          {off.unitType.area} m² • {getUnitCategoryLabel(off.unitType.category, t)}
                        </Text>
                        <Text className="text-xs font-extrabold text-brand mt-1.5">
                          {formatVnd(off.pricePerUnit)} {getBillingUnitSuffix(off.billingUnit, t)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <View
                key="offering-picker-empty"
                className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3"
              >
                <Text className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {isEn
                    ? "No available storage packages at this facility right now."
                    : "Hiện cơ sở này chưa có gói loại kho còn trống."}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Selected Offering Summary Card */}
        {selectedOffering ? (
          <View
            key="selected-offering-summary"
            className="rounded-2xl border border-brand/40 bg-brand-light/25 dark:bg-brand/15 p-3.5 gap-2"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100 flex-1">
                {resolvedFacilityName}
              </Text>
              <Badge variant="outline" className="border-brand/40 bg-white dark:bg-neutral-900">
                <Text className="text-[10px] font-bold text-brand">
                  {getUnitCategoryLabel(selectedOffering.unitType.category, t)}
                </Text>
              </Badge>
            </View>

            {resolvedFacilityAddress ? (
              <Text variant="muted" className="text-[11px]" numberOfLines={1}>
                {resolvedFacilityAddress}
              </Text>
            ) : null}

            <View className="border-t border-brand/20 pt-2 mt-0.5 gap-1.5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Boxes size={13} color="#0B927E" />
                  <Text variant="muted" className="text-xs">
                    {isEn ? "Package:" : "Loại kho:"}
                  </Text>
                </View>
                <Text className="text-xs font-extrabold text-brand">
                  {selectedOffering.unitType.name}
                </Text>
              </View>

              {selectedOffering.unitType.dimensions ? (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <Ruler size={13} color="#647B80" />
                    <Text variant="muted" className="text-xs">
                      {isEn ? "Dimensions:" : "Kích thước:"}
                    </Text>
                  </View>
                  <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                    {selectedOffering.unitType.dimensions.length}m ×{" "}
                    {selectedOffering.unitType.dimensions.width}m ×{" "}
                    {selectedOffering.unitType.dimensions.height}m ({selectedOffering.unitType.area}{" "}
                    m²)
                  </Text>
                </View>
              ) : null}

              <View className="flex-row items-center justify-between">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Unit Price:" : "Đơn giá thuê:"}
                </Text>
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {formatVnd(selectedOffering.pricePerUnit)}{" "}
                  {getBillingUnitSuffix(selectedOffering.billingUnit, t)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Minimum Rental:" : "Thuê tối thiểu:"}
                </Text>
                <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                  {formatRentalDurationDays(minRentalDays, currentLocale)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <ShieldCheck size={13} color="#0B927E" />
                  <Text variant="muted" className="text-xs">
                    {isEn ? "Deposit Required:" : "Tiền cọc giữ chỗ:"}
                  </Text>
                </View>
                <Text className="text-xs font-extrabold text-brand">
                  {formatVnd(depositAmount)} (×{depositMultiplier})
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {/* ── Section: Select Storage Unit (2D Map & Vacant List) ── */}
      <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Boxes size={18} color="#0B927E" />
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {isEn ? "2. Choose Storage Unit" : "2. Chọn phòng kho vật lý"}
            </Text>
          </View>
          <Pressable
            onPress={() => setIsMapModalOpen(true)}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 active:opacity-70"
          >
            <Layers size={13} color="#0B927E" />
            <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              {isEn ? "2D Floor Plan" : "Xem sơ đồ"}
            </Text>
          </Pressable>
        </View>

        <Text variant="muted" className="text-xs">
          {isEn
            ? "Tap a vacant unit below or open the 2D Floor Plan to select your room:"
            : "Chọn phòng kho trống bên dưới hoặc mở Sơ đồ 2D để xem trực quan mặt bằng:"}
        </Text>

        {handoffPayload?.selectedUnit && activeUnitId === handoffPayload.selectedUnit.id ? (
          <View className="flex-row items-center gap-2 p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 size={15} color="#0B927E" />
            <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
              {isEn
                ? `Pre-selected from 2D Map: #${handoffPayload.selectedUnit.unitNumber} (Floor ${handoffPayload.selectedUnit.floor}${handoffPayload.selectedUnit.zone ? `, Zone ${handoffPayload.selectedUnit.zone}` : ""})`
                : `Phòng #${handoffPayload.selectedUnit.unitNumber} (Tầng ${handoffPayload.selectedUnit.floor}${handoffPayload.selectedUnit.zone ? `, Khu ${handoffPayload.selectedUnit.zone}` : ""})`}
            </Text>
          </View>
        ) : null}

        {availableUnitsQuery.isLoading ? (
          <Skeleton className="h-16 w-full rounded-2xl" />
        ) : availableUnits.length === 0 ? (
          <View className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 p-3">
            <Text className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              {isEn
                ? "No units available of this type right now."
                : "Hiện chưa có phòng kho trống thuộc loại kho này tại cơ sở."}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2.5 py-1"
          >
            {availableUnits.map((u) => {
              const isSelected = activeUnitId === u.id;
              return (
                <Pressable
                  key={u.id}
                  onPress={() => setSelectedUnitId(u.id)}
                  className={`rounded-2xl border p-3 w-36 ${
                    isSelected
                      ? "border-brand bg-brand-light/40 dark:bg-brand/20 shadow-sm"
                      : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className={`text-sm font-extrabold ${isSelected ? "text-brand" : "text-neutral-dark dark:text-neutral-100"}`}
                    >
                      #{u.unitNumber}
                    </Text>
                    {isSelected && <CheckCircle2 size={14} color="#0B927E" />}
                  </View>
                  <Text variant="muted" className="text-[11px]">
                    {isEn ? `Floor ${u.floor}` : `Tầng ${u.floor}`}{" "}
                    {u.zone ? `• ${isEn ? "Zone" : "Dãy"} ${u.zone}` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ── Warehouse Rack Picker (If category === warehouse_rack) ── */}
      {isWarehouseRack && (
        <MobileRackPicker
          unitId={activeUnitId}
          selectedRackIds={selectedRackIds}
          onChangeSelectedRacks={setSelectedRackIds}
          isEn={isEn}
        />
      )}

      {/* ── Section: Check-in Date & Time Slot ── */}
      <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
        <View className="flex-row items-center gap-2">
          <Clock size={18} color="#0B927E" />
          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {isEn ? "3. Check-in Appointment" : "3. Lịch hẹn Check-in nhận kho"}
          </Text>
        </View>

        <View>
          <Text className="text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">
            {isEn ? "Check-in Date (YYYY-MM-DD)" : "Ngày đến nhận kho (YYYY-MM-DD)"}
          </Text>
          <TextInput
            value={checkInDateInput}
            onChangeText={(val) => {
              setCheckInDateInput(val);
              setSelectedSlotName(null);
            }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2.5 text-sm font-semibold text-neutral-dark dark:text-neutral-100"
          />
        </View>

        <View>
          <Text className="text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">
            {isEn ? "Check-in Time Slot" : "Khung giờ hẹn check-in"}
          </Text>

          {availableSlotsQuery.isLoading ? (
            <Skeleton className="h-12 w-full rounded-2xl" />
          ) : availableSlots.length === 0 ? (
            <Text variant="muted" className="text-xs">
              {isEn ? "No slots open for this date." : "Chưa có ca hẹn nào mở cho ngày này."}
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 py-1"
            >
              {availableSlots.map((s) => {
                const isSelected = activeSlotName === s.slotName;
                const isAvailable = s.isAvailable;
                return (
                  <Pressable
                    key={s.id}
                    disabled={!isAvailable}
                    onPress={() => setSelectedSlotName(s.slotName)}
                    className={`rounded-xl border px-3 py-2 ${
                      !isAvailable
                        ? "opacity-40 border-neutral-200 bg-neutral-100 dark:bg-neutral-800"
                        : isSelected
                          ? "border-brand bg-brand-light/40 dark:bg-brand/20 shadow-sm"
                          : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${isSelected ? "text-brand" : "text-neutral-dark dark:text-neutral-200"}`}
                    >
                      {s.slotName}
                    </Text>
                    <Text variant="muted" className="text-[10px]">
                      {isAvailable
                        ? isEn
                          ? `${s.availableCapacity} left`
                          : `còn ${s.availableCapacity} chỗ`
                        : isEn
                          ? "Full"
                          : "Đã đầy"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {isImmediateForfeit && (
          <View className="flex-row items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 mt-1">
            <AlertTriangle size={16} color="#D97706" />
            <Text className="text-xs font-medium text-amber-800 dark:text-amber-300 flex-1 leading-4">
              {isEn
                ? "Notice: Check-in scheduled within 24 hours. Under policy, cancellations after deposit payment are non-refundable (100% deposit forfeited)."
                : "Lưu ý: Check-in trong vòng 24 giờ tới sẽ không được hoàn cọc nếu hủy sau khi thanh toán cọc."}
            </Text>
          </View>
        )}
      </View>

      {/* ── Section 1.2: Rental Schedule (startDate & rentalDuration in DAYS) ── */}
      <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-4">
        <View className="flex-row items-center gap-2">
          <Calendar size={18} color="#0B927E" />
          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {isEn ? "2. Rental Schedule" : "2. Lịch trình thuê kho"}
          </Text>
        </View>

        {/* Start Date */}
        <View>
          <Text className="text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">
            {isEn ? "Expected Move-in Date (YYYY-MM-DD)" : "Ngày dự kiến bắt đầu thuê (YYYY-MM-DD)"}
          </Text>

          {requiresAdvanceDay ? (
            <Text className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mb-2">
              {isEn
                ? "Note: Small, Medium, and Large storage units must be scheduled at least 1 day after today to allow time for order processing."
                : "Lưu ý: Đối với kho loại Small, Medium, Large thì ngày dự kiến bắt đầu thuê phải sau ít nhất 1 ngày hiện tại (để chừa thời gian tiếp nhận đơn)."}
            </Text>
          ) : null}

          <TextInput
            value={startDateInput}
            onChangeText={(val) => {
              setCustomStartDateInput(val);
              setDateError(null);
            }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2.5 text-sm font-semibold text-neutral-dark dark:text-neutral-100"
          />

          <View className="mt-2 flex-row flex-wrap gap-2">
            {quickDateOptions.map((opt) => {
              const active = startDateInput.trim() === opt.value;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => {
                    setCustomStartDateInput(opt.value);
                    setDateError(null);
                  }}
                  className={`rounded-xl border px-3 py-1.5 ${
                    active
                      ? "border-brand bg-brand-light/40 dark:bg-brand/20"
                      : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-brand" : "text-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    {opt.label} ({opt.value})
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {dateError ? (
            <Text className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
              {dateError}
            </Text>
          ) : null}
        </View>

        {/* Rental Duration (in days, with month conversion) */}
        <View>
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center gap-1.5">
              <Clock size={14} color="#0B927E" />
              <Text className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                {isEn ? "Rental Duration (days)" : "Thời lượng thuê (ngày)"}
              </Text>
            </View>
            <Text variant="muted" className="text-[11px]">
              {isEn ? "Min:" : "Tối thiểu:"}{" "}
              {formatRentalDurationDays(minRentalDays, currentLocale)}
            </Text>
          </View>

          <View className="flex-row items-center gap-2.5">
            <Pressable
              onPress={() => {
                setCustomRentalDuration(Math.max(minRentalDays, rentalDuration - 1));
                setDurationError(null);
              }}
              disabled={rentalDuration <= minRentalDays}
              className={`h-11 w-11 items-center justify-center rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 ${
                rentalDuration <= minRentalDays ? "opacity-40" : ""
              }`}
            >
              <Minus size={16} color="#0F172A" />
            </Pressable>

            <View className="flex-1 flex-row items-center justify-between rounded-xl border border-brand/40 bg-brand-light/20 px-3.5 py-2">
              <TextInput
                value={String(rentalDuration || "")}
                onChangeText={(txt) => {
                  const digits = txt.replace(/[^0-9]/g, "");
                  setCustomRentalDuration(digits ? Number(digits) : 0);
                  setDurationError(null);
                }}
                keyboardType="number-pad"
                className="text-base font-extrabold text-brand py-0 min-w-[48px]"
              />
              <Text className="text-xs font-bold text-brand">
                {formatRentalDurationDays(rentalDuration, currentLocale)}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setCustomRentalDuration((rentalDuration || 0) + 1);
                setDurationError(null);
              }}
              className="h-11 w-11 items-center justify-center rounded-xl bg-brand"
            >
              <Plus size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Quick Duration Chips (30 days = 1 month, 90 days = 3 months, etc.) */}
          <View className="mt-2 flex-row flex-wrap gap-2">
            {quickDurationPresets.map((preset) => {
              const active = rentalDuration === preset.days;
              return (
                <Pressable
                  key={preset.days}
                  onPress={() => {
                    setCustomRentalDuration(preset.days);
                    setDurationError(null);
                  }}
                  className={`flex-1 min-w-[44%] items-center rounded-xl border py-2 px-2 ${
                    active
                      ? "border-brand bg-brand-light/40 dark:bg-brand/20"
                      : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      active ? "text-brand" : "text-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {durationError ? (
            <Text className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
              {durationError}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ── Section 1.3: Add-on Amenities Selector ── */}
      {availableAmenities.length > 0 ? (
        <View
          key="section-3-amenities"
          className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={18} color="#0B927E" />
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "3. Add-on Amenities (Optional)" : "3. Tiện ích đi kèm (Tùy chọn)"}
              </Text>
            </View>
            {selectedAmenityCount > 0 ? (
              <Badge variant="outline" className="border-brand/40 bg-brand-light/40">
                <Text className="text-[11px] font-bold text-brand">
                  {isEn ? `${selectedAmenityCount} selected` : `Đã chọn ${selectedAmenityCount}`}
                </Text>
              </Badge>
            ) : null}
          </View>

          <View className="gap-2.5">
            {availableAmenities.map((item) => {
              const qty = amenityQuantities[item.id] ?? 0;
              const isSelected = qty > 0;
              const isService = item.amenity?.type === AmenityTypeEnum.SERVICE;
              const maxQty = isService ? 99 : (item.availableQuantity ?? 0);
              const itemTotalPrice = (item.pricePerUnit || 0) * qty;

              return (
                <View
                  key={item.id}
                  className={`rounded-2xl border p-3.5 ${
                    isSelected
                      ? "border-brand bg-brand-light/30 dark:bg-brand/15"
                      : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Pressable
                      onPress={() => toggleAmenity(item.id, maxQty)}
                      className="flex-row items-center gap-2.5 flex-1 pr-2"
                    >
                      <View
                        className={`h-5 w-5 items-center justify-center rounded-md border ${
                          isSelected ? "border-brand bg-brand" : "border-neutral-400 bg-transparent"
                        }`}
                      >
                        {isSelected && <Check size={12} color="#FFFFFF" />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                          {item.amenity.name}
                        </Text>
                        <Text variant="muted" className="text-[11px] mt-0.5">
                          {item.pricePerUnit === 0
                            ? isEn
                              ? "Free"
                              : "Miễn phí"
                            : `${formatVnd(item.pricePerUnit)} ${getBillingUnitSuffix(
                                item.billingUnit,
                                t
                              )}`}{" "}
                          •{" "}
                          {isService
                            ? isEn
                              ? "Service"
                              : "Dịch vụ"
                            : isEn
                              ? `Stock: ${maxQty}`
                              : `Còn lại: ${maxQty}`}
                        </Text>
                      </View>
                    </Pressable>

                    {isSelected ? (
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => updateAmenityQuantity(item.id, -1, maxQty)}
                          className="h-7 w-7 items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                        >
                          <Minus size={12} color="#0F172A" />
                        </Pressable>
                        <Text className="w-6 text-center text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
                          {qty}
                        </Text>
                        <Pressable
                          onPress={() => updateAmenityQuantity(item.id, 1, maxQty)}
                          disabled={qty >= maxQty}
                          className={`h-7 w-7 items-center justify-center rounded-lg bg-brand ${
                            qty >= maxQty ? "opacity-40" : ""
                          }`}
                        >
                          <Plus size={12} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>

                  {isSelected ? (
                    <View className="mt-2 flex-row items-center justify-between border-t border-brand/20 pt-2">
                      <Text variant="muted" className="text-[11px]">
                        {isEn
                          ? `Subtotal (${qty} × ${formatVnd(item.pricePerUnit)}):`
                          : `Tạm tính (${qty} × ${formatVnd(item.pricePerUnit)}):`}
                      </Text>
                      <Text className="text-xs font-extrabold text-brand">
                        {formatVnd(itemTotalPrice)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* ── Section 1.4: Customer Notes ── */}
      <View
        key="section-4-notes"
        className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <FileText size={18} color="#0B927E" />
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {isEn ? "4. Notes for Facility Staff" : "4. Ghi chú cho cơ sở kho"}
            </Text>
          </View>
          <Text variant="muted" className="text-[11px]">
            {notes.length}/1000
          </Text>
        </View>

        <TextInput
          value={notes}
          onChangeText={(val) => setNotes(val.slice(0, 1000))}
          multiline
          numberOfLines={3}
          placeholder={
            isEn
              ? "Special requests (preferred floor, expected check-in time, cargo notes)..."
              : "Ghi chú thêm (ưu tiên tầng thấp, giờ dự kiến đến nhận kho, loại hàng lưu trữ...)..."
          }
          placeholderTextColor="#94A3B8"
          textAlignVertical="top"
          className="min-h-[82px] rounded-2xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-3.5 text-xs text-neutral-dark dark:text-neutral-100"
        />
      </View>

      {/* ── Section 1.5: Real-time Pricing Summary & Submit ── */}
      <View
        key="section-5-pricing"
        className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm"
      >
        <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
          {isEn ? "Pricing Summary" : "Bảng tạm tính chi phí đặt chỗ"}
        </Text>

        <View className="gap-2 mb-4">
          <View className="flex-row justify-between">
            <Text variant="muted" className="text-xs">
              {isEn ? "Base Storage Price:" : "Giá thuê kho cơ bản (basePrice):"}
            </Text>
            <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
              {formatVnd(basePrice)}{" "}
              {selectedOffering ? getBillingUnitSuffix(selectedOffering.billingUnit, t) : ""}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text variant="muted" className="text-xs">
              {isEn
                ? `Deposit Amount (×${depositMultiplier}):`
                : `Tiền đặt cọc giữ kho (×${depositMultiplier}):`}
            </Text>
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
              {formatVnd(depositAmount)}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text variant="muted" className="text-xs">
              {isEn ? "Add-on Amenities Total:" : "Tổng phí tiện ích đi kèm:"}
            </Text>
            <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
              {formatVnd(amenitiesTotal)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-2.5 mt-1">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
              {isEn ? "Estimated Total Amount:" : "Tổng giá trị đơn dự kiến:"}
            </Text>
            <Text className="text-base font-extrabold text-brand">{formatVnd(totalAmount)}</Text>
          </View>
        </View>

        {/* Terms Acceptance */}
        <Pressable
          onPress={() => setTermsAccepted(!termsAccepted)}
          className="flex-row items-center gap-2 mb-3 px-1 active:opacity-70"
        >
          <View
            className={`w-4 h-4 rounded border items-center justify-center ${termsAccepted ? "bg-brand border-brand" : "border-neutral-400 bg-white"}`}
          >
            {termsAccepted && <Check size={12} color="#FFFFFF" />}
          </View>
          <Text className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex-1">
            {isEn
              ? "I agree to the Reservation Terms and 24h Refund Policy."
              : "Tôi đồng ý với Điều khoản đặt giữ chỗ & Chính sách hoàn cọc (24h)."}
          </Text>
        </Pressable>

        {/* Immediate Forfeit Warning Modal */}
        <Modal
          visible={showForfeitModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowForfeitModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center p-5">
            <View className="w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 p-5 shadow-2xl gap-3">
              <View className="items-center">
                <View className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 items-center justify-center mb-2">
                  <AlertTriangle size={24} color="#D97706" />
                </View>
                <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100 text-center">
                  {isEn
                    ? "Immediate Check-in Warning (< 24h)"
                    : "Cảnh báo đặt sát giờ hẹn (< 24 giờ)"}
                </Text>
                <Text className="text-xs text-neutral-600 dark:text-neutral-300 text-center mt-2 leading-4">
                  {isEn
                    ? "Your check-in is scheduled within 24 hours. If you cancel after payment, your deposit will be completely forfeited. Do you want to proceed?"
                    : "Đơn đặt sát giờ hẹn check-in (< 24 giờ). Theo chính sách, nếu bạn hủy đơn sau khi thanh toán cọc bạn sẽ không được hoàn lại tiền cọc (mất 100% cọc). Bạn có chắc chắn muốn tiếp tục?"}
                </Text>
              </View>

              <View className="flex-row items-center gap-2.5 mt-2">
                <Pressable
                  onPress={() => setShowForfeitModal(false)}
                  className="flex-1 rounded-2xl border border-neutral-300 dark:border-neutral-700 py-3 items-center"
                >
                  <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {isEn ? "Review" : "Xem lại"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  className="flex-1 rounded-2xl bg-amber-600 py-3 items-center"
                >
                  <Text className="text-xs font-bold text-white">
                    {isEn ? "I Understand & Submit" : "Tôi hiểu & Tiếp tục"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Pressable
          onPress={handleSubmit}
          disabled={createMutation.isPending || !selectedOffering}
          className={`flex-row items-center justify-center gap-2 rounded-2xl bg-cta py-4 shadow-sm active:opacity-90 ${
            createMutation.isPending || !selectedOffering ? "opacity-50" : ""
          }`}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">
                {isEn ? "Submit Reservation Request" : "Gửi yêu cầu đặt chỗ"}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>

      {/* 2D Map Layout Modal */}
      <MobileMapLayoutModal
        visible={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        facilityId={activeFacilityId}
        selectedUnitId={activeUnitId}
        onSelectUnit={(u) => setSelectedUnitId(u.id)}
        isEn={isEn}
        targetUnitTypeId={selectedOffering?.unitTypeId}
      />
    </ScrollView>
  );
}
