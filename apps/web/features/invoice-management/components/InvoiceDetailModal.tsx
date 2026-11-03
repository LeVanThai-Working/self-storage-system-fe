"use client";

import React from "react";
import {
  AlertTriangle,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Printer,
  QrCode,
  ShieldAlert,
  User,
  X,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceTypeBadge } from "./InvoiceTypeBadge";
import {
  InvoiceItemTypeEnum,
  InvoiceStatusEnum,
  type EntitySummary,
  type InvoiceResponse,
} from "../types";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceResponse | null;
  onOpenPaymentQr?: (invoice: InvoiceResponse) => void;
  onOpenConfirmManual?: (invoice: InvoiceResponse) => void;
  onOpenCancel?: (invoice: InvoiceResponse) => void;
  onOpenPdf?: (invoice: InvoiceResponse) => void;
}

const formatVND = (num: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

const formatDate = (isoString?: string | null) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

const formatDateOnly = (isoString?: string | null) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
};

const getEntityName = (entity?: EntitySummary | null) => {
  if (!entity) return "—";
  return entity.name || entity.email || entity.code || entity.id;
};

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onOpenPaymentQr,
  onOpenConfirmManual,
  onOpenCancel,
  onOpenPdf,
}) => {
  if (!invoice) return null;

  const isUnpaid =
    invoice.status === InvoiceStatusEnum.ISSUED || invoice.status === InvoiceStatusEnum.OVERDUE;
  const isCancellable = isUnpaid;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-slate-100 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-xl font-mono font-extrabold text-slate-900">
                  {invoice.invoiceCode}
                </DialogTitle>
                <InvoiceStatusBadge status={invoice.status} />
                <InvoiceTypeBadge type={invoice.type} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kỳ thanh toán số #{invoice.billingPeriodIndex} • Ngày tạo:{" "}
                {formatDate(invoice.createdAt)}
              </p>
            </div>
            {onOpenPdf && (
              <button
                type="button"
                onClick={() => onOpenPdf(invoice)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Xem / In PDF A4
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Overdue Warning */}
          {invoice.status === InvoiceStatusEnum.OVERDUE && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Hóa đơn đã quá hạn thanh toán!</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  Hợp đồng liên quan có thể đã bị tạm khóa quyền truy cập kho sau 3 ngày ân hạn. Vui
                  lòng thanh toán sớm để khôi phục trạng thái hoạt động bình thường.
                </p>
              </div>
            </div>
          )}

          {/* Cancellation Notice */}
          {invoice.status === InvoiceStatusEnum.CANCELLED && (
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-700">
                <XCircle className="w-4 h-4 text-rose-600" />
                Hóa đơn đã bị hủy
              </div>
              <p className="text-slate-600">
                <strong>Lý do:</strong> {invoice.cancelReason || "Không có lý do"}
              </p>
              <p className="text-[11px] text-slate-400">
                Hủy bởi: {getEntityName(invoice.cancelledBy)} • Lúc:{" "}
                {formatDate(invoice.cancelledAt)}
              </p>
            </div>
          )}

          {/* Basic Entity Details Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Khách hàng
              </span>
              <p className="font-bold text-slate-900 text-sm">{getEntityName(invoice.customer)}</p>
              <p className="text-[11px] text-slate-500">{invoice.customer?.email || "—"}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Hợp đồng liên kết
              </span>
              <p className="font-mono font-bold text-slate-900 text-sm">
                {invoice.contract?.code || invoice.contractId}
              </p>
              <p className="text-[11px] text-slate-500">Cơ sở: {getEntityName(invoice.facility)}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Chu kỳ & Hạn đóng
              </span>
              <p className="font-semibold text-slate-800">
                {formatDateOnly(invoice.periodStartDate)} → {formatDateOnly(invoice.periodEndDate)}
              </p>
              <p className="text-[11px] font-bold text-amber-700">
                Hạn thanh toán: {formatDateOnly(invoice.dueDate)}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
              Chi tiết các khoản mục hóa đơn
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Khoản mục</th>
                    <th className="py-2.5 px-3">Phân loại</th>
                    <th className="py-2.5 px-3 text-right">SL</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        {item.description && (
                          <p className="text-[11px] text-slate-400">{item.description}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.itemType === InvoiceItemTypeEnum.RENT
                            ? "Tiền thuê kho"
                            : item.itemType === InvoiceItemTypeEnum.AMENITY
                              ? "Tiện ích thuê"
                              : item.itemType === InvoiceItemTypeEnum.DAMAGE_FEE
                                ? "Phí hư hại"
                                : item.itemType === InvoiceItemTypeEnum.OVERDUE_FEE
                                  ? "Phạt trễ hạn"
                                  : item.itemType === InvoiceItemTypeEnum.DISCOUNT
                                    ? "Giảm trừ"
                                    : "Khoản khác"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {formatVND(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatVND(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính (Subtotal):</span>
                <span className="font-semibold text-slate-800">{formatVND(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Giảm giá (Discount):</span>
                  <span className="font-semibold">-{formatVND(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Thuế (Tax):</span>
                  <span className="font-semibold text-slate-800">
                    {formatVND(invoice.taxAmount)}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Tổng tiền:</span>
                <span className="text-teal-700 text-base">{formatVND(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Đã thanh toán:</span>
                <span className="font-bold text-emerald-700">{formatVND(invoice.paidAmount)}</span>
              </div>
            </div>
          </div>

          {/* Proof Image if Manual Counter Payment */}
          {invoice.proofImageUrl && (
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500">
                Ảnh chứng từ nộp tiền tại quầy
              </h4>
              <div className="relative w-48 h-36 rounded-xl overflow-hidden border border-slate-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invoice.proofImageUrl}
                  alt="Biên lai nộp tiền"
                  className="w-full h-full object-cover"
                />
                <a
                  href={invoice.proofImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1"
                >
                  <ExternalLink className="w-4 h-4" /> Xem ảnh gốc
                </a>
              </div>
            </div>
          )}

          {/* Maker-Checker & Audit Trail */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs text-slate-600">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
              Thông tin kiểm soát & Người thực hiện (Maker-Checker)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Người lập hóa đơn (Maker):</span>
                <span className="font-semibold text-slate-800">
                  {getEntityName(invoice.createdBy)}
                </span>
                <span className="text-slate-400 block text-[10px]">
                  {formatDate(invoice.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Người duyệt thu tiền (Checker):
                </span>
                <span className="font-semibold text-slate-800">
                  {getEntityName(invoice.confirmedBy)}
                </span>
                <span className="text-slate-400 block text-[10px]">
                  {invoice.confirmedAt ? formatDate(invoice.confirmedAt) : "Chưa xác nhận thu quầy"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70"
          >
            Đóng
          </button>

          {isCancellable && onOpenCancel && (
            <button
              type="button"
              onClick={() => onOpenCancel(invoice)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200"
            >
              Hủy hóa đơn
            </button>
          )}

          {isUnpaid && onOpenConfirmManual && (
            <button
              type="button"
              onClick={() => onOpenConfirmManual(invoice)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 shadow-sm flex items-center gap-1.5"
            >
              <Banknote className="w-4 h-4" />
              Thu tiền mặt tại quầy
            </button>
          )}

          {isUnpaid && onOpenPaymentQr && (
            <button
              type="button"
              onClick={() => onOpenPaymentQr(invoice)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              Mã VietQR thanh toán
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
