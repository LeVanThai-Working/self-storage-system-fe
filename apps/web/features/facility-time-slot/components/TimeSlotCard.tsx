"use client";

import React from "react";
import { Clock, Users, Edit3, Trash2, FileText } from "lucide-react";
import type { FacilityTimeSlot } from "../types";

interface TimeSlotCardProps {
  slot: FacilityTimeSlot;
  onEdit: (slot: FacilityTimeSlot) => void;
  onDelete: (slot: FacilityTimeSlot) => void;
  compact?: boolean;
}

export const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  slot,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const isCustomName =
    slot.slotName &&
    slot.slotName.trim().length > 0 &&
    slot.slotName.trim() !== `${slot.startTime} - ${slot.endTime}`;

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 ${
        slot.isActive
          ? "border-emerald-100 bg-white hover:border-emerald-300 hover:shadow-md dark:border-emerald-950/40 dark:bg-slate-900/90"
          : "border-slate-200 bg-slate-50/70 opacity-75 hover:opacity-100 dark:border-slate-800 dark:bg-slate-900/40"
      } ${compact ? "p-3" : "p-4"}`}
    >
      {/* Top Header: Time Badge & Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
          <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold tracking-tight">
            {slot.startTime} - {slot.endTime}
          </span>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${
            slot.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          }`}
        >
          {slot.isActive ? "Hoạt động" : "Tạm dừng"}
        </span>
      </div>

      {/* Custom Slot Name */}
      {isCustomName && (
        <div className="mt-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
          {slot.slotName}
        </div>
      )}

      {/* Capacity & Info */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 font-medium">
          <Users className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span>
            Tối đa:{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-bold">
              {slot.maxCapacity ?? slot.slotCapacity ?? 0}
            </strong>{" "}
            lượt
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(slot);
            }}
            title="Sửa khung giờ"
            className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(slot);
            }}
            title="Xóa khung giờ"
            className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notes footer */}
      {slot.notes && (
        <div className="mt-2 flex items-start gap-1 text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1">
          <FileText className="h-3 w-3 mt-0.5 text-slate-400 shrink-0" />
          <span className="truncate">{slot.notes}</span>
        </div>
      )}
    </div>
  );
};
