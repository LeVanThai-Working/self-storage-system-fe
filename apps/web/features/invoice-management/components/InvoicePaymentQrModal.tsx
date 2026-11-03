"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useCreateInvoicePayment } from "../hooks";
import type { InvoiceResponse, PaymentResponse } from "../types";

interface InvoicePaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceResponse | null;
}

const formatVND = (num: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

export const InvoicePaymentQrModal: React.FC<InvoicePaymentQrModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const getErrorMessage = useApiErrorMessage();
  const paymentMutation = useCreateInvoicePayment();
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && invoice?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMsg(null);
      paymentMutation
        .mutateAsync(invoice.id)
        .then((data) => setPaymentData(data))
        .catch((err) => setErrorMsg(getErrorMessage(err)));
    } else {
      setPaymentData(null);
      setErrorMsg(null);
    }
  }, [isOpen, invoice?.id]);

  if (!invoice) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const bankName =
    paymentData?.bankInfo?.bankCode || paymentData?.bankAccount?.bankName || "MBBank";
  const accountNumber =
    paymentData?.bankInfo?.accountNumber || paymentData?.bankAccount?.accountNumber || "—";
  const accountHolder =
    paymentData?.bankInfo?.accountName ||
    paymentData?.bankAccount?.accountHolder ||
    paymentData?.bankAccount?.accountName ||
    "STORAGEHUB VIETNAM";
  const paymentCode = paymentData?.paymentCode || invoice.invoiceCode;
  const amountToPay = paymentData?.amount || invoice.totalAmount;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-teal-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                Thanh toán VietQR • {invoice.invoiceCode}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Quét mã SePay QR để thanh toán tự động và kích hoạt hợp đồng
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 text-xs">
          {paymentMutation.isPending ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
              <p className="font-semibold text-xs">
                Đang khởi tạo phiên thanh toán SePay VietQR...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <>
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {paymentData?.qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={paymentData.qrUrl}
                    alt="VietQR Payment"
                    className="w-56 h-56 object-contain rounded-xl shadow-sm bg-white p-2"
                  />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 p-4 text-center">
                    <QrCode className="w-10 h-10 mb-2 opacity-50" />
                    <span>Mã QR tự động</span>
                  </div>
                )}
                <span className="text-[11px] font-bold text-teal-700 mt-2 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Khớp lệnh tự động 24/7 qua SePay
                </span>
              </div>

              {/* Bank Details Table */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-bold text-slate-900">{bankName}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                    <span>{accountNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(accountNumber, "acc")}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                      title="Sao chép"
                    >
                      {copiedField === "acc" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Người thụ hưởng:</span>
                  <span className="font-bold text-slate-900">{accountHolder}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Số tiền:</span>
                  <span className="font-extrabold text-teal-700 text-sm">
                    {formatVND(amountToPay)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <span>{paymentCode}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentCode, "code")}
                      className="p-1 hover:bg-amber-100 rounded text-amber-700"
                      title="Sao chép nội dung"
                    >
                      {copiedField === "code" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-800">
                <strong>Quan trọng:</strong> Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống
                tự động gạch nợ và phục hồi trạng thái hoạt động của kho ngay lập tức.
              </div>
            </>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70"
          >
            Đóng
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
