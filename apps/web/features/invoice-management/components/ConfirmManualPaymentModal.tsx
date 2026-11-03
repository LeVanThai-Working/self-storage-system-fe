"use client";

import React, { useState } from "react";
import { AlertCircle, Banknote, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import { CloudinaryFolderEnum } from "@self-storage-system-fe/shared";
import { useAuthStore } from "@/features/auth/store";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useConfirmManualInvoicePayment } from "../hooks";
import {
  InvoiceTypeEnum,
  PaymentMethodEnum,
  confirmManualInvoicePaymentSchema,
  type InvoiceResponse,
} from "../types";

interface ConfirmManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceResponse | null;
}

const formatVND = (num: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

export const ConfirmManualPaymentModal: React.FC<ConfirmManualPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const getErrorMessage = useApiErrorMessage();
  const confirmMutation = useConfirmManualInvoicePayment();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>(PaymentMethodEnum.CASH);
  const [referenceCode, setReferenceCode] = useState("");
  const [note, setNote] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!invoice) return null;

  // Maker-Checker violation check
  const isCreator =
    currentUser?.id &&
    invoice.createdBy?.id &&
    String(currentUser.id) === String(invoice.createdBy.id);
  const isMakerCheckerRisk = isCreator && invoice.type === InvoiceTypeEnum.INCIDENTAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!proofImageUrl) {
      setErrorMsg("Vui lòng tải lên ảnh chứng từ / biên lai thu tiền quầy (bắt buộc).");
      return;
    }

    const parsed = confirmManualInvoicePaymentSchema.safeParse({
      proofImageUrl,
      paymentMethod,
      referenceCode: referenceCode.trim() || undefined,
      note: note.trim() || undefined,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errList = Object.values(fieldErrors).flat();
      const firstError = typeof errList[0] === "string" ? errList[0] : null;
      setErrorMsg(firstError || "Dữ liệu xác nhận không hợp lệ.");
      return;
    }

    try {
      await confirmMutation.mutateAsync({
        id: invoice.id,
        payload: parsed.data,
      });
      setSuccessMsg("Xác nhận thu tiền mặt quầy thành công!");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !confirmMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                Xác nhận thu tiền tại quầy • {invoice.invoiceCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Xác nhận đã thu tiền mặt hoặc chuyển khoản trực tiếp tại cơ sở
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Maker-Checker Warning */}
          {isMakerCheckerRisk && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Cảnh báo quy tắc Maker-Checker:</p>
                <p className="text-rose-700 mt-0.5">
                  Bạn là người đã lập hóa đơn phụ phí này. Theo quy định chống gian lận tài chính,
                  nhân viên xác nhận thu tiền <strong>bắt buộc phải là người khác</strong>. Thao tác
                  này có thể bị máy chủ từ chối với lỗi 403.
                </p>
              </div>
            </div>
          )}

          {/* Amount Overview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold uppercase">
                Số tiền cần thu
              </span>
              <span className="text-slate-800 text-xs">
                Còn lại: {formatVND(invoice.totalAmount - (invoice.paidAmount || 0))}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-amber-700">
                {formatVND(invoice.totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Hình thức thu tiền *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod(PaymentMethodEnum.CASH)}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === PaymentMethodEnum.CASH
                    ? "border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Banknote className="w-4 h-4 text-amber-600" />
                Tiền mặt (CASH)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod(PaymentMethodEnum.BANK_TRANSFER)}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === PaymentMethodEnum.BANK_TRANSFER
                    ? "border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Chuyển khoản quầy
              </button>
            </div>
          </div>

          {/* Reference code */}
          {paymentMethod === PaymentMethodEnum.BANK_TRANSFER && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mã tham chiếu / Mã giao dịch ngân hàng
              </label>
              <input
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="VD: FT2410298319..."
                className="w-full text-xs font-mono text-slate-800 bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>
          )}

          {/* Proof Image Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Ảnh biên lai / Chứng từ thu tiền *
            </label>
            <CloudinaryUploader
              folder={CloudinaryFolderEnum.GENERAL}
              value={proofImageUrl ? [proofImageUrl] : []}
              onChange={(urls) => {
                setProofImageUrl(urls[0] || "");
                setErrorMsg(null);
              }}
              multiple={false}
              maxFiles={1}
              label="Tải lên ảnh chứng từ nộp tiền"
              description="Hỗ trợ JPG, PNG dưới 5MB"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Ghi chú tiếp nhận (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách nộp tiền mặt trực tiếp tại quầy lễ tân chi nhánh..."
              className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-200 outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={confirmMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm disabled:opacity-50"
            >
              {confirmMutation.isPending ? "Đang ghi nhận..." : "Xác nhận đã thu tiền"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
