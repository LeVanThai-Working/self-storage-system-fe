import React from "react";
import { Pressable, View } from "react-native";
import { CalendarClock, ChevronRight } from "lucide-react-native";
import type { AccessScheduleListItemResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { StatusPill } from "@/components/ui/status-pill";
import { useTranslation } from "@/stores/language.store";
import { ACCESS_SCHEDULE_STATUS_TONE, formatScheduleDate } from "../utils/accessScheduleFormat";

interface AccessScheduleCardProps {
  schedule: AccessScheduleListItemResponse;
  onPress: () => void;
}

export function AccessScheduleCard({ schedule, onPress }: AccessScheduleCardProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-3xl border border-neutral-border bg-white p-3.5 active:opacity-80 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-bg dark:bg-brand/10">
        <CalendarClock size={20} color="#0B927E" />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="font-mono text-[11px] font-bold text-neutral-dark dark:text-neutral-100">
            {schedule.scheduleCode}
          </Text>
          <StatusPill
            label={t(`accessSchedule.status.${schedule.status}`)}
            tone={ACCESS_SCHEDULE_STATUS_TONE[schedule.status]}
          />
        </View>
        <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {formatScheduleDate(schedule.scheduledDate)} · {schedule.startTime} – {schedule.endTime}
        </Text>
        <Text numberOfLines={1} variant="muted" className="text-[11px]">
          {t("accessSchedule.contractLine", {
            code: schedule.contractCode ?? "",
            facility: schedule.facilityName ?? "",
          })}
          {" · "}
          {t("accessSchedule.peopleCount", { count: schedule.numberOfPeople })}
        </Text>
      </View>
      <ChevronRight size={16} color="#94A3B8" />
    </Pressable>
  );
}
