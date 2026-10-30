"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Ban, CheckCircle2, Clock, DollarSign, XCircle } from "lucide-react";
import { RefundRequestStatusEnum } from "../types";

interface RefundStatusBadgeProps {
  status: RefundRequestStatusEnum | string;
  className?: string;
}

export const RefundStatusBadge: React.FC<RefundStatusBadgeProps> = ({ status, className = "" }) => {
  switch (status) {
    case RefundRequestStatusEnum.PENDING_APPROVAL:
    case "pending_approval":
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5 font-medium px-2.5 py-0.5 rounded-full ${className}`}
        >
          <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
          <span>Chờ duyệt</span>
        </Badge>
      );
    case RefundRequestStatusEnum.APPROVED:
    case "approved":
      return (
        <Badge
          variant="outline"
          className={`bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1.5 font-medium px-2.5 py-0.5 rounded-full ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã duyệt (Chờ chi)</span>
        </Badge>
      );
    case RefundRequestStatusEnum.PAID:
    case "paid":
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-full ${className}`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Đã hoàn tiền</span>
        </Badge>
      );
    case RefundRequestStatusEnum.REJECTED:
    case "rejected":
      return (
        <Badge
          variant="outline"
          className={`bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1.5 font-medium px-2.5 py-0.5 rounded-full ${className}`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Đã từ chối</span>
        </Badge>
      );
    case RefundRequestStatusEnum.CANCELLED:
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className={`bg-slate-100 text-slate-600 border-slate-200 flex items-center gap-1.5 font-medium px-2.5 py-0.5 rounded-full ${className}`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>Đã hủy</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
};
