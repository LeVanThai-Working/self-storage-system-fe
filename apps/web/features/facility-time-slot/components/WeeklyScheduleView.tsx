"use client";

import React, { useMemo, useState } from "react";
import { Plus, Clock, Users, CalendarDays } from "lucide-react";
import type { FacilityTimeSlot, DayOfWeek } from "../types";
import { TimeSlotCard } from "./TimeSlotCard";

interface WeeklyScheduleViewProps {
  slots: FacilityTimeSlot[];
  onAddSlot: (day?: DayOfWeek) => void;
  onEditSlot: (slot: FacilityTimeSlot) => void;
  onDeleteSlot: (slot: FacilityTimeSlot) => void;
}

interface DayConfig {
  key: DayOfWeek;
  name: string;
  short: string;
  isWeekend?: boolean;
}

const WEEK_DAYS: DayConfig[] = [
  { key: "MONDAY", name: "Thứ Hai", short: "T2" },
  { key: "TUESDAY", name: "Thứ Ba", short: "T3" },
  { key: "WEDNESDAY", name: "Thứ Tư", short: "T4" },
  { key: "THURSDAY", name: "Thứ Năm", short: "T5" },
  { key: "FRIDAY", name: "Thứ Sáu", short: "T6" },
  { key: "SATURDAY", name: "Thứ Bảy", short: "T7", isWeekend: true },
  { key: "SUNDAY", name: "Chủ Nhật", short: "CN", isWeekend: true },
];

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  slots,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
}) => {
  const [activeDayFilter, setActiveDayFilter] = useState<string>("ALL");

  // Group slots by day of week.
  // Slots with no dayOfWeek or 'ALL' apply to all 7 days.
  const groupedSlots = useMemo(() => {
    const map: Record<DayOfWeek, FacilityTimeSlot[]> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
      ALL: [],
    };

    slots.forEach((slot) => {
      const slotDay = (slot.dayOfWeek?.toUpperCase() as DayOfWeek) || "ALL";

      if (slotDay === "ALL" || !slot.dayOfWeek) {
        // Appears across all days
        WEEK_DAYS.forEach((d) => map[d.key].push(slot));
      } else if (map[slotDay]) {
        map[slotDay].push(slot);
      }
    });

    // Sort each day's slots chronologically by startTime
    WEEK_DAYS.forEach((d) => {
      map[d.key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return map;
  }, [slots]);

  const displayedDays = useMemo(() => {
    if (activeDayFilter === "ALL") return WEEK_DAYS;
    return WEEK_DAYS.filter((d) => d.key === activeDayFilter);
  }, [activeDayFilter]);

  const isSingleDay = displayedDays.length === 1;

  return (
    <div className="space-y-4">
      {/* Day Selector Navigation Pills */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full">
          <button
            type="button"
            onClick={() => setActiveDayFilter("ALL")}
            className={`inline-flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeDayFilter === "ALL"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">Tất cả tuần (7 ngày)</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

          {WEEK_DAYS.map((d) => {
            const count = (groupedSlots[d.key] || []).filter((s) => s.isActive).length;
            const isSelected = activeDayFilter === d.key;

            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDayFilter(d.key)}
                className={`inline-flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="whitespace-nowrap">{d.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid View */}
      {isSingleDay ? (
        /* Single Day View (Spacious layout) */
        <div className="max-w-3xl mx-auto">
          {displayedDays.map((day) => {
            const daySlots = groupedSlots[day.key] || [];
            const activeSlots = daySlots.filter((s) => s.isActive);
            const totalCapacity = activeSlots.reduce(
              (acc, s) => acc + (s.maxCapacity ?? s.slotCapacity ?? 0),
              0
            );

            return (
              <div
                key={day.key}
                className={`rounded-2xl border ${
                  day.isWeekend
                    ? "border-amber-200/80 bg-amber-50/20 dark:border-amber-950/50 dark:bg-amber-950/10"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                } shadow-sm overflow-hidden`}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {day.name}
                    </span>
                    {day.isWeekend && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-800">
                        Cuối tuần
                      </span>
                    )}
                    <span className="text-xs text-slate-500 ml-2">
                      ({activeSlots.length} ca hoạt động · Tổng {totalCapacity} lượt khách)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddSlot(day.key)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm ca
                  </button>
                </div>

                {/* Slots */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {daySlots.length === 0 ? (
                    <div className="col-span-2 py-12 text-center text-slate-400">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      Chưa có khung giờ làm việc nào cho ngày này
                    </div>
                  ) : (
                    daySlots.map((slot) => (
                      <TimeSlotCard
                        key={`${day.key}-${slot.id}`}
                        slot={slot}
                        onEdit={onEditSlot}
                        onDelete={onDeleteSlot}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Full Week Board (with horizontal scroll and guaranteed column min-width) */
        <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          <div className="grid grid-cols-7 gap-3 min-w-[1360px]">
            {displayedDays.map((day) => {
              const daySlots = groupedSlots[day.key] || [];
              const activeSlots = daySlots.filter((s) => s.isActive);
              const totalCapacity = activeSlots.reduce(
                (acc, s) => acc + (s.maxCapacity ?? s.slotCapacity ?? 0),
                0
              );

              return (
                <div
                  key={day.key}
                  className={`flex flex-col rounded-2xl border transition-all min-w-[185px] ${
                    day.isWeekend
                      ? "border-amber-200/80 bg-amber-50/20 dark:border-amber-950/50 dark:bg-amber-950/10"
                      : "border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/40"
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`flex items-center justify-between px-3 py-2.5 border-b rounded-t-2xl gap-1.5 ${
                      day.isWeekend
                        ? "border-amber-200/80 bg-amber-100/40 text-amber-900 dark:border-amber-950/60 dark:bg-amber-950/30 dark:text-amber-200"
                        : "border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs tracking-tight whitespace-nowrap">
                          {day.name}
                        </span>
                        {day.isWeekend && (
                          <span className="shrink-0 whitespace-nowrap rounded px-1 py-0.2 text-[9px] font-semibold bg-amber-200/70 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                            Cuối tuần
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">
                        {activeSlots.length} ca hoạt động
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddSlot(day.key)}
                      title={`Thêm khung giờ cho ${day.name}`}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white transition-all shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Slots List for this day */}
                  <div className="p-2 flex-1 space-y-2 min-h-[180px]">
                    {daySlots.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <Clock className="h-5 w-5 text-slate-300 dark:text-slate-600 mb-1" />
                        <p className="text-[11px] text-slate-400 font-medium">Chưa có khung giờ</p>
                        <button
                          type="button"
                          onClick={() => onAddSlot(day.key)}
                          className="mt-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                          + Thêm ca
                        </button>
                      </div>
                    ) : (
                      daySlots.map((slot) => (
                        <TimeSlotCard
                          key={`${day.key}-${slot.id}`}
                          slot={slot}
                          compact
                          onEdit={onEditSlot}
                          onDelete={onDeleteSlot}
                        />
                      ))
                    )}
                  </div>

                  {/* Day Capacity Footer */}
                  {daySlots.length > 0 && (
                    <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 rounded-b-2xl text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                        <Users className="h-3 w-3 text-teal-600 shrink-0" />
                        Tổng:
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200 font-bold whitespace-nowrap">
                        {totalCapacity} lượt/ngày
                      </strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
