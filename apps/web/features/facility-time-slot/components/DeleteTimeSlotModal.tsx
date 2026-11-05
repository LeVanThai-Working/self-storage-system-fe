"use client";

import React from "react";
import { AlertTriangle, Clock, Loader2, X } from "lucide-react";
import type { FacilityTimeSlot } from "../types";

interface DeleteTimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  slot: FacilityTimeSlot | null;
  facilityName?: string;
  isLoading?: boolean;
}

export const DeleteTimeSlotModal: React.FC<DeleteTimeSlotModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  slot,
  facilityName,
  isLoading = false,
}) => {
  if (!isOpen || !slot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Xác nhận Xóa Khung giờ
              </h3>
              <p className="text-xs text-red-600 dark:text-red-400">
                Hành động này sẽ xóa khung giờ khỏi lịch cơ sở
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bạn có chắc chắn muốn xóa khung giờ tiếp đón này không?
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-base">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span>
                {slot.startTime} - {slot.endTime}
              </span>
              {slot.slotName && (
                <span className="text-xs font-normal text-slate-500">({slot.slotName})</span>
              )}
            </div>
            {facilityName && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Cơ sở:{" "}
                <strong className="text-slate-700 dark:text-slate-300">{facilityName}</strong>
              </div>
            )}
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Lượt tiếp nhận tối đa:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {slot.maxCapacity ?? slot.slotCapacity ?? 0} lượt
              </strong>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            * Lưu ý: Các lượt đặt chỗ hoặc cuộc hẹn đã đặt trước đó trong khung giờ này vẫn sẽ được
            lưu trữ trong nhật ký lịch sử.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 transition-all"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận Xóa
          </button>
        </div>
      </div>
    </div>
  );
};
