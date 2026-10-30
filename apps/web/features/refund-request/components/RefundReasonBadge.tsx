"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { RefundRequestReasonEnum } from "../types";

interface RefundReasonBadgeProps {
  reason: RefundRequestReasonEnum | string;
  className?: string;
}

export const getRefundReasonLabel = (reason: RefundRequestReasonEnum | string): string => {
  switch (reason) {
    case RefundRequestReasonEnum.CUSTOMER_CANCEL:
    case "customer_cancel":
      return "Khách hủy đơn";
    case RefundRequestReasonEnum.FACILITY_CANCEL:
    case "facility_cancel":
      return "Cơ sở hủy đơn";
    case RefundRequestReasonEnum.SYSTEM_CANCEL:
    case "system_cancel":
      return "Hệ thống hủy đơn";
    case RefundRequestReasonEnum.LATE_PAYMENT:
    case "late_payment":
      return "Chuyển tiền muộn";
    case RefundRequestReasonEnum.AMOUNT_MISMATCH:
    case "amount_mismatch":
      return "Chuyển thừa/thiếu tiền";
    case RefundRequestReasonEnum.DEPOSIT_SETTLEMENT:
    case "deposit_settlement":
      return "Quyết toán cọc dư";
    case RefundRequestReasonEnum.FACILITY_FAULT:
    case "facility_fault":
      return "Lỗi cơ sở kho";
    default:
      return reason;
  }
};

export const RefundReasonBadge: React.FC<RefundReasonBadgeProps> = ({ reason, className = "" }) => {
  const label = getRefundReasonLabel(reason);

  const getVariantStyle = () => {
    switch (reason) {
      case "deposit_settlement":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "facility_fault":
      case "facility_cancel":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "late_payment":
      case "amount_mismatch":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "customer_cancel":
      case "system_cancel":
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <Badge
      variant="outline"
      className={`font-medium px-2.5 py-0.5 rounded-md ${getVariantStyle()} ${className}`}
    >
      {label}
    </Badge>
  );
};
