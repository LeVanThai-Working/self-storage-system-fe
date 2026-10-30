"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { AlertCircle, Ban, X } from "lucide-react";
import { toast } from "sonner";
import { cancelPaymentSchema } from "@self-storage-system-fe/shared";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCancelPayment } from "../hooks";
import { type PaymentResponse } from "../types";
import { resolvePaymentErrorMessage } from "../utils";

interface CancelPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentResponse | null;
  onSuccess?: () => void;
}

export const CancelPaymentModal: React.FC<CancelPaymentModalProps> = ({
  isOpen,
  onClose,
  payment,
  onSuccess,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";

  const cancelMutation = useCancelPayment();

  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parseResult = cancelPaymentSchema.safeParse({
      cancellationReason: reason.trim(),
    });

    if (!parseResult.success) {
      setErrorMsg(
        parseResult.error.issues[0]?.message ||
          (isEn
            ? "Cancellation reason must be at least 3 characters."
            : "Lý do hủy đơn phải có ít nhất 3 ký tự.")
      );
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: payment.id,
        payload: parseResult.data,
      });

      toast.success(
        isEn
          ? `Payment ${payment.paymentCode} has been cancelled.`
          : `Đơn thanh toán ${payment.paymentCode} đã được hủy.`
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
        if (!open && !cancelMutation.isPending) {
          setErrorMsg(null);
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-0 rounded-2xl border-slate-200 shadow-2xl overflow-hidden bg-white">
        <DialogHeader className="p-5 pb-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {isEn ? "Cancel Pending Payment" : "Hủy đơn thanh toán chờ xử lý"}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? `Payment Code: ${payment.paymentCode}`
                  : `Mã đơn thanh toán: ${payment.paymentCode}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {isEn
              ? "Are you sure you want to cancel this pending payment? This action cannot be undone, and the customer will no longer be able to pay using this QR code."
              : "Bạn có chắc chắn muốn hủy đơn thanh toán đang chờ này không? Thao tác này không thể hoàn tác, và khách hàng sẽ không thể tiếp tục quét mã thanh toán này."}
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isEn
                ? "Cancellation Reason * (min 3 characters)"
                : "Lý do hủy đơn * (tối thiểu 3 ký tự)"}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                isEn
                  ? "e.g., Customer requested payment method change..."
                  : "VD: Khách hàng đổi phương thức thanh toán hoặc hủy thuê..."
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3 py-2 rounded-xl border border-slate-200 focus:border-rose-500 outline-none resize-none transition-colors"
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Keep Pending" : "Giữ lại"}
            </button>
            <button
              type="submit"
              disabled={cancelMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/20 disabled:opacity-50 transition-colors"
            >
              {cancelMutation.isPending
                ? isEn
                  ? "Cancelling..."
                  : "Đang hủy..."
                : isEn
                  ? "Confirm Cancel"
                  : "Xác nhận hủy đơn"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
