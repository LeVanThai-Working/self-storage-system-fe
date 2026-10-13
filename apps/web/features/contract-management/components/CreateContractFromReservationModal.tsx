"use client";

import React, { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Boxes,
  Calendar,
  CheckCircle2,
  FileSignature,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/features/auth/store";
import { useCreateContract, useFacilityStaffs } from "../hooks";
import { ContractSourceEnum, RoleEnum, UserStatusEnum, type ReservationResponse } from "../types";
import { formatDateOnly, formatVnd, getCurrentUserId, resolveContractErrorMessage } from "../utils";

interface CreateContractFromReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
  portalBase?: "facility-manager" | "facility-staff";
}

export const CreateContractFromReservationModal: React.FC<
  CreateContractFromReservationModalProps
> = ({ isOpen, onClose, reservation, portalBase }) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentUserId = getCurrentUserId(currentUser);

  const userRole = String(currentUser?.role ?? "").toLowerCase();
  const isManager = userRole === RoleEnum.FACILITY_MANAGER;
  const resolvedPortal =
    portalBase ?? (userRole === RoleEnum.FACILITY_STAFF ? "facility-staff" : "facility-manager");

  const staffsQuery = useFacilityStaffs(
    { status: UserStatusEnum.ACTIVE, limit: 100 },
    isOpen && isManager
  );
  const staffList = useMemo(() => staffsQuery.data?.items ?? [], [staffsQuery.data?.items]);

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createContractMutation = useCreateContract();

  if (!reservation) return null;

  const estimatedEndDateIso = (() => {
    const start = new Date(reservation.startDate);
    if (Number.isNaN(start.getTime())) return reservation.startDate;
    start.setDate(start.getDate() + Math.max(1, reservation.rentalDuration || 1));
    return start.toISOString();
  })();

  const effectiveAssignedStaffId = isManager
    ? selectedStaffId || staffList[0]?.id || (currentUserId ?? "")
    : (currentUserId ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reservation.storageUnitId) {
      setErrorMsg(
        isEn
          ? "This reservation has not been assigned a physical storage unit yet."
          : "Đơn đặt chỗ này chưa được gán ô kho vật lý."
      );
      return;
    }

    try {
      const created = await createContractMutation.mutateAsync({
        source: ContractSourceEnum.RESERVATION,
        reservationId: reservation.id,
        assignedStaffId: effectiveAssignedStaffId || undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      onClose();
      router.push(`/${locale}/${resolvedPortal}/contracts/${created.id}`);
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !createContractMutation.isPending) {
          setErrorMsg(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? "Create Contract & Assign Check-in"
                  : "Tạo Hợp đồng & Giao Nhân viên Check-in"}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? `Initialize DRAFT contract from reservation #${reservation.reservationCode}`
                  : `Khởi tạo hợp đồng nháp (DRAFT) từ khách đặt chỗ #${reservation.reservationCode}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Reservation Summary Card */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {reservation.reservationCode}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isEn ? "Deposit Paid" : "Đã thanh toán cọc"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    {isEn ? "Customer" : "Khách hàng"}
                  </p>
                  <p className="font-bold text-slate-800">
                    {reservation.customer?.name ?? reservation.customerId}
                  </p>
                  {reservation.customer?.phoneNumber && (
                    <p className="text-slate-500">{reservation.customer.phoneNumber}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Boxes className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    {isEn ? "Assigned Storage Unit" : "Ô kho đã phân bổ"}
                  </p>
                  <p className="font-extrabold text-emerald-700">
                    {reservation.storageUnit
                      ? `#${reservation.storageUnit.unitNumber} (${
                          isEn
                            ? `Floor ${reservation.storageUnit.floor}`
                            : `Tầng ${reservation.storageUnit.floor}`
                        })`
                      : reservation.storageUnitId}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    {isEn ? "Lease Period" : "Thời hạn thuê"}
                  </p>
                  <p className="font-bold text-slate-800">
                    {formatDateOnly(reservation.startDate, locale)} →{" "}
                    {formatDateOnly(estimatedEndDateIso, locale)}
                  </p>
                  <p className="text-slate-500">
                    ({reservation.rentalDuration} {isEn ? "days" : "ngày"})
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    {isEn ? "Paid Deposit" : "Tiền cọc đã đóng"}
                  </p>
                  <p className="font-extrabold text-emerald-700">
                    {formatVnd(reservation.depositAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Staff Selector (Only shown for FACILITY_MANAGER) */}
          {isManager ? (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                {isEn
                  ? "Assign Staff for Check-in (assignedStaffId)"
                  : "Giao nhân viên phụ trách Check-in"}
              </label>
              <select
                value={selectedStaffId || staffList[0]?.id || ""}
                onChange={(e) => {
                  setSelectedStaffId(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 focus:bg-white text-sm font-medium text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              >
                {staffList.length === 0 ? (
                  <option value={currentUser?.id ?? ""}>
                    {currentUser?.name
                      ? `${currentUser.name} (${isEn ? "Manager - Self" : "Quản lý tự phụ trách"})`
                      : isEn
                        ? "Default to current manager"
                        : "Mặc định người tạo"}
                  </option>
                ) : (
                  <>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} — {staff.email}
                        {staff.phone || staff.phoneNumber
                          ? ` (${staff.phone || staff.phoneNumber})`
                          : ""}
                      </option>
                    ))}
                    {currentUser?.id && !staffList.some((s) => s.id === currentUser.id) && (
                      <option value={currentUser.id}>
                        {currentUser.name} ({isEn ? "Manager - Self" : "Quản lý tự phụ trách"})
                      </option>
                    )}
                  </>
                )}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {isEn
                  ? "The assigned staff member will see this contract under their 'Assigned to Me' queue for physical handover."
                  : "Nhân viên được chọn sẽ thấy hợp đồng này trong tab 'Công việc của tôi' để đón khách và bàn giao kho."}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-teal-50/70 border border-teal-200/80 px-3.5 py-2.5 text-xs text-teal-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                {isEn ? "Assigned Check-in Staff:" : "Nhân viên phụ trách Check-in:"}{" "}
                <strong>{currentUser?.name ?? "Facility Staff"}</strong>
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Handover Notes for Staff" : "Ghi chú bàn giao cho nhân viên"}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                isEn
                  ? "Instructions for check-in staff (e.g., verify ID card, hand over smart lock PIN)..."
                  : "Ghi chú hướng dẫn cho nhân viên khi khách đến nhận kho (VD: Kiểm tra CCCD, bàn giao mã PIN khóa cửa)..."
              }
              className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createContractMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Đóng"}
            </button>
            <button
              type="submit"
              disabled={createContractMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {createContractMutation.isPending
                ? isEn
                  ? "Creating Contract..."
                  : "Đang tạo hợp đồng..."
                : isEn
                  ? "Create Contract & Open Detail"
                  : "Tạo hợp đồng & Chuyển tới Chi tiết"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
