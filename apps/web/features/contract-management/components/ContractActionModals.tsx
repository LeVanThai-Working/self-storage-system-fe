"use client";

import React, { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  LogOut,
  MinusCircle,
  PlusCircle,
  QrCode,
  RefreshCw,
  ShieldAlert,
  Trash2,
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
import { useFacilityAmenityOfferings } from "@/features/request-center/hooks";
import {
  useApproveContractAddendum,
  useCancelContract,
  useCancelContractAddendum,
  useCheckInContract,
  useCheckOutContract,
  useConfirmManualContractPayment,
  useContractPayments,
  useCreateContractAddendum,
  useCreateContractDepositPayment,
  useRejectContractAddendum,
  useRenewContract,
  useStaffSignContractAddendum,
  useTerminateContract,
} from "../hooks";
import {
  ContractAddendumTypeEnum,
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  approveContractAddendumSchema,
  cancelContractAddendumSchema,
  cancelContractSchema,
  checkInContractSchema,
  checkOutContractSchema,
  confirmManualPaymentSchema,
  createContractAddendumSchema,
  rejectContractAddendumSchema,
  renewContractSchema,
  signContractAddendumSchema,
  terminateContractSchema,
  type ContractAddendumResponse,
  type ContractResponse,
  type FacilityStaffItem,
  type PaymentResponse,
} from "../types";
import {
  calculateCheckoutSettlementPreview,
  dateInputToIso,
  formatDateOnly,
  formatDateTime,
  formatVnd,
  getBillingUnitLabel,
  getDateInputWithOffset,
  getMaxRemovableAmenityQty,
  getPendingRemoveAmenityQty,
  resolveContractErrorMessage,
} from "../utils";

/* ============================================================================
 * 1. CollectWalkInDepositModal — Thu tiền cọc hợp đồng (CONTRACT_DEPOSIT) tại quầy
 * ========================================================================== */
interface CollectWalkInDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  purpose?: PaymentPurposeEnum;
  onSuccess?: () => void;
}

export const CollectWalkInDepositModal: React.FC<CollectWalkInDepositModalProps> = ({
  isOpen,
  onClose,
  contract,
  purpose = PaymentPurposeEnum.CONTRACT_DEPOSIT,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";

  const paymentsQuery = useContractPayments(isOpen ? contract?.id : null);
  const createDepositMutation = useCreateContractDepositPayment();
  const confirmManualMutation = useConfirmManualContractPayment();

  const [createdSession, setCreatedSession] = useState<PaymentResponse | null>(null);
  const [method, setMethod] = useState<PaymentMethodEnum>(PaymentMethodEnum.CASH);
  const [referenceCode, setReferenceCode] = useState("");
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!contract) return null;

  const existingPendingPayment =
    createdSession && createdSession.purpose === purpose
      ? createdSession
      : ((paymentsQuery.data?.items ?? []).find(
          (p) =>
            p.contractId === contract.id &&
            p.status === PaymentStatusEnum.PENDING &&
            p.purpose === purpose
        ) ?? null);

  const bankName =
    existingPendingPayment?.bankAccount?.bankName ||
    existingPendingPayment?.bankInfo?.bankCode ||
    "—";
  const accountNumber =
    existingPendingPayment?.bankAccount?.accountNumber ||
    existingPendingPayment?.bankInfo?.accountNumber ||
    "—";
  const accountHolder =
    existingPendingPayment?.bankAccount?.accountHolder ||
    existingPendingPayment?.bankInfo?.accountName ||
    "—";

  const requiredAmount = contract.depositAmount;

  const handleGenerateQrOrPayment = async (selectedMethod: PaymentMethodEnum) => {
    setErrorMsg(null);
    try {
      const payment = await createDepositMutation.mutateAsync({
        contractId: contract.id,
        method: selectedMethod,
        purpose,
      });
      setCreatedSession(payment);
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  const handleConfirmManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = confirmManualPaymentSchema.safeParse({
      method,
      referenceCode: referenceCode.trim() ? referenceCode.trim() : undefined,
      note:
        note.trim() ||
        (isEn ? "Collected contract deposit at counter" : "Đã thu tiền cọc hợp đồng tại quầy"),
    });

    if (!parsed.success) {
      setErrorMsg(
        parsed.error.issues[0]?.message ||
          (isEn
            ? "Please enter a valid reconciliation note (at least 2 characters)."
            : "Vui lòng nhập ghi chú đối soát hợp lệ (tối thiểu 2 ký tự).")
      );
      return;
    }

    try {
      let paymentId = existingPendingPayment?.id;
      if (!paymentId) {
        const created = await createDepositMutation.mutateAsync({
          contractId: contract.id,
          method,
          purpose,
        });
        setCreatedSession(created);
        paymentId = created.id;
      }

      await confirmManualMutation.mutateAsync({
        paymentId,
        payload: parsed.data,
      });

      setSuccessMsg(
        isEn
          ? "Contract deposit confirmed successfully!"
          : "Xác nhận thu tiền cọc hợp đồng thành công!"
      );
      onSuccess?.();
      setTimeout(onClose, 700);
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !confirmManualMutation.isPending && !createDepositMutation.isPending) {
          setErrorMsg(null);
          setSuccessMsg(null);
          setCreatedSession(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? `Collect Contract Deposit • ${contract.contractCode}`
                  : `Thu Tiền Cọc Hợp Đồng Tại Quầy • ${contract.contractCode}`}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "Generate SePay VietQR for customer scan or confirm direct cash/bank transfer at counter."
                  : "Tạo mã VietQR SePay cho khách quét hoặc xác nhận thu tiền mặt / chuyển khoản trực tiếp tại quầy."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleConfirmManual} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-900">
                {isEn ? "Deposit Amount Required" : "Số tiền đặt cọc cần thu"}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">#{contract.contractCode}</p>
            </div>
            <span className="text-xl font-extrabold text-emerald-700">
              {formatVnd(requiredAmount)}
            </span>
          </div>

          {/* VietQR SePay Section */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800">
                  {isEn ? "Option 1: VietQR SePay Scan" : "Cách 1: Quét mã VietQR SePay"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleGenerateQrOrPayment(PaymentMethodEnum.BANK_TRANSFER)}
                disabled={createDepositMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
              >
                <QrCode className="w-3.5 h-3.5" />
                {existingPendingPayment?.qrUrl
                  ? isEn
                    ? "Refresh QR"
                    : "Tải lại mã QR"
                  : isEn
                    ? "Create VietQR"
                    : "Tạo mã VietQR"}
              </button>
            </div>

            {existingPendingPayment?.qrUrl && (
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-slate-200/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={existingPendingPayment.qrUrl}
                  alt="VietQR Deposit"
                  className="w-36 h-36 rounded-xl border border-slate-200 bg-white p-1.5 object-contain shrink-0"
                />
                <div className="text-xs text-slate-600 space-y-1 flex-1">
                  <p>
                    <span className="font-bold text-slate-800">
                      {isEn ? "Payment Code:" : "Nội dung CK:"}
                    </span>{" "}
                    <span className="font-mono font-bold text-teal-700">
                      {existingPendingPayment.paymentCode}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">
                      {isEn ? "Bank:" : "Ngân hàng:"}
                    </span>{" "}
                    {bankName}
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">
                      {isEn ? "Account No:" : "Số tài khoản:"}
                    </span>{" "}
                    <span className="font-mono">{accountNumber}</span>
                  </p>
                  <p>
                    <span className="font-bold text-slate-800">
                      {isEn ? "Account Holder:" : "Chủ TK:"}
                    </span>{" "}
                    {accountHolder}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Manual Confirmation at Counter */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">
                {isEn
                  ? "Option 2: Confirm Cash / Bank Transfer at Counter"
                  : "Cách 2: Xác nhận đã thu Tiền mặt / Chuyển khoản tại quầy"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod(PaymentMethodEnum.CASH)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  method === PaymentMethodEnum.CASH
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <Banknote className="w-4 h-4" />
                {isEn ? "Cash at Counter" : "Tiền mặt tại quầy"}
              </button>
              <button
                type="button"
                onClick={() => setMethod(PaymentMethodEnum.BANK_TRANSFER)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  method === PaymentMethodEnum.BANK_TRANSFER
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                {isEn ? "Bank Transfer" : "Chuyển khoản"}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isEn
                  ? "Reference Code / Receipt No. (Optional)"
                  : "Mã giao dịch / Số phiếu thu (Tùy chọn)"}
              </label>
              <input
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder={
                  isEn ? "e.g., CASH-20261012 or FT..." : "VD: PT-00128 hoặc mã FT ngân hàng..."
                }
                className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isEn ? "Reconciliation Note *" : "Ghi chú xác nhận thu cọc *"}
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder={
                  isEn
                    ? "e.g., Received full deposit in cash at counter..."
                    : "VD: Đã thu đủ tiền cọc tại quầy lễ tân..."
                }
                className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none resize-none"
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

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Close" : "Đóng"}
            </button>
            <button
              type="submit"
              disabled={confirmManualMutation.isPending || createDepositMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {confirmManualMutation.isPending
                ? isEn
                  ? "Confirming..."
                  : "Đang xác nhận..."
                : isEn
                  ? "Confirm Deposit Paid"
                  : "Xác nhận Đã thu cọc"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 2. CheckInContractModal — Xác nhận bàn giao kho & Ký phía Nhân viên (POST /contracts/{id}/check-in)
 * ========================================================================== */
interface CheckInContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  onSuccess?: () => void;
}

export const CheckInContractModal: React.FC<CheckInContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const checkInMutation = useCheckInContract();

  const [verifiedIdentity, setVerifiedIdentity] = useState(true);
  const [verifiedUnitAndPin, setVerifiedUnitAndPin] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!contract) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!termsAccepted) {
      setErrorMsg(
        isEn
          ? "Terms must be accepted (termsAccepted: true) to sign and confirm handover."
          : "Bắt buộc phải đồng ý điều khoản bàn giao kho để thực hiện ký xác nhận."
      );
      return;
    }

    const parsed = checkInContractSchema.safeParse({
      termsAccepted,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Invalid check-in input.");
      return;
    }

    try {
      await checkInMutation.mutateAsync({
        id: contract.id,
        payload: parsed.data,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !checkInMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-emerald-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? `Confirm Handover & Sign (Staff) • ${contract.contractCode}`
                  : `Xác nhận bàn giao kho & Ký (Staff) • ${contract.contractCode}`}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "When both Customer and Staff have signed, the contract becomes ACTIVE and unit becomes OCCUPIED."
                  : "Khi cả Khách hàng và Nhân viên đã ký, hợp đồng sẽ kích hoạt sang ACTIVE và kho chuyển sang OCCUPIED."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Dual-party Signature Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div
              className={`rounded-2xl border p-3 ${
                contract.customerSigned
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-amber-50/70 border-amber-200 text-amber-900"
              }`}
            >
              <p className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    contract.customerSigned ? "text-emerald-600" : "text-amber-600"
                  }`}
                />
                {isEn ? "Customer Signature:" : "Chữ ký Khách hàng:"}
              </p>
              <p className="mt-1 text-[11px] font-semibold">
                {contract.customerSigned
                  ? `${isEn ? "Signed" : "Đã ký"} (${formatDateTime(
                      contract.customerSignedAt,
                      locale
                    )})`
                  : isEn
                    ? "Pending customer signature on Mobile App"
                    : "Chờ khách ký trên ứng dụng Mobile"}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-3 ${
                contract.staffSigned
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-teal-50/70 border-teal-200 text-teal-900"
              }`}
            >
              <p className="font-extrabold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                {isEn ? "Staff Signature:" : "Chữ ký Nhân viên:"}
              </p>
              <p className="mt-1 text-[11px] font-semibold">
                {contract.staffSigned
                  ? `${isEn ? "Signed" : "Đã ký"} (${formatDateTime(
                      contract.staffSignedAt,
                      locale
                    )})`
                  : isEn
                    ? "Signing now upon unit handover"
                    : "Sẽ ký xác nhận ở bước này"}
              </p>
            </div>
          </div>

          {/* Handover Checklist */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-3 text-xs">
            <p className="font-extrabold uppercase tracking-wider text-slate-500 text-[11px]">
              {isEn ? "Handover Verification Checklist" : "Checklist kiểm tra bàn giao kho"}
            </p>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedIdentity}
                onChange={(e) => setVerifiedIdentity(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700 font-medium">
                {isEn
                  ? "Verified customer ID card / citizen identification."
                  : "Đã đối chiếu CCCD/định danh của khách hàng."}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedUnitAndPin}
                onChange={(e) => setVerifiedUnitAndPin(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700 font-medium">
                {isEn
                  ? "Guided customer to inspect physical storage unit & handed over lock/PIN."
                  : "Đã dẫn khách kiểm tra kho thực tế & bàn giao khoá/mã PIN."}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  setErrorMsg(null);
                }}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-emerald-900 font-bold">
                {isEn
                  ? "I confirm physical storage unit handover and accept the lease agreement terms (Required) *"
                  : "Tôi xác nhận đã bàn giao kho thực tế và đồng ý ký xác nhận hợp đồng (Bắt buộc) *"}
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Handover & Unit Condition Notes" : "Ghi chú tình trạng kho lúc bàn giao"}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isEn
                  ? "Record unit cleanliness, lock code handed over, etc..."
                  : "Ghi chú tình trạng kho lúc nhận, mã khoá bàn giao..."
              }
              className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={checkInMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Đóng"}
            </button>
            <button
              type="submit"
              disabled={checkInMutation.isPending || !termsAccepted}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {checkInMutation.isPending
                ? isEn
                  ? "Signing & Checking in..."
                  : "Đang ký & xử lý..."
                : isEn
                  ? "Confirm Handover & Sign (Staff)"
                  : "Xác nhận bàn giao kho & Ký (Staff)"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 3. CancelDraftContractModal — Huỷ hợp đồng nháp (DRAFT -> CANCELLED)
 * ========================================================================== */
interface CancelDraftContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  onSuccess?: () => void;
}

export const CancelDraftContractModal: React.FC<CancelDraftContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const cancelMutation = useCancelContract();

  const [cancellationReason, setCancellationReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!contract) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = cancelContractSchema.safeParse({
      cancellationReason: cancellationReason.trim(),
    });
    if (!parsed.success) {
      setErrorMsg(
        isEn ? "Please enter a cancellation reason." : "Vui lòng nhập lý do hủy hợp đồng nháp."
      );
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: contract.id,
        payload: parsed.data,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !cancelMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-rose-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? `Cancel Draft Contract • ${contract.contractCode}`
                  : `Huỷ Hợp đồng nháp • ${contract.contractCode}`}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "Used when customer does not show up or cancels before Check-in."
                  : "Dùng khi khách không đến nhận kho hoặc huỷ trước khi Check-in."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 space-y-1.5">
            <div className="flex items-center gap-2 font-extrabold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              {isEn ? "Cancellation Policy Notice" : "Cảnh báo chính sách huỷ bản nháp"}
            </div>
            <p>
              {isEn
                ? `• 100% of deposit (${formatVnd(contract.depositAmount)}) is forfeited (refundAmount = 0 VND).`
                : `• Hệ thống tịch thu 100% tiền cọc (${formatVnd(contract.depositAmount)}, hoàn trả 0 VND).`}
            </p>
            <p>
              {isEn
                ? "• Assigned storage unit will be released back to AVAILABLE and amenity stock restored."
                : "• Giải phóng phòng kho về trạng thái Còn trống (AVAILABLE) và hoàn trả tồn kho tiện ích."}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Cancellation Reason *" : "Lý do huỷ hợp đồng nháp *"}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              required
              value={cancellationReason}
              onChange={(e) => {
                setCancellationReason(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                isEn
                  ? "Enter reason for cancelling draft contract..."
                  : "Nhập lý do huỷ (VD: Khách hàng báo không đến nhận kho)..."
              }
              className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={cancelMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Back" : "Quay lại"}
            </button>
            <button
              type="submit"
              disabled={cancelMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-50"
            >
              {cancelMutation.isPending
                ? isEn
                  ? "Cancelling..."
                  : "Đang huỷ..."
                : isEn
                  ? "Confirm Cancel Draft"
                  : "Xác nhận huỷ hợp đồng nháp"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 4. RenewContractModal — Gia hạn hợp đồng (ACTIVE / OVERDUE -> ACTIVE)
 * ========================================================================== */
interface RenewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  onSuccess?: () => void;
}

export const RenewContractModal: React.FC<RenewContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const renewMutation = useRenewContract();

  const minNextDateInput = contract
    ? getDateInputWithOffset(1, contract.endDate)
    : getDateInputWithOffset(1);

  const [newEndDateInput, setNewEndDateInput] = useState(() =>
    contract ? getDateInputWithOffset(30, contract.endDate) : getDateInputWithOffset(30)
  );
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!contract) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const newEndIso = dateInputToIso(newEndDateInput, false);
    if (!newEndIso || new Date(newEndIso).getTime() <= new Date(contract.endDate).getTime()) {
      setErrorMsg(
        isEn
          ? "New end date must be strictly after the current contract end date."
          : "Ngày kết thúc mới bắt buộc phải lớn hơn ngày kết thúc hiện tại của hợp đồng."
      );
      return;
    }

    const parsed = renewContractSchema.safeParse({
      newEndDate: newEndIso,
      note: note.trim() ? note.trim() : undefined,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Invalid renewal input.");
      return;
    }

    try {
      await renewMutation.mutateAsync({
        id: contract.id,
        payload: parsed.data,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !renewMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-teal-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? `Renew Contract • ${contract.contractCode}`
                  : `Gia hạn Hợp đồng • ${contract.contractCode}`}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "Extend contract end date and transition OVERDUE back to ACTIVE."
                  : "Kéo dài thời hạn thuê kho (chuyển hợp đồng quá hạn về lại Đang thuê ACTIVE)."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs space-y-1">
            <p>
              <span className="font-bold text-slate-700">
                {isEn ? "Current End Date:" : "Ngày hết hạn hiện tại:"}
              </span>{" "}
              <strong className="text-emerald-700">
                {formatDateOnly(contract.endDate, locale)}
              </strong>
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              {isEn ? "New End Date *" : "Ngày kết thúc gia hạn mới *"}
            </label>
            <input
              type="date"
              required
              min={minNextDateInput}
              value={newEndDateInput}
              onChange={(e) => {
                setNewEndDateInput(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full bg-slate-50 focus:bg-white text-sm font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {[30, 60, 90, 180].map((days) => {
                const presetVal = getDateInputWithOffset(days, contract.endDate);
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setNewEndDateInput(presetVal);
                      setErrorMsg(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      newEndDateInput === presetVal
                        ? "bg-teal-50 border-teal-500 text-teal-700"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    +{days} {isEn ? "days" : "ngày"} ({presetVal})
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Renewal Note (Optional)" : "Ghi chú gia hạn (Tùy chọn)"}
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isEn ? "Enter renewal note..." : "Nhập ghi chú gia hạn hợp đồng..."}
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={renewMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Đóng"}
            </button>
            <button
              type="submit"
              disabled={renewMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm disabled:opacity-50"
            >
              {renewMutation.isPending
                ? isEn
                  ? "Renewing..."
                  : "Đang gia hạn..."
                : isEn
                  ? "Confirm Renewal"
                  : "Xác nhận Gia hạn"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 5A. CreateContractAddendumModal — Tạo Phụ lục Hợp đồng (Thuê thêm ADD / Tháo dỡ REMOVE)
 * ========================================================================== */
interface CreateContractAddendumModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  initialType?: ContractAddendumTypeEnum;
  onSuccess?: () => void;
}

export const CreateContractAddendumModal: React.FC<CreateContractAddendumModalProps> = ({
  isOpen,
  onClose,
  contract,
  initialType = ContractAddendumTypeEnum.ADD,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";

  const [typeOverride, setTypeOverride] = useState<ContractAddendumTypeEnum | null>(null);
  const type = typeOverride ?? initialType;
  const setType = (nextType: ContractAddendumTypeEnum) => setTypeOverride(nextType);
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const amenityOfferingsQuery = useFacilityAmenityOfferings(contract?.facilityId);
  const availableOfferings = useMemo(
    () => (amenityOfferingsQuery.data ?? []).filter((a) => (a.availableQuantity ?? 0) > 0),
    [amenityOfferingsQuery.data]
  );

  const removableItems = useMemo(() => {
    if (!contract?.amenities) return [];
    return contract.amenities.map((item) => {
      const pendingRemoveQty = getPendingRemoveAmenityQty(
        contract.addendums,
        item.facilityAmenityOfferingId
      );
      const maxRemovableQty = getMaxRemovableAmenityQty(contract, item.facilityAmenityOfferingId);
      return {
        ...item,
        pendingRemoveQty,
        maxRemovableQty,
      };
    });
  }, [contract]);

  const createAddendumMutation = useCreateContractAddendum();

  if (!contract) return null;

  const isAdd = type === ContractAddendumTypeEnum.ADD;

  const activeAddOffering =
    availableOfferings.find((o) => o.id === selectedOfferingId) ?? availableOfferings[0] ?? null;

  const eligibleRemovableItems = removableItems.filter((i) => i.maxRemovableQty > 0);
  const activeRemoveItem =
    eligibleRemovableItems.find((i) => i.facilityAmenityOfferingId === selectedOfferingId) ??
    eligibleRemovableItems[0] ??
    null;

  const maxAllowedQty = isAdd
    ? (activeAddOffering?.availableQuantity ?? 1)
    : (activeRemoveItem?.maxRemovableQty ?? 1);

  const safeQty = Math.min(Math.max(1, Number(quantity) || 1), Math.max(1, maxAllowedQty));

  const unitPrice = isAdd
    ? (activeAddOffering?.pricePerUnit ?? 0)
    : (activeRemoveItem?.pricePerUnit ?? 0);
  const estimatedPeriodicDelta = unitPrice * safeQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const targetOfferingId = isAdd
      ? activeAddOffering?.id
      : activeRemoveItem?.facilityAmenityOfferingId;

    if (!targetOfferingId) {
      setErrorMsg(
        isAdd
          ? isEn
            ? "No available amenity offerings in stock at this facility."
            : "Hiện không có tiện ích nào còn tồn kho tại cơ sở."
          : isEn
            ? "No removable amenities available on this contract."
            : "Hiện không còn tiện ích nào có thể yêu cầu tháo dỡ / trả bớt."
      );
      return;
    }

    if (!isAdd && activeRemoveItem && safeQty > activeRemoveItem.maxRemovableQty) {
      setErrorMsg(
        isEn
          ? `Requested removal quantity (${safeQty}) exceeds maximum removable quantity (${activeRemoveItem.maxRemovableQty}).`
          : `Số lượng yêu cầu trả bớt (${safeQty}) vượt quá số lượng khả dụng có thể tháo dỡ (${activeRemoveItem.maxRemovableQty}).`
      );
      return;
    }

    const parsed = createContractAddendumSchema.safeParse({
      type,
      amenities: [
        {
          facilityAmenityOfferingId: targetOfferingId,
          quantity: safeQty,
        },
      ],
      notes: notes.trim() ? notes.trim() : undefined,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Invalid addendum input.");
      return;
    }

    try {
      await createAddendumMutation.mutateAsync({
        id: contract.id,
        payload: parsed.data,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !createAddendumMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader
          className={`p-6 pb-4 border-b border-slate-100 ${
            isAdd ? "bg-emerald-50/60" : "bg-orange-50/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                isAdd
                  ? "bg-emerald-600 shadow-emerald-500/20"
                  : "bg-orange-600 shadow-orange-500/20"
              }`}
            >
              {isAdd ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isAdd
                  ? isEn
                    ? "Create Addendum: Add / Install Amenities"
                    : "Tạo Phụ lục: Thuê thêm / Lắp đặt tiện ích"
                  : isEn
                    ? "Create Addendum: Remove / Return Amenities"
                    : "Tạo Phụ lục: Yêu cầu tháo dỡ / Trả bớt tiện ích"}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">#{contract.contractCode}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Addendum Type Toggle */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setType(ContractAddendumTypeEnum.ADD);
                setSelectedOfferingId("");
                setQuantity(1);
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                isAdd
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              {isEn ? "Add / Install (ADD)" : "Thuê thêm / Lắp đặt"}
            </button>
            <button
              type="button"
              disabled={(contract.amenities?.length ?? 0) === 0}
              onClick={() => {
                setType(ContractAddendumTypeEnum.REMOVE);
                setSelectedOfferingId("");
                setQuantity(1);
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 ${
                !isAdd
                  ? "bg-orange-50 border-orange-500 text-orange-700"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              {isEn ? "Remove / Return (REMOVE)" : "Tháo dỡ / Trả bớt"}
            </button>
          </div>

          {isAdd ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {isEn ? "Select Facility Amenity *" : "Chọn tiện ích tại cơ sở *"}
              </label>
              <select
                value={activeAddOffering?.id ?? ""}
                onChange={(e) => {
                  setSelectedOfferingId(e.target.value);
                  setQuantity(1);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              >
                {availableOfferings.length === 0 ? (
                  <option value="">
                    {isEn ? "No amenities in stock" : "Không có tiện ích còn tồn kho"}
                  </option>
                ) : (
                  availableOfferings.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.amenity.name} — {formatVnd(item.pricePerUnit)} (
                      {isEn ? `Stock: ${item.availableQuantity}` : `Còn: ${item.availableQuantity}`}
                      )
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {isEn
                  ? "Select Currently Rented Amenity to Remove *"
                  : "Chọn tiện ích đang thuê cần tháo dỡ / trả bớt *"}
              </label>
              <select
                value={activeRemoveItem?.facilityAmenityOfferingId ?? ""}
                onChange={(e) => {
                  setSelectedOfferingId(e.target.value);
                  setQuantity(1);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 outline-none"
              >
                {eligibleRemovableItems.length === 0 ? (
                  <option value="">
                    {isEn
                      ? "All rented amenities already have pending removal requests"
                      : "Tất cả tiện ích đang thuê đều đã có yêu cầu tháo dỡ chờ xử lý"}
                  </option>
                ) : (
                  eligibleRemovableItems.map((item) => (
                    <option
                      key={item.facilityAmenityOfferingId}
                      value={item.facilityAmenityOfferingId}
                    >
                      {item.name || item.facilityAmenityOfferingId} — {formatVnd(item.pricePerUnit)}{" "}
                      (
                      {isEn
                        ? `Rented: ${item.quantity}, Max removable: ${item.maxRemovableQty}`
                        : `Đang thuê: ${item.quantity}, Tối đa trả bớt: ${item.maxRemovableQty}`}
                      )
                    </option>
                  ))
                )}
              </select>
              {activeRemoveItem && activeRemoveItem.pendingRemoveQty > 0 && (
                <p className="text-[11px] text-amber-700 font-semibold">
                  {isEn
                    ? `Note: ${activeRemoveItem.pendingRemoveQty} unit(s) already in pending removal addendums.`
                    : `Lưu ý: Đang có ${activeRemoveItem.pendingRemoveQty} thiết bị nằm trong phụ lục tháo dỡ chờ duyệt/ký.`}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn
                ? `Quantity (Max: ${maxAllowedQty}) *`
                : `Số lượng (Tối đa: ${maxAllowedQty}) *`}
            </label>
            <input
              type="number"
              min={1}
              max={Math.max(1, maxAllowedQty)}
              value={safeQty}
              onChange={(e) =>
                setQuantity(
                  Math.min(Math.max(1, Number(e.target.value) || 1), Math.max(1, maxAllowedQty))
                )
              }
              className="w-full bg-slate-50 focus:bg-white text-sm font-bold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Addendum Notes (Optional)" : "Ghi chú yêu cầu phụ lục (Tùy chọn)"}
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isAdd
                  ? isEn
                    ? "e.g., Requesting additional shelving rack installation..."
                    : "VD: Yêu cầu lắp thêm kệ sắt lưu trữ..."
                  : isEn
                    ? "e.g., Returning dehumidifier unit no longer needed..."
                    : "VD: Yêu cầu tháo dỡ trả bớt thiết bị không còn nhu cầu sử dụng..."
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          <div
            className={`rounded-xl border p-3 flex items-center justify-between text-xs ${
              isAdd ? "bg-emerald-50/70 border-emerald-200" : "bg-orange-50/70 border-orange-200"
            }`}
          >
            <span className="font-semibold text-slate-700">
              {isAdd
                ? isEn
                  ? "Periodic Fee Increase (upon activation):"
                  : "Tăng phí thuê định kỳ (khi phụ lục ACTIVE):"
                : isEn
                  ? "Periodic Fee Reduction (from next cycle):"
                  : "Giảm phí thuê định kỳ (áp dụng từ kỳ tiếp theo):"}
            </span>
            <strong
              className={`text-sm font-extrabold ${isAdd ? "text-emerald-700" : "text-orange-700"}`}
            >
              {isAdd ? "+" : "-"} {formatVnd(estimatedPeriodicDelta)} /{" "}
              {getBillingUnitLabel(contract.billingUnit, locale)}
            </strong>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createAddendumMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Hủy"}
            </button>
            <button
              type="submit"
              disabled={
                createAddendumMutation.isPending || (isAdd ? !activeAddOffering : !activeRemoveItem)
              }
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-50 ${
                isAdd ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {createAddendumMutation.isPending
                ? isEn
                  ? "Submitting..."
                  : "Đang gửi yêu cầu..."
                : isAdd
                  ? isEn
                    ? "Submit Add Addendum"
                    : "Tạo phụ lục thuê thêm"
                  : isEn
                    ? "Submit Removal Addendum"
                    : "Tạo phụ lục tháo dỡ"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 5B. ApproveContractAddendumModal — Quản lý Duyệt & Phân công NV (PENDING_APPROVAL -> DRAFT)
 * ========================================================================== */
interface ApproveContractAddendumModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  addendum: ContractAddendumResponse | null;
  staffs: FacilityStaffItem[];
  onSuccess?: () => void;
}

export const ApproveContractAddendumModal: React.FC<ApproveContractAddendumModalProps> = ({
  isOpen,
  onClose,
  contract,
  addendum,
  staffs,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const approveMutation = useApproveContractAddendum();

  const [assignedStaffIdOverride, setAssignedStaffIdOverride] = useState<string | null>(null);
  const assignedStaffId = assignedStaffIdOverride ?? contract?.assignedStaffId ?? "";
  const setAssignedStaffId = (val: string) => setAssignedStaffIdOverride(val);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!contract || !addendum) return null;

  const isAdd = addendum.type === ContractAddendumTypeEnum.ADD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = approveContractAddendumSchema.safeParse({
      assignedStaffId: assignedStaffId.trim() ? assignedStaffId.trim() : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Invalid approval input.");
      return;
    }

    try {
      await approveMutation.mutateAsync({
        id: contract.id,
        addendumId: addendum.id,
        payload: parsed.data,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !approveMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-emerald-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? `Approve Addendum & Assign Staff • ${addendum.addendumCode}`
                  : `Duyệt Phụ lục & Phân công Nhân viên • ${addendum.addendumCode}`}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdd
                  ? isEn
                    ? "Assign facility staff to install the requested amenities (status → DRAFT)."
                    : "Phân công nhân viên cơ sở đi lắp đặt tiện ích và chuyển phụ lục sang DRAFT."
                  : isEn
                    ? "Assign facility staff to remove & inspect the returned amenities (status → DRAFT)."
                    : "Phân công nhân viên cơ sở đi tháo dỡ thu hồi tiện ích và chuyển phụ lục sang DRAFT."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isAdd
                ? isEn
                  ? "Assign Staff for Installation"
                  : "Nhân viên phụ trách lắp đặt tiện ích"
                : isEn
                  ? "Assign Staff for Removal & Inspection"
                  : "Nhân viên phụ trách tháo dỡ & thu hồi"}
            </label>
            <select
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
            >
              <option value="">
                {isEn ? "— Unassigned / Any Staff —" : "— Chưa chỉ định đích danh —"}
              </option>
              {staffs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Manager Approval Notes (Optional)" : "Ghi chú duyệt của Quản lý (Tùy chọn)"}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isEn
                  ? "Instructions for staff regarding installation or removal..."
                  : "Ghi chú hướng dẫn cho nhân viên đi lắp đặt hoặc tháo dỡ..."
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={approveMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Hủy"}
            </button>
            <button
              type="submit"
              disabled={approveMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {approveMutation.isPending
                ? isEn
                  ? "Approving..."
                  : "Đang duyệt..."
                : isEn
                  ? "Approve & Move to DRAFT"
                  : "Xác nhận Duyệt & Giao việc"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 5C. RejectContractAddendumModal — Quản lý Từ chối Phụ lục (PENDING_APPROVAL -> REJECTED)
 * ========================================================================== */
interface RejectContractAddendumModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  addendum: ContractAddendumResponse | null;
  onSuccess?: () => void;
}

export const RejectContractAddendumModal: React.FC<RejectContractAddendumModalProps> = ({
  isOpen,
  onClose,
  contract,
  addendum,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const rejectMutation = useRejectContractAddendum();

  const [rejectionReason, setRejectionReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!contract || !addendum) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = rejectContractAddendumSchema.safeParse({
      rejectionReason: rejectionReason.trim(),
    });

    if (!parsed.success) {
      setErrorMsg(
        isEn ? "Please enter a rejection reason." : "Vui lòng nhập lý do từ chối phụ lục."
      );
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: contract.id,
        addendumId: addendum.id,
        payload: parsed.data,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !rejectMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-rose-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? `Reject Addendum • ${addendum.addendumCode}`
                  : `Từ chối Phụ lục Hợp đồng • ${addendum.addendumCode}`}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "If this is an ADD addendum, reserved amenity stock will be automatically restored."
                  : "Nếu là phụ lục thuê thêm (ADD), tồn kho tiện ích tạm giữ sẽ tự động được hoàn trả."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Rejection Reason *" : "Lý do từ chối *"}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              required
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                isEn
                  ? "Enter reason for rejecting this addendum..."
                  : "Nhập lý do từ chối yêu cầu phụ lục hợp đồng..."
              }
              className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={rejectMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Back" : "Quay lại"}
            </button>
            <button
              type="submit"
              disabled={rejectMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-50"
            >
              {rejectMutation.isPending
                ? isEn
                  ? "Rejecting..."
                  : "Đang xử lý..."
                : isEn
                  ? "Confirm Reject"
                  : "Xác nhận Từ chối"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 5D. StaffSignContractAddendumModal — Nhân viên/Quản lý Ký Phụ lục (POST /contracts/{id}/addendums/{addendumId}/staff-sign)
 * ========================================================================== */
interface StaffSignContractAddendumModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  addendum: ContractAddendumResponse | null;
  onSuccess?: () => void;
}

export const StaffSignContractAddendumModal: React.FC<StaffSignContractAddendumModalProps> = ({
  isOpen,
  onClose,
  contract,
  addendum,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const staffSignMutation = useStaffSignContractAddendum();

  const [termsAccepted, setTermsAccepted] = useState(true);
  const [damageFeeInput, setDamageFeeInput] = useState("0");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!contract || !addendum) return null;

  const isRemove = addendum.type === ContractAddendumTypeEnum.REMOVE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!termsAccepted) {
      setErrorMsg(
        isEn
          ? "You must accept the addendum terms (termsAccepted: true) to sign."
          : "Bắt buộc phải đồng ý xác nhận nghiệm thu để ký phụ lục."
      );
      return;
    }

    const rawPayload: Record<string, unknown> = {
      termsAccepted,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    if (isRemove) {
      rawPayload.damageFee = Math.max(0, Number(damageFeeInput) || 0);
    }

    const parsed = signContractAddendumSchema.safeParse(rawPayload);
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Invalid addendum signature input.");
      return;
    }

    try {
      await staffSignMutation.mutateAsync({
        id: contract.id,
        addendumId: addendum.id,
        payload: parsed.data,
      });
      setTermsAccepted(true);
      setDamageFeeInput("0");
      setNotes("");
      setErrorMsg(null);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !staffSignMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader
          className={`p-6 pb-4 border-b border-slate-100 ${
            isRemove ? "bg-orange-50/70" : "bg-emerald-50/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                isRemove
                  ? "bg-orange-600 shadow-orange-500/20"
                  : "bg-emerald-600 shadow-emerald-500/20"
              }`}
            >
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isRemove
                  ? isEn
                    ? `Confirm Removal & Sign Addendum • ${addendum.addendumCode}`
                    : `Xác nhận tháo dỡ thu hồi & Ký nghiệm thu • ${addendum.addendumCode}`
                  : isEn
                    ? `Confirm Installation & Sign Addendum • ${addendum.addendumCode}`
                    : `Xác nhận bàn giao lắp đặt & Ký phụ lục • ${addendum.addendumCode}`}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "Once both Customer and Staff have signed, the addendum becomes ACTIVE."
                  : "Khi cả Khách hàng và Nhân viên hoàn tất ký, phụ lục sẽ tự động chuyển sang ACTIVE."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ONLY show damageFee input when addendum.type === 'remove' */}
          {isRemove && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {isEn
                  ? "Equipment Damage Compensation Fee (VND, >= 0)"
                  : "Phí đền bù hư hại thiết bị thu hồi (VND, >= 0)"}
              </label>
              <input
                type="number"
                min={0}
                value={damageFeeInput}
                onChange={(e) => {
                  setDamageFeeInput(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 focus:bg-white text-sm font-extrabold text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {isEn
                  ? "Default 0 VND if returned equipment is in good working condition."
                  : "Mặc định 0đ nếu thiết bị thu hồi nguyên vẹn, không hư hỏng."}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isRemove
                ? isEn
                  ? "Equipment Removal & Condition Notes"
                  : "Ghi chú tình trạng thiết bị khi tháo dỡ / thu hồi"
                : isEn
                  ? "Equipment Installation & Handover Notes"
                  : "Ghi chú tình trạng thiết bị khi lắp đặt / bàn giao"}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isRemove
                  ? isEn
                    ? "Record equipment condition upon removal..."
                    : "Ghi nhận tình trạng thiết bị khi tháo dỡ thu hồi..."
                  : isEn
                    ? "Record installation details and handover confirmation..."
                    : "Ghi nhận chi tiết lắp đặt thiết bị vào kho cho khách..."
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-xs">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                setErrorMsg(null);
              }}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-bold text-slate-800">
              {isRemove
                ? isEn
                  ? "I confirm that the amenities have been physically removed, inspected, and returned to stock (Required) *"
                  : "Tôi xác nhận đã tháo dỡ, kiểm tra thiết bị thu hồi và đồng ý ký nghiệm thu phụ lục (Bắt buộc) *"
                : isEn
                  ? "I confirm that the amenities have been physically installed and handed over to the customer (Required) *"
                  : "Tôi xác nhận đã lắp đặt, bàn giao tiện ích cho khách và đồng ý ký phụ lục (Bắt buộc) *"}
            </span>
          </label>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={staffSignMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Đóng"}
            </button>
            <button
              type="submit"
              disabled={staffSignMutation.isPending || !termsAccepted}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-50 ${
                isRemove
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {staffSignMutation.isPending
                ? isEn
                  ? "Signing..."
                  : "Đang ký xác nhận..."
                : isRemove
                  ? isEn
                    ? "Confirm Removal & Sign"
                    : "Xác nhận tháo dỡ thu hồi & Ký nghiệm thu"
                  : isEn
                    ? "Confirm Installation & Sign"
                    : "Xác nhận bàn giao lắp đặt & Ký phụ lục"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 5E. CancelContractAddendumModal — Huỷ Phụ lục Hợp đồng (PENDING_APPROVAL / DRAFT -> CANCELLED)
 * ========================================================================== */
interface CancelContractAddendumModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  addendum: ContractAddendumResponse | null;
  onSuccess?: () => void;
}

export const CancelContractAddendumModal: React.FC<CancelContractAddendumModalProps> = ({
  isOpen,
  onClose,
  contract,
  addendum,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const cancelAddendumMutation = useCancelContractAddendum();

  const [cancellationReason, setCancellationReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!contract || !addendum) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = cancelContractAddendumSchema.safeParse({
      cancellationReason: cancellationReason.trim(),
    });

    if (!parsed.success) {
      setErrorMsg(
        isEn ? "Please enter a cancellation reason." : "Vui lòng nhập lý do hủy phụ lục hợp đồng."
      );
      return;
    }

    try {
      await cancelAddendumMutation.mutateAsync({
        id: contract.id,
        addendumId: addendum.id,
        payload: parsed.data,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !cancelAddendumMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-rose-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? `Cancel Addendum • ${addendum.addendumCode}`
                  : `Hủy Phụ lục Hợp đồng • ${addendum.addendumCode}`}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "Can only cancel addendums in pending_approval or draft status."
                  : "Áp dụng cho phụ lục đang ở trạng thái chờ duyệt (pending_approval) hoặc chờ ký (draft)."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Cancellation Reason *" : "Lý do hủy phụ lục *"}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              required
              value={cancellationReason}
              onChange={(e) => {
                setCancellationReason(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                isEn
                  ? "Enter reason for cancelling this addendum..."
                  : "Nhập lý do hủy yêu cầu phụ lục hợp đồng..."
              }
              className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={cancelAddendumMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Back" : "Quay lại"}
            </button>
            <button
              type="submit"
              disabled={cancelAddendumMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-50"
            >
              {cancelAddendumMutation.isPending
                ? isEn
                  ? "Cancelling..."
                  : "Đang hủy..."
                : isEn
                  ? "Confirm Cancel Addendum"
                  : "Xác nhận Hủy Phụ lục"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 6. CheckOutContractModal — Biên bản Kiểm tra & Thanh lý Kho (ACTIVE / OVERDUE -> COMPLETED)
 * ========================================================================== */
interface CheckOutContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  onSuccess?: () => void;
}

export const CheckOutContractModal: React.FC<CheckOutContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const checkOutMutation = useCheckOutContract();

  const [damageFeeInput, setDamageFeeInput] = useState<string>("0");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mountNowMs] = useState(() => Date.now());

  if (!contract) return null;

  const parsedDamageFee = Math.max(0, Number(damageFeeInput) || 0);
  const preview = calculateCheckoutSettlementPreview(contract, parsedDamageFee, mountNowMs);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = checkOutContractSchema.safeParse({
      damageFee: parsedDamageFee,
      inspectionNotes: inspectionNotes.trim() ? inspectionNotes.trim() : undefined,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Invalid check-out input.");
      return;
    }

    try {
      await checkOutMutation.mutateAsync({
        id: contract.id,
        payload: parsed.data,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !checkOutMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-sky-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? `Storage Inspection & Check-out • ${contract.contractCode}`
                  : `Biên bản Kiểm tra & Thanh lý Kho • ${contract.contractCode}`}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "Complete contract (COMPLETED) and move unit to UNDER_MAINTENANCE for cleaning."
                  : "Hoàn tất hợp đồng (COMPLETED) và chuyển kho sang Đang bảo trì (UNDER_MAINTENANCE) chờ dọn dẹp."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {isEn ? "Damage Compensation Fee (VND)" : "Phí đền bù hư hại tài sản/kho (VND)"}
              </label>
              <input
                type="number"
                min={0}
                value={damageFeeInput}
                onChange={(e) => {
                  setDamageFeeInput(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 focus:bg-white text-sm font-extrabold text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 outline-none"
              />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs flex flex-col justify-center">
              <span className="text-slate-500 font-semibold">
                {isEn ? "Contract End Date:" : "Hạn kết thúc hợp đồng:"}
              </span>
              <span className="font-bold text-slate-800 mt-0.5">
                {formatDateTime(contract.endDate, locale)}
              </span>
              {preview.overdueDays > 0 && (
                <span className="text-orange-600 font-extrabold mt-0.5">
                  {isEn
                    ? `Overdue: ${preview.overdueDays} day(s)`
                    : `Trả trễ: ${preview.overdueDays} ngày`}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Inspection Notes" : "Biên bản kiểm tra kho khi trả (inspectionNotes)"}
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder={
                isEn
                  ? "Describe unit condition upon return, lock status, any damages..."
                  : "Ghi chú tình trạng kho khi nhận lại từ khách (sàn, vách, khoá cửa, vệ sinh...)..."
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 outline-none resize-none"
            />
          </div>

          {/* Real-time Settlement Preview Table */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5 text-xs">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {isEn
                ? "Automatic Settlement Preview (Real-time)"
                : "Bảng Tóm tắt Quyết toán Tự động (Real-time Preview)"}
            </p>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/70">
              <span className="text-slate-600 font-medium">
                {isEn ? "Held Deposit (depositAmount):" : "Tiền cọc đã giữ (depositAmount):"}
              </span>
              <span className="font-bold text-emerald-700">
                + {formatVnd(preview.depositAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/70">
              <span className="text-slate-600 font-medium">
                {isEn
                  ? `Estimated Overdue Fee (${preview.overdueDays} days × 1.5 × daily rate):`
                  : `Phí quá hạn dự kiến (${preview.overdueDays} ngày trễ × 1.5 × đơn giá ngày):`}
              </span>
              <span className="font-bold text-orange-600">
                - {formatVnd(preview.estimatedOverdueFee)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/70">
              <span className="text-slate-600 font-medium">
                {isEn ? "Damage Fee (damageFee):" : "Phí hư hại nhập vào (damageFee):"}
              </span>
              <span className="font-bold text-rose-600">- {formatVnd(preview.damageFee)}</span>
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900">
                  {isEn
                    ? "Refund to Customer (refundAmount):"
                    : "Số tiền hoàn trả khách (refundAmount):"}
                </span>
                <span className="text-sm font-extrabold text-emerald-700">
                  {formatVnd(preview.refundAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-900">
                  {isEn
                    ? "Additional Payment Required:"
                    : "Số tiền khách cần đóng thêm (additionalPaymentRequired):"}
                </span>
                <span className="text-sm font-extrabold text-amber-800">
                  {formatVnd(preview.additionalPaymentRequired)}
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={checkOutMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Đóng"}
            </button>
            <button
              type="submit"
              disabled={checkOutMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm disabled:opacity-50"
            >
              {checkOutMutation.isPending
                ? isEn
                  ? "Processing Check-out..."
                  : "Đang thanh lý..."
                : isEn
                  ? "Confirm Check-out & Settle"
                  : "Xác nhận Check-out & Thanh lý kho"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================================
 * 7. TerminateContractModal — Chấm dứt hợp đồng trước hạn (Chỉ FACILITY_MANAGER)
 * ========================================================================== */
interface TerminateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractResponse | null;
  onSuccess?: () => void;
}

export const TerminateContractModal: React.FC<TerminateContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const terminateMutation = useTerminateContract();

  const [terminationReason, setTerminationReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!contract) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = terminateContractSchema.safeParse({
      terminationReason: terminationReason.trim(),
    });
    if (!parsed.success) {
      setErrorMsg(
        isEn
          ? "Please enter a termination reason."
          : "Vui lòng nhập lý do chấm dứt hợp đồng trước hạn."
      );
      return;
    }

    try {
      await terminateMutation.mutateAsync({
        id: contract.id,
        payload: parsed.data,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !terminateMutation.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? `Terminate Contract Early • ${contract.contractCode}`
                  : `Chấm dứt Hợp đồng trước hạn • ${contract.contractCode}`}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "Facility Manager authority only (ACTIVE / OVERDUE → TERMINATED)."
                  : "Quyền hạn dành riêng cho Quản lý cơ sở (ACTIVE / OVERDUE → TERMINATED)."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Termination Reason *" : "Lý do chấm dứt hợp đồng *"}
            </label>
            <textarea
              rows={4}
              maxLength={1000}
              required
              value={terminationReason}
              onChange={(e) => {
                setTerminationReason(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                isEn
                  ? "Specify reason for early termination (e.g., policy violation, long overdue)..."
                  : "Nhập lý do chấm dứt hợp đồng trước hạn (VD: Vi phạm quy định lưu trữ, quá hạn kéo dài)..."
              }
              className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={terminateMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Hủy bỏ"}
            </button>
            <button
              type="submit"
              disabled={terminateMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-50"
            >
              {terminateMutation.isPending
                ? isEn
                  ? "Terminating..."
                  : "Đang xử lý..."
                : isEn
                  ? "Confirm Early Termination"
                  : "Xác nhận Chấm dứt Hợp đồng"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
