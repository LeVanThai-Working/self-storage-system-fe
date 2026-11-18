import {
  InvoiceItemTypeEnum,
  InvoiceStatusEnum,
  InvoiceTypeEnum,
  type EntitySummary,
  type InvoiceResponse,
} from "@self-storage-system-fe/shared";
import {
  formatDateShort,
  formatDateTime,
  formatVnd,
  getCountdownRemaining,
  resolveReservationErrorMessage,
} from "@/features/reservations/utils/reservationFormat";

export {
  formatDateShort,
  formatDateTime,
  formatVnd,
  getCountdownRemaining,
  resolveReservationErrorMessage,
};

export interface InvoiceBadgeMeta {
  label: string;
  badgeClass: string;
  textClass: string;
  dotColor: string;
}

export function getInvoiceStatusMeta(
  status: InvoiceStatusEnum | string,
  isEn: boolean
): InvoiceBadgeMeta {
  switch (String(status).toLowerCase()) {
    case InvoiceStatusEnum.DRAFT:
      return {
        label: isEn ? "Draft" : "Bản nháp",
        badgeClass: "border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        textClass: "text-neutral-600 dark:text-neutral-300",
        dotColor: "#94A3B8",
      };
    case InvoiceStatusEnum.ISSUED:
      return {
        label: isEn ? "Due" : "Chờ thanh toán",
        badgeClass: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
        textClass: "text-amber-700 dark:text-amber-400",
        dotColor: "#F59E0B",
      };
    case InvoiceStatusEnum.PAID:
      return {
        label: isEn ? "Paid" : "Đã thanh toán",
        badgeClass: "border-brand/40 bg-brand-light/30 dark:bg-brand/20",
        textClass: "text-brand",
        dotColor: "#0B927E",
      };
    case InvoiceStatusEnum.OVERDUE:
      return {
        label: isEn ? "Overdue" : "Quá hạn",
        badgeClass: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40",
        textClass: "text-red-600 dark:text-red-400",
        dotColor: "#EF4444",
      };
    case InvoiceStatusEnum.CANCELLED:
      return {
        label: isEn ? "Cancelled" : "Đã hủy",
        badgeClass: "border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        textClass: "text-neutral-500 dark:text-neutral-400",
        dotColor: "#94A3B8",
      };
    case InvoiceStatusEnum.VOID:
      return {
        label: isEn ? "Void" : "Vô hiệu hóa",
        badgeClass: "border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        textClass: "text-neutral-500 dark:text-neutral-400",
        dotColor: "#94A3B8",
      };
    default:
      return {
        label: String(status),
        badgeClass: "border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        textClass: "text-neutral-600 dark:text-neutral-300",
        dotColor: "#94A3B8",
      };
  }
}

export function getInvoiceTypeMeta(
  type: InvoiceTypeEnum | string,
  isEn: boolean
): {
  label: string;
  badgeClass: string;
  textClass: string;
} {
  switch (String(type).toLowerCase()) {
    case InvoiceTypeEnum.FIRST_PERIOD:
      return {
        label: isEn ? "First Period" : "Kỳ đầu",
        badgeClass: "border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/40",
        textClass: "text-teal-700 dark:text-teal-300",
      };
    case InvoiceTypeEnum.RECURRING:
      return {
        label: isEn ? "Recurring" : "Định kỳ",
        badgeClass: "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40",
        textClass: "text-indigo-700 dark:text-indigo-300",
      };
    case InvoiceTypeEnum.INCIDENTAL:
      return {
        label: isEn ? "Incidental Fee" : "Phụ phí phát sinh",
        badgeClass: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
        textClass: "text-amber-700 dark:text-amber-300",
      };
    case InvoiceTypeEnum.CHECK_OUT_SETTLEMENT:
      return {
        label: isEn ? "Settlement" : "Quyết toán trả kho",
        badgeClass: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/40",
        textClass: "text-purple-700 dark:text-purple-300",
      };
    default:
      return {
        label: String(type),
        badgeClass: "border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        textClass: "text-neutral-600 dark:text-neutral-300",
      };
  }
}

export function getInvoiceItemTypeLabel(
  itemType: InvoiceItemTypeEnum | string,
  isEn: boolean
): string {
  switch (String(itemType).toLowerCase()) {
    case InvoiceItemTypeEnum.RENT:
      return isEn ? "Storage Rent" : "Tiền thuê kho";
    case InvoiceItemTypeEnum.AMENITY:
      return isEn ? "Amenity Fee" : "Tiện ích thuê";
    case InvoiceItemTypeEnum.DAMAGE_FEE:
      return isEn ? "Damage Fee" : "Phí hư hại";
    case InvoiceItemTypeEnum.OVERDUE_FEE:
      return isEn ? "Overdue Fee" : "Phạt trễ hạn";
    case InvoiceItemTypeEnum.DISCOUNT:
      return isEn ? "Discount" : "Giảm trừ";
    case InvoiceItemTypeEnum.OTHER:
    default:
      return isEn ? "Other" : "Khoản khác";
  }
}

export function getInvoiceRemainingAmount(invoice?: InvoiceResponse | null): number {
  if (!invoice) return 0;
  return Math.max(0, Number(invoice.totalAmount ?? 0) - Number(invoice.paidAmount ?? 0));
}

export function isInvoicePayable(invoice?: InvoiceResponse | null): boolean {
  if (!invoice) return false;
  const status = String(invoice.status).toLowerCase();
  const isUnpaidStatus =
    status === InvoiceStatusEnum.ISSUED || status === InvoiceStatusEnum.OVERDUE;
  return isUnpaidStatus && getInvoiceRemainingAmount(invoice) > 0;
}

export function getEntityDisplayName(entity?: EntitySummary | null): string {
  if (!entity) return "—";
  return entity.name || entity.email || entity.code || entity.id || "—";
}

/**
 * Localizes trailing unit labels such as "(month)" embedded by BE in invoice item descriptions.
 */
export function localizeInvoiceItemDescription(text: string, isEn: boolean): string {
  return text.replace(/\((day|month|one_time)\)$/i, (_, unit: string) => {
    switch (unit.toLowerCase()) {
      case "day":
        return isEn ? "(day)" : "(ngày)";
      case "one_time":
        return isEn ? "(one-time)" : "(một lần)";
      case "month":
      default:
        return isEn ? "(month)" : "(tháng)";
    }
  });
}
