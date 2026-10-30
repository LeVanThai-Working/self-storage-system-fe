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

export function isCheckInDatePassed(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const targetDate = new Date(dateStr);
  if (Number.isNaN(targetDate.getTime())) return false;

  const now = new Date();
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const vnNow = new Date(utcNow + 7 * 3600000);
  const startOfDayVn = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate(), 0, 0, 0, 0);

  const utcTarget = targetDate.getTime() + targetDate.getTimezoneOffset() * 60000;
  const vnTarget = new Date(utcTarget + 7 * 3600000);
  const targetDateOnly = new Date(
    vnTarget.getFullYear(),
    vnTarget.getMonth(),
    vnTarget.getDate(),
    0,
    0,
    0,
    0
  );

  return targetDateOnly.getTime() < startOfDayVn.getTime();
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
      text: locale === "en" ? "Hold expired" : "Đã quá hạn giữ chỗ (15p)",
      isExpired: true,
      isUrgent: true,
    };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diffMs % 60000) / 1000);

  const isUrgent = hours < 1 && minutes < 5;
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
  billingUnit: BillingUnitEnum | "day" | "month" | "one_time" | string,
  locale = "vi"
): string {
  if (
    (billingUnit === BillingUnitEnum.MONTH || billingUnit === "month") &&
    rentalDuration % 30 === 0
  ) {
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

export function getReservationStatusTone(status: ReservationStatusEnum | string): StatusBadgeTone {
  switch (status) {
    case ReservationStatusEnum.PENDING_PAYMENT:
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        dot: "bg-orange-500",
        border: "border-orange-200/80",
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
    case ReservationStatusEnum.OVERDUE:
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
        border: "border-amber-200/80",
      };
    case ReservationStatusEnum.COMPLETED:
      return {
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        dot: "bg-indigo-500",
        border: "border-indigo-200/80",
      };
    case ReservationStatusEnum.CANCELLED:
    case ReservationStatusEnum.REJECTED:
      return {
        bg: "bg-rose-50/80",
        text: "text-rose-700",
        dot: "bg-rose-500",
        border: "border-rose-200/70",
      };
    case ReservationStatusEnum.EXPIRED:
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        dot: "bg-slate-400",
        border: "border-slate-200",
      };
    case ReservationStatusEnum.PENDING:
    case ReservationStatusEnum.RECEIVED:
    default:
      return {
        bg: "bg-slate-50",
        text: "text-slate-700",
        dot: "bg-slate-500",
        border: "border-slate-200/80",
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

const PRIMARY_FLOW_STATUSES: ReservationStatusEnum[] = [
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
    status === ReservationStatusEnum.CANCELLED ||
    status === ReservationStatusEnum.EXPIRED ||
    status === ReservationStatusEnum.REJECTED;

  const currentIdx = PRIMARY_FLOW_STATUSES.indexOf(status as ReservationStatusEnum);

  const unitLabel = reservation.storageUnit?.unitNumber
    ? locale === "en"
      ? `Unit ${reservation.storageUnit.unitNumber}`
      : `Ô kho ${reservation.storageUnit.unitNumber}`
    : null;

  const paidLabel =
    reservation.depositAmount > 0 ? `${formatVnd(reservation.depositAmount)}` : null;

  const hasArrived = Boolean(reservation.arrivedAt);

  // Step 1: Hold & Pending Payment
  const step1State =
    status === ReservationStatusEnum.PENDING_PAYMENT
      ? "current"
      : reservation.createdAt
        ? "completed"
        : "upcoming";

  // Step 2: Payment
  let step2State: "completed" | "current" | "upcoming" | "error" = "upcoming";
  if (
    reservation.paidAt ||
    status === ReservationStatusEnum.PAYMENT_SUCCESSFUL ||
    status === ReservationStatusEnum.CONFIRMED ||
    status === ReservationStatusEnum.OVERDUE ||
    status === ReservationStatusEnum.COMPLETED ||
    hasArrived
  ) {
    step2State = "completed";
  } else if (status === ReservationStatusEnum.PENDING_PAYMENT) {
    step2State = "upcoming";
  }

  // Step 3: Confirmed & Staff Assigned
  let step3State: "completed" | "current" | "upcoming" | "error" = "upcoming";
  if (
    reservation.confirmedAt ||
    status === ReservationStatusEnum.CONFIRMED ||
    status === ReservationStatusEnum.OVERDUE ||
    status === ReservationStatusEnum.COMPLETED ||
    hasArrived
  ) {
    step3State = "completed";
  } else if (status === ReservationStatusEnum.PAYMENT_SUCCESSFUL) {
    step3State = "current";
  }

  // Step 4: Arrived
  let step4State: "completed" | "current" | "upcoming" | "error" = "upcoming";
  if (hasArrived) {
    step4State = "completed";
  } else if (
    status === ReservationStatusEnum.CONFIRMED ||
    status === ReservationStatusEnum.OVERDUE
  ) {
    step4State = "current";
  } else if (status === ReservationStatusEnum.COMPLETED) {
    step4State = "completed";
  }

  // Step 5: Completed
  let step5State: "completed" | "current" | "upcoming" | "error" = "upcoming";
  if (status === ReservationStatusEnum.COMPLETED) {
    step5State = "completed";
  } else if (
    hasArrived &&
    (status === ReservationStatusEnum.CONFIRMED || status === ReservationStatusEnum.OVERDUE)
  ) {
    step5State = "current";
  }

  return [
    {
      key: "pending_payment",
      stepNumber: 1,
      state: isTerminalNegative && !reservation.paidAt ? "completed" : step1State,
      timestamp: reservation.createdAt,
      actorName: reservation.customer?.name ?? null,
      metaText: unitLabel,
    },
    {
      key: "payment_successful",
      stepNumber: 2,
      state: step2State,
      timestamp: reservation.paidAt,
      actorName: reservation.customer?.name ?? null,
      metaText: paidLabel,
    },
    {
      key: "confirmed",
      stepNumber: 3,
      state: step3State,
      timestamp: reservation.confirmedAt,
      actorName: reservation.assignedStaff?.name ?? reservation.confirmedBy?.name ?? null,
    },
    {
      key: "arrived",
      stepNumber: 4,
      state: step4State,
      timestamp: reservation.arrivedAt,
      actorName: reservation.arrivedBy?.name ?? null,
    },
    {
      key: "completed",
      stepNumber: 5,
      state: step5State,
      timestamp: status === ReservationStatusEnum.COMPLETED ? reservation.updatedAt : null,
      actorName: null,
    },
  ];
}
