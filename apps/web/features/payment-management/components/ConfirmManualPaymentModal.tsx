"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { AlertCircle, AlertTriangle, Banknote, CreditCard, Receipt } from "lucide-react";
import { toast } from "sonner";
import { CloudinaryFolderEnum, confirmManualPaymentSchema } from "@self-storage-system-fe/shared";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirmManualPayment } from "../hooks";
import { PaymentMethodEnum, type PaymentResponse } from "../types";
import { formatVnd, resolvePaymentErrorMessage } from "../utils";

interface ConfirmManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentResponse | null;
  onSuccess?: () => void;
}

export const ConfirmManualPaymentModal: React.FC<ConfirmManualPaymentModalProps> = ({
  isOpen,
  onClose,
  payment,
  onSuccess,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";

  const confirmMutation = useConfirmManualPayment();

  const [method, setMethod] = useState<PaymentMethodEnum>(PaymentMethodEnum.CASH);
  const [referenceCode, setReferenceCode] = useState("");
  const [note, setNote] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!proofImageUrl.trim()) {
      setErrorMsg(
        isEn
          ? "Proof receipt image is required for manual payment verification (MESSAGE_CODE_509)."
          : "Bắt buộc đính kèm ảnh chụp biên lai / phiếu thu / sao kê (MESSAGE_CODE_509)."
      );
      return;
    }

    const parseResult = confirmManualPaymentSchema.safeParse({
      method,
      referenceCode: referenceCode.trim() ? referenceCode.trim() : undefined,
      proofImageUrl: proofImageUrl.trim(),
      note: note.trim(),
    });

    if (!parseResult.success) {
      setErrorMsg(
        parseResult.error.issues[0]?.message ||
          (isEn
            ? "Please enter a valid note (at least 2 characters)."
            : "Vui lòng nhập ghi chú đối soát hợp lệ (tối thiểu 2 ký tự).")
      );
      return;
    }

    try {
      await confirmMutation.mutateAsync({
        id: payment.id,
        payload: parseResult.data,
      });

      toast.success(
        isEn
          ? `Payment ${payment.paymentCode} manually confirmed!`
          : `Xác nhận thanh toán thủ công cho ${payment.paymentCode} thành công!`
      );
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(resolvePaymentErrorMessage(err, locale));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !confirmMutation.isPending) {
          setErrorMsg(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[92vh] flex flex-col p-0 rounded-2xl border-slate-200 shadow-2xl overflow-hidden bg-white">
        <DialogHeader className="p-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {isEn ? "Confirm Manual Payment" : "Xác nhận thu tiền tại quầy"}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? `Payment Code: ${payment.paymentCode}`
                  : `Mã đơn thanh toán: ${payment.paymentCode}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Amount Overview */}
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                {isEn ? "Amount to Collect" : "Số tiền cần thu"}
              </span>
              <span className="text-xs text-slate-500">
                {payment.customer?.name || isEn ? "Customer Payment" : "Khách hàng"}
              </span>
            </div>
            <span className="text-lg font-black text-emerald-700">{formatVnd(payment.amount)}</span>
          </div>

          {/* Maker-Checker Warning */}
          <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold block mb-0.5">
                {isEn ? "Maker-Checker Policy:" : "Quy định Maker-Checker:"}
              </strong>
              {isEn
                ? "The staff who manually confirms this payment will be restricted from approving refund requests for this order in the future."
                : "Nhân viên xác nhận thu tiền cho đơn này sẽ không được hệ thống cho phép duyệt yêu cầu hoàn tiền cho chính đơn này trong tương lai."}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isEn ? "Payment Method *" : "Hình thức thu tiền *"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod(PaymentMethodEnum.CASH)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                  method === PaymentMethodEnum.CASH
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                {isEn ? "Cash at Counter" : "Tiền mặt tại quầy"}
              </button>
              <button
                type="button"
                onClick={() => setMethod(PaymentMethodEnum.BANK_TRANSFER)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                  method === PaymentMethodEnum.BANK_TRANSFER
                    ? "bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <CreditCard className="w-4 h-4 text-indigo-600" />
                {isEn ? "Direct Transfer" : "Chuyển khoản trực tiếp"}
              </button>
            </div>
          </div>

          {/* Reference Code */}
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
                isEn
                  ? "e.g., PT-00234 or bank FT code..."
                  : "VD: PT-00234 hoặc mã giao dịch ngân hàng FT..."
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          {/* Mandatory Proof Image Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isEn
                ? "Proof Receipt Image * (Mandatory)"
                : "Ảnh biên lai / Hóa đơn chứng từ * (Bắt buộc)"}
            </label>
            <CloudinaryUploader
              label={
                isEn
                  ? "Upload Proof Receipt / Bank Slip"
                  : "Tải lên ảnh chụp biên lai giấy hoặc ủy nhiệm chi"
              }
              description={
                isEn
                  ? "Required proof for compliance audit (image/pdf)"
                  : "Ảnh chụp rõ nét số tiền và nội dung để đối soát"
              }
              folder={CloudinaryFolderEnum.GENERAL}
              value={proofImageUrl ? [proofImageUrl] : []}
              onChange={(urls) => {
                setProofImageUrl(urls[0] || "");
                setErrorMsg(null);
              }}
              multiple={false}
              maxFiles={1}
              accept="image/*,application/pdf"
              disabled={confirmMutation.isPending}
            />
          </div>

          {/* Mandatory Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isEn
                ? "Confirmation Note * (min 2 characters)"
                : "Ghi chú thu tiền * (tối thiểu 2 ký tự)"}
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
                  ? "e.g., Collected in cash at reception desk..."
                  : "VD: Đã thu đủ tiền mặt tại quầy lễ tân cơ sở..."
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none resize-none transition-colors"
            />
          </div>

          {/* Error Message */}
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
              disabled={confirmMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Hủy bỏ"}
            </button>
            <button
              type="submit"
              disabled={confirmMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-colors"
            >
              {confirmMutation.isPending
                ? isEn
                  ? "Confirming..."
                  : "Đang xác nhận..."
                : isEn
                  ? "Confirm Payment"
                  : "Xác nhận đã thu"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
