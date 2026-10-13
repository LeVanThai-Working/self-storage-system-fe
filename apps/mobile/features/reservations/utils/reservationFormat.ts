import {
  BillingUnitEnum,
  ContractStatusEnum,
  MESSAGE_CODE,
  PaymentStatusEnum,
  ReservationStatusEnum,
  UnitTypeCategoryEnum,
  formatCurrency,
  resolveMessageCode,
  type ContractResponse,
  type MessageLocale,
  type ReservationResponse,
} from "@self-storage-system-fe/shared";
import { AppApiError } from "@/lib/api/axios";

/**
 * Checks whether a storage unit category (SMALL, MEDIUM, LARGE) requires at least 1 day
 * advance notice from today for order processing.
 */
export function requiresAdvanceDayForCategory(
  category?: UnitTypeCategoryEnum | string | null
): boolean {
  if (!category) return false;
  const normalized = String(category).toLowerCase();
  return (
    normalized === UnitTypeCategoryEnum.SMALL ||
    normalized === UnitTypeCategoryEnum.MEDIUM ||
    normalized === UnitTypeCategoryEnum.LARGE
  );
}

/**
 * Formats VND currency safely.
 */
export function formatVnd(amount?: number | null): string {
  const num = Number(amount ?? 0);
  try {
    return formatCurrency(num);
  } catch {
    return `${num.toLocaleString("vi-VN")} ₫`;
  }
}

/**
 * Formats an ISO string into `DD/MM/YYYY`.
 */
export function formatDateShort(isoStr?: string | null): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formats an ISO string into `HH:mm - DD/MM/YYYY`.
 */
export function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${min} • ${dd}/${mm}/${yyyy}`;
}

/**
 * Returns today's date in `YYYY-MM-DD` local format.
 */
export function getTodayDateInput(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Converts an ISO date string into `YYYY-MM-DD` local format for editing.
 */
export function isoToDateInput(isoStr?: string | null): string {
  if (!isoStr) return getTodayDateInput();
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return getTodayDateInput();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parses `YYYY-MM-DD` or `DD/MM/YYYY` or ISO string into a valid ISO 8601 string,
 * and checks whether it is >= startOfToday (and >= startOfTomorrow for SMALL, MEDIUM, LARGE).
 */
export function parseAndValidateStartDate(
  dateInput: string,
  category?: UnitTypeCategoryEnum | string | null
): {
  isValidFormat: boolean;
  isNotInPast: boolean;
  isSatisfyingAdvanceDay: boolean;
  isoString: string;
} {
  const trimmed = dateInput.trim();
  if (!trimmed) {
    return {
      isValidFormat: false,
      isNotInPast: false,
      isSatisfyingAdvanceDay: false,
      isoString: "",
    };
  }

  let year = 0;
  let month = 0;
  let day = 0;

  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (ymdMatch) {
    year = Number(ymdMatch[1]);
    month = Number(ymdMatch[2]);
    day = Number(ymdMatch[3]);
  } else if (dmyMatch) {
    day = Number(dmyMatch[1]);
    month = Number(dmyMatch[2]);
    year = Number(dmyMatch[3]);
  } else {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return {
        isValidFormat: false,
        isNotInPast: false,
        isSatisfyingAdvanceDay: false,
        isoString: "",
      };
    }
    year = parsed.getFullYear();
    month = parsed.getMonth() + 1;
    day = parsed.getDate();
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000) {
    return {
      isValidFormat: false,
      isNotInPast: false,
      isSatisfyingAdvanceDay: false,
      isoString: "",
    };
  }

  const candidateLocal = new Date(year, month - 1, day, 9, 0, 0, 0);
  if (
    candidateLocal.getFullYear() !== year ||
    candidateLocal.getMonth() !== month - 1 ||
    candidateLocal.getDate() !== day
  ) {
    return {
      isValidFormat: false,
      isNotInPast: false,
      isSatisfyingAdvanceDay: false,
      isoString: "",
    };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  const needsAdvanceDay = requiresAdvanceDayForCategory(category);

  if (candidateLocal.getTime() < startOfToday.getTime()) {
    return {
      isValidFormat: true,
      isNotInPast: false,
      isSatisfyingAdvanceDay: false,
      isoString: candidateLocal.toISOString(),
    };
  }

  if (needsAdvanceDay && candidateLocal.getTime() < startOfTomorrow.getTime()) {
    return {
      isValidFormat: true,
      isNotInPast: true,
      isSatisfyingAdvanceDay: false,
      isoString: candidateLocal.toISOString(),
    };
  }

  // Ensure that if the user selects today, the timestamp is never in the past relative to UTC/server clock
  const safeTimestamp = Math.max(candidateLocal.getTime(), now.getTime() + 60 * 1000);
  return {
    isValidFormat: true,
    isNotInPast: true,
    isSatisfyingAdvanceDay: true,
    isoString: new Date(safeTimestamp).toISOString(),
  };
}

/**
 * Formats billing unit label (e.g., "tháng" / "ngày" / "lần") for pricing display.
 */
export function getBillingUnitName(
  billingUnit: BillingUnitEnum | string | undefined | null,
  locale: MessageLocale = "vi"
): string {
  switch (billingUnit) {
    case BillingUnitEnum.DAY:
      return locale === "en" ? "day" : "ngày";
    case BillingUnitEnum.ONE_TIME:
      return locale === "en" ? "time" : "lần";
    case BillingUnitEnum.MONTH:
    default:
      return locale === "en" ? "month" : "tháng";
  }
}

/**
 * Maps physical StorageUnitStatusEnum (`available`, `reserved`, `occupied`, `under_maintenance`, `inactive`)
 * to localized EN/VI labels.
 */
export function getStorageUnitStatusLabel(
  status?: string | null,
  locale: MessageLocale = "vi"
): string {
  if (!status) return "—";
  const isEn = locale === "en";
  switch (status.toLowerCase()) {
    case "available":
      return isEn ? "Available" : "Còn trống";
    case "reserved":
      return isEn ? "Reserved" : "Đã giữ chỗ";
    case "occupied":
      return isEn ? "Occupied" : "Đang thuê";
    case "under_maintenance":
      return isEn ? "Under Maintenance" : "Đang bảo trì";
    case "inactive":
      return isEn ? "Inactive" : "Ngừng sử dụng";
    default:
      return status;
  }
}

/**
 * Formats `rentalDuration` / `minRentalDays` (which Backend always stores in DAYS).
 * Example:
 * - `30` -> `"30 ngày (1 tháng)"` / `"30 days (1 month)"`
 * - `90` -> `"90 ngày (3 tháng)"` / `"90 days (3 months)"`
 * - `45` -> `"45 ngày (≈ 1.5 tháng)"` / `"45 days (≈ 1.5 months)"`
 * - `7`  -> `"7 ngày"` / `"7 days"`
 */
export function formatRentalDurationDays(
  days?: number | null,
  locale: MessageLocale = "vi"
): string {
  const safeDays = Math.max(0, Number(days ?? 0));
  const isEn = locale === "en";
  const dayUnit = isEn ? (safeDays === 1 ? "day" : "days") : "ngày";

  if (safeDays >= 30) {
    if (safeDays % 30 === 0) {
      const months = safeDays / 30;
      const monthUnit = isEn ? (months === 1 ? "month" : "months") : "tháng";
      return `${safeDays} ${dayUnit} (${months} ${monthUnit})`;
    }
    const approxMonths = Math.round((safeDays / 30) * 10) / 10;
    const monthUnit = isEn ? "months" : "tháng";
    return `${safeDays} ${dayUnit} (≈ ${approxMonths} ${monthUnit})`;
  }

  return `${safeDays} ${dayUnit}`;
}

export interface ReservationStatusStyle {
  label: string;
  compactStepLabel: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  badgeTextClass: string;
  dotColor: string;
}

/**
 * Maps ReservationStatusEnum to UI badge classes and compact step progress summary.
 */
export function getReservationStatusMeta(
  status: ReservationStatusEnum | string,
  locale: MessageLocale = "vi"
): ReservationStatusStyle {
  const isEn = locale === "en";

  switch (status) {
    case ReservationStatusEnum.PENDING:
      return {
        label: isEn ? "Pending Review" : "Chờ tiếp nhận",
        compactStepLabel: isEn ? "Step 1/6: Submitted" : "Bước 1/6: Đã gửi yêu cầu",
        badgeBgClass: "bg-amber-50 dark:bg-amber-950/40",
        badgeBorderClass: "border-amber-300 dark:border-amber-800",
        badgeTextClass: "text-amber-700 dark:text-amber-400",
        dotColor: "#D97706",
      };
    case ReservationStatusEnum.RECEIVED:
      return {
        label: isEn ? "Staff Received" : "Đã tiếp nhận",
        compactStepLabel: isEn ? "Step 2/6: Staff Received" : "Bước 2/6: Đã tiếp nhận",
        badgeBgClass: "bg-sky-50 dark:bg-sky-950/40",
        badgeBorderClass: "border-sky-300 dark:border-sky-800",
        badgeTextClass: "text-sky-700 dark:text-sky-400",
        dotColor: "#0284C7",
      };
    case ReservationStatusEnum.PENDING_PAYMENT:
      return {
        label: isEn ? "Awaiting Deposit" : "Chờ đặt cọc",
        compactStepLabel: isEn ? "Step 3/6: Awaiting Deposit" : "Bước 3/6: Chờ đặt cọc",
        badgeBgClass: "bg-cta-light/40 dark:bg-cta/20",
        badgeBorderClass: "border-cta/50",
        badgeTextClass: "text-cta",
        dotColor: "#FF702E",
      };
    case ReservationStatusEnum.PAYMENT_FAILED:
      return {
        label: isEn ? "Payment Failed" : "Lỗi thanh toán",
        compactStepLabel: isEn ? "Step 3/6: Payment Issue" : "Bước 3/6: Thanh toán lỗi",
        badgeBgClass: "bg-red-50 dark:bg-red-950/40",
        badgeBorderClass: "border-red-300 dark:border-red-800",
        badgeTextClass: "text-red-600 dark:text-red-400",
        dotColor: "#EF4444",
      };
    case ReservationStatusEnum.PAYMENT_SUCCESSFUL:
      return {
        label: isEn ? "Deposit Paid" : "Đã đặt cọc",
        compactStepLabel: isEn ? "Step 4/6: Deposit Paid" : "Bước 4/6: Đã đặt cọc",
        badgeBgClass: "bg-brand-light/40 dark:bg-brand/20",
        badgeBorderClass: "border-brand/50",
        badgeTextClass: "text-brand",
        dotColor: "#0B927E",
      };
    case ReservationStatusEnum.CONFIRMED:
      return {
        label: isEn ? "Confirmed" : "Đã xác nhận giữ kho",
        compactStepLabel: isEn ? "Step 5/6: Confirmed" : "Bước 5/6: Đã xác nhận giữ kho",
        badgeBgClass: "bg-brand-light/50 dark:bg-brand/25",
        badgeBorderClass: "border-brand",
        badgeTextClass: "text-brand",
        dotColor: "#0B927E",
      };
    case ReservationStatusEnum.COMPLETED:
      return {
        label: isEn ? "Completed" : "Hoàn tất",
        compactStepLabel: isEn ? "Step 6/6: Completed" : "Bước 6/6: Hoàn tất",
        badgeBgClass: "bg-emerald-50 dark:bg-emerald-950/40",
        badgeBorderClass: "border-emerald-400 dark:border-emerald-700",
        badgeTextClass: "text-emerald-700 dark:text-emerald-400",
        dotColor: "#10B981",
      };
    case ReservationStatusEnum.REJECTED:
      return {
        label: isEn ? "Rejected" : "Bị từ chối",
        compactStepLabel: isEn ? "Terminated: Rejected" : "Đã dừng: Bị từ chối",
        badgeBgClass: "bg-red-50 dark:bg-red-950/40",
        badgeBorderClass: "border-red-300 dark:border-red-800",
        badgeTextClass: "text-red-600 dark:text-red-400",
        dotColor: "#EF4444",
      };
    case ReservationStatusEnum.CANCELLED:
      return {
        label: isEn ? "Cancelled" : "Đã hủy",
        compactStepLabel: isEn ? "Terminated: Cancelled" : "Đã dừng: Đã hủy",
        badgeBgClass: "bg-neutral-100 dark:bg-neutral-800",
        badgeBorderClass: "border-neutral-300 dark:border-neutral-700",
        badgeTextClass: "text-neutral-600 dark:text-neutral-400",
        dotColor: "#647B80",
      };
    case ReservationStatusEnum.EXPIRED:
      return {
        label: isEn ? "Expired" : "Hết hạn giữ chỗ",
        compactStepLabel: isEn ? "Terminated: Expired" : "Đã dừng: Hết hạn giữ chỗ",
        badgeBgClass: "bg-neutral-100 dark:bg-neutral-800",
        badgeBorderClass: "border-neutral-300 dark:border-neutral-700",
        badgeTextClass: "text-neutral-500 dark:text-neutral-400",
        dotColor: "#94A3B8",
      };
    default:
      return {
        label: String(status),
        compactStepLabel: String(status),
        badgeBgClass: "bg-neutral-100 dark:bg-neutral-800",
        badgeBorderClass: "border-neutral-300 dark:border-neutral-700",
        badgeTextClass: "text-neutral-600 dark:text-neutral-300",
        dotColor: "#647B80",
      };
  }
}

export type TimelineNodeState = "completed" | "current" | "warning" | "upcoming";

export interface ReservationTimelineStep {
  stepNumber: number;
  title: string;
  description: string;
  timestamp?: string | null;
  actorName?: string | null;
  extraBadge?: string | null;
  errorText?: string | null;
  state: TimelineNodeState;
}

export interface ReservationTerminalNode {
  type: "rejected" | "cancelled" | "expired";
  title: string;
  reason: string;
  timestamp?: string | null;
  refundAmount?: number;
}

/**
 * Computes the 6-Step Progress Timeline & Terminal Node according to Section 4 of the specification.
 */
export function buildReservationTimeline(
  reservation: ReservationResponse,
  locale: MessageLocale = "vi",
  linkedContract?: ContractResponse | null
): {
  steps: ReservationTimelineStep[];
  terminalNode: ReservationTerminalNode | null;
  lastCompletedStepNumber: number;
} {
  const isEn = locale === "en";
  const status = reservation.status;

  const isTerminal =
    status === ReservationStatusEnum.REJECTED ||
    status === ReservationStatusEnum.CANCELLED ||
    status === ReservationStatusEnum.EXPIRED;

  // Determine how far the reservation progressed based on non-null timestamps (Section 4.2 Case C)
  let lastCompletedByTimestamp = 1;
  if (reservation.confirmedAt) {
    lastCompletedByTimestamp = 5;
  } else if (reservation.paidAt) {
    lastCompletedByTimestamp = 4;
  } else if (reservation.assignedAt) {
    lastCompletedByTimestamp = 3;
  } else if (reservation.receivedAt) {
    lastCompletedByTimestamp = 2;
  } else {
    lastCompletedByTimestamp = 1;
  }

  let activeStepNumber = 1;
  if (!isTerminal) {
    switch (status) {
      case ReservationStatusEnum.PENDING:
        activeStepNumber = 1;
        break;
      case ReservationStatusEnum.RECEIVED:
        activeStepNumber = 2;
        break;
      case ReservationStatusEnum.PENDING_PAYMENT:
      case ReservationStatusEnum.PAYMENT_FAILED:
        activeStepNumber = 3;
        break;
      case ReservationStatusEnum.PAYMENT_SUCCESSFUL:
        activeStepNumber = 4;
        break;
      case ReservationStatusEnum.CONFIRMED:
        activeStepNumber = linkedContract ? 6 : 5;
        break;
      case ReservationStatusEnum.COMPLETED:
        activeStepNumber = 6;
        break;
      default:
        activeStepNumber = 1;
    }
  }

  const getStepState = (stepNum: number): TimelineNodeState => {
    if (isTerminal) {
      return stepNum <= lastCompletedByTimestamp ? "completed" : "upcoming";
    }
    if (status === ReservationStatusEnum.COMPLETED) {
      return "completed";
    }
    if (
      stepNum === 6 &&
      linkedContract &&
      linkedContract.status !== ContractStatusEnum.DRAFT &&
      linkedContract.status !== ContractStatusEnum.CANCELLED
    ) {
      return "completed";
    }
    if (stepNum < activeStepNumber) {
      return "completed";
    }
    if (stepNum === activeStepNumber) {
      if (status === ReservationStatusEnum.PAYMENT_FAILED && stepNum === 3) {
        return "warning";
      }
      return "current";
    }
    return "upcoming";
  };

  const allSteps: ReservationTimelineStep[] = [
    {
      stepNumber: 1,
      title: isEn ? "Reservation Submitted" : "Gửi yêu cầu đặt chỗ",
      description: isEn
        ? "Customer submitted storage booking request."
        : "Khách hàng tạo đơn đặt chỗ mới.",
      timestamp: reservation.createdAt,
      actorName: reservation.customer?.name ?? null,
      state: getStepState(1),
    },
    {
      stepNumber: 2,
      title: isEn ? "Staff Received" : "Nhân viên tiếp nhận",
      description: isEn
        ? "Facility staff received and verified the request."
        : "Nhân viên cơ sở tiếp nhận và kiểm tra yêu cầu.",
      timestamp: reservation.receivedAt,
      actorName: reservation.receivedBy?.name ?? null,
      state: getStepState(2),
    },
    {
      stepNumber: 3,
      title:
        status === ReservationStatusEnum.PAYMENT_FAILED
          ? isEn
            ? "Deposit Payment Issue"
            : "Thanh toán cọc gặp sự cố"
          : isEn
            ? "Unit Assigned & Awaiting Deposit"
            : "Gán phòng kho & Chờ đặt cọc",
      description: reservation.storageUnit
        ? isEn
          ? `Assigned unit #${reservation.storageUnit.unitNumber} (Floor ${reservation.storageUnit.floor}). Awaiting deposit payment.`
          : `Đã gán phòng kho #${reservation.storageUnit.unitNumber} (Tầng ${reservation.storageUnit.floor}). Chờ khách thanh toán tiền cọc.`
        : isEn
          ? "Staff assigns a physical storage unit and opens deposit payment."
          : "Nhân viên gán phòng kho vật lý và mở cổng thanh toán tiền cọc.",
      timestamp: reservation.assignedAt,
      actorName: reservation.assignedBy?.name ?? null,
      extraBadge: reservation.storageUnit
        ? `${isEn ? "Unit" : "Phòng"} #${reservation.storageUnit.unitNumber}`
        : null,
      errorText:
        status === ReservationStatusEnum.PAYMENT_FAILED
          ? reservation.lastPaymentError ||
            (isEn
              ? "Deposit transfer was insufficient or failed. Please retry payment."
              : "Giao dịch đặt cọc chưa đủ số tiền hoặc gặp lỗi. Vui lòng thử thanh toán lại.")
          : null,
      state: getStepState(3),
    },
    {
      stepNumber: 4,
      title: isEn ? "Deposit Paid" : "Đã thanh toán tiền cọc",
      description: isEn
        ? "System recorded full deposit transfer via VietQR."
        : "Hệ thống đã ghi nhận thanh toán đủ 100% tiền cọc qua VietQR.",
      timestamp: reservation.paidAt,
      extraBadge:
        reservation.paidAmount && reservation.paidAmount > 0
          ? formatVnd(reservation.paidAmount)
          : null,
      state: getStepState(4),
    },
    {
      stepNumber: 5,
      title: isEn ? "Reservation Confirmed" : "Đã xác nhận giữ kho",
      description: isEn
        ? "Staff confirmed the reservation. Ready for check-in & contract signing."
        : "Nhân viên xác nhận giữ kho chính thức, sẵn sàng làm thủ tục nhận kho.",
      timestamp: reservation.confirmedAt,
      actorName: reservation.confirmedBy?.name ?? null,
      state: getStepState(5),
    },
    {
      stepNumber: 6,
      title:
        linkedContract?.status === ContractStatusEnum.DRAFT
          ? isEn
            ? "Draft Contract Created (Pending Check-in)"
            : "Đã tạo Hợp đồng nháp (Chờ Check-in)"
          : isEn
            ? "Completed & Contract Created"
            : "Hoàn tất & Tạo hợp đồng",
      description: linkedContract
        ? linkedContract.status === ContractStatusEnum.DRAFT
          ? isEn
            ? `Draft contract #${linkedContract.contractCode} created (deposit inherited). Please visit the facility counter to check in.`
            : `Đã khởi tạo hợp đồng nháp #${linkedContract.contractCode} (đã kế thừa tiền cọc). Vui lòng đến quầy cơ sở gặp nhân viên phụ trách để Check-in nhận kho.`
          : isEn
            ? `Converted into official rental contract #${linkedContract.contractCode}.`
            : `Đơn đặt chỗ đã chuyển đổi thành Hợp đồng thuê kho chính thức #${linkedContract.contractCode}.`
        : isEn
          ? "Reservation converted into an official rental contract."
          : "Đơn đặt chỗ đã chuyển đổi thành Hợp đồng thuê kho chính thức.",
      timestamp:
        linkedContract?.createdAt ??
        (status === ReservationStatusEnum.COMPLETED ? reservation.updatedAt : null),
      actorName: linkedContract?.assignedStaff?.name ?? null,
      extraBadge: linkedContract ? `#${linkedContract.contractCode}` : null,
      state: getStepState(6),
    },
  ];

  if (!isTerminal) {
    return {
      steps: allSteps,
      terminalNode: null,
      lastCompletedStepNumber: activeStepNumber,
    };
  }

  // Slice steps up to lastCompletedByTimestamp and attach the Terminal Node right after
  const completedSteps = allSteps.slice(0, lastCompletedByTimestamp);
  let terminalNode: ReservationTerminalNode | null = null;

  if (status === ReservationStatusEnum.REJECTED) {
    terminalNode = {
      type: "rejected",
      title: isEn ? "Reservation Rejected" : "Bị từ chối",
      reason:
        reservation.rejectionReason ||
        (isEn ? "Rejected by facility staff." : "Nhân viên cơ sở đã từ chối yêu cầu đặt chỗ."),
      timestamp: reservation.updatedAt,
    };
  } else if (status === ReservationStatusEnum.CANCELLED) {
    terminalNode = {
      type: "cancelled",
      title: isEn ? "Reservation Cancelled" : "Đã hủy đặt chỗ",
      reason:
        reservation.cancellationReason ||
        (isEn ? "Cancelled by customer." : "Đã hủy theo yêu cầu."),
      timestamp: reservation.cancelledAt || reservation.updatedAt,
      refundAmount: reservation.refundAmount,
    };
  } else if (status === ReservationStatusEnum.EXPIRED) {
    terminalNode = {
      type: "expired",
      title: isEn ? "Reservation Expired" : "Hết hạn giữ chỗ",
      reason: isEn
        ? "Automatically closed because the deposit payment deadline expired."
        : "Đơn đặt chỗ đã tự động đóng do quá thời hạn thanh toán tiền cọc.",
      timestamp: reservation.expiresAt || reservation.updatedAt,
    };
  }

  return {
    steps: completedSteps,
    terminalNode,
    lastCompletedStepNumber: lastCompletedByTimestamp,
  };
}

/**
 * Checks whether a reservation can be cancelled by the customer.
 */
export function canCancelReservation(status: ReservationStatusEnum | string): boolean {
  return [
    ReservationStatusEnum.PENDING,
    ReservationStatusEnum.RECEIVED,
    ReservationStatusEnum.PENDING_PAYMENT,
    ReservationStatusEnum.PAYMENT_FAILED,
    ReservationStatusEnum.PAYMENT_SUCCESSFUL,
    ReservationStatusEnum.CONFIRMED,
  ].includes(status as ReservationStatusEnum);
}

/**
 * Returns the Refund Policy warning banner text based on current reservation status (Section 5 - 3.4).
 */
export function getCancellationPolicyNotice(
  reservation: ReservationResponse,
  locale: MessageLocale = "vi"
): {
  severity: "info" | "success" | "danger";
  title: string;
  description: string;
  estimatedRefund: number;
} {
  const isEn = locale === "en";
  const status = reservation.status;
  const deposit = reservation.paidAmount ?? reservation.depositAmount ?? 0;

  if (status === ReservationStatusEnum.PAYMENT_SUCCESSFUL) {
    return {
      severity: "success",
      title: isEn ? "100% Deposit Refund Eligible" : "Được hoàn 100% tiền cọc",
      description: isEn
        ? `Your reservation has not been confirmed by staff yet. Cancelling now qualifies for a 100% deposit refund (${formatVnd(deposit)}).`
        : `Đơn chưa được nhân viên xác nhận giữ kho cuối cùng. Nếu hủy lúc này, bạn được hoàn 100% tiền cọc (${formatVnd(deposit)}).`,
      estimatedRefund: deposit,
    };
  }

  if (status === ReservationStatusEnum.CONFIRMED) {
    return {
      severity: "danger",
      title: isEn
        ? "Warning: Non-refundable Deposit (0% Refund)"
        : "Cảnh báo: Không được hoàn tiền cọc (Mất 100% cọc)",
      description: isEn
        ? `Your storage unit has already been officially confirmed and locked for you. Cancelling at this stage will forfeit 100% of your deposit (${formatVnd(deposit)}).`
        : `Đơn đã được xác nhận giữ kho chính thức. Nếu hủy ở bước này, bạn sẽ KHÔNG được hoàn lại tiền cọc (${formatVnd(deposit)} - hoàn 0 đ).`,
      estimatedRefund: 0,
    };
  }

  return {
    severity: "info",
    title: isEn ? "Free Cancellation" : "Hủy miễn phí",
    description: isEn
      ? "You have not completed deposit payment yet. You can cancel this reservation free of charge."
      : "Bạn chưa thanh toán tiền cọc nên có thể hủy đơn đặt chỗ miễn phí.",
    estimatedRefund: 0,
  };
}

/**
 * Computes remaining time from an `expiresAt` ISO string.
 */
export function getCountdownRemaining(
  expiresAt?: string | null,
  nowMs: number = Date.now()
): {
  isExpired: boolean;
  totalSeconds: number;
  formatted: string;
} {
  if (!expiresAt) {
    return { isExpired: false, totalSeconds: 0, formatted: "" };
  }
  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) {
    return { isExpired: false, totalSeconds: 0, formatted: "" };
  }
  const diffMs = target - nowMs;
  if (diffMs <= 0) {
    return { isExpired: true, totalSeconds: 0, formatted: "00:00" };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    const hh = String(hours).padStart(2, "0");
    return { isExpired: false, totalSeconds, formatted: `${hh}:${mm}:${ss}` };
  }
  return { isExpired: false, totalSeconds, formatted: `${mm}:${ss}` };
}

/**
 * Maps PaymentStatusEnum to localized label & colors.
 */
export function getPaymentStatusMeta(
  status: PaymentStatusEnum | string,
  locale: MessageLocale = "vi"
): {
  label: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  badgeTextClass: string;
} {
  const isEn = locale === "en";
  switch (status) {
    case PaymentStatusEnum.PENDING:
      return {
        label: isEn ? "Waiting for Transfer" : "Chờ chuyển khoản",
        badgeBgClass: "bg-amber-50 dark:bg-amber-950/40",
        badgeBorderClass: "border-amber-300 dark:border-amber-800",
        badgeTextClass: "text-amber-700 dark:text-amber-400",
      };
    case PaymentStatusEnum.PARTIALLY_PAID:
      return {
        label: isEn ? "Partially Paid" : "Đã thanh toán một phần",
        badgeBgClass: "bg-cta-light/40 dark:bg-cta/20",
        badgeBorderClass: "border-cta/50",
        badgeTextClass: "text-cta",
      };
    case PaymentStatusEnum.PAID:
      return {
        label: isEn ? "Paid in Full" : "Đã thanh toán đủ",
        badgeBgClass: "bg-brand-light/40 dark:bg-brand/20",
        badgeBorderClass: "border-brand/50",
        badgeTextClass: "text-brand",
      };
    case PaymentStatusEnum.EXPIRED:
      return {
        label: isEn ? "Expired" : "Đã hết hạn",
        badgeBgClass: "bg-neutral-100 dark:bg-neutral-800",
        badgeBorderClass: "border-neutral-300 dark:border-neutral-700",
        badgeTextClass: "text-neutral-500 dark:text-neutral-400",
      };
    case PaymentStatusEnum.CANCELLED:
      return {
        label: isEn ? "Cancelled" : "Đã hủy",
        badgeBgClass: "bg-red-50 dark:bg-red-950/40",
        badgeBorderClass: "border-red-300 dark:border-red-800",
        badgeTextClass: "text-red-600 dark:text-red-400",
      };
    default:
      return {
        label: String(status),
        badgeBgClass: "bg-neutral-100 dark:bg-neutral-800",
        badgeBorderClass: "border-neutral-300 dark:border-neutral-700",
        badgeTextClass: "text-neutral-600 dark:text-neutral-300",
      };
  }
}

/**
 * Resolves any AppApiError or unknown error from Reservation & Payment APIs into a clean,
 * localized user-facing message using `resolveMessageCode` from `@self-storage-system-fe/shared`.
 */
export function resolveReservationErrorMessage(
  error: unknown,
  locale: MessageLocale = "vi",
  defaultSubject = "reservation"
): { message: string; messageCode?: string } {
  if (error instanceof AppApiError) {
    const code = error.messageCode;
    if (code) {
      const resolved = resolveMessageCode(code, {
        locale,
        rawMessage: error.message,
        defaultSubject,
      });
      if (resolved) {
        return { message: resolved, messageCode: String(code) };
      }
    }
    return {
      message:
        error.message ||
        (locale === "en" ? "An unexpected error occurred." : "Đã xảy ra lỗi, vui lòng thử lại."),
      messageCode: code ? String(code) : undefined,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return {
    message: locale === "en" ? "An unexpected error occurred." : "Đã xảy ra lỗi, vui lòng thử lại.",
  };
}

export { MESSAGE_CODE };
