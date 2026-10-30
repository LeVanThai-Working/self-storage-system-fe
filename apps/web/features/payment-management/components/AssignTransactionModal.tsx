"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { AlertCircle, CheckCircle2, Link2, Search } from "lucide-react";
import { toast } from "sonner";
import { assignUnmatchedTransactionSchema } from "@self-storage-system-fe/shared";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAssignUnmatchedTransaction } from "../hooks";
import { type PaymentTransactionResponse } from "../types";
import { formatDateTime, formatVnd, resolvePaymentErrorMessage } from "../utils";

interface AssignTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransactionResponse | null;
  onSuccess?: () => void;
}

export const AssignTransactionModal: React.FC<AssignTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";

  const assignMutation = useAssignUnmatchedTransaction();

  const [paymentCode, setPaymentCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parseResult = assignUnmatchedTransactionSchema.safeParse({
      paymentCode: paymentCode.trim().toUpperCase(),
    });

    if (!parseResult.success) {
      setErrorMsg(
        parseResult.error.issues[0]?.message ||
          (isEn
            ? "Payment code must be between 3 and 50 characters."
            : "Mã thanh toán phải từ 3 đến 50 ký tự.")
      );
      return;
    }

    try {
      await assignMutation.mutateAsync({
        transactionId: transaction.id,
        payload: parseResult.data,
      });

      toast.success(
        isEn
          ? `Successfully reconciled transaction with payment ${parseResult.data.paymentCode}!`
          : `Gán đối soát giao dịch ngân hàng vào mã ${parseResult.data.paymentCode} thành công!`
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
        if (!open && !assignMutation.isPending) {
          setErrorMsg(null);
          setPaymentCode("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-0 rounded-2xl border-slate-200 shadow-2xl overflow-hidden bg-white">
        <DialogHeader className="p-5 pb-4 border-b border-slate-100 bg-teal-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {isEn ? "Assign Bank Transaction" : "Gán giao dịch ngân hàng đối soát"}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? `SePay ID: #${transaction.sepayId}`
                  : `Mã giao dịch SePay: #${transaction.sepayId}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Bank Transaction Info Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                {isEn ? "Transfer Amount:" : "Số tiền chuyển:"}
              </span>
              <span className="text-sm font-black text-emerald-700">
                {formatVnd(transaction.transferAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                {isEn ? "Transaction Date:" : "Thời gian ngân hàng:"}
              </span>
              <span className="font-semibold text-slate-800">
                {formatDateTime(transaction.transactionDate, locale)}
              </span>
            </div>

            {transaction.accountNumber && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  {isEn ? "Receiving Account:" : "Tài khoản nhận:"}
                </span>
                <span className="font-mono text-slate-800">{transaction.accountNumber}</span>
              </div>
            )}

            {transaction.content && (
              <div>
                <span className="text-slate-500 block mb-0.5">
                  {isEn ? "Transfer Content / Description:" : "Nội dung chuyển khoản thực tế:"}
                </span>
                <p className="bg-white p-2 rounded-lg border border-slate-200 font-mono text-slate-700 break-words">
                  {transaction.content}
                </p>
              </div>
            )}
          </div>

          {/* Target Payment Code Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isEn
                ? "Target Payment Code * (e.g. SSM...)"
                : "Mã đơn thanh toán cần gán * (VD: SSM...)"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={paymentCode}
                onChange={(e) => {
                  setPaymentCode(e.target.value.toUpperCase());
                  setErrorMsg(null);
                }}
                placeholder={isEn ? "e.g., SSM7A8B9C2" : "VD: SSM7A8B9C2"}
                className="w-full bg-slate-50 focus:bg-white text-xs font-mono font-bold text-slate-800 pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none uppercase transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {isEn
                ? "Note: The transfer amount must match 100% of the target payment amount. The order will be immediately marked as PAID."
                : "Lưu ý: Số tiền chuyển của giao dịch ngân hàng phải khớp chính xác 100% với đơn thanh toán. Đơn sẽ được chuyển sang Đã thanh toán ngay lập tức."}
            </p>
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
              disabled={assignMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Hủy bỏ"}
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending || !paymentCode.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/20 disabled:opacity-50 transition-colors"
            >
              {assignMutation.isPending
                ? isEn
                  ? "Assigning..."
                  : "Đang gán..."
                : isEn
                  ? "Assign & Settle"
                  : "Gán & Hoàn tất"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
