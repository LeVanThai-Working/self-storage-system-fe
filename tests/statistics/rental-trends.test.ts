import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MAX_RANGE_DAYS,
  DEFAULT_RANGE_DAYS,
  DEFAULT_RENTAL_TRENDS_RANGE_DAYS,
  DEFAULT_TOP_PEAK_LOW_COUNT,
  MESSAGE_CODE,
  RentalTrendsGranularityEnum,
  StatisticsGranularityEnum,
  financialAnalyticsQuerySchema,
  rentalTrendsQuerySchema,
  resolveMessageCode,
  type RentalTrendsResponse,
} from "../../packages/shared/src/index";
import api from "../../apps/web/lib/api/axios";
import { fetchRentalTrends } from "../../apps/web/features/statistics/api";
import {
  formatRentalTrendPeriod,
  getStatisticsDateRange,
  getTodayInVietnam,
  validateStatisticsDateRange,
} from "../../apps/web/features/statistics/utils/rentalTrends";

vi.mock("../../apps/web/lib/api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Statistics constants and message codes", () => {
  it("exposes updated range and peak/low constants", () => {
    expect(DEFAULT_RANGE_DAYS).toBe(30);
    expect(DEFAULT_RENTAL_TRENDS_RANGE_DAYS).toBe(365);
    expect(DEFAULT_MAX_RANGE_DAYS).toBe(366);
    expect(DEFAULT_TOP_PEAK_LOW_COUNT).toBe(1);
  });

  it("resolves statistics message codes and entity subjects", () => {
    expect(resolveMessageCode(MESSAGE_CODE.MESSAGE_CODE_820, { locale: "vi" })).toBe(
      "Khoảng thời gian thống kê không hợp lệ hoặc vượt quá số ngày tối đa cho phép"
    );
    expect(
      resolveMessageCode(MESSAGE_CODE.MESSAGE_CODE_110, {
        locale: "vi",
        rawMessage: "User Account Is Inactive",
      })
    ).toBe("Tài khoản người dùng đang ngừng hoạt động");
    expect(
      resolveMessageCode(MESSAGE_CODE.MESSAGE_CODE_122, {
        locale: "vi",
        rawMessage: "You Do Not Have Permission To Manage Facility Statistics",
      })
    ).toBe("Bạn không có quyền quản lý Thống kê cơ sở");
    expect(
      resolveMessageCode(MESSAGE_CODE.MESSAGE_CODE_104, {
        locale: "vi",
        rawMessage: "Facility Not Found",
      })
    ).toBe("Cơ sở kho không tồn tại");
  });
});

describe("rentalTrendsQuerySchema & financialAnalyticsQuerySchema", () => {
  it("allows only month and quarter for rental-trends and defaults to month", () => {
    expect(RentalTrendsGranularityEnum.MONTH).toBe("month");
    expect(RentalTrendsGranularityEnum.QUARTER).toBe("quarter");

    expect(rentalTrendsQuerySchema.parse({})).toEqual({
      granularity: RentalTrendsGranularityEnum.MONTH,
    });
    expect(
      rentalTrendsQuerySchema.parse({
        granularity: RentalTrendsGranularityEnum.QUARTER,
        fromDate: "2025-11-18",
        toDate: "2026-11-18",
        facilityId: "a".repeat(24),
      })
    ).toEqual({
      granularity: RentalTrendsGranularityEnum.QUARTER,
      fromDate: "2025-11-18",
      toDate: "2026-11-18",
      facilityId: "a".repeat(24),
    });

    expect(rentalTrendsQuerySchema.safeParse({ granularity: "day" }).success).toBe(false);
    expect(rentalTrendsQuerySchema.safeParse({ granularity: "week" }).success).toBe(false);
    expect(rentalTrendsQuerySchema.safeParse({ facilityId: "invalid-id" }).success).toBe(false);
  });

  it("keeps day/week/month/quarter options for financial-analytics", () => {
    expect(financialAnalyticsQuerySchema.parse({})).toEqual({
      granularity: StatisticsGranularityEnum.DAY,
    });
    for (const g of [
      StatisticsGranularityEnum.DAY,
      StatisticsGranularityEnum.WEEK,
      StatisticsGranularityEnum.MONTH,
      StatisticsGranularityEnum.QUARTER,
    ]) {
      expect(financialAnalyticsQuerySchema.safeParse({ granularity: g }).success).toBe(true);
    }
  });
});

describe("RentalTrendsResponse contract shape", () => {
  it("supports isPeak/isLow flags, simplified dayOfWeekDistribution, and object timeSlotDemand", async () => {
    const sampleResponse: RentalTrendsResponse = {
      period: {
        fromDate: "2025-11-18",
        toDate: "2026-11-18",
        granularity: RentalTrendsGranularityEnum.MONTH,
        scopedFacilityId: null,
      },
      timeSeries: [
        {
          period: "2026-10",
          reservationsCreated: 0,
          completedReservations: 0,
          cancelledReservations: 0,
          contractsCheckedIn: 0,
          walkInContracts: 0,
          contractsEnded: 0,
          collectedRevenue: 0,
          varianceFromAvgPercent: -100,
          isPeak: false,
          isLow: true,
        },
        {
          period: "2026-11",
          reservationsCreated: 5,
          completedReservations: 3,
          cancelledReservations: 1,
          contractsCheckedIn: 3,
          walkInContracts: 2,
          contractsEnded: 0,
          collectedRevenue: 15_000_000,
          varianceFromAvgPercent: 100,
          isPeak: true,
          isLow: false,
        },
      ],
      peakAndLowAnalysis: {
        averageReservationsPerPeriod: 2.5,
        peakPeriods: [
          {
            period: "2026-11",
            reservationsCreated: 5,
            completedReservations: 3,
            cancelledReservations: 1,
            contractsCheckedIn: 3,
            walkInContracts: 2,
            contractsEnded: 0,
            collectedRevenue: 15_000_000,
            varianceFromAvgPercent: 100,
            isPeak: true,
            isLow: false,
          },
        ],
        lowPeriods: [
          {
            period: "2026-10",
            reservationsCreated: 0,
            completedReservations: 0,
            cancelledReservations: 0,
            contractsCheckedIn: 0,
            walkInContracts: 0,
            contractsEnded: 0,
            collectedRevenue: 0,
            varianceFromAvgPercent: -100,
            isPeak: false,
            isLow: true,
          },
        ],
      },
      dayOfWeekDistribution: {
        busiestDay: { dayOfWeek: 2, dayName: "Thứ Hai", reservationsCreated: 4 },
        items: [
          { dayOfWeek: 2, dayName: "Thứ Hai", reservationsCreated: 4 },
          { dayOfWeek: 1, dayName: "Chủ Nhật", reservationsCreated: 1 },
        ],
      },
      timeSlotDemand: {
        mostBookedTimeSlot: { timeSlot: "08:00 - 10:00", reservationCount: 4 },
        items: [
          { timeSlot: "08:00 - 10:00", reservationCount: 4 },
          { timeSlot: "10:00 - 12:00", reservationCount: 1 },
        ],
      },
      hourOfDayDistribution: [{ hour: 9, label: "09:00", reservationCount: 4 }],
      durationBreakdown: {
        byBillingUnit: [],
        byDurationBucket: [],
      },
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: sampleResponse } });

    const data = await fetchRentalTrends({
      fromDate: "2025-11-18",
      toDate: "2026-11-18",
      granularity: RentalTrendsGranularityEnum.MONTH,
    });

    expect(api.get).toHaveBeenCalledWith("/statistics/rental-trends", {
      params: {
        fromDate: "2025-11-18",
        toDate: "2026-11-18",
        granularity: "month",
      },
    });
    expect(data.timeSlotDemand.mostBookedTimeSlot?.timeSlot).toBe("08:00 - 10:00");
    expect(data.timeSeries[1]?.isPeak).toBe(true);
    expect(data.timeSeries[1]?.contractsCheckedIn).toBe(3);
    expect(data.timeSeries[1]?.walkInContracts).toBe(2);
  });
});

describe("Vietnam date range and period formatting helpers", () => {
  it("computes Vietnam calendar dates accurately even right after midnight VN time", () => {
    // 2026-11-18T18:30:00Z = 2026-11-19T01:30:00+07:00
    const earlyMorningVn = new Date("2026-11-18T18:30:00.000Z");
    expect(getTodayInVietnam(earlyMorningVn)).toBe("2026-11-19");
    expect(getStatisticsDateRange(365, earlyMorningVn)).toEqual({
      fromDate: "2025-11-19",
      toDate: "2026-11-19",
    });
  });

  it("keeps 365-day default range valid across leap years (<= 366 inclusive days)", () => {
    const leapYearDate = new Date("2024-11-18T10:00:00+07:00");
    const range = getStatisticsDateRange(DEFAULT_RENTAL_TRENDS_RANGE_DAYS, leapYearDate);
    expect(range).toEqual({ fromDate: "2023-11-19", toDate: "2024-11-18" });
    expect(validateStatisticsDateRange(range.fromDate, range.toDate)).toEqual({ valid: true });
  });

  it("rejects inverted ranges and ranges exceeding 366 days", () => {
    expect(validateStatisticsDateRange("2026-11-19", "2026-11-18")).toEqual({
      valid: false,
      reason: "invalid_order",
    });
    expect(validateStatisticsDateRange("2025-11-17", "2026-11-18")).toEqual({
      valid: false,
      reason: "exceeds_max_days",
    });
    expect(validateStatisticsDateRange("2025-11-18", "2026-11-18")).toEqual({
      valid: true,
    });
  });

  it("formats YYYY-MM and YYYY-Qq period strings without Date parsing", () => {
    expect(formatRentalTrendPeriod("2026-11")).toBe("11/2026");
    expect(formatRentalTrendPeriod("2026-01")).toBe("01/2026");
    expect(formatRentalTrendPeriod("2026-Q1")).toBe("Quý 1/2026");
    expect(formatRentalTrendPeriod("2026-Q4")).toBe("Quý 4/2026");
    expect(formatRentalTrendPeriod("2026-11-18")).toBe("18/11/2026");
  });
});
