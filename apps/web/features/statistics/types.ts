export type {
  OverviewStatisticsResponse,
  RentalTrendsResponse,
  RentalTrendPoint,
  DayOfWeekItem,
  TimeSlotDemandItem,
  HourOfDayItem,
  FacilitiesKpiResponse,
  FacilityKpiItem,
  FinancialAnalyticsResponse,
  ProductAndOperationsResponse,
  StatisticsBaseQuery,
  RentalTrendsQuery,
  FacilitiesKpiQuery,
  FinancialAnalyticsQuery,
  ProductAndOperationsQuery,
} from "@self-storage-system-fe/shared";

export {
  StatisticsGranularityEnum,
  FacilityKpiTierEnum,
  FacilityKpiSortByEnum,
  STATISTICS_MAX_RANGE_DAYS,
  STATISTICS_DEFAULT_RANGE_DAYS,
  STATISTICS_TIMEZONE,
  STATISTICS_PEAK_MULTIPLIER,
  STATISTICS_LOW_MULTIPLIER,
  FACILITY_KPI_TIER_THRESHOLDS,
} from "@self-storage-system-fe/shared";

export type StatisticsUserRole = "business_ops_manager" | "system_admin" | "facility_manager";
