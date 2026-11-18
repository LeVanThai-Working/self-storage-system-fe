"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Coins, LayoutDashboard, TrendingUp } from "lucide-react";
import { MESSAGE_CODE, resolveMessageCode } from "@self-storage-system-fe/shared";
import {
  DEFAULT_RANGE_DAYS,
  DEFAULT_RENTAL_TRENDS_RANGE_DAYS,
  FacilityKpiSortByEnum,
  FacilityKpiTierEnum,
  RentalTrendsGranularityEnum,
  StatisticsGranularityEnum,
  type StatisticsUserRole,
} from "../types";
import {
  useFacilitiesKpi,
  useFinancialAnalytics,
  useOverviewStatistics,
  useProductAndOperations,
  useRentalTrends,
} from "../hooks";
import { useStatisticsFilterStore } from "../store";
import { getStatisticsDateRange, validateStatisticsDateRange } from "../utils/rentalTrends";
import { StatisticsFilterBar, type StatisticsFilterGranularity } from "./StatisticsFilterBar";
import { OverviewTab } from "./OverviewTab";
import { RentalTrendsTab } from "./RentalTrendsTab";
import { FacilitiesKpiTab } from "./FacilitiesKpiTab";
import { FinancialAnalyticsTab } from "./FinancialAnalyticsTab";
import { ProductOperationsTab } from "./ProductOperationsTab";
import { RagAdvisorChatWidget } from "./RagAdvisorChatWidget";
import { AppApiError } from "@/lib/api/axios";

interface StatisticsDashboardViewProps {
  role: StatisticsUserRole;
  initialTab?: "overview" | "trends" | "kpi" | "financial" | "operations";
  lockedFacilityId?: string;
  facilityName?: string;
  /** Hide the page title when embedded under another page header. */
  hideHeader?: boolean;
  /** Override the role-based page title. */
  title?: string;
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof AppApiError) {
    const resolved = resolveMessageCode(error.messageCode, {
      locale: "vi",
      rawMessage: error.message,
      defaultSubject: "Facility",
    });
    return resolved || error.message || "Không thể tải dữ liệu thống kê.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Không thể tải dữ liệu thống kê.";
}

export function StatisticsDashboardView({
  role,
  initialTab = "overview",
  lockedFacilityId,
  facilityName,
  hideHeader = false,
  title,
}: StatisticsDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "trends" | "kpi" | "financial" | "operations"
  >(initialTab);

  // Default dates in Vietnam timezone: 30 days for overview/financial, 365 days for rental trends
  const defaultStandardDates = useMemo(() => getStatisticsDateRange(DEFAULT_RANGE_DAYS), []);
  const defaultTrendsDates = useMemo(
    () => getStatisticsDateRange(DEFAULT_RENTAL_TRENDS_RANGE_DAYS),
    []
  );

  const [standardFromDate, setStandardFromDate] = useState<string | undefined>(
    defaultStandardDates.fromDate
  );
  const [standardToDate, setStandardToDate] = useState<string | undefined>(
    defaultStandardDates.toDate
  );
  const [trendsFromDate, setTrendsFromDate] = useState<string | undefined>(
    defaultTrendsDates.fromDate
  );
  const [trendsToDate, setTrendsToDate] = useState<string | undefined>(defaultTrendsDates.toDate);

  const [financialGranularity, setFinancialGranularity] = useState<StatisticsGranularityEnum>(
    StatisticsGranularityEnum.DAY
  );
  const [trendsGranularity, setTrendsGranularity] = useState<RentalTrendsGranularityEnum>(
    RentalTrendsGranularityEnum.MONTH
  );
  const [facilityId, setFacilityId] = useState<string | undefined>(lockedFacilityId);

  // KPI specific states
  const [kpiTier, setKpiTier] = useState<FacilityKpiTierEnum | undefined>(undefined);
  const [kpiSortBy, setKpiSortBy] = useState<FacilityKpiSortByEnum>(
    FacilityKpiSortByEnum.KPI_SCORE
  );
  const [kpiSortOrder, setKpiSortOrder] = useState<"asc" | "desc">("desc");

  const effectiveFacilityId = lockedFacilityId || facilityId;
  const isTrendsTab = activeTab === "trends";

  const activeFromDate = isTrendsTab ? trendsFromDate : standardFromDate;
  const activeToDate = isTrendsTab ? trendsToDate : standardToDate;
  const activeGranularity: StatisticsFilterGranularity = isTrendsTab
    ? trendsGranularity
    : financialGranularity;

  const setActiveFromDate = isTrendsTab ? setTrendsFromDate : setStandardFromDate;
  const setActiveToDate = isTrendsTab ? setTrendsToDate : setStandardToDate;

  const handleGranularityChange = (val: StatisticsFilterGranularity) => {
    if (isTrendsTab) {
      const next =
        val === RentalTrendsGranularityEnum.QUARTER
          ? RentalTrendsGranularityEnum.QUARTER
          : RentalTrendsGranularityEnum.MONTH;
      setTrendsGranularity(next);
      return;
    }
    setFinancialGranularity(val as StatisticsGranularityEnum);
  };

  const dateValidation = useMemo(
    () => validateStatisticsDateRange(activeFromDate, activeToDate),
    [activeFromDate, activeToDate]
  );

  // Sync active filters to store so external widgets can access them
  const setStoreFilters = useStatisticsFilterStore((s) => s.setFilters);
  useEffect(() => {
    setStoreFilters({
      fromDate: activeFromDate,
      toDate: activeToDate,
      facilityId: effectiveFacilityId,
    });
  }, [activeFromDate, activeToDate, effectiveFacilityId, setStoreFilters]);

  const standardBaseQuery = useMemo(
    () => ({
      fromDate: standardFromDate,
      toDate: standardToDate,
      facilityId: effectiveFacilityId,
    }),
    [standardFromDate, standardToDate, effectiveFacilityId]
  );

  const trendsBaseQuery = useMemo(
    () => ({
      fromDate: trendsFromDate,
      toDate: trendsToDate,
      facilityId: effectiveFacilityId,
    }),
    [trendsFromDate, trendsToDate, effectiveFacilityId]
  );

  // Queries
  const overviewQuery = useOverviewStatistics(standardBaseQuery, {
    enabled: dateValidation.valid && (activeTab === "overview" || activeTab === "financial"),
  });

  const trendsQuery = useRentalTrends(
    { ...trendsBaseQuery, granularity: trendsGranularity },
    { enabled: dateValidation.valid && activeTab === "trends" }
  );

  const kpiQuery = useFacilitiesKpi(
    {
      ...standardBaseQuery,
      tier: kpiTier,
      sortBy: kpiSortBy,
      sortOrder: kpiSortOrder,
    },
    { enabled: dateValidation.valid && role !== "facility_manager" && activeTab === "kpi" }
  );

  const financialQuery = useFinancialAnalytics(
    { ...standardBaseQuery, granularity: financialGranularity },
    { enabled: dateValidation.valid && activeTab === "financial" }
  );

  const productQuery = useProductAndOperations(standardBaseQuery, {
    enabled: dateValidation.valid && activeTab === "operations",
  });

  const isFetching =
    overviewQuery.isFetching ||
    trendsQuery.isFetching ||
    kpiQuery.isFetching ||
    financialQuery.isFetching ||
    productQuery.isFetching;

  const activeQueryError = useMemo(() => {
    switch (activeTab) {
      case "overview":
        return overviewQuery.error;
      case "trends":
        return trendsQuery.error;
      case "kpi":
        return kpiQuery.error;
      case "financial":
        return financialQuery.error ?? overviewQuery.error;
      case "operations":
        return productQuery.error;
    }
  }, [
    activeTab,
    overviewQuery.error,
    trendsQuery.error,
    kpiQuery.error,
    financialQuery.error,
    productQuery.error,
  ]);

  const dateValidationMessage = useMemo(() => {
    if (dateValidation.valid) return null;
    if (dateValidation.reason === "invalid_order") {
      return "Ngày bắt đầu không được lớn hơn ngày kết thúc.";
    }
    if (dateValidation.reason === "exceeds_max_days") {
      return resolveMessageCode(MESSAGE_CODE.MESSAGE_CODE_820, { locale: "vi" });
    }
    return "Định dạng ngày lọc không hợp lệ.";
  }, [dateValidation]);

  const handleRefresh = () => {
    if (!dateValidation.valid) return;
    switch (activeTab) {
      case "overview":
        overviewQuery.refetch();
        break;
      case "trends":
        trendsQuery.refetch();
        break;
      case "kpi":
        kpiQuery.refetch();
        break;
      case "financial":
        financialQuery.refetch();
        overviewQuery.refetch();
        break;
      case "operations":
        productQuery.refetch();
        break;
    }
  };

  const getRoleTitle = () => {
    if (role === "facility_manager") {
      return {
        title: "Báo cáo & Thống kê",
        subtitle: facilityName
          ? `Chi nhánh: ${facilityName} (Dữ liệu khóa theo cơ sở phụ trách)`
          : "Số liệu vận hành, tỷ lệ lấp đầy & dòng tiền tại cơ sở phụ trách",
      };
    }
    if (role === "system_admin") {
      return {
        title: "Điều hành & Thống kê",
        subtitle: "Báo cáo toàn diện chuỗi chi nhánh kho tự quản trên phạm vi toàn quốc",
      };
    }
    return {
      title: "Báo cáo & Thống kê",
      subtitle: "Theo dõi doanh thu, hiệu suất chuỗi cơ sở, xu hướng thuê và chất lượng vận hành",
    };
  };

  const roleText = getRoleTitle();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      {!hideHeader && (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {title ?? roleText.title}
          </h1>
        </div>
      )}

      {/* Global Filter Bar */}
      <StatisticsFilterBar
        mode={isTrendsTab ? "trends" : "standard"}
        fromDate={activeFromDate}
        toDate={activeToDate}
        granularity={activeGranularity}
        facilityId={effectiveFacilityId}
        showFacilityFilter={role !== "facility_manager"}
        isFetching={isFetching}
        onFromDateChange={setActiveFromDate}
        onToDateChange={setActiveToDate}
        onGranularityChange={handleGranularityChange}
        onFacilityChange={setFacilityId}
        onRefresh={handleRefresh}
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "overview"
              ? "border-teal-600 text-teal-700 bg-teal-50/30"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Tổng quan & Vận hành</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("trends")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "trends"
              ? "border-teal-600 text-teal-700 bg-teal-50/30"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Xu hướng & Nhu cầu</span>
        </button>

        {/* {role !== "facility_manager" && (
          <button
            type="button"
            onClick={() => setActiveTab("kpi")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "kpi"
                ? "border-teal-600 text-teal-700 bg-teal-50/30"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Xếp hạng KPI chi nhánh</span>
          </button>
        )} */}

        <button
          type="button"
          onClick={() => setActiveTab("financial")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "financial"
              ? "border-teal-600 text-teal-700 bg-teal-50/30"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <Coins className="h-4 w-4" />
          <span>Tài chính & Dòng tiền</span>
        </button>

        {/* <button
          type="button"
          onClick={() => setActiveTab("operations")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "operations"
              ? "border-teal-600 text-teal-700 bg-teal-50/30"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Danh mục & Kho kệ</span>
        </button> */}
      </div>

      {/* Validation / Query Error Alert */}
      {(dateValidationMessage || activeQueryError) && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-xs font-semibold text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{dateValidationMessage ?? getApiErrorMessage(activeQueryError)}</span>
          </div>
          {!dateValidationMessage && (
            <button
              type="button"
              onClick={handleRefresh}
              className="shrink-0 cursor-pointer rounded-md border border-rose-300 bg-white px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
            >
              Thử lại
            </button>
          )}
        </div>
      )}

      {/* Tab Panels */}
      <div className="pt-2">
        {dateValidation.valid && activeTab === "overview" && (
          <OverviewTab data={overviewQuery.data} isLoading={overviewQuery.isLoading} />
        )}

        {dateValidation.valid && activeTab === "trends" && (
          <RentalTrendsTab data={trendsQuery.data} isLoading={trendsQuery.isLoading} />
        )}

        {dateValidation.valid && activeTab === "kpi" && role !== "facility_manager" && (
          <FacilitiesKpiTab
            data={kpiQuery.data}
            isLoading={kpiQuery.isLoading}
            selectedTier={kpiTier}
            selectedSortBy={kpiSortBy}
            sortOrder={kpiSortOrder}
            onTierChange={setKpiTier}
            onSortByChange={setKpiSortBy}
            onSortOrderChange={setKpiSortOrder}
          />
        )}

        {dateValidation.valid && activeTab === "financial" && (
          <FinancialAnalyticsTab
            data={financialQuery.data}
            overviewData={overviewQuery.data}
            isLoading={financialQuery.isLoading || overviewQuery.isLoading}
          />
        )}

        {dateValidation.valid && activeTab === "operations" && (
          <ProductOperationsTab data={productQuery.data} isLoading={productQuery.isLoading} />
        )}
      </div>

      {/* Floating AI RAG Profit Advisor Widget for system_admin and facility_manager (Business ops has it via Layout) */}
      {role !== "business_ops_manager" && (
        <RagAdvisorChatWidget
          role={role}
          fromDate={activeFromDate}
          toDate={activeToDate}
          facilityId={effectiveFacilityId}
        />
      )}
    </div>
  );
}
