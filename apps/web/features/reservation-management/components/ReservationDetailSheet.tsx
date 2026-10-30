"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Banknote,
  Boxes,
  Calendar,
  Check,
  Clock,
  CreditCard,
  FileCheck2,
  Flame,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuthStore } from "@/features/auth/store";
import { RoleEnum } from "@self-storage-system-fe/shared";
import { useReservationDetail } from "../hooks";
import {
  BillingUnitEnum,
  ReservationStatusEnum,
  type FacilityUnitTypeOfferingResponse,
  type ReservationResponse,
} from "../types";
import {
  buildReservationTimelineSteps,
  formatDateOnly,
  formatDateTime,
  formatRentalScheduleLabel,
  formatVnd,
} from "../utils";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

interface ReservationDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
  offerings: FacilityUnitTypeOfferingResponse[];
  nowMs: number;
  portalBase?: "facility-manager" | "facility-staff";
  onOpenConfirm?: (reservation: ReservationResponse) => void;
  onOpenMarkArrived?: (reservation: ReservationResponse) => void;
  onOpenExtendGrace?: (reservation: ReservationResponse) => void;
  onOpenReassignUnit?: (reservation: ReservationResponse) => void;
  onOpenForceCancel?: (reservation: ReservationResponse) => void;
  onOpenConfirmRefund?: (reservation: ReservationResponse) => void;
  onOpenCancel?: (reservation: ReservationResponse) => void;
  onOpenManualPayment?: (reservation: ReservationResponse) => void;
  onOpenAssignStaff?: (reservation: ReservationResponse) => void;
  onOpenCreateContract?: (reservation: ReservationResponse) => void;
  isCreatingContract?: boolean;
  // Legacy
  onReceive?: (reservation: ReservationResponse) => void;
  onOpenAssignUnit?: (reservation: ReservationResponse) => void;
  onOpenReject?: (reservation: ReservationResponse) => void;
  onComplete?: (reservation: ReservationResponse) => void;
  isReceiving?: boolean;
  isCompleting?: boolean;
}

export const ReservationDetailSheet: React.FC<ReservationDetailSheetProps> = ({
  isOpen,
  onClose,
  reservation: initialReservation,
  offerings,
  nowMs,
  portalBase = "facility-manager",
  isCreatingContract = false,
  onOpenConfirm,
  onOpenMarkArrived,
  onOpenExtendGrace,
  onOpenReassignUnit,
  onOpenForceCancel,
  onOpenConfirmRefund,
  onOpenCancel,
  onOpenManualPayment,
  onOpenAssignStaff,
  onOpenCreateContract,
}) => {
  const t = useTranslations("facilityManager.reservations.detailSheet");
  const tActions = useTranslations("facilityManager.reservations.actions");
  const tBilling = useTranslations("facilityManager.reservations.billingUnit");
  const locale = useLocale() === "en" ? "en" : "vi";

  const currentUser = useAuthStore((s) => s.currentUser);
  const isStaff = portalBase === "facility-staff" || currentUser?.role === RoleEnum.FACILITY_STAFF;
  const isManager = !isStaff;

  const detailQuery = useReservationDetail(isOpen ? (initialReservation?.id ?? null) : null);
  const reservation = detailQuery.data ?? initialReservation;

  if (!reservation) return null;

  const timelineSteps = buildReservationTimelineSteps(reservation, locale);
  const status = reservation.status;

  const canManualPayment = status === ReservationStatusEnum.PENDING_PAYMENT;
  const canConfirm = status === ReservationStatusEnum.PAYMENT_SUCCESSFUL;
  const canMarkArrived =
    (status === ReservationStatusEnum.CONFIRMED || status === ReservationStatusEnum.OVERDUE) &&
    !reservation.arrivedAt;
  const canCreateContract =
    (status === ReservationStatusEnum.CONFIRMED || status === ReservationStatusEnum.OVERDUE) &&
    Boolean(reservation.storageUnitId);
  const canAssignStaff =
    isManager &&
    (status === ReservationStatusEnum.CONFIRMED || status === ReservationStatusEnum.OVERDUE) &&
    Boolean(onOpenAssignStaff);
  const canReassign =
    isManager &&
    (status === ReservationStatusEnum.PAYMENT_SUCCESSFUL ||
      status === ReservationStatusEnum.CONFIRMED ||
      status === ReservationStatusEnum.OVERDUE);
  const canExtendGrace =
    isManager &&
    (status === ReservationStatusEnum.CONFIRMED || status === ReservationStatusEnum.OVERDUE);
  const canForceCancel =
    isManager &&
    (status === ReservationStatusEnum.PAYMENT_SUCCESSFUL ||
      status === ReservationStatusEnum.CONFIRMED ||
      status === ReservationStatusEnum.OVERDUE);
  const canConfirmRefund =
    isManager &&
    (status === ReservationStatusEnum.CANCELLED || status === ReservationStatusEnum.EXPIRED) &&
    reservation.refundStatus === "pending";
  const canCancel =
    status === ReservationStatusEnum.PENDING_PAYMENT ||
    (status === ReservationStatusEnum.PAYMENT_SUCCESSFUL && isManager);

  // Subtotal
  const durationMultiplier =
    reservation.billingUnit === BillingUnitEnum.MONTH
      ? Math.max(1, reservation.rentalDuration / 30)
      : reservation.billingUnit === BillingUnitEnum.DAY
        ? reservation.rentalDuration
        : 1;
  const baseStorageTotal = Math.round(reservation.basePrice * durationMultiplier);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full data-[side=right]:w-full data-[side=right]:sm:w-[620px] data-[side=right]:sm:max-w-[640px] data-[side=right]:md:w-[680px] data-[side=right]:md:max-w-[700px] p-0 border-l border-slate-200 bg-white flex flex-col h-full shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-slate-900">
                {reservation.reservationCode}
              </span>
              <ReservationStatusBadge
                status={reservation.status}
                expiresAt={reservation.expiresAt}
                nowMs={nowMs}
              />
              {reservation.arrivedAt && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  <UserCheck className="w-3 h-3" /> Đã có mặt
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t("createdAt")}: {formatDateTime(reservation.createdAt, locale)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void detailQuery.refetch()}
            disabled={detailQuery.isFetching}
            className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 transition-colors disabled:opacity-40"
            title={t("refresh")}
          >
            <RefreshCw
              className={`w-4 h-4 ${detailQuery.isFetching ? "animate-spin text-teal-600" : ""}`}
            />
          </button>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Pending Unit Change Proposal Alert */}
          {reservation.pendingUnitChange && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Đang có đề xuất đổi phòng kho 2 bước chờ khách phản hồi
              </div>
              <p className="text-xs text-amber-800">
                Kho đề xuất mới: #
                {reservation.pendingUnitChange.newStorageUnit?.unitNumber ??
                  reservation.pendingUnitChange.newStorageUnitId}{" "}
                • Lý do: {reservation.pendingUnitChange.reason}
              </p>
            </div>
          )}

          {/* Grace Period Extension Note */}
          {reservation.graceExtendedAt && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Đã gia hạn ân hạn nhận kho:
              </p>
              <p>
                Lý do: {reservation.graceExtensionReason || "Được quản lý gia hạn"} • Hạn mới:{" "}
                {formatDateTime(reservation.graceExpiresAt, locale)}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tiến trình đơn đặt chỗ (5 giai đoạn)
            </h4>
            <div className="space-y-2.5">
              {timelineSteps.map((step) => {
                const isCompleted = step.state === "completed";
                const isCurrent = step.state === "current";
                return (
                  <div
                    key={step.key}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? "bg-teal-50/40 border-teal-200"
                        : isCompleted
                          ? "bg-slate-50/50 border-slate-100"
                          : "bg-white border-dashed border-slate-200 opacity-60"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                            ? "bg-teal-600 text-white animate-pulse"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.stepNumber}
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-slate-800">
                        {step.key === "pending_payment"
                          ? "1. Đặt giữ chỗ 15 phút & Khóa kho"
                          : step.key === "payment_successful"
                            ? "2. Thanh toán tiền cọc thành công"
                            : step.key === "confirmed"
                              ? "3. Xác nhận đơn & Phân công đón tiếp"
                              : step.key === "arrived"
                                ? "4. Khách có mặt tại cơ sở"
                                : "5. Ký hợp đồng check-in & Bàn giao kho"}
                      </p>
                      {step.timestamp && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(step.timestamp, locale)}{" "}
                          {step.actorName ? `• ${step.actorName}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer & Staff info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                Khách hàng
              </p>
              <p className="font-semibold text-slate-800">{reservation.customer?.name ?? "—"}</p>
              <p className="text-slate-500">{reservation.customer?.phoneNumber || "Chưa có SĐT"}</p>
              <p className="text-slate-500">{reservation.customer?.email || "—"}</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-600" />
                Nhân viên phụ trách
              </p>
              {reservation.assignedStaff ? (
                <>
                  <p className="font-semibold text-slate-800">{reservation.assignedStaff.name}</p>
                  <p className="text-slate-500">
                    {reservation.assignedStaff.phoneNumber || "Chưa có SĐT"}
                  </p>
                  <p className="text-slate-500">{reservation.assignedStaff.email}</p>
                </>
              ) : (
                <p className="text-slate-400 italic">Chưa phân công nhân viên</p>
              )}
            </div>
          </div>

          {/* Storage Unit & Schedule */}
          <div className="p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-teal-600" />
              Phòng kho & Lịch hẹn check-in
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Phòng kho vật lý</span>
                <span className="font-bold text-slate-800 text-sm">
                  {reservation.storageUnit
                    ? `#${reservation.storageUnit.unitNumber}`
                    : "Chưa chọn kho"}
                </span>
                {reservation.storageUnit && (
                  <span className="text-slate-500 block text-[11px]">
                    Tầng {reservation.storageUnit.floor}{" "}
                    {reservation.storageUnit.zone ? `• Khu ${reservation.storageUnit.zone}` : ""}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ca hẹn Check-in</span>
                <span className="font-bold text-slate-800 text-sm">
                  {reservation.checkInTimeSlot || "—"}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  Ngày: {formatDateOnly(reservation.checkInDate, locale)}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Ngày bắt đầu tính tiền</span>
                <span className="font-semibold text-slate-800">
                  {formatDateOnly(reservation.startDate, locale)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Thời hạn thuê</span>
                <span className="font-semibold text-slate-800">
                  {formatRentalScheduleLabel(
                    reservation.rentalDuration,
                    reservation.billingUnit,
                    locale
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Financials & Deposit */}
          <div className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Chi tiết tài chính & Tiền cọc
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Đơn giá thuê kho:</span>
              <span className="font-semibold text-slate-800">
                {formatVnd(reservation.basePrice)} / {reservation.billingUnit}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tiền cọc giữ chỗ (100%):</span>
              <span className="font-bold text-emerald-700">
                {formatVnd(reservation.depositAmount)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tổng giá trị đơn:</span>
              <span className="font-extrabold text-slate-900">
                {formatVnd(reservation.totalAmount)}
              </span>
            </div>
            {reservation.refundAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-bold">
                <span>Số tiền hoàn trả:</span>
                <span>{formatVnd(reservation.refundAmount)}</span>
              </div>
            )}
            {reservation.forfeitedAmount > 0 && (
              <div className="flex justify-between py-1 text-rose-600 font-bold">
                <span>Số tiền cọc bị tịch thu (No-show / Hủy sát giờ):</span>
                <span>{formatVnd(reservation.forfeitedAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2 flex-wrap shrink-0">
          {canManualPayment && onOpenManualPayment && (
            <button
              type="button"
              onClick={() => onOpenManualPayment(reservation)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
            >
              Thu cọc tại quầy
            </button>
          )}

          {canConfirm && onOpenConfirm && (
            <button
              type="button"
              onClick={() => onOpenConfirm(reservation)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              Xác nhận đơn
            </button>
          )}

          {canMarkArrived && onOpenMarkArrived && (
            <button
              type="button"
              onClick={() => onOpenMarkArrived(reservation)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Khách đã đến
            </button>
          )}

          {canCreateContract && onOpenCreateContract && (
            <button
              type="button"
              onClick={() => onOpenCreateContract(reservation)}
              disabled={isCreatingContract}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 shadow-sm flex items-center gap-1.5"
            >
              {isCreatingContract ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileCheck2 className="w-3.5 h-3.5" />
              )}
              {isCreatingContract ? "Đang tạo hợp đồng..." : "Lập hợp đồng nháp"}
            </button>
          )}

          {canAssignStaff && onOpenAssignStaff && (
            <button
              type="button"
              onClick={() => onOpenAssignStaff(reservation)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
            >
              Đổi NV tiếp đón
            </button>
          )}

          {canReassign && onOpenReassignUnit && (
            <button
              type="button"
              onClick={() => onOpenReassignUnit(reservation)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100"
            >
              Đổi kho sự cố
            </button>
          )}

          {canExtendGrace && onOpenExtendGrace && (
            <button
              type="button"
              onClick={() => onOpenExtendGrace(reservation)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100"
            >
              Gia hạn ân hạn
            </button>
          )}

          {canForceCancel && onOpenForceCancel && (
            <button
              type="button"
              onClick={() => onOpenForceCancel(reservation)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1"
            >
              <Flame className="w-3 h-3" />
              Hủy khẩn cấp
            </button>
          )}

          {canConfirmRefund && onOpenConfirmRefund && (
            <button
              type="button"
              onClick={() => onOpenConfirmRefund(reservation)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
            >
              <Banknote className="w-3.5 h-3.5" />
              Xác nhận hoàn cọc
            </button>
          )}

          {canCancel && onOpenCancel && (
            <button
              type="button"
              onClick={() => onOpenCancel(reservation)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600"
            >
              Hủy đơn
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
