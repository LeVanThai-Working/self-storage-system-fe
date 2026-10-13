"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileSignature,
  FileText,
  History,
  LogOut,
  MinusCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import {
  useContractDetail,
  useFacilityStaffs,
  useStorageUnitDetail,
  useToggleStorageUnitMaintenance,
} from "../hooks";
import {
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  PaymentPurposeEnum,
  RoleEnum,
  StorageUnitStatusEnum,
  UserStatusEnum,
  type ContractAddendumResponse,
} from "../types";
import {
  buildContractLifecycleSteps,
  canCheckInContract,
  formatDateOnly,
  formatDateTime,
  formatVnd,
  getBillingUnitLabel,
  getContractDurationDays,
  getCurrentUserId,
  isContractAssignedToStaff,
  isContractDepositSatisfied,
  resolveContractErrorMessage,
} from "../utils";
import {
  ApproveContractAddendumModal,
  CancelContractAddendumModal,
  CancelDraftContractModal,
  CheckInContractModal,
  CheckOutContractModal,
  CollectWalkInDepositModal,
  CreateContractAddendumModal,
  RejectContractAddendumModal,
  RenewContractModal,
  StaffSignContractAddendumModal,
  TerminateContractModal,
} from "./ContractActionModals";
import {
  ContractAddendumStatusBadge,
  ContractAddendumTypeBadge,
  ContractDepositBadge,
  ContractSourceBadge,
  ContractStatusBadge,
} from "./ContractStatusBadge";

interface ContractDetailViewProps {
  contractId: string;
  portalBase: "facility-manager" | "facility-staff";
}

export const ContractDetailView: React.FC<ContractDetailViewProps> = ({
  contractId,
  portalBase,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const currentUserId = getCurrentUserId(currentUser);
  const userRole = String(currentUser?.role ?? "").toLowerCase();
  const isStaff = userRole === RoleEnum.FACILITY_STAFF || portalBase === "facility-staff";
  const isManager = userRole === RoleEnum.FACILITY_MANAGER && !isStaff;

  const contractQuery = useContractDetail(contractId);
  const contract = contractQuery.data;

  const unitDetailQuery = useStorageUnitDetail(contract?.storageUnitId);
  const storageUnit = contract?.storageUnit ?? unitDetailQuery.data;

  const staffsQuery = useFacilityStaffs({ status: UserStatusEnum.ACTIVE, limit: 100 }, isManager);
  const maintenanceMutation = useToggleStorageUnitMaintenance();

  // Active modals
  const [collectPaymentPurpose, setCollectPaymentPurpose] = useState<PaymentPurposeEnum | null>(
    null
  );
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCancelDraftOpen, setIsCancelDraftOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [createAddendumType, setCreateAddendumType] = useState<ContractAddendumTypeEnum | null>(
    null
  );
  const [approveAddendumTarget, setApproveAddendumTarget] =
    useState<ContractAddendumResponse | null>(null);
  const [rejectAddendumTarget, setRejectAddendumTarget] = useState<ContractAddendumResponse | null>(
    null
  );
  const [staffSignAddendumTarget, setStaffSignAddendumTarget] =
    useState<ContractAddendumResponse | null>(null);
  const [cancelAddendumTarget, setCancelAddendumTarget] = useState<ContractAddendumResponse | null>(
    null
  );
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [unitReopened, setUnitReopened] = useState(false);

  if (contractQuery.isLoading || (isStaff && isAuthLoading && !currentUserId)) {
    return (
      <div className="p-14 flex items-center justify-center gap-2 text-sm text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span>{isEn ? "Loading contract details..." : "Đang tải chi tiết hợp đồng..."}</span>
      </div>
    );
  }

  if (contractQuery.isError || !contract) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <p className="text-base font-extrabold text-slate-900">
          {isEn ? "Contract not found or failed to load" : "Không tìm thấy hợp đồng"}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href={`/${locale}/${portalBase}/contracts`}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {isEn ? "Back to Contracts" : "Quay lại danh sách"}
          </Link>
          <button
            type="button"
            onClick={() => contractQuery.refetch()}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
          >
            {isEn ? "Retry" : "Thử lại"}
          </button>
        </div>
      </div>
    );
  }

  if (isStaff && !isContractAssignedToStaff(contract, currentUserId)) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
        <p className="text-base font-extrabold text-slate-900">
          {isEn
            ? "Access Restricted: Contract Not Assigned to You"
            : "Không có quyền truy cập: Hợp đồng này không được phân công cho bạn"}
        </p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {isEn
            ? "Facility staff can only view and process contracts assigned directly to them."
            : "Nhân viên cơ sở chỉ được phép xem và xử lý các hợp đồng do quản lý giao trực tiếp cho mình."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href={`/${locale}/${portalBase}/contracts`}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
          >
            {isEn ? "Back to My Assigned Contracts" : "Quay lại danh sách hợp đồng của tôi"}
          </Link>
        </div>
      </div>
    );
  }

  const lifecycleSteps = buildContractLifecycleSteps(contract, locale);
  const status = contract.status;
  const isDraft = status === ContractStatusEnum.DRAFT;
  const isActive = status === ContractStatusEnum.ACTIVE;
  const isOverdue = status === ContractStatusEnum.OVERDUE;
  const isActiveOrOverdue = isActive || isOverdue;
  const isCompleted = status === ContractStatusEnum.COMPLETED;
  const isCancelled = status === ContractStatusEnum.CANCELLED;
  const isTerminated = status === ContractStatusEnum.TERMINATED;

  const isFromReservation = contract.source === ContractSourceEnum.RESERVATION;
  const isDepositSatisfied = isContractDepositSatisfied(contract);

  const canCollectWalkInDeposit =
    contract.status === ContractStatusEnum.DRAFT &&
    contract.source === ContractSourceEnum.WALK_IN &&
    !contract.depositPaidAt;

  const canCheckIn = canCheckInContract(contract);

  const durationDays = getContractDurationDays(contract.startDate, contract.endDate);

  const assignedStaffName =
    contract.assignedStaff?.name ||
    (contract.assignedStaffId
      ? (staffsQuery.data?.items ?? []).find((s) => s.id === contract.assignedStaffId)?.name
      : undefined) ||
    (contract.assignedStaffId && contract.assignedStaffId === currentUserId
      ? currentUser?.name
      : null) ||
    contract.assignedStaffId ||
    "—";

  const handleReopenStorageUnit = async () => {
    try {
      await maintenanceMutation.mutateAsync({
        storageUnitId: contract.storageUnitId,
        payload: {
          isUnderMaintenance: false,
          notes: "Đã kiểm tra và vệ sinh sau check-out",
        },
      });
      setUnitReopened(true);
      toast.success(
        isEn
          ? "Storage unit reopened to AVAILABLE!"
          : "Đã hoàn tất vệ sinh và mở lại phòng kho sang trạng thái Còn trống (AVAILABLE)!"
      );
    } catch (err: unknown) {
      toast.error(resolveContractErrorMessage(err, locale));
    }
  };

  const isUnitUnderMaintenance =
    !unitReopened &&
    (!storageUnit?.status ||
      String(storageUnit.status).toLowerCase() === StorageUnitStatusEnum.UNDER_MAINTENANCE);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="space-y-2">
          <Link
            href={`/${locale}/${portalBase}/contracts`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isEn ? "Back to Contracts List" : "Quay lại Danh sách Hợp đồng"}
          </Link>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-base font-extrabold px-3.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              {contract.contractCode}
            </span>
            <ContractStatusBadge status={contract.status} />
            <ContractSourceBadge source={contract.source} />
            <ContractDepositBadge source={contract.source} depositPaidAt={contract.depositPaidAt} />
          </div>

          <p className="text-xs text-slate-500">
            {isEn ? "Created at:" : "Khởi tạo lúc:"} {formatDateTime(contract.createdAt, locale)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            contractQuery.refetch();
            unitDetailQuery.refetch();
          }}
          disabled={contractQuery.isFetching}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 self-start sm:self-center"
        >
          <RefreshCw
            className={`w-4 h-4 text-emerald-600 ${contractQuery.isFetching ? "animate-spin" : ""}`}
          />
          {isEn ? "Refresh" : "Làm mới"}
        </button>
      </div>

      {/* A. Contract Lifecycle Stepper */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          {isEn ? "Contract Lifecycle Progress" : "Thanh Tiến trình Vòng đời Hợp đồng"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lifecycleSteps.map((step) => {
            const isStepCompleted = step.state === "completed";
            const isStepCurrent = step.state === "current";
            const isStepError = step.state === "error";

            return (
              <div
                key={step.key}
                className={`rounded-2xl border p-4 flex items-start gap-3.5 ${
                  isStepCompleted
                    ? "border-emerald-200 bg-emerald-50/40"
                    : isStepCurrent
                      ? "border-teal-400 bg-teal-50/50 ring-2 ring-teal-500/15"
                      : isStepError
                        ? "border-rose-200 bg-rose-50/40"
                        : "border-slate-200/70 bg-slate-50/50 opacity-75"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    isStepCompleted
                      ? "bg-emerald-600 text-white"
                      : isStepCurrent
                        ? "bg-teal-600 text-white"
                        : isStepError
                          ? "bg-rose-600 text-white"
                          : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isStepCompleted ? <Check className="w-4 h-4" /> : step.stepNumber}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900">{step.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancelled / Terminated Warning Banner */}
        {(isCancelled || isTerminated) && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-xs text-rose-800">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-sm text-rose-900">
                {isCancelled
                  ? isEn
                    ? "Draft Contract Cancelled Before Check-in"
                    : "Hợp đồng nháp đã bị huỷ trước khi Check-in"
                  : isEn
                    ? "Contract Terminated Early by Facility Manager"
                    : "Hợp đồng đã bị chấm dứt trước hạn bởi Quản lý cơ sở"}
              </p>
              <p>
                <span className="font-bold">{isEn ? "Reason:" : "Lý do:"}</span>{" "}
                {contract.cancellationReason || contract.terminationReason || "—"}
              </p>
              {(contract.cancelledBy || contract.terminatedBy) && (
                <p className="text-[11px] text-rose-700">
                  {isEn ? "Action by:" : "Thực hiện bởi:"}{" "}
                  {contract.cancelledBy?.name || contract.terminatedBy?.name} •{" "}
                  {formatDateTime(contract.cancelledAt || contract.terminatedAt, locale)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* B. Action Panel Based on Contract Status */}
      {/* Status 1: DRAFT */}
      {isDraft && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                {isEn
                  ? "Step 1 Action Panel: Deposit Verification & Dual-Party Signing (Check-in)"
                  : "Bảng Thao tác Bước 1: Kiểm tra Tiền cọc & Ký 2 chiều Bàn giao Kho (Check-in)"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEn
                  ? "Contract activates automatically once Deposit is satisfied and BOTH Customer & Staff have signed."
                  : "Hợp đồng tự động chuyển sang ACTIVE khi đã hoàn tất Tiền cọc và CẢ 2 BÊN (Khách hàng & Nhân viên) đều đã ký xác nhận."}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* ONLY show Collect Deposit at Counter for WALK_IN contracts without depositPaidAt */}
              {canCollectWalkInDeposit && (
                <button
                  type="button"
                  onClick={() => setCollectPaymentPurpose(PaymentPurposeEnum.CONTRACT_DEPOSIT)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  {isEn ? "Collect Deposit at Counter" : "Thu tiền cọc tại quầy"}
                </button>
              )}

              {/* Staff Sign & Handover button when deposit is satisfied and !staffSigned */}
              {!contract.staffSigned && (
                <button
                  type="button"
                  disabled={!canCheckIn}
                  onClick={() => setIsCheckInOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {isEn ? "Confirm Handover & Sign (Staff)" : "Xác nhận bàn giao kho & Ký (Staff)"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCancelDraftOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {isEn ? "Cancel Draft Contract" : "Huỷ hợp đồng nháp"}
              </button>
            </div>
          </div>

          {/* Deposit Condition & Dual-Signature Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* 1. Deposit Status */}
            <div
              className={`rounded-2xl border p-3.5 space-y-1 ${
                isDepositSatisfied
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-amber-50/70 border-amber-200 text-amber-900"
              }`}
            >
              <div className="flex items-center justify-between font-extrabold">
                <span>{isEn ? "1. Security Deposit" : "1. Tiền đặt cọc"}</span>
                {isDepositSatisfied ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <p className="font-bold">{formatVnd(contract.depositAmount)}</p>
              <p className="text-[11px] opacity-85">
                {isFromReservation
                  ? isEn
                    ? "Paid from Reservation (No second collection)"
                    : "Tiền cọc: Đã thanh toán từ Đặt chỗ"
                  : contract.depositPaidAt
                    ? `${isEn ? "Paid:" : "Đã thu:"} ${formatDateTime(contract.depositPaidAt, locale)}`
                    : isEn
                      ? "Unpaid (Walk-in)"
                      : "Chưa đóng cọc"}
              </p>
            </div>

            {/* 2. Customer Signature Status */}
            <div
              className={`rounded-2xl border p-3.5 space-y-1 ${
                contract.customerSigned
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between font-extrabold">
                <span>{isEn ? "2. Customer Signature" : "2. Chữ ký Khách hàng"}</span>
                {contract.customerSigned ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="font-bold">
                {contract.customerSigned
                  ? isEn
                    ? "Signed & Confirmed"
                    : "Khách đã ký xác nhận"
                  : isEn
                    ? "Waiting for customer signature"
                    : "Chờ khách ký trên App"}
              </p>
              <p className="text-[11px] opacity-80">
                {contract.customerSignedAt
                  ? formatDateTime(contract.customerSignedAt, locale)
                  : isEn
                    ? "Independent of staff signature"
                    : "Ký độc lập với nhân viên"}
              </p>
            </div>

            {/* 3. Staff Signature Status */}
            <div
              className={`rounded-2xl border p-3.5 space-y-1 ${
                contract.staffSigned
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between font-extrabold">
                <span>{isEn ? "3. Staff Handover Signature" : "3. Chữ ký Nhân viên"}</span>
                {contract.staffSigned ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="font-bold">
                {contract.staffSigned
                  ? isEn
                    ? "Staff Signed Handover"
                    : "NV đã ký bàn giao"
                  : isEn
                    ? "Pending staff handover sign"
                    : "Chờ NV ký bàn giao kho"}
              </p>
              <p className="text-[11px] opacity-80">
                {contract.staffSignedAt
                  ? formatDateTime(contract.staffSignedAt, locale)
                  : isEn
                    ? "Can sign once deposit is paid"
                    : "Có thể ký ngay khi đã đóng cọc"}
              </p>
            </div>
          </div>

          {!isDepositSatisfied ? (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold">
                  {isEn
                    ? "Walk-in Contract: Security deposit has not been paid yet."
                    : "Hợp đồng khách vãng lai (Walk-in): Khách hàng chưa đóng tiền đặt cọc."}
                </p>
                <p className="text-amber-700">
                  {isEn
                    ? "Click 'Collect Deposit at Counter' above to generate VietQR or confirm cash payment before signing handover."
                    : "Vui lòng nhấn nút 'Thu tiền cọc tại quầy' phía trên để tạo mã VietQR hoặc xác nhận thu tiền mặt trước khi ký bàn giao kho."}
                </p>
              </div>
            </div>
          ) : contract.staffSigned && !contract.customerSigned ? (
            <div className="rounded-2xl bg-teal-50 border border-teal-200 p-4 flex items-center gap-3 text-xs text-teal-900">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <p className="font-extrabold">
                  {isEn
                    ? "Staff has signed! Waiting for Customer to sign on Mobile App."
                    : "Nhân viên đã ký bàn giao kho! Đang chờ Khách hàng ký xác nhận trên ứng dụng Mobile."}
                </p>
                <p className="text-teal-700 mt-0.5">
                  {isEn
                    ? "As soon as the customer signs, the contract will automatically become ACTIVE."
                    : "Ngay khi khách hàng bấm ký xác nhận trên điện thoại, hợp đồng sẽ tự động kích hoạt sang ACTIVE."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Status 2: ACTIVE or OVERDUE */}
      {isActiveOrOverdue && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                {isEn
                  ? "Active Lease Operations: Renew, Amenities & Check-out"
                  : "Quản lý Hợp đồng Đang thuê: Gia hạn, Tiện ích & Trả kho Check-out"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isOverdue
                  ? isEn
                    ? "This contract is currently OVERDUE. Please renew the lease or perform Check-out settlement."
                    : "Hợp đồng đang quá hạn trả kho. Vui lòng gia hạn hợp đồng hoặc làm thủ tục Check-out thanh lý."
                  : isEn
                    ? "Manage add-on amenities, extend the lease end date, or inspect the unit for Check-out."
                    : "Quản lý tiện ích đi kèm, gia hạn thời gian thuê kho hoặc làm biên bản kiểm tra trả kho (Check-out)."}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsRenewOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {isEn ? "Renew Contract" : "Gia hạn hợp đồng"}
              </button>

              <button
                type="button"
                onClick={() => setIsCheckOutOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {isEn ? "Check-out" : "Làm thủ tục trả kho"}
              </button>

              {/* Terminate button ONLY visible for FACILITY_MANAGER */}
              {isManager && (
                <button
                  type="button"
                  onClick={() => setIsTerminateOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  {isEn ? "Terminate Contract" : "Chấm dứt hợp đồng"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status 3: COMPLETED (Post Check-out Settlement & Unit Maintenance Reopen) */}
      {isCompleted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Official Settlement Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {isEn
                    ? "Official Check-out Settlement"
                    : "Bảng Quyết toán Thanh lý Hợp đồng Chính thức"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEn ? "Checked out at:" : "Thời điểm trả kho:"}{" "}
                  {formatDateTime(contract.actualCheckOutDate, locale)}
                  {contract.inspectedBy?.name ? ` • ${contract.inspectedBy.name}` : ""}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/70">
                <span className="text-slate-600">
                  {isEn ? "Deposit Held:" : "Tiền đặt cọc đã giữ:"}
                </span>
                <strong className="text-slate-900">{formatVnd(contract.depositAmount)}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/70">
                <span className="text-slate-600">{isEn ? "Overdue Fee:" : "Phí quá hạn:"}</span>
                <strong className="text-orange-600">{formatVnd(contract.overdueFee)}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/70">
                <span className="text-slate-600">
                  {isEn ? "Damage Compensation Fee:" : "Phí đền bù hư hại:"}
                </span>
                <strong className="text-rose-600">{formatVnd(contract.damageFee)}</strong>
              </div>
              <div className="flex justify-between py-1.5 bg-emerald-50 px-3 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900">
                  {isEn ? "Refund Amount to Customer:" : "Số tiền hoàn cọc cho khách:"}
                </span>
                <strong className="text-emerald-700 text-sm">
                  {formatVnd(contract.refundAmount)}
                </strong>
              </div>
              <div className="flex justify-between py-1.5 bg-amber-50 px-3 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900">
                  {isEn ? "Additional Payment Required:" : "Số tiền khách cần đóng thêm:"}
                </span>
                <strong className="text-amber-800 text-sm">
                  {formatVnd(contract.additionalPaymentRequired)}
                </strong>
              </div>
            </div>

            {contract.inspectionNotes && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
                <span className="font-bold text-slate-700 block mb-1">
                  {isEn ? "Inspection Notes:" : "Biên bản kiểm tra kho khi trả:"}
                </span>
                <p className="text-slate-600">{contract.inspectionNotes}</p>
              </div>
            )}
          </div>

          {/* Post Check-out Unit Maintenance Reopen Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {isEn
                      ? "Post Check-out Unit Cleaning & Reopen"
                      : "Vệ sinh Hậu Check-out & Mở lại Kho"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isEn
                      ? "After check-out, the physical unit enters Under maintenance until staff finishes cleaning."
                      : "Sau khi Check-out, kho vật lý tự động chuyển sang Đang bảo trì để chờ nhân viên dọn dẹp."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs space-y-1.5">
                <p>
                  <span className="font-bold text-slate-700">
                    {isEn ? "Storage Unit:" : "Phòng kho vật lý:"}
                  </span>{" "}
                  <strong className="text-emerald-700">
                    {storageUnit ? `#${storageUnit.unitNumber}` : contract.storageUnitId}
                  </strong>
                </p>
                <p>
                  <span className="font-bold text-slate-700">
                    {isEn ? "Current Unit Status:" : "Trạng thái kho hiện tại:"}
                  </span>{" "}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold ${
                      isUnitUnderMaintenance
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {isUnitUnderMaintenance
                      ? isEn
                        ? "Under maintenance"
                        : "Đang bảo trì"
                      : isEn
                        ? "Available"
                        : "Còn trống"}
                  </span>
                </p>
              </div>
            </div>

            {isUnitUnderMaintenance ? (
              <button
                type="button"
                onClick={handleReopenStorageUnit}
                disabled={maintenanceMutation.isPending}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {maintenanceMutation.isPending
                  ? isEn
                    ? "Reopening Storage Unit..."
                    : "Đang mở lại kho..."
                  : isEn
                    ? "Complete Cleaning & Reopen Unit"
                    : "Hoàn tất dọn dẹp & Mở lại kho"}
              </button>
            ) : (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isEn
                    ? "This storage unit has been cleaned and reopened as AVAILABLE."
                    : "Phòng kho này đã được xác nhận vệ sinh xong và mở lại trạng thái AVAILABLE."}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Details Grid: Lease Info, Customer/Staff/Unit, Amenities & Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Contract Schedule, Unit, Amenities & Renewals */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Contract Information */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600" />
              {isEn
                ? "Storage Unit, Schedule & Staff Assignment"
                : "Thông tin Phòng kho, Thời hạn thuê & Nhân sự phụ trách"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {isEn ? "Physical Storage Unit" : "Ô kho vật lý"}
                </p>
                <p className="text-sm font-extrabold text-emerald-700">
                  {storageUnit
                    ? `#${storageUnit.unitNumber} (${
                        isEn ? `Floor ${storageUnit.floor}` : `Tầng ${storageUnit.floor}`
                      }${storageUnit.zone ? ` • ${storageUnit.zone}` : ""})`
                    : contract.storageUnitId}
                </p>
                <p className="text-slate-500">
                  {contract.facility?.name ? `${contract.facility.name} • ` : ""}
                  ID: <span className="font-mono">{contract.storageUnitId}</span>
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {isEn ? "Customer & Assigned Staff" : "Khách hàng & Nhân viên phụ trách"}
                </p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {contract.customer?.name ?? contract.customerId}
                  {contract.customer?.phoneNumber ? ` (${contract.customer.phoneNumber})` : ""}
                </p>
                {contract.customer?.email && (
                  <p className="text-[11px] text-slate-500 pl-5">{contract.customer.email}</p>
                )}
                <p className="font-semibold text-teal-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  {isEn ? "Staff:" : "NV Check-in:"} {assignedStaffName}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {isEn ? "Contract Period" : "Thời hạn hợp đồng"}
                </p>
                <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  {formatDateOnly(contract.startDate, locale)} →{" "}
                  {formatDateOnly(contract.endDate, locale)}
                </p>
                <p className="text-slate-500">
                  {durationDays} {isEn ? "days" : "ngày"} •{" "}
                  {isEn ? "Billing unit:" : "Đơn vị tính:"}{" "}
                  {getBillingUnitLabel(contract.billingUnit, locale)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {isEn ? "Actual Check-in / Check-out" : "Thời điểm Check-in / Check-out thực tế"}
                </p>
                <p className="text-slate-700">
                  <span className="font-bold">Check-in:</span>{" "}
                  {formatDateTime(contract.actualCheckInDate, locale)}
                </p>
                <p className="text-slate-700">
                  <span className="font-bold">Check-out:</span>{" "}
                  {formatDateTime(contract.actualCheckOutDate, locale)}
                </p>
              </div>
            </div>

            {contract.notes && (
              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 text-xs">
                <span className="font-bold text-slate-700 block mb-0.5">
                  {isEn ? "Contract Notes:" : "Ghi chú hợp đồng:"}
                </span>
                <p className="text-slate-600">{contract.notes}</p>
              </div>
            )}
          </div>

          {/* Active Add-on Amenities Table (Modified only via Contract Addendums) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  {isEn ? "Active Rented Amenities" : "Danh sách Tiện ích đang thuê"} (
                  {contract.amenities?.length ?? 0})
                </h3>
              </div>

              {isActive && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCreateAddendumType(ContractAddendumTypeEnum.ADD)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isEn ? "+ Addendum: Add Amenity" : "+ Phụ lục Thuê thêm"}
                  </button>

                  {contract.amenities && contract.amenities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCreateAddendumType(ContractAddendumTypeEnum.REMOVE)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold transition-colors"
                    >
                      <MinusCircle className="w-3.5 h-3.5 text-orange-600" />
                      {isEn ? "- Addendum: Remove Amenity" : "- Phụ lục Tháo dỡ / Trả bớt"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {!contract.amenities || contract.amenities.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-6 text-center text-xs text-slate-500">
                {isEn
                  ? "No add-on amenities currently active on this contract."
                  : "Hợp đồng này hiện chưa có tiện ích đi kèm nào đang kích hoạt."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                      <th className="py-2.5 px-3">{isEn ? "Amenity Name" : "Tên tiện ích"}</th>
                      <th className="py-2.5 px-3 text-center">{isEn ? "Quantity" : "Số lượng"}</th>
                      <th className="py-2.5 px-3 text-right">{isEn ? "Unit Price" : "Đơn giá"}</th>
                      <th className="py-2.5 px-3 text-right">{isEn ? "Subtotal" : "Thành tiền"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contract.amenities.map((am) => {
                      const displayName = am.name || am.facilityAmenityOfferingId;
                      const unitPrice = am.pricePerUnit ?? 0;
                      const subtotal = am.totalPrice ?? unitPrice * am.quantity;

                      return (
                        <tr key={am.facilityAmenityOfferingId}>
                          <td className="py-3 px-3 font-bold text-slate-800">{displayName}</td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {am.quantity}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            {formatVnd(unitPrice)} / {getBillingUnitLabel(am.billingUnit, locale)}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                            {formatVnd(subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Contract Addendums Section (ADD & REMOVE Amenity Requests & Dual-Party Signing) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-teal-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {isEn
                      ? "Contract Addendums (Add / Remove Amenities)"
                      : "Danh sách Phụ lục Hợp đồng (Thuê thêm / Tháo dỡ Tiện ích)"}{" "}
                    ({contract.addendums?.length ?? 0})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isEn
                      ? "All amenity additions and removals are processed via dual-signed Contract Addendums."
                      : "Mọi thay đổi thêm/bớt tiện ích đều thực hiện qua Phụ lục hợp đồng có chữ ký xác nhận 2 chiều."}
                  </p>
                </div>
              </div>
            </div>

            {!contract.addendums || contract.addendums.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-6 text-center text-xs text-slate-500">
                {isEn
                  ? "No contract addendums have been created yet."
                  : "Chưa có phụ lục hợp đồng nào phát sinh."}
              </div>
            ) : (
              <div className="space-y-3.5">
                {contract.addendums.map((addendum) => {
                  const isRemove = addendum.type === ContractAddendumTypeEnum.REMOVE;
                  const isPendingApproval =
                    addendum.status === ContractAddendumStatusEnum.PENDING_APPROVAL;
                  const isAddendumDraft = addendum.status === ContractAddendumStatusEnum.DRAFT;
                  const canCancelAddendum = isPendingApproval || isAddendumDraft;

                  return (
                    <div
                      key={addendum.id}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-3 text-xs"
                    >
                      {/* Addendum Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-extrabold text-slate-900 px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                            {addendum.addendumCode}
                          </span>
                          <ContractAddendumTypeBadge type={addendum.type} />
                          <ContractAddendumStatusBadge status={addendum.status} />
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(addendum.requestedAt, locale)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-extrabold ${
                              isRemove ? "text-orange-700" : "text-emerald-700"
                            }`}
                          >
                            {isRemove ? "-" : "+"}
                            {formatVnd(addendum.totalPeriodicPrice)} / {isEn ? "cycle" : "kỳ"}
                          </span>
                          {isRemove && (addendum.damageFee ?? 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200">
                              {isEn ? "Damage Fee:" : "Phí đền bù hư hại:"}{" "}
                              {formatVnd(addendum.damageFee)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Addendum Amenities List */}
                      <div className="rounded-xl bg-white border border-slate-200/70 p-3 space-y-1.5">
                        {addendum.amenities.map((am) => (
                          <div
                            key={am.facilityAmenityOfferingId}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-bold text-slate-800">
                              {am.name || am.facilityAmenityOfferingId}{" "}
                              <span className="text-slate-500 font-semibold">× {am.quantity}</span>
                            </span>
                            <span className="font-semibold text-slate-700">
                              {isRemove ? "-" : "+"}
                              {formatVnd(
                                am.totalPrice ?? (am.pricePerUnit ?? 0) * am.quantity
                              )} / {getBillingUnitLabel(am.billingUnit, locale)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Dual-Party Signature Progress (shown for DRAFT and ACTIVE addendums) */}
                      {(isAddendumDraft ||
                        addendum.status === ContractAddendumStatusEnum.ACTIVE) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div
                            className={`rounded-xl border p-2.5 flex items-center justify-between ${
                              addendum.customerSigned
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <div>
                              <p className="font-extrabold text-[11px]">
                                {isEn ? "Customer Signature" : "Chữ ký Khách hàng"}
                              </p>
                              <p className="text-[11px]">
                                {addendum.customerSigned
                                  ? `${isEn ? "Signed:" : "Đã ký:"} ${formatDateTime(addendum.customerSignedAt, locale)}`
                                  : isEn
                                    ? "Waiting for customer to sign"
                                    : "Chờ khách ký xác nhận"}
                              </p>
                            </div>
                            {addendum.customerSigned ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                          </div>

                          <div
                            className={`rounded-xl border p-2.5 flex items-center justify-between ${
                              addendum.staffSigned
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <div>
                              <p className="font-extrabold text-[11px]">
                                {isEn ? "Staff Handover Signature" : "Chữ ký Nhân viên"}
                              </p>
                              <p className="text-[11px]">
                                {addendum.staffSigned
                                  ? `${isEn ? "Signed:" : "Đã ký:"} ${formatDateTime(addendum.staffSignedAt, locale)}`
                                  : isEn
                                    ? "Waiting for staff handover sign"
                                    : "Chờ nhân viên ký nghiệm thu"}
                              </p>
                            </div>
                            {addendum.staffSigned ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Metadata & Reasons */}
                      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-500">
                        <div>
                          {addendum.assignedStaff?.name && (
                            <span className="mr-3">
                              {isEn ? "Assigned Staff:" : "NV thực hiện:"}{" "}
                              <strong className="text-slate-700">
                                {addendum.assignedStaff.name}
                              </strong>
                            </span>
                          )}
                          {addendum.notes && (
                            <span>
                              {isEn ? "Notes:" : "Ghi chú:"} {addendum.notes}
                            </span>
                          )}
                          {addendum.rejectionReason && (
                            <span className="text-rose-700 font-semibold block mt-0.5">
                              {isEn ? "Rejection Reason:" : "Lý do từ chối:"}{" "}
                              {addendum.rejectionReason}
                            </span>
                          )}
                          {addendum.cancellationReason && (
                            <span className="text-slate-600 font-semibold block mt-0.5">
                              {isEn ? "Cancellation Reason:" : "Lý do hủy:"}{" "}
                              {addendum.cancellationReason}
                            </span>
                          )}
                        </div>

                        {/* Addendum Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Manager Actions on PENDING_APPROVAL */}
                          {isManager && isPendingApproval && (
                            <>
                              <button
                                type="button"
                                onClick={() => setApproveAddendumTarget(addendum)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isEn ? "Approve & Assign Staff" : "Duyệt & Giao nhân viên"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectAddendumTarget(addendum)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                {isEn ? "Reject" : "Từ chối"}
                              </button>
                            </>
                          )}

                          {/* Staff / Manager Sign Action on DRAFT when !staffSigned */}
                          {isAddendumDraft && !addendum.staffSigned && (
                            <button
                              type="button"
                              onClick={() => setStaffSignAddendumTarget(addendum)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shadow-sm ${
                                isRemove
                                  ? "bg-orange-600 hover:bg-orange-700"
                                  : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              {isRemove
                                ? isEn
                                  ? "Confirm Removal & Sign"
                                  : "Xác nhận tháo dỡ thu hồi & Ký nghiệm thu"
                                : isEn
                                  ? "Confirm Installation & Sign"
                                  : "Xác nhận bàn giao lắp đặt & Ký phụ lục"}
                            </button>
                          )}

                          {/* Cancel Addendum on PENDING_APPROVAL or DRAFT */}
                          {canCancelAddendum && (
                            <button
                              type="button"
                              onClick={() => setCancelAddendumTarget(addendum)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 font-bold text-xs transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {isEn ? "Cancel Addendum" : "Hủy phụ lục"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lease Renewal History */}
          {contract.renewals && contract.renewals.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  {isEn ? "Lease Renewal History" : "Lịch sử Gia hạn Hợp đồng"} (
                  {contract.renewalCount || contract.renewals.length})
                </h3>
              </div>

              <div className="space-y-2.5">
                {contract.renewals.map((rn, idx) => (
                  <div
                    key={`${rn.renewedAt}-${idx}`}
                    className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800">
                        {formatDateOnly(rn.previousEndDate, locale)} →{" "}
                        <span className="text-emerald-700">
                          {formatDateOnly(rn.newEndDate, locale)}
                        </span>{" "}
                        (+{rn.additionalDuration} {getBillingUnitLabel(rn.billingUnit, locale)})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDateTime(rn.renewedAt, locale)}
                        {rn.renewedBy?.name ? ` • ${rn.renewedBy.name}` : ""}
                      </p>
                    </div>
                    <div className="font-extrabold text-teal-700 text-sm">
                      +{formatVnd(rn.additionalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Financial Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 self-start">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            {isEn ? "Financial Breakdown" : "Chi tiết Tài chính Hợp đồng"}
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">
                {isEn ? "Base Rental Price:" : "Giá thuê kho cơ bản:"}
              </span>
              <strong className="text-slate-900">
                {formatVnd(contract.rentalPrice)} /{" "}
                {getBillingUnitLabel(contract.billingUnit, locale)}
              </strong>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">
                {isEn ? "Amenities Total:" : "Tổng phí tiện ích:"}
              </span>
              <strong className="text-slate-900">{formatVnd(contract.amenitiesTotalPrice)}</strong>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-sm">
                {isEn ? "Total Periodic Price:" : "Tổng giá thuê định kỳ:"}
              </span>
              <strong className="text-emerald-700 text-base font-extrabold">
                {formatVnd(contract.totalPeriodicPrice)} /{" "}
                {getBillingUnitLabel(contract.billingUnit, locale)}
              </strong>
            </div>

            {/* Security Deposit Status Box */}
            <div
              className={`rounded-2xl border p-4 space-y-1.5 ${
                isDepositSatisfied
                  ? "bg-emerald-50/70 border-emerald-200"
                  : "bg-amber-50/70 border-amber-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-extrabold ${
                    isDepositSatisfied ? "text-emerald-900" : "text-amber-900"
                  }`}
                >
                  {isEn ? "Security Deposit:" : "Tiền đặt cọc hợp đồng:"}
                </span>
                <span
                  className={`text-base font-extrabold ${
                    isDepositSatisfied ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {formatVnd(contract.depositAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <ContractDepositBadge
                  source={contract.source}
                  depositPaidAt={contract.depositPaidAt}
                />
                {contract.depositPaidAt && (
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {formatDateTime(contract.depositPaidAt, locale)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      <CollectWalkInDepositModal
        isOpen={Boolean(collectPaymentPurpose)}
        onClose={() => setCollectPaymentPurpose(null)}
        contract={contract}
      />

      <CheckInContractModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        contract={contract}
      />

      <CancelDraftContractModal
        isOpen={isCancelDraftOpen}
        onClose={() => setIsCancelDraftOpen(false)}
        contract={contract}
      />

      <RenewContractModal
        isOpen={isRenewOpen}
        onClose={() => setIsRenewOpen(false)}
        contract={contract}
      />

      <CreateContractAddendumModal
        isOpen={Boolean(createAddendumType)}
        onClose={() => setCreateAddendumType(null)}
        contract={contract}
        initialType={createAddendumType ?? ContractAddendumTypeEnum.ADD}
      />

      <ApproveContractAddendumModal
        isOpen={Boolean(approveAddendumTarget)}
        onClose={() => setApproveAddendumTarget(null)}
        contract={contract}
        addendum={approveAddendumTarget}
        staffs={staffsQuery.data?.items ?? []}
      />

      <RejectContractAddendumModal
        isOpen={Boolean(rejectAddendumTarget)}
        onClose={() => setRejectAddendumTarget(null)}
        contract={contract}
        addendum={rejectAddendumTarget}
      />

      <StaffSignContractAddendumModal
        isOpen={Boolean(staffSignAddendumTarget)}
        onClose={() => setStaffSignAddendumTarget(null)}
        contract={contract}
        addendum={staffSignAddendumTarget}
      />

      <CancelContractAddendumModal
        isOpen={Boolean(cancelAddendumTarget)}
        onClose={() => setCancelAddendumTarget(null)}
        contract={contract}
        addendum={cancelAddendumTarget}
      />

      <CheckOutContractModal
        isOpen={isCheckOutOpen}
        onClose={() => setIsCheckOutOpen(false)}
        contract={contract}
      />

      <TerminateContractModal
        isOpen={isTerminateOpen}
        onClose={() => setIsTerminateOpen(false)}
        contract={contract}
      />
    </div>
  );
};
