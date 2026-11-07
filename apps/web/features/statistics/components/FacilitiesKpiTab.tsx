"use client";

import React from "react";
import { AlertTriangle, Filter, Trophy } from "lucide-react";
import { formatCurrency } from "@self-storage-system-fe/shared";
import { FacilityKpiSortByEnum, FacilityKpiTierEnum, type FacilitiesKpiResponse } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

interface FacilitiesKpiTabProps {
  data?: FacilitiesKpiResponse;
  isLoading: boolean;
  selectedTier?: FacilityKpiTierEnum;
  selectedSortBy: FacilityKpiSortByEnum;
  sortOrder: "asc" | "desc";
  onTierChange: (tier?: FacilityKpiTierEnum) => void;
  onSortByChange: (sortBy: FacilityKpiSortByEnum) => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
}

function getTierBadge(tier: FacilityKpiTierEnum) {
  switch (tier) {
    case FacilityKpiTierEnum.EXCELLENT:
      return (
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
          Xuất sắc (≥85)
        </span>
      );
    case FacilityKpiTierEnum.GOOD:
      return (
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-800">
          Tốt (70–84)
        </span>
      );
    case FacilityKpiTierEnum.AVERAGE:
      return (
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800">
          Trung bình (50–69)
        </span>
      );
    case FacilityKpiTierEnum.NEEDS_IMPROVEMENT:
      return (
        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-800">
          Cần cải thiện (&lt;50)
        </span>
      );
    default:
      return null;
  }
}

export function FacilitiesKpiTab({
  data,
  isLoading,
  selectedTier,
  selectedSortBy,
  sortOrder,
  onTierChange,
  onSortByChange,
  onSortOrderChange,
}: FacilitiesKpiTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const { summary, highlights, items } = data;

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Điểm KPI Trung bình
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-600">{summary.averageKpiScore}</span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Đánh giá {summary.totalFacilitiesEvaluated} chi nhánh
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Hạng Xuất sắc
          </span>
          <div className="mt-2 text-3xl font-black text-emerald-900">{summary.excellentCount}</div>
          <p className="mt-1 text-xs text-emerald-700">Đạt từ 85 điểm trở lên</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Hạng Tốt</span>
          <div className="mt-2 text-3xl font-black text-blue-900">{summary.goodCount}</div>
          <p className="mt-1 text-xs text-blue-700">Đạt từ 70 đến 84 điểm</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Hạng Trung bình
          </span>
          <div className="mt-2 text-3xl font-black text-amber-900">{summary.averageCount}</div>
          <p className="mt-1 text-xs text-amber-700">Đạt từ 50 đến 69 điểm</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
            Cần cải thiện
          </span>
          <div className="mt-2 text-3xl font-black text-rose-900">
            {summary.needsImprovementCount}
          </div>
          <p className="mt-1 text-xs text-rose-700">Dưới 50 điểm</p>
        </div>
      </div>

      {/* 2. Top Performers & Underperformers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Chi nhánh tiêu biểu
            </h4>
          </div>
          <div className="space-y-2.5">
            {highlights.topPerformers.map((fac) => (
              <div
                key={fac.facility.id}
                className="flex items-center justify-between rounded-xl bg-emerald-50/50 p-3 text-xs"
              >
                <div className="font-extrabold text-slate-900">
                  #{fac.rank} {fac.facility.name}
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-emerald-700">{fac.kpiScore} điểm</div>
                  {getTierBadge(fac.kpiTier)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Chi nhánh cần hỗ trợ
            </h4>
          </div>
          <div className="space-y-2.5">
            {highlights.underperformers.map((fac) => (
              <div
                key={fac.facility.id}
                className="flex items-center justify-between rounded-xl bg-rose-50/50 p-3 text-xs"
              >
                <div className="font-extrabold text-slate-900">
                  #{fac.rank} {fac.facility.name}
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-rose-700">{fac.kpiScore} điểm</div>
                  {getTierBadge(fac.kpiTier)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Filter Controls & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Lọc phân hạng:
          </span>
          <button
            type="button"
            onClick={() => onTierChange(undefined)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              !selectedTier
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => onTierChange(FacilityKpiTierEnum.EXCELLENT)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedTier === FacilityKpiTierEnum.EXCELLENT
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            Xuất sắc
          </button>
          <button
            type="button"
            onClick={() => onTierChange(FacilityKpiTierEnum.GOOD)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedTier === FacilityKpiTierEnum.GOOD
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-800 hover:bg-blue-100"
            }`}
          >
            Tốt
          </button>
          <button
            type="button"
            onClick={() => onTierChange(FacilityKpiTierEnum.AVERAGE)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedTier === FacilityKpiTierEnum.AVERAGE
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Trung bình
          </button>
          <button
            type="button"
            onClick={() => onTierChange(FacilityKpiTierEnum.NEEDS_IMPROVEMENT)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              selectedTier === FacilityKpiTierEnum.NEEDS_IMPROVEMENT
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            Cần cải thiện
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Sắp xếp theo:</span>
          <select
            value={selectedSortBy}
            onChange={(e) => onSortByChange(e.target.value as FacilityKpiSortByEnum)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-teal-500"
          >
            <option value={FacilityKpiSortByEnum.KPI_SCORE}>Điểm KPI</option>
            <option value={FacilityKpiSortByEnum.OCCUPANCY_RATE}>Tỷ lệ lấp đầy</option>
            <option value={FacilityKpiSortByEnum.COLLECTED_REVENUE}>Doanh thu thu được</option>
            <option value={FacilityKpiSortByEnum.CONVERSION_RATE}>Tỷ lệ chuyển đổi</option>
            <option value={FacilityKpiSortByEnum.COLLECTION_RATE}>Tỷ lệ thu nợ</option>
          </select>

          <button
            type="button"
            onClick={() => onSortOrderChange(sortOrder === "desc" ? "asc" : "desc")}
            className="cursor-pointer rounded-xl border border-slate-200 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50"
          >
            {sortOrder === "desc" ? "Giảm dần ↓" : "Tăng dần ↑"}
          </button>
        </div>
      </div>

      {/* 4. Full KPI Leaderboard Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3">Hạng</th>
              <th className="py-3 px-3">Chi nhánh</th>
              <th className="py-3 px-3 text-center">Điểm KPI</th>
              <th className="py-3 px-3">Phân hạng</th>
              <th className="py-3 px-3 text-right">Lấp đầy kho</th>
              <th className="py-3 px-3 text-right">Thực thu</th>
              <th className="py-3 px-3 text-right">RevPAU</th>
              <th className="py-3 px-3 text-right">RevPAM</th>
              <th className="py-3 px-3 text-right">Thu nợ</th>
              <th className="py-3 px-3">Cảnh báo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {items.map((item) => (
              <tr key={item.facility.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-3 font-black text-slate-900">#{item.rank}</td>
                <td className="py-3 px-3">
                  <div className="font-extrabold text-slate-900">{item.facility.name}</div>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="text-base font-black text-teal-700">{item.kpiScore}</span>
                </td>
                <td className="py-3 px-3">{getTierBadge(item.kpiTier)}</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">
                  {item.occupancy.unitOccupancyRate}%
                </td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">
                  {formatCurrency(item.financial.collectedRevenue)}
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {formatCurrency(item.financial.revPAU)}
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {formatCurrency(item.financial.revPAM)}/m²
                </td>
                <td className="py-3 px-3 text-right font-bold text-emerald-600">
                  {item.financial.invoiceCollectionRate}%
                </td>
                <td className="py-3 px-3">
                  {item.alerts?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {item.alerts.map((alert, i) => (
                        <span
                          key={i}
                          className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700"
                        >
                          {alert}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
