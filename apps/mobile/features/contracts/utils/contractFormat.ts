import {
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  RentalUnitEnum,
  type ContractResponse,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import {
  formatDateShort,
  formatDateTime,
  formatVnd,
  resolveReservationErrorMessage,
} from "@/features/reservations/utils/reservationFormat";

export { formatDateShort, formatDateTime, formatVnd, resolveReservationErrorMessage };

export interface ContractStatusMeta {
  label: string;
  description: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  badgeTextClass: string;
  accentColor: string;
}

export function getContractStatusMeta(
  status: ContractStatusEnum | string,
  locale: MessageLocale = "vi"
): ContractStatusMeta {
  const isEn = locale === "en";
  const normalized = String(status).toLowerCase();

  switch (normalized) {
    case ContractStatusEnum.DRAFT:
      return {
        label: isEn ? "Pending Check-in" : "Chờ Check-in",
        description: isEn
          ? "Review and sign your lease contract. Once both you and facility staff have signed, your storage unit becomes active."
          : "Kiểm tra thông tin và ký xác nhận hợp đồng. Khi cả Khách hàng và Nhân viên cơ sở đã ký, hợp đồng sẽ tự động kích hoạt.",
        badgeBgClass: "bg-amber-50 dark:bg-amber-950/40",
        badgeBorderClass: "border-amber-300 dark:border-amber-800",
        badgeTextClass: "text-amber-700 dark:text-amber-300",
        accentColor: "#D97706",
      };
    case ContractStatusEnum.ACTIVE:
      return {
        label: isEn ? "Active Lease" : "Đang thuê",
        description: isEn
          ? "Your storage unit is active and ready for 24/7 access."
          : "Kho lưu trữ đang trong thời hạn thuê và sẵn sàng ra vào 24/7.",
        badgeBgClass: "bg-brand-light/40 dark:bg-brand/20",
        badgeBorderClass: "border-brand/40",
        badgeTextClass: "text-brand",
        accentColor: "#0B927E",
      };
    case ContractStatusEnum.OVERDUE:
      return {
        label: isEn ? "Overdue" : "Quá hạn trả kho",
        description: isEn
          ? "Lease period has ended. Please contact the facility to renew or check-out."
          : "Hợp đồng đã quá ngày hết hạn. Vui lòng liên hệ cơ sở để gia hạn hoặc làm thủ tục trả kho.",
        badgeBgClass: "bg-red-50 dark:bg-red-950/40",
        badgeBorderClass: "border-red-300 dark:border-red-800",
        badgeTextClass: "text-red-600 dark:text-red-400",
        accentColor: "#EF4444",
      };
    case ContractStatusEnum.COMPLETED:
      return {
        label: isEn ? "Checked Out" : "Đã trả kho",
        description: isEn
          ? "Storage unit has been returned and deposit settlement is complete."
          : "Đã hoàn tất thủ tục trả kho và quyết toán tiền đặt cọc.",
        badgeBgClass: "bg-indigo-50 dark:bg-indigo-950/40",
        badgeBorderClass: "border-indigo-300 dark:border-indigo-800",
        badgeTextClass: "text-indigo-700 dark:text-indigo-300",
        accentColor: "#4F46E5",
      };
    case ContractStatusEnum.CANCELLED:
      return {
        label: isEn ? "Cancelled" : "Đã hủy",
        description: isEn
          ? "This draft contract was cancelled before check-in."
          : "Hợp đồng nháp đã được hủy trước khi bàn giao kho.",
        badgeBgClass: "bg-neutral-100 dark:bg-neutral-800",
        badgeBorderClass: "border-neutral-300 dark:border-neutral-700",
        badgeTextClass: "text-neutral-600 dark:text-neutral-400",
        accentColor: "#647B80",
      };
    case ContractStatusEnum.TERMINATED:
      return {
        label: isEn ? "Early Terminated" : "Chấm dứt trước hạn",
        description: isEn
          ? "This contract was terminated early by facility management."
          : "Hợp đồng đã được chấm dứt trước hạn bởi quản lý cơ sở.",
        badgeBgClass: "bg-red-50 dark:bg-red-950/40",
        badgeBorderClass: "border-red-300 dark:border-red-800",
        badgeTextClass: "text-red-700 dark:text-red-400",
        accentColor: "#DC2626",
      };
    default:
      return {
        label: String(status),
        description: "",
        badgeBgClass: "bg-neutral-100 dark:bg-neutral-800",
        badgeBorderClass: "border-neutral-300 dark:border-neutral-700",
        badgeTextClass: "text-neutral-600 dark:text-neutral-400",
        accentColor: "#647B80",
      };
  }
}

export function getContractAddendumStatusMeta(
  status: ContractAddendumStatusEnum | string,
  locale: MessageLocale = "vi"
): ContractStatusMeta {
  const isEn = locale === "en";
  const normalized = String(status).toLowerCase();

  switch (normalized) {
    case ContractAddendumStatusEnum.PENDING_APPROVAL:
      return {
        label: isEn ? "Pending Approval" : "Chờ duyệt",
        description: isEn
          ? "Waiting for facility manager to review and assign staff."
          : "Đang chờ quản lý cơ sở duyệt và phân công nhân viên thực hiện.",
        badgeBgClass: "bg-amber-50 dark:bg-amber-950/40",
        badgeBorderClass: "border-amber-300 dark:border-amber-800",
        badgeTextClass: "text-amber-700 dark:text-amber-300",
        accentColor: "#D97706",
      };
    case ContractAddendumStatusEnum.DRAFT:
      return {
        label: isEn ? "Pending Signatures (DRAFT)" : "Chờ ký 2 bên (DRAFT)",
        description: isEn
          ? "Approved. Waiting for both Customer and Staff to sign."
          : "Đã duyệt. Chờ Khách hàng và Nhân viên ký xác nhận nghiệm thu.",
        badgeBgClass: "bg-indigo-50 dark:bg-indigo-950/40",
        badgeBorderClass: "border-indigo-300 dark:border-indigo-800",
        badgeTextClass: "text-indigo-700 dark:text-indigo-300",
        accentColor: "#4F46E5",
      };
    case ContractAddendumStatusEnum.ACTIVE:
      return {
        label: isEn ? "Active" : "Đã hiệu lực",
        description: isEn
          ? "Both parties signed. Amenity changes have been applied."
          : "Cả 2 bên đã ký. Thay đổi tiện ích đã được cập nhật vào hợp đồng.",
        badgeBgClass: "bg-brand-light/40 dark:bg-brand/20",
        badgeBorderClass: "border-brand/40",
        badgeTextClass: "text-brand",
        accentColor: "#0B927E",
      };
    case ContractAddendumStatusEnum.REJECTED:
      return {
        label: isEn ? "Rejected" : "Đã từ chối",
        description: isEn ? "Rejected by facility manager." : "Đã bị quản lý cơ sở từ chối.",
        badgeBgClass: "bg-red-50 dark:bg-red-950/40",
        badgeBorderClass: "border-red-300 dark:border-red-800",
        badgeTextClass: "text-red-600 dark:text-red-400",
        accentColor: "#EF4444",
      };
    case ContractAddendumStatusEnum.CANCELLED:
    default:
      return {
        label: isEn ? "Cancelled" : "Đã hủy",
        description: isEn ? "Addendum was cancelled." : "Phụ lục đã bị hủy.",
        badgeBgClass: "bg-neutral-100 dark:bg-neutral-800",
        badgeBorderClass: "border-neutral-300 dark:border-neutral-700",
        badgeTextClass: "text-neutral-600 dark:text-neutral-400",
        accentColor: "#647B80",
      };
  }
}

export function getContractAddendumTypeMeta(
  type: ContractAddendumTypeEnum | string,
  locale: MessageLocale = "vi"
) {
  const isEn = locale === "en";
  const isRemove = String(type).toLowerCase() === ContractAddendumTypeEnum.REMOVE;
  if (isRemove) {
    return {
      isRemove: true,
      label: isEn ? "Remove / Return Amenity" : "Tháo dỡ / Trả bớt tiện ích",
      badgeBgClass: "bg-amber-50 dark:bg-amber-950/40",
      badgeBorderClass: "border-amber-300 dark:border-amber-800",
      badgeTextClass: "text-amber-700 dark:text-amber-300",
    };
  }
  return {
    isRemove: false,
    label: isEn ? "Add / Install Amenity" : "Thuê thêm tiện ích",
    badgeBgClass: "bg-brand-light/40 dark:bg-brand/20",
    badgeBorderClass: "border-brand/40",
    badgeTextClass: "text-brand",
  };
}

/**
 * Calculates total quantity of a given amenity currently locked in `type === 'remove'` addendums
 * with status `pending_approval` or `draft`.
 */
export function getPendingRemoveAmenityQty(
  contract: ContractResponse | null | undefined,
  facilityAmenityOfferingId: string
): number {
  if (!contract?.addendums?.length) return 0;
  let total = 0;
  for (const addendum of contract.addendums) {
    const isRemove = addendum.type === ContractAddendumTypeEnum.REMOVE;
    const isPendingOrDraft =
      addendum.status === ContractAddendumStatusEnum.PENDING_APPROVAL ||
      addendum.status === ContractAddendumStatusEnum.DRAFT;
    if (!isRemove || !isPendingOrDraft) continue;
    for (const item of addendum.amenities ?? []) {
      if (item.facilityAmenityOfferingId === facilityAmenityOfferingId) {
        total += Number(item.quantity ?? 0);
      }
    }
  }
  return total;
}

export function getMaxRemovableAmenityQty(
  contract: ContractResponse | null | undefined,
  facilityAmenityOfferingId: string
): number {
  const activeItem = (contract?.amenities ?? []).find(
    (a) => a.facilityAmenityOfferingId === facilityAmenityOfferingId
  );
  if (!activeItem) return 0;
  const pendingRemove = getPendingRemoveAmenityQty(contract, facilityAmenityOfferingId);
  return Math.max(0, Number(activeItem.quantity ?? 0) - pendingRemove);
}

export function getRentalUnitLabel(
  unit: RentalUnitEnum | string,
  locale: MessageLocale = "vi"
): string {
  const isEn = locale === "en";
  const normalized = String(unit).toLowerCase();
  switch (normalized) {
    case RentalUnitEnum.DAY:
      return isEn ? "day" : "ngày";
    case RentalUnitEnum.WEEK:
      return isEn ? "week" : "tuần";
    case RentalUnitEnum.MONTH:
      return isEn ? "month" : "tháng";
    case RentalUnitEnum.YEAR:
      return isEn ? "year" : "năm";
    case RentalUnitEnum.ONE_TIME:
      return isEn ? "one-time" : "lần";
    default:
      return String(unit);
  }
}

export function formatContractDuration(
  duration: number,
  unit: RentalUnitEnum | string,
  locale: MessageLocale = "vi"
): string {
  const isEn = locale === "en";
  const label = getRentalUnitLabel(unit, locale);
  if (isEn) {
    return `${duration} ${label}${duration > 1 ? "s" : ""}`;
  }
  return `${duration} ${label}`;
}

export function getContractDurationDays(startDateIso: string, endDateIso: string): number {
  const startMs = new Date(startDateIso).getTime();
  const endMs = new Date(endDateIso).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return 1;
  return Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
}

export function getContractSourceLabel(
  source: ContractSourceEnum | string,
  locale: MessageLocale = "vi"
): string {
  const isEn = locale === "en";
  if (String(source).toLowerCase() === ContractSourceEnum.RESERVATION) {
    return isEn ? "From Reservation" : "Khách đặt chỗ";
  }
  return isEn ? "Walk-in Counter" : "Thuê trực tiếp tại quầy";
}

export function getRemainingDays(endDateIso: string, nowMs: number): number {
  const endMs = new Date(endDateIso).getTime();
  if (Number.isNaN(endMs)) return 0;
  const diffDays = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
  return diffDays;
}
