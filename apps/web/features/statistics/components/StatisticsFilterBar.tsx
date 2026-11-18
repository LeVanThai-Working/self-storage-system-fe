"use client";

import React from "react";
import { Building2, Calendar, RefreshCw } from "lucide-react";
import {
  DEFAULT_RANGE_DAYS,
  DEFAULT_RENTAL_TRENDS_RANGE_DAYS,
  RentalTrendsGranularityEnum,
  StatisticsGranularityEnum,
} from "../types";
import { getStatisticsDateRange } from "../utils/rentalTrends";
import { useFacilities } from "@/features/facility-management/hooks";
import { Button } from "@/components/ui/button";

export type StatisticsFilterGranularity = StatisticsGranularityEnum | RentalTrendsGranularityEnum;

const STANDARD_PRESETS = [
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: DEFAULT_RANGE_DAYS },
  { label: "90 ngày", days: 90 },
] as const;

const TRENDS_PRESETS = [
  { label: "3 tháng", days: 90 },
  { label: "6 tháng", days: 180 },
  { label: "1 năm", days: DEFAULT_RENTAL_TRENDS_RANGE_DAYS },
] as const;

const STANDARD_GRANULARITY_OPTIONS = [
  { value: StatisticsGranularityEnum.DAY, label: "Theo Ngày" },
  { value: StatisticsGranularityEnum.WEEK, label: "Theo Tuần" },
  { value: StatisticsGranularityEnum.MONTH, label: "Theo Tháng" },
  { value: StatisticsGranularityEnum.QUARTER, label: "Theo Quý" },
] as const;

const TRENDS_GRANULARITY_OPTIONS = [
  { value: RentalTrendsGranularityEnum.MONTH, label: "Theo Tháng" },
  { value: RentalTrendsGranularityEnum.QUARTER, label: "Theo Quý" },
] as const;

interface StatisticsFilterBarProps {
  mode?: "standard" | "trends";
  fromDate?: string;
  toDate?: string;
  granularity: StatisticsFilterGranularity;
  facilityId?: string;
  showFacilityFilter: boolean;
  isFetching?: boolean;
  onFromDateChange: (val?: string) => void;
  onToDateChange: (val?: string) => void;
  onGranularityChange: (val: StatisticsFilterGranularity) => void;
  onFacilityChange: (val?: string) => void;
  onRefresh: () => void;
}

export function StatisticsFilterBar({
  mode = "standard",
  fromDate,
  toDate,
  granularity,
  facilityId,
  showFacilityFilter,
  isFetching,
  onFromDateChange,
  onToDateChange,
  onGranularityChange,
  onFacilityChange,
  onRefresh,
}: StatisticsFilterBarProps) {
  const { data: facilitiesData, isLoading: facilitiesLoading } = useFacilities({
    limit: 100,
  });

  const presets = mode === "trends" ? TRENDS_PRESETS : STANDARD_PRESETS;
  const granularityOptions =
    mode === "trends" ? TRENDS_GRANULARITY_OPTIONS : STANDARD_GRANULARITY_OPTIONS;

  const setPreset = (days: number) => {
    const range = getStatisticsDateRange(days);
    onFromDateChange(range.fromDate);
    onToDateChange(range.toDate);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Preset date buttons */}
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600">
          {presets.map((preset) => {
            const expected = getStatisticsDateRange(preset.days);
            const isActive = fromDate === expected.fromDate && toDate === expected.toDate;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPreset(preset.days)}
                className={`cursor-pointer rounded-md px-2.5 py-1.5 transition-all ${
                  isActive
                    ? "bg-white text-teal-700 shadow-2xs"
                    : "hover:bg-white hover:text-slate-900"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom date range */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={fromDate || ""}
              onChange={(e) => onFromDateChange(e.target.value || undefined)}
              className="border-none bg-transparent p-0 text-xs text-slate-800 outline-none"
              placeholder="Từ ngày"
            />
          </div>
          <span className="text-slate-400 font-medium">—</span>
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={toDate || ""}
              onChange={(e) => onToDateChange(e.target.value || undefined)}
              className="border-none bg-transparent p-0 text-xs text-slate-800 outline-none"
              placeholder="Đến ngày"
            />
          </div>
        </div>

        {/* Granularity selection */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">Chu kỳ:</span>
          <select
            value={granularity}
            onChange={(e) => onGranularityChange(e.target.value as StatisticsFilterGranularity)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-teal-500"
          >
            {granularityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Multi-facility selector for Business Ops & System Admin */}
        {showFacilityFilter && (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={facilityId || ""}
              onChange={(e) => onFacilityChange(e.target.value || undefined)}
              disabled={facilitiesLoading}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-teal-500 max-w-[220px]"
            >
              <option value="">Toàn hệ thống</option>
              {facilitiesData?.items?.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.city})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Action refresh */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isFetching}
        className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        <RefreshCw
          className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin text-teal-600" : ""}`}
        />
        Làm mới
      </Button>
    </div>
  );
}
