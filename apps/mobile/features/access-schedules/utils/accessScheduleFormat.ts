import {
  ACCESS_SCHEDULE_CONFIG,
  AccessScheduleStatusEnum,
  MESSAGE_CODE,
} from "@self-storage-system-fe/shared";
import type { StatusTone } from "@/components/ui/status-pill";

const MINUTE_MS = 60 * 1000;

export const ACCESS_SCHEDULE_STATUS_TONE: Record<AccessScheduleStatusEnum, StatusTone> = {
  [AccessScheduleStatusEnum.PENDING]: "yellow",
  [AccessScheduleStatusEnum.CHECKED_IN]: "blue",
  [AccessScheduleStatusEnum.COMPLETED]: "green",
  [AccessScheduleStatusEnum.CANCELLED]: "gray",
  [AccessScheduleStatusEnum.NO_SHOW]: "red",
  [AccessScheduleStatusEnum.EXPIRED]: "brown",
};

export const ACCESS_SCHEDULE_ERROR = {
  SLOT_FULL: MESSAGE_CODE.MESSAGE_CODE_652,
  TOO_LATE_TO_CANCEL: MESSAGE_CODE.MESSAGE_CODE_656,
  DUPLICATE_SLOT: MESSAGE_CODE.MESSAGE_CODE_657,
} as const;

/** Slot times belong to the facility's Vietnam date, regardless of device timezone. */
export function getSlotStart(scheduledDate: string, startTime: string): Date {
  return new Date(`${scheduledDate}T${startTime}:00+07:00`);
}

function formatClock(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** Gate check-in window around the slot start, e.g. { from: "07:30", to: "08:45" }. */
export function getCheckInWindow(scheduledDate: string, startTime: string) {
  const start = getSlotStart(scheduledDate, startTime).getTime();
  return {
    from: formatClock(new Date(start - ACCESS_SCHEDULE_CONFIG.EARLY_CHECKIN_MINUTES * MINUTE_MS)),
    to: formatClock(new Date(start + ACCESS_SCHEDULE_CONFIG.GRACE_CHECKIN_MINUTES * MINUTE_MS)),
  };
}

/** Customers may cancel a pending visit until one hour before the slot starts. */
export function canCancelAccessSchedule(
  status: AccessScheduleStatusEnum,
  scheduledDate: string,
  startTime: string,
  now = Date.now()
): boolean {
  if (status !== AccessScheduleStatusEnum.PENDING) return false;
  const deadline =
    getSlotStart(scheduledDate, startTime).getTime() -
    ACCESS_SCHEDULE_CONFIG.MIN_CANCEL_LEAD_HOURS * 60 * MINUTE_MS;
  return now < deadline;
}

/** A slot that already started cannot be booked any more. */
export function isSlotInPast(scheduledDate: string, startTime: string, now = Date.now()): boolean {
  return getSlotStart(scheduledDate, startTime).getTime() <= now;
}

/** "2026-11-09" → "09/11/2026". */
export function formatScheduleDate(scheduledDate: string): string {
  const [year, month, day] = scheduledDate.split("-");
  return `${day}/${month}/${year}`;
}
