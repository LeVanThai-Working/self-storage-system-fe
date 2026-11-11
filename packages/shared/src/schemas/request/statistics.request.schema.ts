import { z } from "zod";
import {
  StatisticsGranularityEnum,
  FacilityKpiTierEnum,
  FacilityKpiSortByEnum,
  AiInsightFocusAreaEnum,
} from "../../enums/statistics.enum";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const statisticsBaseQuerySchema = z.object({
  fromDate: z
    .string()
    .trim()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Invalid fromDate format",
    })
    .optional(),
  toDate: z
    .string()
    .trim()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Invalid toDate format",
    })
    .optional(),
  facilityId: z.string().trim().regex(objectIdRegex, "Invalid facility ID format").optional(),
});

export const rentalTrendsQuerySchema = statisticsBaseQuerySchema.extend({
  granularity: z
    .enum([
      StatisticsGranularityEnum.DAY,
      StatisticsGranularityEnum.WEEK,
      StatisticsGranularityEnum.MONTH,
      StatisticsGranularityEnum.QUARTER,
    ])
    .default(StatisticsGranularityEnum.DAY)
    .optional(),
});

export const facilitiesKpiQuerySchema = statisticsBaseQuerySchema.extend({
  city: z.string().trim().min(1).max(100).optional(),
  tier: z
    .enum([
      FacilityKpiTierEnum.EXCELLENT,
      FacilityKpiTierEnum.GOOD,
      FacilityKpiTierEnum.AVERAGE,
      FacilityKpiTierEnum.NEEDS_IMPROVEMENT,
    ])
    .optional(),
  sortBy: z
    .enum([
      FacilityKpiSortByEnum.KPI_SCORE,
      FacilityKpiSortByEnum.OCCUPANCY_RATE,
      FacilityKpiSortByEnum.COLLECTED_REVENUE,
      FacilityKpiSortByEnum.CONVERSION_RATE,
      FacilityKpiSortByEnum.COLLECTION_RATE,
    ])
    .default(FacilityKpiSortByEnum.KPI_SCORE)
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const financialAnalyticsQuerySchema = statisticsBaseQuerySchema.extend({
  granularity: z
    .enum([
      StatisticsGranularityEnum.DAY,
      StatisticsGranularityEnum.WEEK,
      StatisticsGranularityEnum.MONTH,
      StatisticsGranularityEnum.QUARTER,
    ])
    .default(StatisticsGranularityEnum.DAY)
    .optional(),
});

export const productAndOperationsQuerySchema = statisticsBaseQuerySchema;

export const ragAdvisorRequestSchema = statisticsBaseQuerySchema.extend({
  question: z
    .string()
    .trim()
    .min(3, "Question must be at least 3 characters")
    .max(1000, "Question cannot exceed 1000 characters"),
  focusArea: z
    .enum([
      AiInsightFocusAreaEnum.ALL,
      AiInsightFocusAreaEnum.REVENUE_GROWTH,
      AiInsightFocusAreaEnum.OCCUPANCY,
      AiInsightFocusAreaEnum.DEBT_COLLECTION,
      AiInsightFocusAreaEnum.OPERATIONAL_EFFICIENCY,
    ])
    .default(AiInsightFocusAreaEnum.ALL)
    .optional(),
  topK: z.coerce.number().int().min(1).max(8).default(5).optional(),
  refresh: z.boolean().default(false).optional(),
});

export type StatisticsBaseQuery = z.infer<typeof statisticsBaseQuerySchema>;
export type RentalTrendsQuery = z.infer<typeof rentalTrendsQuerySchema>;
export type FacilitiesKpiQuery = z.infer<typeof facilitiesKpiQuerySchema>;
export type FinancialAnalyticsQuery = z.infer<typeof financialAnalyticsQuerySchema>;
export type ProductAndOperationsQuery = z.infer<typeof productAndOperationsQuerySchema>;
export type RagAdvisorRequest = z.infer<typeof ragAdvisorRequestSchema>;
