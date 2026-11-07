"use client";

import React from "react";
import { Building2, Calendar, RefreshCw } from "lucide-react";
import { StatisticsGranularityEnum } from "../types";
import { useFacilities } from "@/features/facility-management/hooks";
import { Button } from "@/components/ui/button";

interface StatisticsFilterBarProps {
  fromDate?: string;
  toDate?: string;
  granularity: StatisticsGranularityEnum;
  facilityId?: string;
  showFacilityFilter: boolean;
  isFetching?: boolean;
  onFromDateChange: (val?: string) => void;
  onToDateChange: (val?: string) => void;
  onGranularityChange: (val: StatisticsGranularityEnum) => void;
  onFacilityChange: (val?: string) => void;
  onRefresh: () => void;
}

export function StatisticsFilterBar({
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

  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    onFromDateChange(start.toISOString().split("T")[0]);
    onToDateChange(end.toISOString().split("T")[0]);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Preset date buttons */}
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setPreset(7)}
            className="cursor-pointer rounded-lg px-2.5 py-1.5 transition-all hover:bg-white hover:text-slate-900"
          >
            7 ngày
          </button>
          <button
            type="button"
            onClick={() => setPreset(30)}
            className="cursor-pointer rounded-lg px-2.5 py-1.5 transition-all hover:bg-white hover:text-slate-900"
          >
            30 ngày
          </button>
          <button
            type="button"
            onClick={() => setPreset(90)}
            className="cursor-pointer rounded-lg px-2.5 py-1.5 transition-all hover:bg-white hover:text-slate-900"
          >
            90 ngày
          </button>
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
            onChange={(e) => onGranularityChange(e.target.value as StatisticsGranularityEnum)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-teal-500"
          >
            <option value={StatisticsGranularityEnum.DAY}>Theo Ngày</option>
            <option value={StatisticsGranularityEnum.WEEK}>Theo Tuần</option>
            <option value={StatisticsGranularityEnum.MONTH}>Theo Tháng</option>
            <option value={StatisticsGranularityEnum.QUARTER}>Theo Quý</option>
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
