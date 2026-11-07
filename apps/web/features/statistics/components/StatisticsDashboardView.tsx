"use client";

import React, { useMemo, useState } from "react";
import { Boxes, Coins, LayoutDashboard, TrendingUp, Trophy } from "lucide-react";
import {
  FacilityKpiSortByEnum,
  FacilityKpiTierEnum,
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
import { StatisticsFilterBar } from "./StatisticsFilterBar";
import { OverviewTab } from "./OverviewTab";
import { RentalTrendsTab } from "./RentalTrendsTab";
import { FacilitiesKpiTab } from "./FacilitiesKpiTab";
import { FinancialAnalyticsTab } from "./FinancialAnalyticsTab";
import { ProductOperationsTab } from "./ProductOperationsTab";

interface StatisticsDashboardViewProps {
  role: StatisticsUserRole;
  initialTab?: "overview" | "trends" | "kpi" | "financial" | "operations";
  lockedFacilityId?: string;
  facilityName?: string;
}

export function StatisticsDashboardView({
  role,
  initialTab = "overview",
  lockedFacilityId,
  facilityName,
}: StatisticsDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "trends" | "kpi" | "financial" | "operations"
  >(initialTab);

  // Default dates: past 30 days
  const defaultDates = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      from: start.toISOString().split("T")[0],
      to: end.toISOString().split("T")[0],
    };
  }, []);

  const [fromDate, setFromDate] = useState<string | undefined>(defaultDates.from);
  const [toDate, setToDate] = useState<string | undefined>(defaultDates.to);
  const [granularity, setGranularity] = useState<StatisticsGranularityEnum>(
    StatisticsGranularityEnum.DAY
  );
  const [facilityId, setFacilityId] = useState<string | undefined>(lockedFacilityId);

  // KPI specific states
  const [kpiTier, setKpiTier] = useState<FacilityKpiTierEnum | undefined>(undefined);
  const [kpiSortBy, setKpiSortBy] = useState<FacilityKpiSortByEnum>(
    FacilityKpiSortByEnum.KPI_SCORE
  );
  const [kpiSortOrder, setKpiSortOrder] = useState<"asc" | "desc">("desc");

  const effectiveFacilityId = lockedFacilityId || facilityId;

  // Base query
  const baseQuery = useMemo(
    () => ({
      fromDate,
      toDate,
      facilityId: effectiveFacilityId,
    }),
    [fromDate, toDate, effectiveFacilityId]
  );

  // Queries
  const overviewQuery = useOverviewStatistics(baseQuery, {
    enabled: activeTab === "overview" || activeTab === "financial",
  });

  const trendsQuery = useRentalTrends(
    { ...baseQuery, granularity },
    { enabled: activeTab === "trends" }
  );

  const kpiQuery = useFacilitiesKpi(
    {
      ...baseQuery,
      tier: kpiTier,
      sortBy: kpiSortBy,
      sortOrder: kpiSortOrder,
    },
    { enabled: role !== "facility_manager" && activeTab === "kpi" }
  );

  const financialQuery = useFinancialAnalytics(
    { ...baseQuery, granularity },
    { enabled: activeTab === "financial" }
  );

  const productQuery = useProductAndOperations(baseQuery, {
    enabled: activeTab === "operations",
  });

  const isFetching =
    overviewQuery.isFetching ||
    trendsQuery.isFetching ||
    kpiQuery.isFetching ||
    financialQuery.isFetching ||
    productQuery.isFetching;

  const handleRefresh = () => {
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
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {roleText.title}
        </h1>
      </div>

      {/* Global Filter Bar */}
      <StatisticsFilterBar
        fromDate={fromDate}
        toDate={toDate}
        granularity={granularity}
        facilityId={effectiveFacilityId}
        showFacilityFilter={role !== "facility_manager"}
        isFetching={isFetching}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onGranularityChange={setGranularity}
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

        {role !== "facility_manager" && (
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
        )}

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

        <button
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
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <OverviewTab data={overviewQuery.data} isLoading={overviewQuery.isLoading} />
        )}

        {activeTab === "trends" && (
          <RentalTrendsTab data={trendsQuery.data} isLoading={trendsQuery.isLoading} />
        )}

        {activeTab === "kpi" && role !== "facility_manager" && (
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

        {activeTab === "financial" && (
          <FinancialAnalyticsTab
            data={financialQuery.data}
            overviewData={overviewQuery.data}
            isLoading={financialQuery.isLoading || overviewQuery.isLoading}
          />
        )}

        {activeTab === "operations" && (
          <ProductOperationsTab data={productQuery.data} isLoading={productQuery.isLoading} />
        )}
      </div>
    </div>
  );
}
