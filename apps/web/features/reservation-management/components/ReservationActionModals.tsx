"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Flame,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import {
  CloudinaryFolderEnum,
  IncidentCategoryEnum,
  RoleEnum,
  UserStatusEnum,
} from "@self-storage-system-fe/shared";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useAuthStore } from "@/features/auth/store";
import { useFacilityStaffs } from "@/features/contract-management/hooks";
import {
  useAssignReservationStaff,
  useAvailableStorageUnitsForAssignment,
  useCancelReservation,
  useConfirmManualPayment,
  useConfirmRefund,
  useConfirmReservation,
  useCreateOrGetReservationDepositPayment,
  useExtendGracePeriod,
  useForceCancelReservation,
  useMarkCustomerArrived,
  useReassignStorageUnit,
} from "../hooks";
import {
  MESSAGE_CODE,
  PaymentMethodEnum,
  PaymentStatusEnum,
  ReservationStatusEnum,
  assignReservationStaffSchema,
  cancelReservationSchema,
  confirmManualPaymentSchema,
  confirmRefundSchema,
  confirmReservationSchema,
  extendGracePeriodSchema,
  forceCancelReservationSchema,
  reassignStorageUnitSchema,
  type PaymentResponse,
  type ReservationResponse,
} from "../types";
import { formatDateOnly, formatDateTime, formatVnd, isCheckInDatePassed } from "../utils";

/* ============================================================================
 * 1. ConfirmReservationModal (POST /reservations/{id}/confirm)
 * ========================================================================== */
interface ConfirmReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const ConfirmReservationModal: React.FC<ConfirmReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const t = useTranslations("facilityManager.reservations.confirmModal");
  const tErrors = useTranslations("facilityManager.reservations.errors");
  const locale = useLocale() === "en" ? "en" : "vi";
  const getErrorMessage = useApiErrorMessage();
  const confirmMutation = useConfirmReservation();
  const currentUser = useAuthStore((s) => s.currentUser);
  const isManager = currentUser?.role === RoleEnum.FACILITY_MANAGER;

  const staffsQuery = useFacilityStaffs(
    { status: UserStatusEnum.ACTIVE, limit: 100 },
    isOpen && Boolean(reservation) && isManager
  );
  const staffList = useMemo(() => staffsQuery.data?.items ?? [], [staffsQuery.data?.items]);

  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [prevResId, setPrevResId] = useState(reservation?.id);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (reservation?.id !== prevResId || isOpen !== prevIsOpen) {
    setPrevResId(reservation?.id);
    setPrevIsOpen(isOpen);
    if (isOpen && reservation) {
      const fallbackStaffId = isManager ? staffList[0]?.id || "" : currentUser?.id || "";
      setAssignedStaffId(reservation.assignedStaffId || fallbackStaffId);
      setNotes(reservation.notes || "");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }

  if (!reservation) return null;

  const isCheckInPassed = isCheckInDatePassed(reservation.checkInDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isCheckInPassed) {
      setErrorMsg(t("checkInPassedError"));
      return;
    }

    const parsed = confirmReservationSchema.safeParse({
      assignedStaffId: assignedStaffId.trim(),
      notes: notes.trim() ? notes.trim() : undefined,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.assignedStaffId) {
        setErrorMsg(t("assignedStaffRequired"));
      } else {
        setErrorMsg(t("validationError"));
      }
      return;
    }

    try {
      await confirmMutation.mutateAsync({
        id: reservation.id,
        payload: parsed.data,
      });
      setSuccessMsg(t("success"));
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setErrorMsg(
        getErrorMessage(err, {
          [MESSAGE_CODE.MESSAGE_CODE_301]: tErrors("statusChanged"),
          [MESSAGE_CODE.MESSAGE_CODE_319]: t("checkInPassedError"),
        })
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !confirmMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {t("title")} • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{t("customerLabel")}:</span>
              <span className="text-slate-900 font-semibold">
                {reservation.customer?.name ?? "—"} ({reservation.customer?.phoneNumber || "—"})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{t("assignedUnitLabel")}:</span>
              <span className="font-mono font-bold text-emerald-700">
                {reservation.storageUnit?.unitNumber
                  ? `#${reservation.storageUnit.unitNumber}`
                  : "Chưa phân bổ"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{t("paidDepositLabel")}:</span>
              <span className="font-bold text-emerald-700">
                {formatVnd(reservation.depositAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{t("startDateLabel")}:</span>
              <span className="text-slate-700 font-medium">
                {formatDateOnly(reservation.startDate, locale)}
              </span>
            </div>
          </div>

          {isManager ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("assignedStaffLabel")}
              </label>
              <select
                value={assignedStaffId}
                onChange={(e) => {
                  setAssignedStaffId(e.target.value);
                  setErrorMsg(null);
                }}
                disabled={staffsQuery.isLoading}
                className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              >
                <option value="">{t("assignedStaffPlaceholder")}</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.email} • {st.phoneNumber || "N/A"})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">{t("assignedStaffLabel")}</span>
              <span className="text-xs font-extrabold text-emerald-700">
                {currentUser?.name || "Tôi (Staff)"}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t("notesLabel")}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={t("notesPlaceholder")}
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={confirmMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={confirmMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {confirmMutation.isPending ? t("submitting") : t("confirmBtn")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 2. MarkCustomerArrivedModal (POST /reservations/{id}/mark-arrived)
 * ========================================================================== */
interface MarkCustomerArrivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const MarkCustomerArrivedModal: React.FC<MarkCustomerArrivedModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const markArrivedMutation = useMarkCustomerArrived();
  const getErrorMessage = useApiErrorMessage();
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await markArrivedMutation.mutateAsync({
        id: reservation.id,
        payload: { notes: notes.trim() || undefined },
      });
      setSuccessMsg("Ghi nhận khách đã đến thành công!");
      setTimeout(onClose, 800);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !markArrivedMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-md p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-teal-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                Ghi nhận khách đã đến • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Xác nhận khách hàng đã có mặt tại cơ sở để làm thủ tục check-in
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              Cơ chế miễn nhiễm No-show:
            </p>
            <p>
              Sau khi bấm ghi nhận, đơn đặt chỗ sẽ{" "}
              <strong>không bao giờ bị hệ thống tự động hủy No-show</strong>, giúp khách và nhân
              viên an tâm làm thủ tục bàn giao.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Ghi chú tiếp đón (không bắt buộc)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Khách đã đến mang theo 4 kiện hàng, xe đỗ tại cổng B..."
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={markArrivedMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={markArrivedMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm disabled:opacity-50"
            >
              {markArrivedMutation.isPending ? "Đang ghi nhận..." : "Xác nhận Khách đã đến"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 3. ExtendGracePeriodModal (POST /reservations/{id}/extend-grace)
 * ========================================================================== */
interface ExtendGracePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const ExtendGracePeriodModal: React.FC<ExtendGracePeriodModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const extendMutation = useExtendGracePeriod();
  const getErrorMessage = useApiErrorMessage();
  const [extensionHours, setExtensionHours] = useState<number>(24);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = extendGracePeriodSchema.safeParse({
      extensionHours: Number(extensionHours),
      reason: reason.trim(),
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || "Thông tin không hợp lệ");
      return;
    }

    try {
      await extendMutation.mutateAsync({
        id: reservation.id,
        payload: parsed.data,
      });
      setSuccessMsg("Gia hạn thời gian ân hạn thành công!");
      setTimeout(onClose, 800);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !extendMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-md p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                Gia hạn ân hạn nhận kho • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Cho phép Quản lý gia hạn giữ chỗ thêm từ 1 đến 72 giờ
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Số giờ gia hạn thêm (1 – 72 giờ) *
            </label>
            <input
              type="number"
              min={1}
              max={72}
              value={extensionHours}
              onChange={(e) => setExtensionHours(Number(e.target.value))}
              className="w-full bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Lý do giải trình (tối thiểu 5 ký tự) *
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Khách hàng gọi điện thông báo chuyến bay bị trễ, xin đến nhận kho sáng mai..."
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={extendMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={extendMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm disabled:opacity-50"
            >
              {extendMutation.isPending ? "Đang lưu..." : "Xác nhận gia hạn"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 4. ReassignStorageUnitModal (POST /reservations/{id}/reassign-unit)
 * ========================================================================== */
interface ReassignStorageUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const ReassignStorageUnitModal: React.FC<ReassignStorageUnitModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const reassignMutation = useReassignStorageUnit();
  const getErrorMessage = useApiErrorMessage();

  const availableUnitsQuery = useAvailableStorageUnitsForAssignment(
    reservation?.facilityId,
    undefined,
    isOpen && Boolean(reservation)
  );
  const units = useMemo(() => availableUnitsQuery.data ?? [], [availableUnitsQuery.data]);

  const [newStorageUnitId, setNewStorageUnitId] = useState("");
  const [reason, setReason] = useState("");
  const [oldUnitStatus, setOldUnitStatus] = useState<"under_maintenance" | "available">(
    "under_maintenance"
  );
  const [customerAgreed, setCustomerAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setNewStorageUnitId("");
      setReason("");
      setOldUnitStatus("under_maintenance");
      setCustomerAgreed(false);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = reassignStorageUnitSchema.safeParse({
      newStorageUnitId,
      reason: reason.trim(),
      oldUnitStatus,
      customerAgreed,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || "Thông tin đổi kho không hợp lệ");
      return;
    }

    try {
      await reassignMutation.mutateAsync({
        id: reservation.id,
        payload: parsed.data,
      });
      setSuccessMsg(
        customerAgreed
          ? "Đã đổi kho và áp dụng thành công!"
          : "Đã gửi đề xuất đổi kho 2 bước cho khách hàng duyệt!"
      );
      setTimeout(onClose, 1000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !reassignMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                Đổi phòng kho sự cố • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Chuyển sang kho cùng cơ sở có đơn giá bằng hoặc cao hơn
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Chọn phòng kho thay thế đang trống *
            </label>
            <select
              value={newStorageUnitId}
              onChange={(e) => {
                setNewStorageUnitId(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              <option value="">Chọn phòng kho trống...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  #{u.unitNumber} • Tầng {u.floor} {u.zone ? `(Khu ${u.zone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Lý do đổi kho (3 - 500 ký tự) *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Phòng kho cũ bị thấm dột sau mưa lớn, cần đổi sang phòng kho khô ráo tương đương..."
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Trạng thái kho cũ
              </label>
              <select
                value={oldUnitStatus}
                onChange={(e) =>
                  setOldUnitStatus(e.target.value as "under_maintenance" | "available")
                }
                className="w-full bg-slate-50 focus:bg-white text-xs font-medium text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none"
              >
                <option value="under_maintenance">Đưa vào Bảo trì</option>
                <option value="available">Trả về Còn trống</option>
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={customerAgreed}
                  onChange={(e) => setCustomerAgreed(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 size-4"
                />
                Khách đã đồng ý trước
              </label>
            </div>
          </div>

          {!customerAgreed && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 p-2.5 rounded-xl">
              Nếu khách chưa đồng ý trực tiếp, hệ thống sẽ gửi đề xuất vào App của khách hàng để
              khách duyệt (hoặc từ chối hủy đơn hoàn 100% cọc).
            </p>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={reassignMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={reassignMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm disabled:opacity-50"
            >
              {reassignMutation.isPending ? "Đang gửi..." : "Xác nhận đổi kho"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 5. ForceCancelReservationModal (POST /reservations/{id}/force-cancel)
 * ========================================================================== */
interface ForceCancelReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const ForceCancelReservationModal: React.FC<ForceCancelReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const forceCancelMutation = useForceCancelReservation();
  const getErrorMessage = useApiErrorMessage();

  const [reason, setReason] = useState("");
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentCategory, setIncidentCategory] = useState<IncidentCategoryEnum>(
    IncidentCategoryEnum.FACILITY_DAMAGE
  );
  const [incidentDesc, setIncidentDesc] = useState("");
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [refundAccountHolder, setRefundAccountHolder] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      reason: reason.trim(),
      incidentDetails: {
        title: incidentTitle.trim(),
        category: incidentCategory,
        description: incidentDesc.trim() || undefined,
        images: evidenceImages,
      },
      refundBankName: refundBankName.trim() || undefined,
      refundAccountNumber: refundAccountNumber.trim() || undefined,
      refundAccountHolder: refundAccountHolder.trim() || undefined,
    };

    const parsed = forceCancelReservationSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || "Thông tin hủy khẩn cấp không hợp lệ");
      return;
    }

    try {
      await forceCancelMutation.mutateAsync({
        id: reservation.id,
        payload: parsed.data,
      });
      setSuccessMsg("Đã hủy khẩn cấp và kích hoạt hoàn 100% cọc!");
      setTimeout(onClose, 1000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !forceCancelMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-rose-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                Hủy khẩn cấp do sự cố • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Áp dụng khi cơ sở / phòng kho bị thiên tai, sự cố hư hỏng (Hoàn 100% cọc)
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Lý do hủy khẩn cấp (tối thiểu 10 ký tự) *
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Phòng kho gặp sự cố ngập lụt cục bộ, không thể bàn giao cho khách thuê..."
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none resize-none"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-3">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Biên bản sự cố bắt buộc
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tiêu đề sự cố *
              </label>
              <input
                type="text"
                value={incidentTitle}
                onChange={(e) => setIncidentTitle(e.target.value)}
                placeholder="VD: Sự cố ngập lụt tầng trệt do mưa bão"
                className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Phân loại sự cố *
                </label>
                <select
                  value={incidentCategory}
                  onChange={(e) => setIncidentCategory(e.target.value as IncidentCategoryEnum)}
                  className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
                >
                  <option value={IncidentCategoryEnum.FACILITY_DAMAGE}>
                    Hư hỏng cơ sở vật chất
                  </option>
                  <option value={IncidentCategoryEnum.FIRE_WATER}>Ngập lụt / Cháy nổ</option>
                  <option value={IncidentCategoryEnum.EQUIPMENT_FAILURE}>Lỗi trang thiết bị</option>
                  <option value={IncidentCategoryEnum.NATURAL_DISASTER}>Thiên tai / Bão lũ</option>
                  <option value={IncidentCategoryEnum.OTHER}>Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Mô tả vắn tắt
                </label>
                <input
                  type="text"
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Mô tả thêm..."
                  className="w-full bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Ảnh hiện trường sự cố (Tối thiểu 1 ảnh) *
              </label>
              <CloudinaryUploader
                value={evidenceImages}
                onChange={(urls: string[]) => setEvidenceImages(urls)}
                folder={CloudinaryFolderEnum.GENERAL}
                maxFiles={3}
                multiple={true}
              />
              {evidenceImages.length > 0 && (
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  Đã đính kèm {evidenceImages.length} ảnh bằng chứng
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-2">
            <p className="text-xs font-bold text-slate-900">
              Thông tin nhận hoàn tiền 100% cọc ({formatVnd(reservation.depositAmount)})
            </p>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Ngân hàng (VD: MBBank)"
                value={refundBankName}
                onChange={(e) => setRefundBankName(e.target.value)}
                className="bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
              <input
                type="text"
                placeholder="Số tài khoản"
                value={refundAccountNumber}
                onChange={(e) => setRefundAccountNumber(e.target.value)}
                className="bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
              <input
                type="text"
                placeholder="Tên chủ tài khoản"
                value={refundAccountHolder}
                onChange={(e) => setRefundAccountHolder(e.target.value)}
                className="bg-white text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={forceCancelMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={forceCancelMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-50"
            >
              {forceCancelMutation.isPending ? "Đang xử lý..." : "Xác nhận hủy khẩn cấp"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 6. ConfirmRefundModal (POST /reservations/{id}/confirm-refund)
 * ========================================================================== */
interface ConfirmRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const ConfirmRefundModal: React.FC<ConfirmRefundModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const confirmRefundMutation = useConfirmRefund();
  const getErrorMessage = useApiErrorMessage();
  const [referenceCode, setReferenceCode] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = confirmRefundSchema.safeParse({
      referenceCode: referenceCode.trim() || null,
      notes: notes.trim() || null,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || "Thông tin không hợp lệ");
      return;
    }

    try {
      await confirmRefundMutation.mutateAsync({
        id: reservation.id,
        payload: parsed.data,
      });
      setSuccessMsg("Xác nhận hoàn cọc thành công!");
      setTimeout(onClose, 800);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !confirmRefundMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-md p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                Xác nhận hoàn tiền cọc • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Maker-Checker: Quản lý xác nhận đã chuyển trả tiền cọc cho khách hàng
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 text-xs text-slate-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-slate-800">Số tiền hoàn:</span>
              <span className="font-extrabold text-emerald-700 text-sm">
                {formatVnd(reservation.refundAmount || reservation.depositAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-800">Khách hàng:</span>
              <span>{reservation.customer?.name}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mã giao dịch ngân hàng / Ủy nhiệm chi
            </label>
            <input
              type="text"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              placeholder="VD: FT26085123456"
              className="w-full bg-slate-50 focus:bg-white text-xs font-mono text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Ghi chú hoàn tiền
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú xác nhận hoàn tiền..."
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={confirmRefundMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={confirmRefundMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {confirmRefundMutation.isPending ? "Đang xử lý..." : "Xác nhận đã giải ngân"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 7. AssignReservationStaffModal (POST /reservations/{id}/assign-staff)
 * ========================================================================== */
interface AssignReservationStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const AssignReservationStaffModal: React.FC<AssignReservationStaffModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const t = useTranslations("facilityManager.reservations.assignStaffModal");
  const getErrorMessage = useApiErrorMessage();
  const assignMutation = useAssignReservationStaff();

  const staffsQuery = useFacilityStaffs(
    { status: UserStatusEnum.ACTIVE, limit: 100 },
    isOpen && Boolean(reservation)
  );
  const staffList = useMemo(() => staffsQuery.data?.items ?? [], [staffsQuery.data?.items]);

  const [staffId, setStaffId] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [prevId, setPrevId] = useState(reservation?.id);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (reservation?.id !== prevId || isOpen !== prevIsOpen) {
    setPrevId(reservation?.id);
    setPrevIsOpen(isOpen);
    if (isOpen && reservation) {
      setStaffId(reservation.assignedStaffId || "");
      setNotes("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = assignReservationStaffSchema.safeParse({
      staffId: staffId.trim(),
      notes: notes.trim() ? notes.trim() : undefined,
    });
    if (!parsed.success) {
      setErrorMsg(t("validationStaffRequired"));
      return;
    }

    try {
      await assignMutation.mutateAsync({
        id: reservation.id,
        payload: parsed.data,
      });
      setSuccessMsg(t("success"));
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !assignMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {t("title")} • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t("newStaffLabel")}
            </label>
            <select
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setErrorMsg(null);
              }}
              disabled={staffsQuery.isLoading}
              className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 outline-none"
            >
              <option value="">{t("newStaffPlaceholder")}</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.email} • {st.phoneNumber || "N/A"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t("notesLabel")}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={assignMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm disabled:opacity-50"
            >
              {assignMutation.isPending ? t("submitting") : t("confirmBtn")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 8. CancelReservationModal (POST /reservations/{id}/cancel)
 * ========================================================================== */
interface CancelReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const CancelReservationModal: React.FC<CancelReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const t = useTranslations("facilityManager.reservations.cancelModal");
  const getErrorMessage = useApiErrorMessage();
  const cancelMutation = useCancelReservation();

  const [cancellationReason, setCancellationReason] = useState("");
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [refundAccountHolder, setRefundAccountHolder] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCancellationReason("");
      setRefundBankName("");
      setRefundAccountNumber("");
      setRefundAccountHolder("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }

  if (!reservation) return null;

  const isDepositPaid =
    reservation.status === ReservationStatusEnum.PAYMENT_SUCCESSFUL ||
    reservation.status === ReservationStatusEnum.CONFIRMED ||
    reservation.status === ReservationStatusEnum.OVERDUE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = cancelReservationSchema.safeParse({
      cancellationReason: cancellationReason.trim(),
      refundBankName: refundBankName.trim() || undefined,
      refundAccountNumber: refundAccountNumber.trim() || undefined,
      refundAccountHolder: refundAccountHolder.trim() || undefined,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || t("validationReason"));
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: reservation.id,
        payload: parsed.data,
      });
      setSuccessMsg(t("success"));
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !cancelMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {t("title")} • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-800 space-y-1.5">
            <p className="font-bold text-amber-900">{t("impactTitle")}</p>
            <p>
              •{" "}
              {t("releaseUnitNotice", {
                unitNumber: reservation.storageUnit?.unitNumber ?? "đã chọn",
              })}
            </p>
            {isDepositPaid && (
              <p className="font-semibold text-rose-700">
                • Chính sách phạt cọc 2 bậc: Nếu hủy trước giờ hẹn $\ge 24h$ sẽ được hoàn 100% tiền
                cọc; hủy sát giờ &lt; 24h hoặc đang quá hạn (OVERDUE) sẽ mất 100% tiền cọc.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t("reasonLabel")} *
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none resize-none"
            />
          </div>

          {isDepositPaid && (
            <div className="rounded-2xl border border-slate-200 p-3 bg-slate-50 space-y-2">
              <p className="text-xs font-bold text-slate-800">
                Tài khoản ngân hàng nhận hoàn cọc (nếu đủ điều kiện $\ge 24h$)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Tên ngân hàng"
                  value={refundBankName}
                  onChange={(e) => setRefundBankName(e.target.value)}
                  className="bg-white text-xs px-2.5 py-2 rounded-xl border border-slate-200 outline-none"
                />
                <input
                  type="text"
                  placeholder="Số tài khoản"
                  value={refundAccountNumber}
                  onChange={(e) => setRefundAccountNumber(e.target.value)}
                  className="bg-white text-xs px-2.5 py-2 rounded-xl border border-slate-200 outline-none"
                />
                <input
                  type="text"
                  placeholder="Chủ tài khoản"
                  value={refundAccountHolder}
                  onChange={(e) => setRefundAccountHolder(e.target.value)}
                  className="bg-white text-xs px-2.5 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={cancelMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t("back")}
            </button>
            <button
              type="submit"
              disabled={cancelMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-50"
            >
              {cancelMutation.isPending ? t("submitting") : t("confirmBtn")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 9. ManualPaymentConfirmModal (POST /payments/{id}/confirm-manual)
 * ========================================================================== */
interface ManualPaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
}

export const ManualPaymentConfirmModal: React.FC<ManualPaymentConfirmModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const t = useTranslations("facilityManager.reservations.manualPaymentModal");
  const getErrorMessage = useApiErrorMessage();
  const getDepositPaymentMutation = useCreateOrGetReservationDepositPayment();
  const confirmManualMutation = useConfirmManualPayment();

  const [paymentSession, setPaymentSession] = useState<PaymentResponse | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [method, setMethod] = useState<PaymentMethodEnum>(PaymentMethodEnum.CASH);
  const [referenceCode, setReferenceCode] = useState("");
  const [note, setNote] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [prevResId, setPrevResId] = useState<string | null>(null);
  const currentKey = isOpen && reservation ? reservation.id : null;
  if (currentKey !== prevResId) {
    setPrevResId(currentKey);
    if (currentKey) {
      setIsLoadingSession(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setReferenceCode("");
      setNote("");
      setProofImageUrl("");
      setMethod(PaymentMethodEnum.CASH);
    } else {
      setPaymentSession(null);
    }
  }

  useEffect(() => {
    let active = true;
    if (isOpen && reservation) {
      getDepositPaymentMutation
        .mutateAsync(reservation.id)
        .then((res) => {
          if (active) {
            setPaymentSession(res);
            setIsLoadingSession(false);
          }
        })
        .catch((err) => {
          if (active) {
            setIsLoadingSession(false);
            setErrorMsg(getErrorMessage(err));
          }
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen, reservation?.id, getDepositPaymentMutation, getErrorMessage]);

  if (!reservation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!paymentSession?.id) {
      setErrorMsg(t("noPaymentSessionError"));
      return;
    }

    if (!proofImageUrl) {
      setErrorMsg("Bắt buộc đính kèm ảnh chụp biên lai giấy / ủy nhiệm chi (MESSAGE_CODE_509).");
      return;
    }

    const parsed = confirmManualPaymentSchema.safeParse({
      method:
        method === PaymentMethodEnum.BANK_TRANSFER
          ? PaymentMethodEnum.BANK_TRANSFER
          : PaymentMethodEnum.CASH,
      referenceCode: referenceCode.trim() ? referenceCode.trim() : undefined,
      note: note.trim(),
      proofImageUrl,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || t("validationNoteRequired"));
      return;
    }

    try {
      await confirmManualMutation.mutateAsync({
        paymentId: paymentSession.id,
        payload: parsed.data,
      });
      setSuccessMsg(t("success"));
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !confirmManualMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-xl p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-amber-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {t("title")} • {reservation.reservationCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {isLoadingSession ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400">
              <span className="animate-pulse">{t("loadingSession")}</span>
            </div>
          ) : (
            <>
              {/* VietQR View */}
              {paymentSession?.qrUrl && (
                <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50 flex items-center gap-4">
                  <div className="w-24 h-24 shrink-0 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={paymentSession.qrUrl}
                      alt="VietQR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-slate-900 text-sm">
                      {formatVnd(paymentSession.amount)}
                    </p>
                    <p className="text-slate-500">
                      Mã TT:{" "}
                      <span className="font-mono font-bold text-slate-700">
                        {paymentSession.paymentCode}
                      </span>
                    </p>
                    {paymentSession.bankInfo && (
                      <p className="text-slate-500">
                        {paymentSession.bankInfo.bankCode} • {paymentSession.bankInfo.accountNumber}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Form fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Hình thức thu
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethodEnum)}
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value={PaymentMethodEnum.CASH}>{t("methodCash")}</option>
                    <option value={PaymentMethodEnum.BANK_TRANSFER}>
                      {t("methodBankTransfer")}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mã tham chiếu / Biên lai
                  </label>
                  <input
                    type="text"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="VD: PT-00123"
                    className="w-full bg-slate-50 text-xs text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ảnh chụp phiếu thu / Biên lai quầy (Bắt buộc) *
                </label>
                <CloudinaryUploader
                  value={proofImageUrl ? [proofImageUrl] : []}
                  onChange={(urls: string[]) => setProofImageUrl(urls[0] || "")}
                  folder={CloudinaryFolderEnum.GENERAL}
                  maxFiles={1}
                  multiple={false}
                />
                {proofImageUrl && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    ✓ Đã tải lên ảnh chứng từ thu tiền
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ghi chú đối soát (tối thiểu 2 ký tự) *
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú xác minh giao dịch tiền mặt..."
                  className="w-full bg-slate-50 text-xs text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 outline-none resize-none"
                />
              </div>
            </>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={confirmManualMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t("close")}
            </button>
            <button
              type="submit"
              disabled={confirmManualMutation.isPending || isLoadingSession}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm disabled:opacity-50"
            >
              {confirmManualMutation.isPending ? t("submitting") : t("confirmBtn")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Legacy stub for backward compatibility
export const RejectReservationModal: React.FC<Record<string, unknown>> = () => null;
