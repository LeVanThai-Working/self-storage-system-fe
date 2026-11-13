"use client";

import { IconActionTooltip } from "@/components/ui/tooltip";

import React, { useState, useMemo } from "react";
import { Clock, Users, Search, Edit3, Trash2, CheckCircle2, XCircle } from "lucide-react";
import type { FacilityTimeSlot } from "../types";

interface TimeSlotListViewProps {
  slots: FacilityTimeSlot[];
  onEditSlot: (slot: FacilityTimeSlot) => void;
  onDeleteSlot: (slot: FacilityTimeSlot) => void;
}

export const TimeSlotListView: React.FC<TimeSlotListViewProps> = ({
  slots,
  onEditSlot,
  onDeleteSlot,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const filteredSlots = useMemo(() => {
    return slots
      .filter((slot) => {
        // Status filter
        if (statusFilter === "ACTIVE" && !slot.isActive) return false;
        if (statusFilter === "INACTIVE" && slot.isActive) return false;

        // Search filter
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          slot.slotName?.toLowerCase().includes(q) ||
          slot.startTime.includes(q) ||
          slot.endTime.includes(q) ||
          slot.notes?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo giờ (08:00), ca trực, ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-900 shadow-2xs transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "ALL"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Tất cả ({slots.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Đang hoạt động ({slots.filter((s) => s.isActive).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("INACTIVE")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "INACTIVE"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Tạm dừng ({slots.filter((s) => !s.isActive).length})
          </button>
        </div>
      </div>

      {/* Table with overflow container & min-width */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 font-semibold whitespace-nowrap">
                <th className="py-3 px-4 whitespace-nowrap">Khung thời gian</th>
                <th className="py-3 px-4 whitespace-nowrap">Tên ca / Mô tả</th>
                <th className="py-3 px-4 whitespace-nowrap">Lượt tiếp nhận tối đa</th>
                <th className="py-3 px-4 whitespace-nowrap">Trạng thái</th>
                <th className="py-3 px-4 whitespace-nowrap">Ghi chú</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredSlots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    Không tìm thấy khung giờ nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredSlots.map((slot) => (
                  <tr
                    key={slot.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-mono text-sm whitespace-nowrap">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {slot.slotName || `${slot.startTime} - ${slot.endTime}`}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800 font-semibold whitespace-nowrap">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">
                          {slot.maxCapacity ?? slot.slotCapacity ?? 0} lượt
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border whitespace-nowrap ${
                          slot.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        }`}
                      >
                        {slot.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                            Đang hoạt động
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-slate-400 shrink-0" />
                            Tạm dừng
                          </>
                        )}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4 text-slate-500 italic max-w-xs truncate"
                      title={slot.notes || undefined}
                    >
                      {slot.notes || "—"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconActionTooltip label="Sửa khung giờ">
                          <button
                            type="button"
                            onClick={() => onEditSlot(slot)}
                            className="rounded-lg p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 transition-colors"
                            title="Sửa khung giờ"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </IconActionTooltip>
                        <IconActionTooltip label="Xóa khung giờ">
                          <button
                            type="button"
                            onClick={() => onDeleteSlot(slot)}
                            className="rounded-lg p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                            title="Xóa khung giờ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </IconActionTooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
