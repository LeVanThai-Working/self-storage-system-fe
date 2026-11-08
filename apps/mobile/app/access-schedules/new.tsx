import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CalendarDays, CircleAlert, Clock, Users } from "lucide-react-native";
import {
  ACCESS_SCHEDULE_CONFIG,
  ContractStatusEnum,
  createAccessScheduleSchema,
  type AvailableAccessSlotResponse,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldError, FieldLabel } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { resolveRequestError } from "@/lib/apiError";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { useContractDetail } from "@/features/contracts/hooks/useContracts";
import { CalendarPickerModal } from "@/features/reservations/components/CalendarPickerModal";
import { getTodayDateInput } from "@/features/reservations/utils/reservationFormat";
import { QuantityStepper } from "@/features/customer-inventory/components/QuantityStepper";
import {
  useAvailableAccessSlots,
  useCreateAccessSchedule,
} from "@/features/access-schedules/hooks/useAccessSchedules";
import {
  formatScheduleDate,
  isSlotInPast,
} from "@/features/access-schedules/utils/accessScheduleFormat";

/** Customers can book up to this many days ahead. */
const BOOKING_WINDOW_DAYS = 30;

const inputClass =
  "rounded-xl border border-neutral-border bg-white px-3 py-2.5 text-sm text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

/** Books a warehouse visit for one contract: day, time slot, people and vehicle. */
export default function NewAccessScheduleScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const { contractId = "" } = useLocalSearchParams<{ contractId?: string }>();

  const contractQuery = useContractDetail(contractId);
  const contract = contractQuery.data;
  const createMutation = useCreateAccessSchedule();

  const [date, setDate] = useState(getTodayDateInput());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [people, setPeople] = useState(1);
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [slotError, setSlotError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const slotsQuery = useAvailableAccessSlots(contract?.facilityId, date);
  const slots = slotsQuery.data ?? [];
  const contractActive = contract?.status === ContractStatusEnum.ACTIVE;

  const slotDisabled = (slot: AvailableAccessSlotResponse) =>
    !slot.isAvailable || slot.availableCapacity <= 0 || isSlotInPast(date, slot.startTime);

  const handlePickDate = (value: string) => {
    setDate(value);
    setSlotId(null);
    setCalendarOpen(false);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!slotId) {
      setSlotError(t("accessSchedule.form.slotRequired"));
      return;
    }
    const parsed = createAccessScheduleSchema.safeParse({
      contractId,
      timeSlotId: slotId,
      scheduledDate: date,
      numberOfPeople: people,
      // BE route validation rejects null, so leave empty optional fields out.
      vehicleType: vehicleType.trim() || undefined,
      vehiclePlate: vehiclePlate.trim() || undefined,
      purpose: purpose.trim() || undefined,
    });
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? t("accessSchedule.loadError"));
      return;
    }
    try {
      const schedule = await createMutation.mutateAsync(parsed.data);
      toast.success(t("accessSchedule.form.success", { code: schedule.scheduleCode }));
      router.replace({ pathname: "/access-schedules/[id]", params: { id: schedule.id } });
    } catch (error) {
      setSubmitError(resolveRequestError(error, currentLocale).message);
      slotsQuery.refetch();
    }
  };

  const renderSlots = () => {
    if (slotsQuery.isLoading) {
      return (
        <View className="flex-row flex-wrap gap-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-16 w-[48%] rounded-2xl" />
          ))}
        </View>
      );
    }
    if (slotsQuery.isError) {
      return (
        <Pressable
          onPress={() => slotsQuery.refetch()}
          className="flex-row items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30"
        >
          <CircleAlert size={16} color="#EF4444" />
          <Text className="flex-1 text-xs text-red-700 dark:text-red-300">
            {resolveRequestError(slotsQuery.error, currentLocale).message}
          </Text>
          <Text className="text-xs font-bold text-brand">{t("rackMap.retry")}</Text>
        </Pressable>
      );
    }
    if (slots.length === 0) {
      return (
        <Text variant="muted" className="text-xs">
          {t("accessSchedule.form.noSlots")}
        </Text>
      );
    }
    return (
      <View className="flex-row flex-wrap gap-2">
        {slots.map((slot) => {
          const disabled = slotDisabled(slot);
          const selected = slot.timeSlotId === slotId;
          // BE also closes slots that already started; tell those apart from full ones.
          const past = isSlotInPast(date, slot.startTime);
          const full = !slot.isAvailable || slot.availableCapacity <= 0;
          return (
            <Pressable
              key={slot.timeSlotId}
              disabled={disabled}
              onPress={() => {
                setSlotId(slot.timeSlotId);
                setSlotError(null);
              }}
              className={cn(
                "w-[48%] gap-0.5 rounded-2xl border p-3 active:opacity-80",
                selected
                  ? "border-brand bg-brand-light dark:bg-brand/20"
                  : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900",
                disabled && "opacity-40"
              )}
            >
              <Text
                numberOfLines={1}
                className="text-xs font-bold text-neutral-dark dark:text-neutral-100"
              >
                {slot.slotName}
              </Text>
              <Text className="text-sm font-extrabold text-brand">
                {slot.startTime} – {slot.endTime}
              </Text>
              <Text
                className={cn(
                  "text-[11px] font-semibold",
                  full && !past ? "text-red-600" : "text-neutral-muted"
                )}
              >
                {past
                  ? t("accessSchedule.form.slotPast")
                  : full
                    ? t("accessSchedule.form.slotFull")
                    : t("accessSchedule.form.slotLeft", { count: slot.availableCapacity })}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <ArrowLeft size={22} color="#0B927E" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
            {t("accessSchedule.form.title")}
          </Text>
          {contract ? (
            <Text numberOfLines={1} variant="muted" className="text-[11px]">
              {t("accessSchedule.contractLine", {
                code: contract.contractCode,
                facility: contract.facility?.name ?? "",
              })}
            </Text>
          ) : null}
        </View>
      </View>

      {contractQuery.isLoading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </View>
      ) : !contract || !contractActive ? (
        <View className="m-4 items-center rounded-3xl border border-neutral-border bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
          <CircleAlert size={32} color="#D34D0F" />
          <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {t("accessSchedule.form.contractNotActive")}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-5 p-4 pb-32" keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <FieldLabel>{t("accessSchedule.form.date")}</FieldLabel>
            <Pressable
              onPress={() => setCalendarOpen(true)}
              className="flex-row items-center gap-2 rounded-xl border border-neutral-border bg-white px-3 py-3 active:opacity-80 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <CalendarDays size={16} color="#0B927E" />
              <Text className="flex-1 text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {formatScheduleDate(date)}
              </Text>
              <Text className="text-xs font-bold text-brand">
                {t("accessSchedule.form.change")}
              </Text>
            </Pressable>
          </View>

          <View className="gap-2">
            <View className="flex-row items-center gap-1.5">
              <Clock size={14} color="#647B80" />
              <FieldLabel>{t("accessSchedule.form.slot")}</FieldLabel>
            </View>
            {renderSlots()}
            <FieldError message={slotError} />
            <Text variant="muted" className="text-[11px] leading-4">
              {t("accessSchedule.form.windowHint", {
                early: ACCESS_SCHEDULE_CONFIG.EARLY_CHECKIN_MINUTES,
                late: ACCESS_SCHEDULE_CONFIG.GRACE_CHECKIN_MINUTES,
              })}
            </Text>
          </View>

          <View className="gap-2">
            <View className="flex-row items-center gap-1.5">
              <Users size={14} color="#647B80" />
              <FieldLabel>{t("accessSchedule.form.people")}</FieldLabel>
            </View>
            <QuantityStepper
              value={people}
              onChange={setPeople}
              min={ACCESS_SCHEDULE_CONFIG.MIN_PEOPLE}
              max={ACCESS_SCHEDULE_CONFIG.MAX_PEOPLE}
            />
          </View>

          <View className="gap-2">
            <FieldLabel>{t("accessSchedule.form.vehicleType")}</FieldLabel>
            <TextInput
              value={vehicleType}
              onChangeText={setVehicleType}
              maxLength={100}
              placeholder={t("accessSchedule.form.vehicleTypePlaceholder")}
              placeholderTextColor="#94A3B8"
              className={inputClass}
            />
            <FieldLabel>{t("accessSchedule.form.vehiclePlate")}</FieldLabel>
            <TextInput
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
              maxLength={20}
              autoCapitalize="characters"
              placeholder="51C-123.45"
              placeholderTextColor="#94A3B8"
              className={inputClass}
            />
          </View>

          <View className="gap-2">
            <FieldLabel>{t("accessSchedule.form.purpose")}</FieldLabel>
            <TextInput
              value={purpose}
              onChangeText={setPurpose}
              maxLength={500}
              multiline
              placeholder={t("accessSchedule.form.purposePlaceholder")}
              placeholderTextColor="#94A3B8"
              className={cn(inputClass, "min-h-20")}
              textAlignVertical="top"
            />
          </View>

          <FieldError message={submitError} />
        </ScrollView>
      )}

      {contract && contractActive ? (
        <View className="border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
          <Pressable
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            className="h-12 flex-row items-center justify-center rounded-xl bg-cta active:opacity-90"
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-sm font-bold text-white">
                {t("accessSchedule.form.submit")}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}

      <CalendarPickerModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onSelectDate={handlePickDate}
        selectedDate={date}
        minDate={getTodayDateInput()}
        maxDate={getTodayDateInput(BOOKING_WINDOW_DAYS)}
        locale={currentLocale}
      />
    </SafeAreaView>
  );
}
