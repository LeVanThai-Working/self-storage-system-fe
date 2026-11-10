"use client";

import { useTranslations } from "next-intl";
import { AccessScheduleStatusEnum } from "@self-storage-system-fe/shared";
import { Pill, type Tone } from "@/features/inventory-operations/components/StatusBadges";

const STATUS_TONE: Record<AccessScheduleStatusEnum, Tone> = {
  [AccessScheduleStatusEnum.PENDING]: "yellow",
  [AccessScheduleStatusEnum.CHECKED_IN]: "blue",
  [AccessScheduleStatusEnum.COMPLETED]: "green",
  [AccessScheduleStatusEnum.CANCELLED]: "gray",
  [AccessScheduleStatusEnum.NO_SHOW]: "red",
  [AccessScheduleStatusEnum.EXPIRED]: "brown",
};

export const AccessScheduleStatusBadge = ({ status }: { status: AccessScheduleStatusEnum }) => {
  const t = useTranslations("accessScheduleDesk.status");
  return <Pill tone={STATUS_TONE[status] ?? "gray"} label={t.has(status) ? t(status) : status} />;
};
