"use client";

import React from "react";
import { useLocale } from "next-intl";
import { Calendar, FileCheck, Layers, Wrench } from "lucide-react";
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
      return isEn ? "First Period" : "Kỳ đầu (Kỳ 1)";
    case InvoiceTypeEnum.RECURRING:
    case "recurring":
      return isEn ? "Recurring Cycle" : "Kỳ định kỳ";
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

  let icon = <Layers className="w-3 h-3 text-slate-500" />;
  let toneClass = "bg-slate-50 text-slate-700 border-slate-200";

  switch (type) {
    case InvoiceTypeEnum.FIRST_PERIOD:
    case "first_period":
      icon = <FileCheck className="w-3 h-3 text-teal-600" />;
      toneClass = "bg-teal-50 text-teal-800 border-teal-200";
      break;
    case InvoiceTypeEnum.RECURRING:
    case "recurring":
      icon = <Calendar className="w-3 h-3 text-indigo-600" />;
      toneClass = "bg-indigo-50 text-indigo-800 border-indigo-200";
      break;
    case InvoiceTypeEnum.INCIDENTAL:
    case "incidental":
      icon = <Wrench className="w-3 h-3 text-amber-600" />;
      toneClass = "bg-amber-50 text-amber-800 border-amber-200";
      break;
    case InvoiceTypeEnum.CHECK_OUT_SETTLEMENT:
    case "check_out_settlement":
      icon = <FileCheck className="w-3 h-3 text-purple-600" />;
      toneClass = "bg-purple-50 text-purple-800 border-purple-200";
      break;
  }

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap shrink-0 gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${toneClass} ${className}`}
    >
      {icon}
      {label}
    </span>
  );
};
