"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  Ban,
  Building2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck2,
  QrCode,
  Receipt,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaymentDetail } from "../hooks";
import { PaymentPurposeEnum, PaymentStatusEnum, type PaymentResponse } from "../types";
import {
  calculateRemainingSeconds,
  formatCountdownTimer,
  formatDateTime,
  formatVnd,
} from "../utils";
import { ConfirmManualPaymentModal } from "./ConfirmManualPaymentModal";
import { CancelPaymentModal } from "./CancelPaymentModal";
import { PaymentMethodBadge } from "./PaymentMethodBadge";
import { PaymentPurposeBadge } from "./PaymentPurposeBadge";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string | null;
  onUpdated?: () => void;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  paymentId,
  onUpdated,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";

  const {
    data: payment,
    isLoading,
    error,
  } = usePaymentDetail(isOpen ? (paymentId ?? undefined) : undefined, {
    enabled: isOpen && Boolean(paymentId),
    polling: true,
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const currentRemaining =
    !payment?.expiresAt || payment.status !== PaymentStatusEnum.PENDING
      ? 0
      : calculateRemainingSeconds(payment.expiresAt);

  const [remainingSeconds, setRemainingSeconds] = useState(currentRemaining);
  const [prevPaymentId, setPrevPaymentId] = useState(payment?.id);

  if (payment?.id !== prevPaymentId) {
    setPrevPaymentId(payment?.id);
    setRemainingSeconds(currentRemaining);
  }

  // Countdown timer for pending payments
  useEffect(() => {
    if (!payment?.expiresAt || payment.status !== PaymentStatusEnum.PENDING) {
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateRemainingSeconds(payment.expiresAt);
      setRemainingSeconds(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [payment?.expiresAt, payment?.status]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isEn ? `Copied ${label} to clipboard!` : `Đã sao chép ${label} vào bộ nhớ tạm!`);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 rounded-2xl border-slate-200 shadow-2xl overflow-hidden bg-white">
          <DialogHeader className="p-5 pb-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-base font-bold text-slate-900">
                      {payment
                        ? payment.paymentCode
                        : isEn
                          ? "Payment Details"
                          : "Chi tiết thanh toán"}
                    </DialogTitle>
                    {payment && <PaymentStatusBadge status={payment.status} />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {payment?.createdAt
                      ? `${isEn ? "Created at" : "Khởi tạo ngày"} ${formatDateTime(payment.createdAt, locale)}`
                      : "..."}
                  </p>
                </div>
              </div>

              {/* Polling Indicator */}
              {payment?.status === PaymentStatusEnum.PENDING && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>{isEn ? "Polling for Bank Transfer..." : "Đang chờ chuyển khoản..."}</span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isEn ? "Failed to load payment details." : "Không thể tải thông tin thanh toán."}
                </span>
              </div>
            )}

            {payment && (
              <>
                {/* Amount & Purpose Header Banner */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-slate-900/10">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      {isEn ? "Required Payment Amount" : "Số tiền thanh toán"}
                    </span>
                    <span className="text-2xl font-black text-emerald-400 mt-1 block">
                      {formatVnd(payment.amount)}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <PaymentPurposeBadge
                        purpose={payment.purpose}
                        className="bg-white/10 text-white border-white/20"
                      />
                      <PaymentMethodBadge
                        method={payment.method}
                        className="bg-white/10 text-white border-white/20"
                      />
                    </div>
                  </div>

                  {payment.status === PaymentStatusEnum.PENDING && (
                    <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/10 p-3 sm:text-right shrink-0">
                      <div className="flex items-center sm:justify-end gap-1.5 text-xs text-amber-300 font-semibold mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isEn ? "Expires in" : "Hết hạn sau"}</span>
                      </div>
                      <span className="font-mono text-lg font-black text-amber-300">
                        {formatCountdownTimer(remainingSeconds)}
                      </span>
                    </div>
                  )}
                </div>

                {/* VietQR Dynamic Section for Pending Payments */}
                {payment.status === PaymentStatusEnum.PENDING && payment.qrUrl && (
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-teal-700" />
                      <span className="text-xs font-bold text-teal-900">
                        {isEn
                          ? "Dynamic VietQR (Auto-filled Amount & Note)"
                          : "Mã VietQR động SePay (Tự động điền tiền & nội dung)"}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-teal-100">
                      {/* QR Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={payment.qrUrl}
                        alt="VietQR dynamic"
                        className="w-36 h-36 rounded-xl border border-slate-200 bg-white p-1 object-contain shrink-0 shadow-sm"
                      />

                      {/* Bank Details Table */}
                      <div className="flex-1 w-full space-y-2 text-xs">
                        <div className="flex items-center justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">{isEn ? "Bank:" : "Ngân hàng:"}</span>
                          <span className="font-bold text-slate-800">
                            {payment.bankInfo?.bankCode || "SePay Partner Bank"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">
                            {isEn ? "Account Number:" : "Số tài khoản:"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">
                              {payment.bankInfo?.accountNumber || "—"}
                            </span>
                            {payment.bankInfo?.accountNumber && (
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    payment.bankInfo!.accountNumber,
                                    isEn ? "Account Number" : "Số tài khoản"
                                  )
                                }
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">
                            {isEn ? "Account Holder:" : "Chủ tài khoản:"}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {payment.bankInfo?.accountName || "STORAGE HUB CO"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-500">
                            {isEn ? "Transfer Code:" : "Nội dung chuyển khoản:"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {payment.paymentCode}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  payment.paymentCode,
                                  isEn ? "Transfer Code" : "Nội dung chuyển khoản"
                                )
                              }
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer & Facility Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Customer Card */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>{isEn ? "Customer Snapshot" : "Thông tin khách hàng"}</span>
                    </div>
                    <p className="text-slate-900 font-semibold">{payment.customer?.name || "—"}</p>
                    <p className="text-slate-500">{payment.customer?.email || "—"}</p>
                    {payment.customer?.phoneNumber && (
                      <p className="text-slate-500">{payment.customer.phoneNumber}</p>
                    )}
                  </div>

                  {/* Facility Card */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>{isEn ? "Facility" : "Cơ sở lưu trữ"}</span>
                    </div>
                    <p className="text-slate-900 font-semibold">{payment.facility?.name || "—"}</p>
                    <p className="text-slate-500">{payment.facility?.address || "—"}</p>
                    <p className="text-slate-500">{payment.facility?.city || "—"}</p>
                  </div>
                </div>

                {/* Manual Confirmation Details (if confirmed manually) */}
                {payment.confirmedBy && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {isEn
                          ? "Manual Confirmation Record"
                          : "Chứng từ xác nhận thủ công tại quầy"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 block">
                          {isEn ? "Confirmed by Staff:" : "Nhân viên xác nhận:"}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {typeof payment.confirmedBy === "object"
                            ? payment.confirmedBy?.name
                            : payment.confirmedBy}
                        </span>
                        {typeof payment.confirmedBy === "object" && payment.confirmedBy?.email && (
                          <span className="text-slate-500 block">{payment.confirmedBy.email}</span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-500 block">
                          {isEn ? "Confirmation Date:" : "Thời gian xác nhận:"}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatDateTime(payment.confirmedAt, locale)}
                        </span>
                      </div>

                      {payment.referenceCode && (
                        <div>
                          <span className="text-slate-500 block">
                            {isEn ? "Reference / Receipt No:" : "Mã phiếu thu:"}
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {payment.referenceCode}
                          </span>
                        </div>
                      )}

                      {payment.note && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 block">
                            {isEn ? "Reconciliation Note:" : "Ghi chú đối soát:"}
                          </span>
                          <p className="text-slate-800 font-medium bg-white/70 p-2 rounded-lg border border-emerald-100 mt-1">
                            {payment.note}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Proof Image */}
                    {payment.proofImageUrl && (
                      <div className="pt-2 border-t border-emerald-100">
                        <span className="text-slate-600 font-bold block mb-1.5">
                          {isEn
                            ? "Uploaded Receipt / Bank Proof:"
                            : "Biên lai / Chứng từ thực tế đính kèm:"}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(payment.proofImageUrl!)}
                            className="group relative w-24 h-24 rounded-xl overflow-hidden border border-emerald-200 bg-white"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={payment.proofImageUrl}
                              alt="Payment Proof"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Eye className="w-5 h-5" />
                            </div>
                          </button>
                          <div className="text-[11px] text-slate-500 space-y-1">
                            <p className="font-semibold text-emerald-800">
                              {isEn
                                ? "Receipt document uploaded to Cloudinary"
                                : "Chứng từ hợp lệ trên hệ thống"}
                            </p>
                            <a
                              href={payment.proofImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-teal-700 hover:underline font-semibold"
                            >
                              <span>{isEn ? "Open full original image" : "Mở file gốc"}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cancellation Record */}
                {payment.status === PaymentStatusEnum.CANCELLED && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-rose-800">
                      <Ban className="w-4 h-4 text-rose-600" />
                      <span>{isEn ? "Cancellation Record" : "Thông tin hủy đơn"}</span>
                    </div>
                    {payment.cancelledBy && (
                      <p className="text-slate-700">
                        <span className="text-slate-500">
                          {isEn ? "Cancelled by: " : "Người hủy: "}
                        </span>
                        <strong>{payment.cancelledBy.name}</strong> ({payment.cancelledBy.email})
                      </p>
                    )}
                    {payment.cancelledAt && (
                      <p className="text-slate-700">
                        <span className="text-slate-500">
                          {isEn ? "Cancelled at: " : "Thời gian hủy: "}
                        </span>
                        {formatDateTime(payment.cancelledAt, locale)}
                      </p>
                    )}
                    {payment.cancellationReason && (
                      <div className="mt-1 bg-white/70 p-2 rounded-lg border border-rose-100">
                        <span className="text-slate-500 block mb-0.5">
                          {isEn ? "Reason: " : "Lý do hủy: "}
                        </span>
                        <p className="font-medium text-rose-900">{payment.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
            >
              {isEn ? "Close" : "Đóng"}
            </button>

            {payment && payment.status === PaymentStatusEnum.PENDING && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  {isEn ? "Cancel Payment" : "Hủy đơn thanh toán"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-colors flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{isEn ? "Confirm at Counter" : "Thu tiền tại quầy"}</span>
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Payment Modal */}
      {payment && (
        <ConfirmManualPaymentModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          payment={payment}
          onSuccess={() => {
            setIsConfirmModalOpen(false);
            onUpdated?.();
          }}
        />
      )}

      {/* Cancel Payment Modal */}
      {payment && (
        <CancelPaymentModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          payment={payment}
          onSuccess={() => {
            setIsCancelModalOpen(false);
            onUpdated?.();
          }}
        />
      )}

      {/* Full Preview Image Modal */}
      {previewImage && (
        <Dialog open={Boolean(previewImage)} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="sm:max-w-3xl p-2 bg-slate-900 border-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Proof full view"
              className="w-full max-h-[85vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
