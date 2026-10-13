"use client";

import React from "react";
import { useLocale } from "next-intl";
import { CheckCircle2, Clock, MinusCircle, PlusCircle, Sparkles, UserCheck } from "lucide-react";
import {
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractSourceEnum,
  ContractStatusEnum,
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

interface ContractAddendumTypeBadgeProps {
  type: ContractAddendumTypeEnum;
}

export const ContractAddendumTypeBadge: React.FC<ContractAddendumTypeBadgeProps> = ({ type }) => {
  const isEn = useLocale() === "en";
  const isAdd = type === ContractAddendumTypeEnum.ADD;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
        isAdd
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-orange-50 text-orange-700 border-orange-200"
      }`}
    >
      {isAdd ? (
        <PlusCircle className="w-3 h-3 shrink-0" />
      ) : (
        <MinusCircle className="w-3 h-3 shrink-0" />
      )}
      {isAdd
        ? isEn
          ? "Add / Install Amenities"
          : "Thuê thêm / Lắp đặt"
        : isEn
          ? "Remove / Return Amenities"
          : "Tháo dỡ / Trả bớt"}
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
        labelVi: "Chờ ký 2 bên",
        labelEn: "Pending Signature",
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
