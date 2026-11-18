import { DEFAULT_MAX_RANGE_DAYS, STATISTICS_TIMEZONE } from "@self-storage-system-fe/shared";

const MS_PER_DAY = 86_400_000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Returns the calendar date (`YYYY-MM-DD`) in Vietnam timezone (`Asia/Ho_Chi_Minh`).
 */
export function getTodayInVietnam(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STATISTICS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Shifts a `YYYY-MM-DD` calendar date string by `deltaDays` without local timezone drift.
 */
export function shiftCalendarDate(dateStr: string, deltaDays: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return dateStr;
  const utcMs = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const shifted = new Date(utcMs + deltaDays * MS_PER_DAY);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Builds default `{ fromDate, toDate }` (`YYYY-MM-DD` in `Asia/Ho_Chi_Minh`) spanning `rangeDays` back from today.
 */
export function getStatisticsDateRange(
  rangeDays: number,
  now: Date = new Date()
): { fromDate: string; toDate: string } {
  const toDate = getTodayInVietnam(now);
  const fromDate = shiftCalendarDate(toDate, -rangeDays);
  return { fromDate, toDate };
}

function parseToVietnamDayBoundary(dateStr: string, boundary: "start" | "end"): number | null {
  const trimmed = dateStr.trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  let year: number;
  let month: number;
  let day: number;

  if (ymd) {
    year = Number(ymd[1]);
    month = Number(ymd[2]);
    day = Number(ymd[3]);
  } else {
    const parsed = Date.parse(trimmed);
    if (Number.isNaN(parsed)) return null;
    const vnDate = new Date(parsed + VN_OFFSET_MS);
    year = vnDate.getUTCFullYear();
    month = vnDate.getUTCMonth() + 1;
    day = vnDate.getUTCDate();
  }

  const startOfDayUtc = Date.UTC(year, month - 1, day) - VN_OFFSET_MS;
  return boundary === "start" ? startOfDayUtc : startOfDayUtc + MS_PER_DAY - 1;
}

/**
 * Validates `fromDate` and `toDate` against Vietnam-timezone boundaries and `DEFAULT_MAX_RANGE_DAYS` (366 days).
 */
export function validateStatisticsDateRange(
  fromDate?: string,
  toDate?: string
): { valid: boolean; reason?: "invalid_format" | "invalid_order" | "exceeds_max_days" } {
  if (!fromDate || !toDate) {
    return { valid: true };
  }

  const fromMs = parseToVietnamDayBoundary(fromDate, "start");
  const toMs = parseToVietnamDayBoundary(toDate, "end");

  if (fromMs === null || toMs === null) {
    return { valid: false, reason: "invalid_format" };
  }

  if (fromMs > toMs) {
    return { valid: false, reason: "invalid_order" };
  }

  const spanDays = (toMs - fromMs) / MS_PER_DAY;
  if (spanDays > DEFAULT_MAX_RANGE_DAYS) {
    return { valid: false, reason: "exceeds_max_days" };
  }

  return { valid: true };
}

/**
 * Formats backend rental-trend period keys (`YYYY-MM`, `YYYY-Qq`) into human-readable Vietnamese labels
 * without passing partial period strings to `new Date(...)`.
 */
export function formatRentalTrendPeriod(period: string): string {
  const trimmed = period.trim();
  let match = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (match) return `${match[2]}/${match[1]}`;

  match = /^(\d{4})-Q([1-4])$/i.exec(trimmed);
  if (match) return `Quý ${match[2]}/${match[1]}`;

  match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;

  match = /^(\d{4})-W(\d{2})$/i.exec(trimmed);
  if (match) return `Tuần ${Number(match[2])}/${match[1]}`;

  return period;
}
