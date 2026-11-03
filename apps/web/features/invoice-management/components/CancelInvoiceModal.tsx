"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useCancelInvoice } from "../hooks";
import { cancelInvoiceSchema, type InvoiceResponse } from "../types";

interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceResponse | null;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const getErrorMessage = useApiErrorMessage();
  const cancelMutation = useCancelInvoice();
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = cancelInvoiceSchema.safeParse({ reason: reason.trim() });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errList = Object.values(fieldErrors).flat();
      const firstError = typeof errList[0] === "string" ? errList[0] : null;
      setErrorMsg(firstError || "Lý do hủy phải có tối thiểu 5 ký tự.");
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: invoice.id,
        payload: parsed.data,
      });
      setSuccessMsg("Đã hủy hóa đơn thành công!");
      setTimeout(() => {
        setSuccessMsg(null);
        setReason("");
        onClose();
      }, 900);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !cancelMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-md p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                Hủy hóa đơn • {invoice.invoiceCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉ có thể hủy hóa đơn đang ở trạng thái Chờ thanh toán hoặc Quá hạn
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
            <p className="font-bold">Lưu ý khi hủy hóa đơn:</p>
            <p>
              Hóa đơn sau khi hủy sẽ chuyển sang trạng thái <strong>CANCELLED</strong> và không thể
              khôi phục lại. Mã hóa đơn này sẽ được đóng vĩnh viễn.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Lý do hủy hóa đơn (tối thiểu 5 ký tự) *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Khách hàng đổi thỏa thuận phụ phí, hủy để phát hành hóa đơn mới..."
              className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none resize-none"
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
              disabled={cancelMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={cancelMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-50"
            >
              {cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy hóa đơn"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
