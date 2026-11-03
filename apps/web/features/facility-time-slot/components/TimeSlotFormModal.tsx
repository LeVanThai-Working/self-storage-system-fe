"use client";

import React, { useState } from "react";
import { X, Clock, Users, Calendar, AlertCircle, Loader2 } from "lucide-react";
import type {
  FacilityTimeSlot,
  CreateFacilityTimeSlotRequest,
  UpdateFacilityTimeSlotRequest,
  DayOfWeek,
} from "../types";

interface TimeSlotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateFacilityTimeSlotRequest | { id: string; payload: UpdateFacilityTimeSlotRequest }
  ) => Promise<void>;
  facilityId: string;
  facilityName?: string;
  initialSlot?: FacilityTimeSlot | null;
  initialDayOfWeek?: DayOfWeek;
  isLoading?: boolean;
}

const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: "ALL", label: "Tất cả các ngày (T2 - CN)", short: "Cả tuần" },
  { value: "MONDAY", label: "Thứ Hai", short: "T2" },
  { value: "TUESDAY", label: "Thứ Ba", short: "T3" },
  { value: "WEDNESDAY", label: "Thứ Tư", short: "T4" },
  { value: "THURSDAY", label: "Thứ Năm", short: "T5" },
  { value: "FRIDAY", label: "Thứ Sáu", short: "T6" },
  { value: "SATURDAY", label: "Thứ Bảy", short: "T7" },
  { value: "SUNDAY", label: "Chủ Nhật", short: "CN" },
];

interface InnerFormProps {
  initialSlot?: FacilityTimeSlot | null;
  initialDayOfWeek?: DayOfWeek;
  facilityId: string;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateFacilityTimeSlotRequest | { id: string; payload: UpdateFacilityTimeSlotRequest }
  ) => Promise<void>;
}

const TimeSlotFormContent: React.FC<InnerFormProps> = ({
  initialSlot,
  initialDayOfWeek = "ALL",
  facilityId,
  isLoading,
  onClose,
  onSubmit,
}) => {
  const isEdit = Boolean(initialSlot);

  const [startTime, setStartTime] = useState<string>(initialSlot?.startTime || "08:00");
  const [endTime, setEndTime] = useState<string>(initialSlot?.endTime || "10:00");
  const [slotName, setSlotName] = useState<string>(initialSlot?.slotName || "");
  const [maxCapacity, setMaxCapacity] = useState<number>(
    initialSlot?.maxCapacity ?? initialSlot?.slotCapacity ?? 5
  );
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(
    (initialSlot?.dayOfWeek as DayOfWeek) || initialDayOfWeek || "ALL"
  );
  const [isActive, setIsActive] = useState<boolean>(initialSlot?.isActive !== false);
  const [notes, setNotes] = useState<string>(initialSlot?.notes || "");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Compute validation error on the fly
  const isTimeInvalid = startTime && endTime && startTime >= endTime;
  const validationError = isTimeInvalid
    ? "Giờ bắt đầu phải luôn nhỏ hơn giờ kết thúc (startTime < endTime)."
    : submitError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startTime || !endTime) {
      setSubmitError("Vui lòng nhập đầy đủ giờ bắt đầu và giờ kết thúc.");
      return;
    }

    if (startTime >= endTime) {
      setSubmitError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
      return;
    }

    if (!maxCapacity || maxCapacity < 1) {
      setSubmitError("Số lượng tiếp nhận tối đa phải lớn hơn hoặc bằng 1.");
      return;
    }

    setSubmitError(null);
    const finalSlotName =
      slotName.trim().length > 0 ? slotName.trim() : `${startTime} - ${endTime}`;

    try {
      if (isEdit && initialSlot) {
        await onSubmit({
          id: initialSlot.id,
          payload: {
            slotName: finalSlotName,
            startTime,
            endTime,
            maxCapacity: Number(maxCapacity),
            slotCapacity: Number(maxCapacity),
            isActive,
            notes: notes.trim() || undefined,
            dayOfWeek,
          },
        });
      } else {
        await onSubmit({
          facilityId,
          slotName: finalSlotName,
          startTime,
          endTime,
          maxCapacity: Number(maxCapacity),
          slotCapacity: Number(maxCapacity),
          isActive,
          notes: notes.trim() || undefined,
          dayOfWeek,
        });
      }
      onClose();
    } catch {
      // Handled by react-query onError toast
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Validation Alert */}
      {validationError && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 animate-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Time pickers row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Giờ bắt đầu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setSubmitError(null);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Giờ kết thúc <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setSubmitError(null);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Slot Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Tên khung giờ / Ca tiếp đón (Tùy chọn)
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder={startTime && endTime ? `${startTime} - ${endTime}` : "Ví dụ: Ca sáng sớm"}
            value={slotName}
            onChange={(e) => setSlotName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Nếu để trống, hệ thống sẽ tự đặt tên theo khoảng thời gian ({startTime} - {endTime}).
        </p>
      </div>

      {/* Capacity & Day of Week */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Lượt tiếp nhận tối đa <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Users className="h-4 w-4" />
            </div>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Giới hạn số lượt khách book</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Ngày áp dụng
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="h-4 w-4" />
            </div>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Chu kỳ lặp hàng tuần</p>
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
        <div>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
            Trạng thái hoạt động
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Cho phép khách hàng đặt hẹn check-in/out trong khung giờ này
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Ghi chú nội bộ
        </label>
        <textarea
          rows={2}
          placeholder="Ví dụ: Giờ cao điểm, tăng cường 2 nhân viên trực quầy..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isLoading || Boolean(isTimeInvalid)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Lưu thay đổi" : "Tạo khung giờ"}
        </button>
      </div>
    </form>
  );
};

export const TimeSlotFormModal: React.FC<TimeSlotFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  facilityId,
  facilityName,
  initialSlot,
  initialDayOfWeek = "ALL",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {initialSlot ? "Cập nhật Khung giờ Tiếp đón" : "Thêm mới Khung giờ Làm việc"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {facilityName ? `Cơ sở: ${facilityName}` : "Thiết lập lịch check-in/out"}
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

        {/* Content with stable key */}
        <TimeSlotFormContent
          key={initialSlot ? initialSlot.id : `create-${initialDayOfWeek}`}
          initialSlot={initialSlot}
          initialDayOfWeek={initialDayOfWeek}
          facilityId={facilityId}
          isLoading={isLoading}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
};
