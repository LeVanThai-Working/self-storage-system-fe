"use client";

import React, { useMemo, useState } from "react";
import { Plus, Clock, Users } from "lucide-react";
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

  return (
    <div className="space-y-4">
      {/* Day quick switcher pills on mobile/tablet */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none sm:hidden">
        <button
          type="button"
          onClick={() => setActiveDayFilter("ALL")}
          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            activeDayFilter === "ALL"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          }`}
        >
          Tất cả tuần
        </button>
        {WEEK_DAYS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setActiveDayFilter(d.key)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeDayFilter === d.key
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            }`}
          >
            {d.short}
          </button>
        ))}
      </div>

      {/* 7-Column / Responsive Calendar Grid */}
      <div
        className={`grid gap-3.5 ${
          displayedDays.length === 1
            ? "grid-cols-1 max-w-xl mx-auto"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7"
        }`}
      >
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
              className={`flex flex-col rounded-2xl border transition-all ${
                day.isWeekend
                  ? "border-amber-200/80 bg-amber-50/20 dark:border-amber-950/50 dark:bg-amber-950/10"
                  : "border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/40"
              }`}
            >
              {/* Day Header */}
              <div
                className={`flex items-center justify-between px-3.5 py-3 border-b rounded-t-2xl ${
                  day.isWeekend
                    ? "border-amber-200/80 bg-amber-100/40 text-amber-900 dark:border-amber-950/60 dark:bg-amber-950/30 dark:text-amber-200"
                    : "border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight">{day.name}</span>
                    {day.isWeekend && (
                      <span className="rounded px-1.5 py-0.2 text-[10px] font-semibold bg-amber-200/70 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        Cuối tuần
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeSlots.length} ca hoạt động
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddSlot(day.key)}
                  title={`Thêm khung giờ cho ${day.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white transition-all shadow-2xs"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Slots List for this day */}
              <div className="p-3 flex-1 space-y-2.5 min-h-[180px]">
                {daySlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Clock className="h-6 w-6 text-slate-300 dark:text-slate-600 mb-1.5" />
                    <p className="text-xs text-slate-400 font-medium">Chưa có khung giờ</p>
                    <button
                      type="button"
                      onClick={() => onAddSlot(day.key)}
                      className="mt-2 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      + Thêm khung giờ
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
                <div className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 rounded-b-2xl text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-teal-600" />
                    Tổng công suất:
                  </span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">
                    {totalCapacity} lượt/ngày
                  </strong>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
