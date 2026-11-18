"use client";

import React from "react";
import { useLocale } from "next-intl";

import { InvoiceTypeEnum } from "../types";

interface InvoiceTypeBadgeProps {
  type: InvoiceTypeEnum | string;
  className?: string;
}

export function getInvoiceTypeLabel(type: InvoiceTypeEnum | string, locale = "vi"): string {
  const isEn = locale === "en";
  switch (type) {
    case InvoiceTypeEnum.FIRST_PERIOD:
    case "first_period":
      return isEn ? "First Period" : "Kỳ đầu";
    case InvoiceTypeEnum.RECURRING:
    case "recurring":
      return isEn ? "Recurring" : "Định kỳ";
    case InvoiceTypeEnum.INCIDENTAL:
    case "incidental":
      return isEn ? "Incidental / Fee" : "Phụ phí phát sinh";
    case InvoiceTypeEnum.CHECK_OUT_SETTLEMENT:
    case "check_out_settlement":
      return isEn ? "Check-out Settlement" : "Quyết toán trả kho";
    default:
      return String(type);
  }
}

export const InvoiceTypeBadge: React.FC<InvoiceTypeBadgeProps> = ({ type, className = "" }) => {
  const locale = useLocale();
  const label = getInvoiceTypeLabel(type, locale);

  let toneClass = "bg-slate-50 text-slate-700 border-slate-200";

  switch (type) {
    case InvoiceTypeEnum.FIRST_PERIOD:
    case "first_period":
      toneClass = "bg-teal-50 text-teal-700 border-teal-200";
      break;
    case InvoiceTypeEnum.RECURRING:
    case "recurring":
      toneClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
      break;
    case InvoiceTypeEnum.INCIDENTAL:
    case "incidental":
      toneClass = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case InvoiceTypeEnum.CHECK_OUT_SETTLEMENT:
    case "check_out_settlement":
      toneClass = "bg-purple-50 text-purple-700 border-purple-200";
      break;
  }

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap shrink-0 gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${toneClass} ${className}`}
    >
      {label}
    </span>
  );
};
