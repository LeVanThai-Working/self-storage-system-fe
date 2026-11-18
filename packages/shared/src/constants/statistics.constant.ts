export const DEFAULT_RANGE_DAYS = 30;
export const DEFAULT_RENTAL_TRENDS_RANGE_DAYS = 365;
export const DEFAULT_MAX_RANGE_DAYS = 366;
export const DEFAULT_TOP_PEAK_LOW_COUNT = 1;

export const STATISTICS_MAX_RANGE_DAYS = DEFAULT_MAX_RANGE_DAYS;
export const STATISTICS_DEFAULT_RANGE_DAYS = DEFAULT_RANGE_DAYS;
export const STATISTICS_RENTAL_TRENDS_DEFAULT_RANGE_DAYS = DEFAULT_RENTAL_TRENDS_RANGE_DAYS;
export const STATISTICS_TOP_PEAK_LOW_COUNT = DEFAULT_TOP_PEAK_LOW_COUNT;
export const STATISTICS_TIMEZONE = "Asia/Ho_Chi_Minh";

/** @deprecated Peak/low detection now selects up to 1 peak and 1 low period directly. */
export const STATISTICS_PEAK_MULTIPLIER = 1.25;
/** @deprecated Peak/low detection now selects up to 1 peak and 1 low period directly. */
export const STATISTICS_LOW_MULTIPLIER = 0.75;

export const FACILITY_KPI_TIER_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  AVERAGE: 50,
} as const;
