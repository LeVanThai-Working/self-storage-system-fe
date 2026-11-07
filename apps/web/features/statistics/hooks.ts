import { useQuery } from "@tanstack/react-query";
import {
  fetchFacilitiesKpi,
  fetchFinancialAnalytics,
  fetchOverviewStatistics,
  fetchProductAndOperations,
  fetchRentalTrends,
} from "./api";
import type {
  FacilitiesKpiQuery,
  FinancialAnalyticsQuery,
  ProductAndOperationsQuery,
  RentalTrendsQuery,
  StatisticsBaseQuery,
} from "./types";

export const statisticsKeys = {
  all: ["statistics"] as const,
  overview: (params?: StatisticsBaseQuery) => [...statisticsKeys.all, "overview", params] as const,
  rentalTrends: (params?: RentalTrendsQuery) =>
    [...statisticsKeys.all, "rental-trends", params] as const,
  facilitiesKpi: (params?: FacilitiesKpiQuery) =>
    [...statisticsKeys.all, "facilities-kpi", params] as const,
  financialAnalytics: (params?: FinancialAnalyticsQuery) =>
    [...statisticsKeys.all, "financial-analytics", params] as const,
  productAndOperations: (params?: ProductAndOperationsQuery) =>
    [...statisticsKeys.all, "product-and-operations", params] as const,
};

export const useOverviewStatistics = (
  params?: StatisticsBaseQuery,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) => {
  return useQuery({
    queryKey: statisticsKeys.overview(params),
    queryFn: () => fetchOverviewStatistics(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
};

export const useRentalTrends = (
  params?: RentalTrendsQuery,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) => {
  return useQuery({
    queryKey: statisticsKeys.rentalTrends(params),
    queryFn: () => fetchRentalTrends(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
};

export const useFacilitiesKpi = (
  params?: FacilitiesKpiQuery,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) => {
  return useQuery({
    queryKey: statisticsKeys.facilitiesKpi(params),
    queryFn: () => fetchFacilitiesKpi(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
};

export const useFinancialAnalytics = (
  params?: FinancialAnalyticsQuery,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) => {
  return useQuery({
    queryKey: statisticsKeys.financialAnalytics(params),
    queryFn: () => fetchFinancialAnalytics(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
};

export const useProductAndOperations = (
  params?: ProductAndOperationsQuery,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) => {
  return useQuery({
    queryKey: statisticsKeys.productAndOperations(params),
    queryFn: () => fetchProductAndOperations(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
};
