"use client";

import React from "react";
import { Clock, Flame, Snowflake, CalendarDays, Zap } from "lucide-react";
import { formatCurrency } from "@self-storage-system-fe/shared";
import type { RentalTrendsResponse } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

interface RentalTrendsTabProps {
  data?: RentalTrendsResponse;
  isLoading: boolean;
}

const GRANULARITY_LABELS: Record<string, string> = {
  day: "ngày",
  week: "tuần",
  month: "tháng",
  quarter: "quý",
};

const BILLING_UNIT_LABELS: Record<string, string> = {
  day: "Theo ngày",
  month: "Theo tháng",
  one_time: "Một lần",
};

export function RentalTrendsTab({ data, isLoading }: RentalTrendsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    timeSeries,
    peakAndLowAnalysis,
    dayOfWeekDistribution,
    timeSlotDemand,
    durationBreakdown,
  } = data;

  const maxSeriesRevenue = Math.max(...timeSeries.map((t) => t.collectedRevenue), 1);

  return (
    <div className="space-y-6">
      {/* 1. Peak & Low Analysis Highlights */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nhu cầu trung bình
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">
            {peakAndLowAnalysis.averageReservationsPerPeriod}
          </div>
          <p className="mt-1 text-xs text-slate-500">Số đơn đặt chỗ trung bình mỗi mốc thời gian</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Giai đoạn cao điểm
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black text-amber-900">
            {peakAndLowAnalysis.peakPeriods.length}
          </div>
          <p className="mt-1 text-xs text-amber-800">
            {peakAndLowAnalysis.peakPeriods.length > 0
              ? `Kỳ cao nhất: ${peakAndLowAnalysis.peakPeriods[0]?.period} (${peakAndLowAnalysis.peakPeriods[0]?.reservationsCreated} đơn)`
              : "Không có giai đoạn vượt 125% mức trung bình"}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Giai đoạn thấp điểm
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Snowflake className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black text-blue-900">
            {peakAndLowAnalysis.lowPeriods.length}
          </div>
          <p className="mt-1 text-xs text-blue-800">
            {peakAndLowAnalysis.lowPeriods.length > 0
              ? `Kỳ thấp nhất: ${peakAndLowAnalysis.lowPeriods[0]?.period} (${peakAndLowAnalysis.lowPeriods[0]?.reservationsCreated} đơn)`
              : "Không có giai đoạn dưới 75% mức trung bình"}
          </p>
        </div>
      </div>

      {/* 2. Time Series Chart & Breakdown */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-extrabold text-slate-900">
              Diễn biến đặt chỗ & Thu tiền theo thời gian
            </h4>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Kỳ</th>
                <th className="py-3 px-3 text-right">Đơn đặt</th>
                <th className="py-3 px-3 text-right">Hoàn tất</th>
                <th className="py-3 px-3 text-right">Hủy</th>
                <th className="py-3 px-3 text-right">Check-in</th>
                <th className="py-3 px-3 text-right">Thực thu</th>
                <th className="py-3 px-3 text-right">Chênh lệch TB</th>
                <th className="py-3 px-3 w-40">Tỷ trọng thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {timeSeries.map((item, idx) => {
                const isPeak = peakAndLowAnalysis.peakPeriods.some((p) => p.period === item.period);
                const isLow = peakAndLowAnalysis.lowPeriods.some((p) => p.period === item.period);
                const barPercent = Math.round((item.collectedRevenue / maxSeriesRevenue) * 100);

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isPeak ? "bg-amber-50/30" : isLow ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      {item.period}
                      {isPeak && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
                          Cao điểm
                        </span>
                      )}
                      {isLow && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-800">
                          Thấp điểm
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {item.reservationsCreated}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 font-semibold">
                      {item.completedReservations}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-500 font-semibold">
                      {item.cancelledReservations}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-600 font-semibold">
                      {item.contractsCheckedIn}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {formatCurrency(item.collectedRevenue)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold ${
                        item.varianceFromAvgPercent >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {item.varianceFromAvgPercent > 0 ? "+" : ""}
                      {item.varianceFromAvgPercent}%
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal-500"
                          style={{ width: `${barPercent}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Day of Week & Time Slot Demand */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Day of Week */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              <h4 className="text-base font-extrabold text-slate-900">
                Phân bố theo ngày trong tuần
              </h4>
            </div>
            {dayOfWeekDistribution.busiestDay && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                Đông nhất: {dayOfWeekDistribution.busiestDay.dayName}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {dayOfWeekDistribution.items.map((day) => {
              const maxActivity = Math.max(
                ...dayOfWeekDistribution.items.map((d) => d.totalActivity),
                1
              );
              const percent = Math.round((day.totalActivity / maxActivity) * 100);
              const isBusiest = day.dayOfWeek === dayOfWeekDistribution.busiestDay?.dayOfWeek;
              const isQuietest = day.dayOfWeek === dayOfWeekDistribution.quietestDay?.dayOfWeek;

              return (
                <div key={day.dayOfWeek} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      {day.dayName}
                      {isBusiest && (
                        <span className="text-[10px] text-amber-600 font-extrabold">
                          ★ Đông nhất
                        </span>
                      )}
                      {isQuietest && (
                        <span className="text-[10px] text-slate-400">(Vắng nhất)</span>
                      )}
                    </span>
                    <span className="font-bold text-slate-900">{day.reservationsCreated} đơn</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isBusiest ? "bg-amber-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              <h4 className="text-base font-extrabold text-slate-900">
                Khung giờ tiếp đón & Nhu cầu hẹn
              </h4>
            </div>
            <span className="text-xs text-slate-400">Tỷ trọng</span>
          </div>

          <div className="mt-4 space-y-3">
            {timeSlotDemand.slice(0, 6).map((slot, idx) => (
              <div key={idx} className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{slot.timeSlot}</span>
                  <span className="font-semibold text-slate-600">
                    {slot.reservationCount} đơn —{" "}
                    <strong className="text-teal-700">{slot.demandSharePercent}%</strong>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${Math.min(slot.demandSharePercent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Duration Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-4">
            Cơ cấu theo đơn vị tính phí
          </h4>
          <div className="space-y-3">
            {durationBreakdown.byBillingUnit.map((bu, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs"
              >
                <div>
                  <div className="font-bold uppercase text-slate-900">
                    {BILLING_UNIT_LABELS[bu.billingUnit.toLowerCase()] ?? bu.billingUnit}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {bu.reservationCount} lượt đặt ({bu.sharePercent}%)
                  </div>
                </div>
                <div className="text-right font-black text-slate-900">
                  {formatCurrency(bu.totalDepositAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-4">
            Phân bổ kỳ hạn thuê
          </h4>
          <div className="space-y-3">
            {durationBreakdown.byDurationBucket.map((bucket, idx) => (
              <div key={idx} className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{bucket.label}</span>
                  <span className="font-bold text-slate-900">
                    {bucket.reservationCount} đơn ({bucket.sharePercent}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${bucket.sharePercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
