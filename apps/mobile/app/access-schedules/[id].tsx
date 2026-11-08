import React from "react";
import { Alert, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  Clock,
  KeyRound,
  LayoutGrid,
  Truck,
  Users,
} from "lucide-react-native";
import {
  AccessScheduleStatusEnum,
  formatDate,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { resolveRequestError } from "@/lib/apiError";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { formatTime } from "@/features/customer-inventory/components/MovementRow";
import {
  useAccessSchedule,
  useCancelAccessSchedule,
} from "@/features/access-schedules/hooks/useAccessSchedules";
import { useAccessOtpStore } from "@/features/access-schedules/stores/accessOtp.store";
import {
  ACCESS_SCHEDULE_STATUS_TONE,
  canCancelAccessSchedule,
  formatScheduleDate,
  getCheckInWindow,
} from "@/features/access-schedules/utils/accessScheduleFormat";

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-2.5 py-2">
      {icon}
      <Text variant="muted" className="w-24 text-xs">
        {label}
      </Text>
      <Text className="flex-1 text-xs font-bold text-neutral-dark dark:text-neutral-100">
        {value}
      </Text>
    </View>
  );
}

/** A booked warehouse visit: the gate QR and OTP, the time window, and cancelling. */
export default function AccessScheduleDetailScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const { id = "" } = useLocalSearchParams<{ id?: string }>();

  const scheduleQuery = useAccessSchedule(id);
  const schedule = scheduleQuery.data;
  const otp = useAccessOtpStore((state) => state.otpByScheduleId[id]);
  const cancelMutation = useCancelAccessSchedule();

  const handleCancel = () => {
    Alert.alert(t("accessSchedule.cancel.title"), t("accessSchedule.cancel.message"), [
      { text: t("accessSchedule.cancel.keep"), style: "cancel" },
      {
        text: t("accessSchedule.cancel.confirm"),
        style: "destructive",
        onPress: async () => {
          try {
            await cancelMutation.mutateAsync({ id });
            toast.success(t("accessSchedule.cancel.success"));
          } catch (error) {
            toast.error(resolveRequestError(error, currentLocale).message);
          }
        },
      },
    ]);
  };

  const renderBody = () => {
    if (scheduleQuery.isLoading) {
      return (
        <View className="gap-3 p-4">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </View>
      );
    }
    if (scheduleQuery.isError || !schedule) {
      return (
        <View className="m-4 items-center rounded-3xl border border-red-200 bg-white p-8 dark:border-red-900 dark:bg-neutral-900">
          <CircleAlert size={32} color="#EF4444" />
          <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {resolveRequestError(scheduleQuery.error, currentLocale).message}
          </Text>
          <Pressable
            onPress={() => scheduleQuery.refetch()}
            className="mt-4 rounded-xl bg-brand px-5 py-2.5"
          >
            <Text className="text-xs font-bold text-white">{t("rackMap.retry")}</Text>
          </Pressable>
        </View>
      );
    }

    const slot = schedule.timeSlotSnapshot;
    const pending = schedule.status === AccessScheduleStatusEnum.PENDING;
    const window = getCheckInWindow(schedule.scheduledDate, slot.startTime);
    const cancellable = canCancelAccessSchedule(
      schedule.status,
      schedule.scheduledDate,
      slot.startTime
    );
    const vehicle = [schedule.vehicleType, schedule.vehiclePlate].filter(Boolean).join(" · ");
    const racks = (schedule.rentedRacks ?? []).map((rack) => rack.rackCode).join(", ");

    return (
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={scheduleQuery.isRefetching}
            onRefresh={() => scheduleQuery.refetch()}
            tintColor="#0B927E"
          />
        }
      >
        <View className="items-center gap-3 rounded-3xl border border-neutral-border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <View className="flex-row items-center gap-2">
            <Text className="font-mono text-sm font-extrabold text-neutral-dark dark:text-neutral-100">
              {schedule.scheduleCode}
            </Text>
            <StatusPill
              label={t(`accessSchedule.status.${schedule.status}`)}
              tone={ACCESS_SCHEDULE_STATUS_TONE[schedule.status]}
            />
          </View>

          {pending && schedule.qrPayload ? (
            <>
              <View className="rounded-2xl bg-white p-3">
                <QRCode value={schedule.qrPayload} size={190} />
              </View>
              <Text variant="muted" className="text-center text-xs">
                {t("accessSchedule.detail.qrHint")}
              </Text>
            </>
          ) : null}

          {pending ? (
            otp ? (
              <View className="w-full items-center gap-1 rounded-2xl bg-brand-bg p-3 dark:bg-brand/10">
                <View className="flex-row items-center gap-1.5">
                  <KeyRound size={14} color="#0B927E" />
                  <Text className="text-xs font-bold text-brand">
                    {t("accessSchedule.detail.otpLabel")}
                  </Text>
                </View>
                <Text className="font-mono text-3xl font-extrabold tracking-[8px] text-neutral-dark dark:text-neutral-100">
                  {otp}
                </Text>
                <Text variant="muted" className="text-center text-[11px]">
                  {t("accessSchedule.detail.otpOnce")}
                </Text>
              </View>
            ) : (
              <Text variant="muted" className="text-center text-[11px]">
                {t("accessSchedule.detail.otpHidden")}
              </Text>
            )
          ) : null}
        </View>

        <View className="rounded-3xl border border-neutral-border bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
          <InfoRow
            icon={<CalendarDays size={15} color="#647B80" />}
            label={t("accessSchedule.detail.date")}
            value={`${formatScheduleDate(schedule.scheduledDate)} · ${slot.slotName} (${slot.startTime} – ${slot.endTime})`}
          />
          <InfoRow
            icon={<Clock size={15} color="#647B80" />}
            label={t("accessSchedule.detail.window")}
            value={t("accessSchedule.detail.windowValue", window)}
          />
          <InfoRow
            icon={<Users size={15} color="#647B80" />}
            label={t("accessSchedule.detail.people")}
            value={String(schedule.numberOfPeople)}
          />
          <InfoRow
            icon={<Truck size={15} color="#647B80" />}
            label={t("accessSchedule.detail.vehicle")}
            value={vehicle || t("accessSchedule.detail.none")}
          />
          {racks ? (
            <InfoRow
              icon={<LayoutGrid size={15} color="#647B80" />}
              label={t("accessSchedule.detail.racks")}
              value={racks}
            />
          ) : null}
          <InfoRow
            icon={<LayoutGrid size={15} color="#647B80" />}
            label={t("accessSchedule.detail.contract")}
            value={`${schedule.contractCode ?? ""} · ${schedule.facilityName ?? ""}`}
          />
          {schedule.purpose ? (
            <Text className="pb-2 text-xs text-neutral-700 dark:text-neutral-300">
              {schedule.purpose}
            </Text>
          ) : null}
        </View>

        {schedule.checkedInAt || schedule.checkedOutAt || schedule.cancelledAt ? (
          <View className="gap-1.5 rounded-3xl border border-neutral-border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            {schedule.checkedInAt ? (
              <Text className="text-xs text-neutral-700 dark:text-neutral-300">
                {t("accessSchedule.detail.checkedIn", {
                  time: `${formatTime(schedule.checkedInAt)} ${formatDate(schedule.checkedInAt)}`,
                })}
              </Text>
            ) : null}
            {schedule.checkedOutAt ? (
              <Text className="text-xs text-neutral-700 dark:text-neutral-300">
                {t("accessSchedule.detail.checkedOut", {
                  time: `${formatTime(schedule.checkedOutAt)} ${formatDate(schedule.checkedOutAt)}`,
                })}
              </Text>
            ) : null}
            {schedule.cancelledAt ? (
              <Text className="text-xs text-neutral-700 dark:text-neutral-300">
                {t("accessSchedule.detail.cancelled", {
                  time: `${formatTime(schedule.cancelledAt)} ${formatDate(schedule.cancelledAt)}`,
                })}
              </Text>
            ) : null}
          </View>
        ) : null}

        {pending ? (
          cancellable ? (
            <Pressable
              onPress={handleCancel}
              disabled={cancelMutation.isPending}
              className="h-12 items-center justify-center rounded-xl border border-red-200 bg-white active:opacity-80 dark:border-red-900 dark:bg-neutral-900"
            >
              <Text className="text-sm font-bold text-red-600">
                {t("accessSchedule.cancel.button")}
              </Text>
            </Pressable>
          ) : (
            <Text variant="muted" className="text-center text-[11px]">
              {t("accessSchedule.cancel.tooLate")}
            </Text>
          )
        ) : null}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/access-schedules" as any)
          }
          hitSlop={10}
          className="p-1 active:opacity-70"
        >
          <ArrowLeft size={22} color="#0B927E" />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
          {t("accessSchedule.detail.title")}
        </Text>
      </View>
      {renderBody()}
    </SafeAreaView>
  );
}
