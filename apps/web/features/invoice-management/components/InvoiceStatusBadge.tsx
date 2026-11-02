"use client";

import React from "react";
import { useLocale } from "next-intl";
import { InvoiceStatusEnum } from "../types";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatusEnum | string;
  className?: string;
}

export function getInvoiceStatusLabel(status: InvoiceStatusEnum | string, locale = "vi"): string {
  const isEn = locale === "en";
  switch (status) {
    case InvoiceStatusEnum.DRAFT:
    case "draft":
      return isEn ? "Draft" : "Bản nháp";
    case InvoiceStatusEnum.ISSUED:
    case "issued":
      return isEn ? "Issued / Due" : "Chờ thanh toán";
    case InvoiceStatusEnum.PAID:
    case "paid":
      return isEn ? "Paid" : "Đã thanh toán";
    case InvoiceStatusEnum.OVERDUE:
    case "overdue":
      return isEn ? "Overdue" : "Quá hạn";
    case InvoiceStatusEnum.CANCELLED:
    case "cancelled":
      return isEn ? "Cancelled" : "Đã hủy";
    case InvoiceStatusEnum.VOID:
    case "void":
      return isEn ? "Void" : "Vô hiệu hóa";
    default:
      return String(status);
  }
}

export function getInvoiceStatusTone(status: InvoiceStatusEnum | string) {
  switch (status) {
    case InvoiceStatusEnum.DRAFT:
    case "draft":
      return {
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
    case InvoiceStatusEnum.ISSUED:
    case "issued":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case InvoiceStatusEnum.PAID:
    case "paid":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    case InvoiceStatusEnum.OVERDUE:
    case "overdue":
      return {
        bg: "bg-rose-50",
        text: "text-rose-800",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    case InvoiceStatusEnum.CANCELLED:
    case "cancelled":
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
    case InvoiceStatusEnum.VOID:
    case "void":
      return {
        bg: "bg-zinc-100",
        text: "text-zinc-600",
        border: "border-zinc-300",
        dot: "bg-zinc-400",
      };
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const locale = useLocale();
  const tone = getInvoiceStatusTone(status);
  const label = getInvoiceStatusLabel(status, locale);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tone.bg} ${tone.text} ${tone.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {label}
    </span>
  );
};
