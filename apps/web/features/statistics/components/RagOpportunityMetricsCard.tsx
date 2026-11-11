"use client";

import React from "react";
import { AlertTriangle, Wrench, TrendingUp, Sparkles } from "lucide-react";
import type { RagOpportunityMetrics } from "../types";

interface RagOpportunityMetricsCardProps {
  metrics: RagOpportunityMetrics;
}

const formatVND = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
};

export function RagOpportunityMetricsCard({ metrics }: RagOpportunityMetricsCardProps) {
  if (!metrics || metrics.totalOpportunityVnd <= 0) return null;

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white p-3.5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Cơ hội cải thiện dòng tiền
            </div>
            <div className="text-base font-black text-emerald-900 sm:text-lg">
              {formatVND(metrics.totalOpportunityVnd)}
            </div>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
          Tiềm năng tối ưu
        </span>
      </div>

      {/* 3 Pillars Breakdown */}
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {/* 1. Nợ quá hạn có thể thu hồi */}
        <div className="rounded-lg border border-amber-200/70 bg-amber-50/60 p-2 text-left">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Nợ quá hạn thu hồi</span>
          </div>
          <div className="mt-1 text-xs font-bold text-slate-900">
            {formatVND(metrics.recoverableOverdueVnd)}
          </div>
        </div>

        {/* 2. Thất thoát bảo trì */}
        <div className="rounded-lg border border-rose-200/70 bg-rose-50/60 p-2 text-left">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-800">
            <Wrench className="h-3.5 w-3.5 text-rose-600 shrink-0" />
            <span className="truncate">Thất thoát bảo trì</span>
          </div>
          <div className="mt-1 text-xs font-bold text-slate-900">
            {formatVND(metrics.maintenanceRevenueLossVnd)}
          </div>
        </div>

        {/* 3. Tiềm năng lấp đầy công suất */}
        <div className="rounded-lg border border-teal-200/70 bg-teal-50/60 p-2 text-left">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-800">
            <TrendingUp className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span className="truncate">Lấp đầy kho trống</span>
          </div>
          <div className="mt-1 text-xs font-bold text-slate-900">
            {formatVND(metrics.idleCapacityOpportunityVnd)}
          </div>
        </div>
      </div>
    </div>
  );
}
