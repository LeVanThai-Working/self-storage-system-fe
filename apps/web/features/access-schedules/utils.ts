import { ACCESS_SCHEDULE_CONFIG } from "@self-storage-system-fe/shared";

/** "2026-11-09" → "09/11/2026". */
export function formatScheduleDate(scheduledDate: string): string {
  const [year, month, day] = scheduledDate.split("-");
  return `${day}/${month}/${year}`;
}

/** Gate check-in window around the slot start, e.g. { from: "07:30", to: "08:45" }. */
export function getCheckInWindow(startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const start = (hours ?? 0) * 60 + (minutes ?? 0);
  const clock = (total: number) => {
    const value = ((total % 1440) + 1440) % 1440;
    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  };
  return {
    from: clock(start - ACCESS_SCHEDULE_CONFIG.EARLY_CHECKIN_MINUTES),
    to: clock(start + ACCESS_SCHEDULE_CONFIG.GRACE_CHECKIN_MINUTES),
  };
}
