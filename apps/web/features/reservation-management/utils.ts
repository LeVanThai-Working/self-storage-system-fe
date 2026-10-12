import { BillingUnitEnum, ReservationStatusEnum, type ReservationResponse } from "./types";

export function formatVnd(amount?: number | null): string {
  const safe = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatDateTime(iso?: string | null, locale = "vi"): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateOnly(iso?: string | null, locale = "vi"): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatHoldCountdown(
  expiresAt?: string | null,
  nowMs = Date.now(),
  locale = "vi"
): { text: string; isExpired: boolean; isUrgent: boolean } | null {
  if (!expiresAt) return null;
  const targetMs = new Date(expiresAt).getTime();
  if (Number.isNaN(targetMs)) return null;

  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    return {
      text: locale === "en" ? "Hold expired" : "Đã quá hạn giữ chỗ",
      isExpired: true,
      isUrgent: true,
    };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diffMs % 60000) / 1000);

  const isUrgent = hours < 2;
  const text =
    hours > 0
      ? locale === "en"
        ? `${hours}h ${minutes}m left`
        : `Còn ${hours}g ${minutes}p`
      : locale === "en"
        ? `${minutes}m ${seconds}s left`
        : `Còn ${minutes}p ${seconds}s`;

  return {
    text,
    isExpired: false,
    isUrgent,
  };
}

export function formatRentalScheduleLabel(
  rentalDuration: number,
  billingUnit: BillingUnitEnum,
  locale = "vi"
): string {
  if (billingUnit === BillingUnitEnum.MONTH && rentalDuration % 30 === 0) {
    const months = rentalDuration / 30;
    return locale === "en"
      ? `${months} ${months === 1 ? "month" : "months"} (${rentalDuration} days)`
      : `${months} tháng (${rentalDuration} ngày)`;
  }
  return locale === "en"
    ? `${rentalDuration} ${rentalDuration === 1 ? "day" : "days"}`
    : `${rentalDuration} ngày`;
}

export interface StatusBadgeTone {
  bg: string;
  text: string;
  dot: string;
  border: string;
}

export function getReservationStatusTone(status: ReservationStatusEnum): StatusBadgeTone {
  switch (status) {
    case ReservationStatusEnum.PENDING:
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
        border: "border-amber-200/80",
      };
    case ReservationStatusEnum.RECEIVED:
      return {
        bg: "bg-sky-50",
        text: "text-sky-700",
        dot: "bg-sky-500",
        border: "border-sky-200/80",
      };
    case ReservationStatusEnum.PENDING_PAYMENT:
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        dot: "bg-orange-500",
        border: "border-orange-200/80",
      };
    case ReservationStatusEnum.PAYMENT_FAILED:
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        dot: "bg-rose-500",
        border: "border-rose-200/80",
      };
    case ReservationStatusEnum.PAYMENT_SUCCESSFUL:
      return {
        bg: "bg-teal-50",
        text: "text-teal-700",
        dot: "bg-teal-500",
        border: "border-teal-200/80",
      };
    case ReservationStatusEnum.CONFIRMED:
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        border: "border-emerald-200/80",
      };
    case ReservationStatusEnum.COMPLETED:
      return {
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        dot: "bg-indigo-500",
        border: "border-indigo-200/80",
      };
    case ReservationStatusEnum.REJECTED:
    case ReservationStatusEnum.CANCELLED:
      return {
        bg: "bg-rose-50/80",
        text: "text-rose-700",
        dot: "bg-rose-500",
        border: "border-rose-200/70",
      };
    case ReservationStatusEnum.EXPIRED:
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        dot: "bg-slate-400",
        border: "border-slate-200",
      };
  }
}

export interface TimelineStepItem {
  key: string;
  stepNumber: number;
  state: "completed" | "current" | "upcoming" | "error";
  timestamp?: string | null;
  actorName?: string | null;
  metaText?: string | null;
}

const ORDERED_HAPPY_STATUSES: ReservationStatusEnum[] = [
  ReservationStatusEnum.PENDING,
  ReservationStatusEnum.RECEIVED,
  ReservationStatusEnum.PENDING_PAYMENT,
  ReservationStatusEnum.PAYMENT_SUCCESSFUL,
  ReservationStatusEnum.CONFIRMED,
  ReservationStatusEnum.COMPLETED,
];

export function buildReservationTimelineSteps(
  reservation: ReservationResponse,
  locale = "vi"
): TimelineStepItem[] {
  const status = reservation.status;
  const isTerminalNegative =
    status === ReservationStatusEnum.REJECTED ||
    status === ReservationStatusEnum.CANCELLED ||
    status === ReservationStatusEnum.EXPIRED;

  const normalizedCurrentStatus =
    status === ReservationStatusEnum.PAYMENT_FAILED
      ? ReservationStatusEnum.PENDING_PAYMENT
      : status;

  const currentIdx = ORDERED_HAPPY_STATUSES.indexOf(normalizedCurrentStatus);

  const hasReached = (stepIdx: number, timestamp?: string | null): boolean => {
    if (timestamp) return true;
    if (!isTerminalNegative && currentIdx >= stepIdx) return true;
    return false;
  };

  const resolveState = (
    stepIdx: number,
    timestamp?: string | null
  ): "completed" | "current" | "upcoming" | "error" => {
    if (!isTerminalNegative) {
      if (stepIdx < currentIdx) return "completed";
      if (stepIdx === currentIdx) {
        return status === ReservationStatusEnum.PAYMENT_FAILED ? "error" : "current";
      }
      if (stepIdx === 5 && status === ReservationStatusEnum.COMPLETED) return "completed";
      return "upcoming";
    }
    return hasReached(stepIdx, timestamp) ? "completed" : "upcoming";
  };

  const unitLabel = reservation.storageUnit?.unitNumber
    ? locale === "en"
      ? `Unit ${reservation.storageUnit.unitNumber}`
      : `Ô kho ${reservation.storageUnit.unitNumber}`
    : null;

  const paidLabel =
    reservation.paidAmount && reservation.paidAmount > 0
      ? `${formatVnd(reservation.paidAmount)}`
      : null;

  return [
    {
      key: "pending",
      stepNumber: 1,
      state: resolveState(0, reservation.createdAt),
      timestamp: reservation.createdAt,
      actorName: reservation.customer?.name ?? null,
    },
    {
      key: "received",
      stepNumber: 2,
      state: resolveState(1, reservation.receivedAt ?? reservation.assignedAt),
      timestamp: reservation.receivedAt ?? reservation.assignedAt,
      actorName: reservation.receivedBy?.name ?? reservation.assignedBy?.name ?? null,
    },
    {
      key: status === ReservationStatusEnum.PAYMENT_FAILED ? "payment_failed" : "pending_payment",
      stepNumber: 3,
      state: resolveState(2, reservation.assignedAt),
      timestamp: reservation.assignedAt,
      actorName: reservation.assignedBy?.name ?? null,
      metaText: unitLabel,
    },
    {
      key: "payment_successful",
      stepNumber: 4,
      state: resolveState(3, reservation.paidAt),
      timestamp: reservation.paidAt,
      actorName: reservation.customer?.name ?? null,
      metaText: paidLabel,
    },
    {
      key: "confirmed",
      stepNumber: 5,
      state: resolveState(4, reservation.confirmedAt),
      timestamp: reservation.confirmedAt,
      actorName: reservation.confirmedBy?.name ?? null,
    },
    {
      key: "completed",
      stepNumber: 6,
      state: status === ReservationStatusEnum.COMPLETED ? "completed" : "upcoming",
      timestamp: status === ReservationStatusEnum.COMPLETED ? reservation.updatedAt : null,
      actorName: null,
    },
  ];
}
