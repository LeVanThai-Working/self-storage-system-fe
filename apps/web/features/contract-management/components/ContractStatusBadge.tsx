"use client";

import React from "react";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  MinusCircle,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react";
import {
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractDepositStatusEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  ContractTerminationTypeEnum,
  ViolationCategoryEnum,
} from "../types";

interface ContractStatusTone {
  bg: string;
  text: string;
  border: string;
  dot: string;
  labelVi: string;
  labelEn: string;
}

export function getContractStatusTone(status: ContractStatusEnum | string): ContractStatusTone {
  switch (status) {
    case ContractStatusEnum.DRAFT:
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
        labelVi: "Chờ ký & Check-in",
        labelEn: "Pending Check-in",
      };
    case ContractStatusEnum.ACTIVE:
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        labelVi: "Đang thuê",
        labelEn: "Active",
      };
    case ContractStatusEnum.OVERDUE:
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
        dot: "bg-orange-500",
        labelVi: "Quá hạn trả kho",
        labelEn: "Overdue",
      };
    case ContractStatusEnum.COMPLETED:
      return {
        bg: "bg-sky-50",
        text: "text-sky-700",
        border: "border-sky-200",
        dot: "bg-sky-500",
        labelVi: "Đã hoàn tất",
        labelEn: "Completed",
      };
    case ContractStatusEnum.CANCELLED:
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-200",
        dot: "bg-slate-400",
        labelVi: "Đã huỷ bản nháp",
        labelEn: "Cancelled",
      };
    case ContractStatusEnum.TERMINATED:
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
        labelVi: "Chấm dứt trước hạn",
        labelEn: "Terminated",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
        labelVi: String(status),
        labelEn: String(status),
      };
  }
}

interface ContractStatusBadgeProps {
  status: ContractStatusEnum;
}

export const ContractStatusBadge: React.FC<ContractStatusBadgeProps> = ({ status }) => {
  const isEn = useLocale() === "en";
  const tone = getContractStatusTone(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${tone.bg} ${tone.text} ${tone.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {isEn ? tone.labelEn : tone.labelVi}
    </span>
  );
};

interface ContractSourceBadgeProps {
  source: ContractSourceEnum;
}

export const ContractSourceBadge: React.FC<ContractSourceBadgeProps> = ({ source }) => {
  const isEn = useLocale() === "en";
  const isReservation = source === ContractSourceEnum.RESERVATION;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
        isReservation
          ? "bg-teal-50 text-teal-700 border-teal-200/80"
          : "bg-indigo-50 text-indigo-700 border-indigo-200/80"
      }`}
    >
      {isReservation ? (
        <Sparkles className="w-3 h-3 shrink-0" />
      ) : (
        <UserCheck className="w-3 h-3 shrink-0" />
      )}
      {isReservation
        ? isEn
          ? "Reservation"
          : "Khách hàng đặt chỗ"
        : isEn
          ? "Walk-in"
          : "Khách hàng trực tiếp"}
    </span>
  );
};

interface ContractDepositBadgeProps {
  source?: ContractSourceEnum;
  depositPaidAt?: string | null;
}

export const ContractDepositBadge: React.FC<ContractDepositBadgeProps> = ({
  source,
  depositPaidAt,
}) => {
  const isEn = useLocale() === "en";
  const isFromReservation = source === ContractSourceEnum.RESERVATION;
  const isPaid = isFromReservation || Boolean(depositPaidAt);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
        isPaid
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
      }`}
    >
      {isPaid ? (
        <CheckCircle2 className="w-3 h-3 shrink-0" />
      ) : (
        <Clock className="w-3 h-3 shrink-0" />
      )}
      {isFromReservation
        ? isEn
          ? "Deposit: Paid from Reservation"
          : "Tiền cọc: Đã thanh toán từ Đặt chỗ"
        : isPaid
          ? isEn
            ? "Deposit Paid"
            : "Đã đóng cọc"
          : isEn
            ? "Unpaid Deposit"
            : "Chưa đóng cọc"}
    </span>
  );
};

interface ContractDepositStatusBadgeProps {
  status?: ContractDepositStatusEnum | string | null;
}

export const ContractDepositStatusBadge: React.FC<ContractDepositStatusBadgeProps> = ({
  status,
}) => {
  const isEn = useLocale() === "en";
  if (!status) return null;

  switch (String(status).toLowerCase()) {
    case ContractDepositStatusEnum.HELD:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3 shrink-0" />
          {isEn ? "Deposit Held" : "Đang giữ cọc"}
        </span>
      );
    case ContractDepositStatusEnum.APPLIED:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border bg-teal-50 text-teal-700 border-teal-200">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          {isEn ? "Deposit Applied" : "Đã đối trừ cọc"}
        </span>
      );
    case ContractDepositStatusEnum.PARTIALLY_REFUNDED:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {isEn ? "Partially Refunded" : "Hoàn trả một phần"}
        </span>
      );
    case ContractDepositStatusEnum.REFUNDED:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          {isEn ? "Deposit Refunded" : "Đã hoàn cọc 100%"}
        </span>
      );
    case ContractDepositStatusEnum.FORFEITED:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border bg-rose-50 text-rose-700 border-rose-200">
          <XCircle className="w-3 h-3 shrink-0" />
          {isEn ? "Deposit Forfeited" : "Tịch thu cọc 100%"}
        </span>
      );
    case ContractDepositStatusEnum.DISPUTED:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border bg-purple-50 text-purple-700 border-purple-200">
          <HelpCircle className="w-3 h-3 shrink-0" />
          {isEn ? "Settlement Disputed" : "Đang khiếu nại tranh chấp"}
        </span>
      );
    default:
      return null;
  }
};

interface ContractAddendumTypeBadgeProps {
  type: ContractAddendumTypeEnum | string;
}

export const ContractAddendumTypeBadge: React.FC<ContractAddendumTypeBadgeProps> = ({ type }) => {
  const isEn = useLocale() === "en";
  const normalized = String(type).toLowerCase();

  if (normalized === ContractAddendumTypeEnum.RENEW) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
        <Calendar className="w-3 h-3 shrink-0" />
        {isEn ? "Renewal (RENEW)" : "Gia hạn hợp đồng"}
      </span>
    );
  }

  if (normalized === ContractAddendumTypeEnum.UNIT_CHANGE) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
        <ArrowRightLeft className="w-3 h-3 shrink-0" />
        {isEn ? "Unit Transfer (UNIT_CHANGE)" : "Điều chuyển kho sự cố"}
      </span>
    );
  }

  if (normalized === ContractAddendumTypeEnum.ADD) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border bg-teal-50 text-teal-700 border-teal-200">
        <PlusCircle className="w-3 h-3 shrink-0" />
        {isEn ? "Add Amenities" : "Thuê thêm tiện ích"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border bg-orange-50 text-orange-700 border-orange-200">
      <MinusCircle className="w-3 h-3 shrink-0" />
      {isEn ? "Remove Amenities" : "Tháo dỡ / Trả bớt"}
    </span>
  );
};

export function getAddendumStatusTone(
  status: ContractAddendumStatusEnum | string
): ContractStatusTone {
  switch (status) {
    case ContractAddendumStatusEnum.PENDING_APPROVAL:
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
        labelVi: "Chờ Quản lý duyệt",
        labelEn: "Pending Approval",
      };
    case ContractAddendumStatusEnum.DRAFT:
      return {
        bg: "bg-teal-50",
        text: "text-teal-700",
        border: "border-teal-200",
        dot: "bg-teal-500",
        labelVi: "Bản nháp (Chờ ký 2 bên)",
        labelEn: "Draft (Pending Sign)",
      };
    case ContractAddendumStatusEnum.ACTIVE:
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        labelVi: "Đã kích hoạt",
        labelEn: "Active",
      };
    case ContractAddendumStatusEnum.REJECTED:
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
        labelVi: "Bị từ chối",
        labelEn: "Rejected",
      };
    case ContractAddendumStatusEnum.CANCELLED:
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-200",
        dot: "bg-slate-400",
        labelVi: "Đã hủy",
        labelEn: "Cancelled",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
        labelVi: String(status),
        labelEn: String(status),
      };
  }
}

interface ContractAddendumStatusBadgeProps {
  status: ContractAddendumStatusEnum;
}

export const ContractAddendumStatusBadge: React.FC<ContractAddendumStatusBadgeProps> = ({
  status,
}) => {
  const isEn = useLocale() === "en";
  const tone = getAddendumStatusTone(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tone.bg} ${tone.text} ${tone.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {isEn ? tone.labelEn : tone.labelVi}
    </span>
  );
};

interface ContractTerminationBadgeProps {
  terminationType?: ContractTerminationTypeEnum | null;
  violationCategory?: ViolationCategoryEnum | null;
}

export const ContractTerminationBadge: React.FC<ContractTerminationBadgeProps> = ({
  terminationType,
  violationCategory,
}) => {
  const isEn = useLocale() === "en";
  if (!terminationType) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border bg-rose-50 text-rose-800 border-rose-200">
      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
      <span>
        {terminationType === ContractTerminationTypeEnum.MUTUAL
          ? isEn
            ? "Mutual Termination"
            : "Thỏa thuận đôi bên"
          : terminationType === ContractTerminationTypeEnum.CUSTOMER_REQUEST
            ? isEn
              ? "Customer Request"
              : "Khách yêu cầu chấm dứt"
            : isEn
              ? "Violation Termination"
              : "Vi phạm hợp đồng"}
      </span>
      {violationCategory && (
        <span className="text-[11px] font-normal text-rose-600">
          •{" "}
          {violationCategory === ViolationCategoryEnum.PROHIBITED_GOODS
            ? isEn
              ? "Prohibited Goods"
              : "Hàng cấm"
            : violationCategory === ViolationCategoryEnum.OVERDUE_PAYMENT
              ? isEn
                ? "Overdue Payment"
                : "Nợ tiền quá hạn"
              : isEn
                ? "Property Damage"
                : "Phá hoại kho"}
        </span>
      )}
    </div>
  );
};
