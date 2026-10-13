import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/stores/toast.store";
import { useFacilityPublicDetail } from "@/features/storage-explore/hooks/useStorageExplore";
import {
  MESSAGE_CODE,
  type MessageLocale,
  type PublicAmenityOfferingResponse,
  type ReservationResponse,
} from "@self-storage-system-fe/shared";
import {
  Calendar,
  Clock,
  Sparkles,
  FileText,
  X,
  Minus,
  Plus,
  Check,
  Save,
} from "lucide-react-native";
import { useUpdateReservation } from "../hooks/useReservations";
import {
  formatRentalDurationDays,
  formatVnd,
  getBillingUnitName,
  getTodayDateInput,
  isoToDateInput,
  parseAndValidateStartDate,
  requiresAdvanceDayForCategory,
  resolveReservationErrorMessage,
} from "../utils/reservationFormat";

interface EditReservationModalProps {
  visible: boolean;
  onClose: () => void;
  reservation: ReservationResponse;
  locale?: MessageLocale;
  onUpdated: () => void;
}

function buildInitialAmenityMap(reservation: ReservationResponse): Record<string, number> {
  const initialMap: Record<string, number> = {};
  for (const am of reservation.amenities ?? []) {
    if (am.quantity > 0) {
      initialMap[am.facilityAmenityOfferingId] = am.quantity;
    }
  }
  return initialMap;
}

export function EditReservationModal({
  visible,
  onClose,
  reservation,
  locale = "vi",
  onUpdated,
}: EditReservationModalProps) {
  const isEn = locale === "en";
  const toast = useToast();

  const updateMutation = useUpdateReservation(reservation.id);
  const { data: facilityDetail } = useFacilityPublicDetail(
    visible ? reservation.facilityId : undefined
  );

  const minRentalDays = Math.max(1, reservation.offering?.minRentalDays ?? 1);
  const resolvedCategory = useMemo(() => {
    const matchedOffering = (facilityDetail?.unitTypeOfferings ?? []).find(
      (item) => item.id === reservation.facilityUnitTypeOfferingId
    );
    return matchedOffering?.unitType?.category;
  }, [facilityDetail?.unitTypeOfferings, reservation.facilityUnitTypeOfferingId]);
  const requiresAdvanceDay = requiresAdvanceDayForCategory(resolvedCategory);

  const [startDateInput, setStartDateInput] = useState<string>(() =>
    isoToDateInput(reservation.startDate)
  );
  const [rentalDuration, setRentalDuration] = useState<number>(() =>
    Math.max(minRentalDays, reservation.rentalDuration || 1)
  );
  const [amenityQuantities, setAmenityQuantities] = useState<Record<string, number>>(() =>
    buildInitialAmenityMap(reservation)
  );
  const [notes, setNotes] = useState<string>(() => reservation.notes ?? "");
  const [dateError, setDateError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);

  const syncFormState = () => {
    setStartDateInput(isoToDateInput(reservation.startDate));
    setRentalDuration(Math.max(minRentalDays, reservation.rentalDuration || 1));
    setAmenityQuantities(buildInitialAmenityMap(reservation));
    setNotes(reservation.notes ?? "");
    setDateError(null);
    setDurationError(null);
  };

  // Merge facility public amenities with existing reservation amenities so customer can edit even if public detail is still loading
  const selectableAmenities = useMemo(() => {
    const publicList = facilityDetail?.amenityOfferings ?? [];
    const byId = new Map<
      string,
      {
        facilityAmenityOfferingId: string;
        name: string;
        pricePerUnit: number;
        billingUnit: string;
        maxQuantity: number;
      }
    >();

    for (const item of publicList as PublicAmenityOfferingResponse[]) {
      const existingSelected = amenityQuantities[item.id] ?? 0;
      const maxQty = Math.max(item.availableQuantity ?? 0, existingSelected);
      if (maxQty > 0) {
        byId.set(item.id, {
          facilityAmenityOfferingId: item.id,
          name: item.amenity.name,
          pricePerUnit: item.pricePerUnit,
          billingUnit: item.billingUnit,
          maxQuantity: maxQty,
        });
      }
    }

    for (const existing of reservation.amenities ?? []) {
      if (!byId.has(existing.facilityAmenityOfferingId)) {
        byId.set(existing.facilityAmenityOfferingId, {
          facilityAmenityOfferingId: existing.facilityAmenityOfferingId,
          name: existing.name,
          pricePerUnit: existing.pricePerUnit,
          billingUnit: existing.billingUnit,
          maxQuantity: Math.max(10, existing.quantity),
        });
      }
    }

    return Array.from(byId.values());
  }, [facilityDetail?.amenityOfferings, reservation.amenities, amenityQuantities]);

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

  const changeAmenityQty = (offeringId: string, delta: number, maxQty: number) => {
    setAmenityQuantities((prev) => {
      const current = prev[offeringId] ?? 0;
      const nextQty = current + delta;
      const next = { ...prev };
      if (nextQty <= 0) {
        delete next[offeringId];
      } else {
        next[offeringId] = Math.min(maxQty, nextQty);
      }
      return next;
    });
  };

  const estimatedAmenitiesTotal = useMemo(() => {
    return selectableAmenities.reduce((sum, item) => {
      const qty = amenityQuantities[item.facilityAmenityOfferingId] ?? 0;
      return sum + item.pricePerUnit * qty;
    }, 0);
  }, [selectableAmenities, amenityQuantities]);

  const estimatedTotalAmount = (reservation.depositAmount ?? 0) + estimatedAmenitiesTotal;

  const handleSave = async () => {
    setDateError(null);
    setDurationError(null);

    const parsedDate = parseAndValidateStartDate(startDateInput, resolvedCategory);
    if (!parsedDate.isValidFormat) {
      setDateError(
        isEn
          ? "Please enter a valid date (YYYY-MM-DD)."
          : "Vui lòng nhập định dạng ngày hợp lệ (YYYY-MM-DD)."
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

    const amenitiesPayload = Object.entries(amenityQuantities)
      .filter(([, qty]) => qty >= 1)
      .map(([facilityAmenityOfferingId, quantity]) => ({
        facilityAmenityOfferingId,
        quantity,
      }));

    try {
      await updateMutation.mutateAsync({
        startDate: parsedDate.isoString,
        rentalDuration,
        amenities: amenitiesPayload,
        notes: notes.trim(),
      });

      toast.success(
        isEn ? "Reservation updated successfully!" : "Cập nhật đơn đặt chỗ thành công!"
      );
      onUpdated();
      onClose();
    } catch (error) {
      const resolved = resolveReservationErrorMessage(error, locale, "reservation");
      toast.error(resolved.message);

      // If staff already received the reservation (MESSAGE_CODE_302), refresh detail & close modal
      if (resolved.messageCode === MESSAGE_CODE.MESSAGE_CODE_302) {
        onUpdated();
        onClose();
      }
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={syncFormState}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="max-h-[90%] rounded-t-3xl bg-white dark:bg-neutral-900 border-t border-neutral-border dark:border-neutral-800">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 px-5 py-4">
            <View>
              <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Edit Reservation" : "Chỉnh sửa đơn đặt chỗ"}
              </Text>
              <Text variant="muted" className="text-xs mt-0.5">
                #{reservation.reservationCode}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              disabled={updateMutation.isPending}
              className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <X size={16} color="#647B80" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="p-5 pb-8 gap-4"
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Start Date */}
            <View>
              <View className="flex-row items-center gap-1.5 mb-2">
                <Calendar size={15} color="#0B927E" />
                <Text className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  {isEn ? "Start Date (YYYY-MM-DD)" : "Ngày dự kiến nhận kho (YYYY-MM-DD)"}
                </Text>
              </View>

              <TextInput
                value={startDateInput}
                onChangeText={(text) => {
                  setStartDateInput(text);
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
                        setStartDateInput(opt.value);
                        setDateError(null);
                      }}
                      className={`rounded-lg border px-2.5 py-1.5 ${
                        active
                          ? "border-brand bg-brand-light/40 dark:bg-brand/20"
                          : "border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-800"
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

            {/* 2. Rental Duration */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <Clock size={15} color="#0B927E" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    {isEn ? "Rental Duration (days)" : "Thời lượng thuê (ngày)"}
                  </Text>
                </View>
                <Text variant="muted" className="text-[11px]">
                  {isEn
                    ? `Min: ${formatRentalDurationDays(minRentalDays, locale)}`
                    : `Tối thiểu: ${formatRentalDurationDays(minRentalDays, locale)}`}
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => {
                    setRentalDuration((prev) => Math.max(minRentalDays, prev - 1));
                    setDurationError(null);
                  }}
                  disabled={rentalDuration <= minRentalDays}
                  className={`h-10 w-10 items-center justify-center rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 ${
                    rentalDuration <= minRentalDays ? "opacity-40" : ""
                  }`}
                >
                  <Minus size={16} color="#0F172A" />
                </Pressable>

                <View className="flex-1 items-center justify-center rounded-xl border border-brand/40 bg-brand-light/20 py-1.5 px-3">
                  <View className="flex-row items-baseline justify-center gap-1.5">
                    <TextInput
                      value={String(rentalDuration)}
                      onChangeText={(text) => {
                        const digits = text.replace(/[^0-9]/g, "");
                        const parsed = digits ? parseInt(digits, 10) : 0;
                        setRentalDuration(parsed);
                        setDurationError(null);
                      }}
                      keyboardType="number-pad"
                      className="text-center text-base font-extrabold text-brand p-0 min-w-[36px]"
                    />
                    <Text className="text-xs font-bold text-brand">{isEn ? "days" : "ngày"}</Text>
                  </View>
                  <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                    {formatRentalDurationDays(rentalDuration, locale)}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    setRentalDuration((prev) => prev + 1);
                    setDurationError(null);
                  }}
                  className="h-10 w-10 items-center justify-center rounded-xl border border-brand bg-brand"
                >
                  <Plus size={16} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Quick Duration Presets (Days / Months) */}
              {quickDurationPresets.length > 0 ? (
                <View className="mt-2.5 flex-row flex-wrap gap-2">
                  {quickDurationPresets.map((preset) => {
                    const active = rentalDuration === preset.days;
                    return (
                      <Pressable
                        key={preset.days}
                        onPress={() => {
                          setRentalDuration(preset.days);
                          setDurationError(null);
                        }}
                        className={`rounded-lg border px-2.5 py-1.5 ${
                          active
                            ? "border-brand bg-brand text-white"
                            : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            active ? "text-white" : "text-neutral-600 dark:text-neutral-300"
                          }`}
                        >
                          {preset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {durationError ? (
                <Text className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  {durationError}
                </Text>
              ) : null}
            </View>

            {/* 3. Amenities Selector */}
            {selectableAmenities.length > 0 ? (
              <View>
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Sparkles size={15} color="#0B927E" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    {isEn ? "Add-on Amenities" : "Tiện ích đi kèm"}
                  </Text>
                </View>

                <View className="gap-2">
                  {selectableAmenities.map((item) => {
                    const qty = amenityQuantities[item.facilityAmenityOfferingId] ?? 0;
                    const isSelected = qty > 0;
                    const itemTotal = item.pricePerUnit * qty;

                    return (
                      <View
                        key={item.facilityAmenityOfferingId}
                        className={`rounded-xl border p-3 ${
                          isSelected
                            ? "border-brand bg-brand-light/30 dark:bg-brand/15"
                            : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Pressable
                            onPress={() =>
                              toggleAmenity(item.facilityAmenityOfferingId, item.maxQuantity)
                            }
                            className="flex-row items-center gap-2.5 flex-1"
                          >
                            <View
                              className={`h-5 w-5 items-center justify-center rounded-md border ${
                                isSelected
                                  ? "border-brand bg-brand"
                                  : "border-neutral-400 bg-transparent"
                              }`}
                            >
                              {isSelected && <Check size={12} color="#FFFFFF" />}
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                                {item.name}
                              </Text>
                              <Text variant="muted" className="text-[11px]">
                                {formatVnd(item.pricePerUnit)} /{" "}
                                {getBillingUnitName(item.billingUnit, locale)} •{" "}
                                {isEn ? "Available:" : "Còn:"} {item.maxQuantity}
                              </Text>
                            </View>
                          </Pressable>

                          {isSelected ? (
                            <View className="flex-row items-center gap-2">
                              <Pressable
                                onPress={() =>
                                  changeAmenityQty(
                                    item.facilityAmenityOfferingId,
                                    -1,
                                    item.maxQuantity
                                  )
                                }
                                className="h-7 w-7 items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                              >
                                <Minus size={12} color="#0F172A" />
                              </Pressable>
                              <Text className="w-5 text-center text-xs font-bold text-neutral-dark dark:text-neutral-100">
                                {qty}
                              </Text>
                              <Pressable
                                onPress={() =>
                                  changeAmenityQty(
                                    item.facilityAmenityOfferingId,
                                    1,
                                    item.maxQuantity
                                  )
                                }
                                disabled={qty >= item.maxQuantity}
                                className={`h-7 w-7 items-center justify-center rounded-lg bg-brand ${
                                  qty >= item.maxQuantity ? "opacity-40" : ""
                                }`}
                              >
                                <Plus size={12} color="#FFFFFF" />
                              </Pressable>
                            </View>
                          ) : null}
                        </View>

                        {isSelected ? (
                          <View className="mt-2 flex-row justify-between border-t border-brand/20 pt-1.5">
                            <Text variant="muted" className="text-[11px]">
                              {isEn ? "Subtotal:" : "Tạm tính tiện ích:"}
                            </Text>
                            <Text className="text-xs font-bold text-brand">
                              {formatVnd(itemTotal)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* 4. Notes */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <FileText size={15} color="#0B927E" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    {isEn ? "Notes" : "Ghi chú"}
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
                    ? "Special requests (preferred floor, check-in hour, etc.)..."
                    : "Yêu cầu đặc biệt (tầng ưu tiên, giờ đến nhận kho dự kiến...)..."
                }
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
                className="min-h-[76px] rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-3 text-xs text-neutral-dark dark:text-neutral-100"
              />
            </View>

            {/* Updated Pricing Preview */}
            <View className="rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/80 p-3.5">
              <View className="flex-row justify-between mb-1">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Deposit Amount:" : "Tiền đặt cọc giữ kho:"}
                </Text>
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                  {formatVnd(reservation.depositAmount)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1.5">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Add-on Amenities:" : "Tổng phí tiện ích:"}
                </Text>
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                  {formatVnd(estimatedAmenitiesTotal)}
                </Text>
              </View>
              <View className="flex-row justify-between border-t border-neutral-200 dark:border-neutral-700 pt-2">
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {isEn ? "Estimated Total:" : "Tổng giá trị đơn dự kiến:"}
                </Text>
                <Badge variant="outline" className="border-brand/40 bg-brand-light/40">
                  <Text className="text-xs font-extrabold text-brand">
                    {formatVnd(estimatedTotalAmount)}
                  </Text>
                </Badge>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 pt-1">
              <Pressable
                onPress={onClose}
                disabled={updateMutation.isPending}
                className="flex-1 items-center justify-center rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 py-3.5"
              >
                <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {isEn ? "Cancel" : "Đóng"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand py-3.5 shadow-sm active:opacity-90"
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={16} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">
                      {isEn ? "Save Changes" : "Lưu thay đổi"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
