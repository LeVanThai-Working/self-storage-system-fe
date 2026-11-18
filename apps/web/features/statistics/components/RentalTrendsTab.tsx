"use client";

import React from "react";
import { Clock, Flame, Snowflake, CalendarDays, Zap } from "lucide-react";
import { formatCurrency } from "@self-storage-system-fe/shared";
import type { RentalTrendsResponse } from "../types";
import { formatRentalTrendPeriod } from "../utils/rentalTrends";
import { Skeleton } from "@/components/ui/skeleton";

interface RentalTrendsTabProps {
  data?: RentalTrendsResponse;
  isLoading: boolean;
}

const GRANULARITY_LABELS: Record<string, string> = {
  month: "tháng",
  quarter: "quý",
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

  const { period, timeSeries, peakAndLowAnalysis, dayOfWeekDistribution, timeSlotDemand } = data;

  const peakPeriod = peakAndLowAnalysis.peakPeriods[0];
  const lowPeriod = peakAndLowAnalysis.lowPeriods[0];

  const busiestDay = dayOfWeekDistribution.busiestDay;
  const maxDayReservations = Math.max(
    ...dayOfWeekDistribution.items.map((d) => d.reservationsCreated),
    0
  );

  const mostBookedTimeSlot = timeSlotDemand.mostBookedTimeSlot;
  const maxTimeSlotReservations = Math.max(
    ...timeSlotDemand.items.map((slot) => slot.reservationCount),
    0
  );

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
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {peakAndLowAnalysis.averageReservationsPerPeriod}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            đơn / {GRANULARITY_LABELS[period.granularity] ?? "kỳ"}
          </p>
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
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-900">
            {peakPeriod ? formatRentalTrendPeriod(peakPeriod.period) : "—"}
          </div>
          <p className="mt-1 text-xs text-amber-800">
            {peakPeriod
              ? `${peakPeriod.reservationsCreated} đơn đặt chỗ`
              : "Chưa có đơn đặt chỗ trong kỳ"}
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
          <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-900">
            {lowPeriod ? formatRentalTrendPeriod(lowPeriod.period) : "—"}
          </div>
          <p className="mt-1 text-xs text-blue-800">
            {lowPeriod
              ? `${lowPeriod.reservationsCreated} đơn đặt chỗ`
              : peakPeriod
                ? "Không có kỳ thấp điểm tách biệt"
                : "Chưa có đơn đặt chỗ trong kỳ"}
          </p>
        </div>
      </div>

      {/* 2. Time Series Breakdown */}
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
                <th className="py-3 px-3 text-right">Walk-in</th>
                <th className="py-3 px-3 text-right">Thực thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {timeSeries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không có dữ liệu trong khoảng thời gian đã chọn
                  </td>
                </tr>
              ) : (
                timeSeries.map((item) => {
                  const rowTone = item.isPeak
                    ? "bg-amber-50/30"
                    : item.isLow
                      ? "bg-blue-50/30"
                      : "";

                  return (
                    <tr
                      key={item.period}
                      className={`hover:bg-slate-50/70 transition-colors ${rowTone}`}
                    >
                      <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        {formatRentalTrendPeriod(item.period)}
                        {item.isPeak && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
                            Cao điểm
                          </span>
                        )}
                        {item.isLow && (
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
                      <td className="py-3 px-3 text-right text-indigo-600 font-semibold">
                        {item.walkInContracts}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {formatCurrency(item.collectedRevenue)}
                      </td>
                    </tr>
                  );
                })
              )}
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
            {busiestDay && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                Đông nhất: {busiestDay.dayName}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {dayOfWeekDistribution.items.map((day) => {
              const percent =
                maxDayReservations > 0
                  ? Math.round((day.reservationsCreated / maxDayReservations) * 100)
                  : 0;
              const isBusiest = busiestDay !== null && day.dayOfWeek === busiestDay.dayOfWeek;

              return (
                <div key={day.dayOfWeek} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{day.dayName}</span>
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
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              <h4 className="text-base font-extrabold text-slate-900">
                Khung giờ tiếp đón & Nhu cầu hẹn
              </h4>
            </div>
            {mostBookedTimeSlot && (
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                Đặt nhiều nhất: {mostBookedTimeSlot.timeSlot}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {timeSlotDemand.items.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Chưa có dữ liệu khung giờ tiếp đón
              </p>
            ) : (
              timeSlotDemand.items.map((slot) => {
                const percent =
                  maxTimeSlotReservations > 0
                    ? Math.round((slot.reservationCount / maxTimeSlotReservations) * 100)
                    : 0;
                const isMostBooked =
                  mostBookedTimeSlot !== null &&
                  slot.timeSlot === mostBookedTimeSlot.timeSlot &&
                  slot.reservationCount > 0;

                return (
                  <div key={slot.timeSlot} className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{slot.timeSlot}</span>
                      <span className="font-semibold text-slate-700">
                        {slot.reservationCount} đơn
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isMostBooked ? "bg-teal-600" : "bg-teal-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Duration Breakdown
      <div className="grid gap-6 lg:grid-cols-2">
        ...
      </div> */}
    </div>
  );
}
