import { AppApiError } from "@/lib/api/axios";
import {
  BillingUnitEnum,
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  MESSAGE_CODE,
  RentalUnitEnum,
  type ContractAddendumResponse,
  type ContractResponse,
} from "./types";

/**
 * Định dạng tiền tệ VND
 */
export function formatVnd(amount?: number | null): string {
  const safe = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(safe);
}

/**
 * Định dạng ngày ngắn gọn (DD/MM/YYYY)
 */
export function formatDateOnly(iso?: string | null, locale = "vi"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Định dạng ngày giờ đầy đủ (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(iso?: string | null, locale = "vi"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Chuyển đổi ISO string sang định dạng YYYY-MM-DD cho input[type="date"]
 */
export function toDateInputString(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Lấy ngày hôm nay + offsetDays theo định dạng YYYY-MM-DD
 */
export function getDateInputWithOffset(offsetDays = 0, baseIso?: string | null): string {
  const d = baseIso ? new Date(baseIso) : new Date();
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + offsetDays);
    return toDateInputString(fallback.toISOString());
  }
  d.setDate(d.getDate() + offsetDays);
  return toDateInputString(d.toISOString());
}

/**
 * Chuyển đổi YYYY-MM-DD sang ISO 8601
 */
export function dateInputToIso(dateInput: string, endOfDay = false): string {
  const trimmed = dateInput.trim();
  if (!trimmed) return "";
  const suffix = endOfDay ? "T23:59:59.000Z" : "T00:00:00.000Z";
  const d = new Date(`${trimmed}${suffix}`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

/**
 * Hiển thị nhãn đơn vị tính chu kỳ thuê
 */
export function getBillingUnitLabel(
  unit?: RentalUnitEnum | BillingUnitEnum | string | null,
  locale: "vi" | "en" = "vi"
): string {
  const isEn = locale === "en";
  switch (String(unit ?? "").toLowerCase()) {
    case RentalUnitEnum.DAY:
      return isEn ? "day" : "ngày";
    case RentalUnitEnum.WEEK:
      return isEn ? "week" : "tuần";
    case RentalUnitEnum.YEAR:
      return isEn ? "year" : "năm";
    case RentalUnitEnum.ONE_TIME:
      return isEn ? "one-time" : "lần";
    case RentalUnitEnum.MONTH:
    default:
      return isEn ? "month" : "tháng";
  }
}

/**
 * Tính số ngày thuê giữa startDate và endDate
 */
export function getContractDurationDays(startDate: string, endDate: string): number {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return 1;
  return Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
}

/**
 * Lấy ID chuẩn hóa của user đang đăng nhập (hỗ trợ cả `id` và `_id`)
 */
export function getCurrentUserId(user?: { id?: string; _id?: unknown } | null): string | undefined {
  if (!user) return undefined;
  if (typeof user.id === "string" && user.id.trim()) return user.id.trim();
  if (typeof user._id === "string" && user._id.trim()) return user._id.trim();
  return undefined;
}

/**
 * Lấy ID của nhân viên được gán phụ trách hợp đồng (từ `assignedStaffId` hoặc `assignedStaff.id`)
 */
export function getContractAssignedStaffId(contract?: ContractResponse | null): string | undefined {
  if (!contract) return undefined;
  if (typeof contract.assignedStaffId === "string" && contract.assignedStaffId.trim()) {
    return contract.assignedStaffId.trim();
  }
  const staffSnap = contract.assignedStaff as { id?: string; _id?: unknown } | null | undefined;
  if (staffSnap) {
    if (typeof staffSnap.id === "string" && staffSnap.id.trim()) {
      return staffSnap.id.trim();
    }
    if (typeof staffSnap._id === "string" && staffSnap._id.trim()) {
      return staffSnap._id.trim();
    }
  }
  return undefined;
}

/**
 * Kiểm tra hợp đồng có được giao đích danh cho nhân viên `staffId` hay không
 */
export function isContractAssignedToStaff(
  contract: ContractResponse | null | undefined,
  staffId?: string | null
): boolean {
  if (!contract || !staffId) return false;
  const assignedId = getContractAssignedStaffId(contract);
  return Boolean(assignedId && assignedId === staffId);
}

/**
 * Kiểm tra điều kiện đã đóng tiền cọc của hợp đồng:
 * - Hợp đồng tạo từ Đơn đặt chỗ (source === 'reservation'): đã đóng cọc 100% ở bước Reservation.
 * - Hợp đồng khách vãng lai (source === 'walk_in'): phải có depositPaidAt !== null.
 */
export function isContractDepositSatisfied(contract: ContractResponse): boolean {
  return contract.source === ContractSourceEnum.RESERVATION || Boolean(contract.depositPaidAt);
}

/**
 * Kiểm tra đã thanh toán tiền thuê kỳ đầu (`firstCyclePaidAt`)
 */
export function isContractFirstCyclePaid(contract: ContractResponse): boolean {
  return Boolean(contract.firstCyclePaidAt);
}

/**
 * Điều kiện cho phép Nhân viên bấm "Xác nhận bàn giao kho & Ký (Staff)" (POST /contracts/{id}/check-in):
 * - status === 'draft'
 * - Đã thanh toán đủ tiền cọc (source === 'reservation' hoặc Boolean(contract.depositPaidAt))
 * - !contract.staffSigned
 */
export function canCheckInContract(contract: ContractResponse): boolean {
  return (
    contract.status === ContractStatusEnum.DRAFT &&
    isContractDepositSatisfied(contract) &&
    !contract.staffSigned
  );
}

/**
 * Tính tổng số lượng của một tiện ích đang nằm trong các phụ lục REMOVE chờ duyệt/ký
 * (status === 'pending_approval' || status === 'draft')
 */
export function getPendingRemoveAmenityQty(
  addendums: ContractAddendumResponse[] | undefined,
  facilityAmenityOfferingId: string
): number {
  if (!addendums || addendums.length === 0) return 0;
  let total = 0;
  for (const add of addendums) {
    if (
      add.type === ContractAddendumTypeEnum.REMOVE &&
      (add.status === ContractAddendumStatusEnum.PENDING_APPROVAL ||
        add.status === ContractAddendumStatusEnum.DRAFT)
    ) {
      for (const item of add.amenities ?? []) {
        if (item.facilityAmenityOfferingId === facilityAmenityOfferingId) {
          total += item.quantity ?? 0;
        }
      }
    }
  }
  return total;
}

/**
 * Tính số lượng tối đa có thể yêu cầu tháo dỡ / trả bớt cho một tiện ích đang thuê:
 * maxRemovableQty = item.quantity - pendingRemoveQty
 */
export function getMaxRemovableAmenityQty(
  contract: ContractResponse,
  facilityAmenityOfferingId: string
): number {
  const rentedItem = (contract.amenities ?? []).find(
    (a) => a.facilityAmenityOfferingId === facilityAmenityOfferingId
  );
  if (!rentedItem) return 0;
  const pendingQty = getPendingRemoveAmenityQty(contract.addendums, facilityAmenityOfferingId);
  return Math.max(0, (rentedItem.quantity ?? 0) - pendingQty);
}

/**
 * Tính toán dự kiến quyết toán khi Check-out (Real-time Preview trên UI)
 * - Nếu trả kho trễ sau `endDate`, hệ thống tính: 1.5 * đơn giá ngày * số ngày trễ
 * - refundAmount = Math.max(0, depositAmount - (damageFee + overdueFee))
 * - additionalPaymentRequired = Math.max(0, (damageFee + overdueFee) - depositAmount)
 */
export interface CheckoutSettlementPreview {
  depositAmount: number;
  overdueDays: number;
  dailyRate: number;
  estimatedOverdueFee: number;
  damageFee: number;
  totalDeductions: number;
  refundAmount: number;
  additionalPaymentRequired: number;
}

export function calculateCheckoutSettlementPreview(
  contract: ContractResponse,
  damageFeeInput: number,
  referenceNowMs: number
): CheckoutSettlementPreview {
  const depositAmount = Math.max(0, contract.depositAmount ?? 0);
  const safeDamageFee = Math.max(0, Number.isFinite(damageFeeInput) ? damageFeeInput : 0);

  // Tính đơn giá theo ngày từ rentalPrice và billingUnit
  const unit = String(contract.billingUnit ?? "").toLowerCase();
  let dailyRate = contract.rentalPrice ?? 0;
  if (unit === RentalUnitEnum.MONTH) {
    dailyRate = (contract.rentalPrice ?? 0) / 30;
  } else if (unit === RentalUnitEnum.WEEK) {
    dailyRate = (contract.rentalPrice ?? 0) / 7;
  } else if (unit === RentalUnitEnum.YEAR) {
    dailyRate = (contract.rentalPrice ?? 0) / 365;
  }

  const endMs = new Date(contract.endDate).getTime();
  const diffMs = Number.isNaN(endMs) ? 0 : referenceNowMs - endMs;
  const computedOverdueDays = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;

  const estimatedOverdueFee =
    contract.overdueFee && contract.overdueFee > 0
      ? contract.overdueFee
      : Math.round(1.5 * dailyRate * computedOverdueDays);

  const totalDeductions = safeDamageFee + estimatedOverdueFee;
  const refundAmount = Math.max(0, depositAmount - totalDeductions);
  const additionalPaymentRequired = Math.max(0, totalDeductions - depositAmount);

  return {
    depositAmount,
    overdueDays: computedOverdueDays,
    dailyRate: Math.round(dailyRate),
    estimatedOverdueFee,
    damageFee: safeDamageFee,
    totalDeductions,
    refundAmount,
    additionalPaymentRequired,
  };
}

/**
 * Xử lý mã lỗi nghiệp vụ Hợp đồng & Phụ lục Hợp đồng
 */
const CONTRACT_ERROR_MESSAGES_VI: Record<string, string> = {
  [MESSAGE_CODE.MESSAGE_CODE_409]:
    "Không thể ký hợp đồng trước khi hoàn tất thanh toán tiền thuê kỳ đầu tiên (firstCyclePaidAt).",
  [MESSAGE_CODE.MESSAGE_CODE_410]:
    "Bên này đã thực hiện ký xác nhận hợp đồng hoặc phụ lục hợp đồng trước đó.",
  [MESSAGE_CODE.MESSAGE_CODE_411]: "Không tìm thấy phụ lục hợp đồng (Contract Addendum).",
  [MESSAGE_CODE.MESSAGE_CODE_412]:
    "Phụ lục hợp đồng không ở trạng thái hợp lệ để thực hiện thao tác này.",
  [MESSAGE_CODE.MESSAGE_CODE_413]:
    "Số lượng yêu cầu tháo dỡ / trả bớt vượt quá số lượng đang thuê trên hợp đồng (hoặc đang có yêu cầu tháo dỡ chờ xử lý).",
  [MESSAGE_CODE.MESSAGE_CODE_500]: "Hợp đồng không ở trạng thái hợp lệ để thực hiện thao tác này.",
  [MESSAGE_CODE.MESSAGE_CODE_501]:
    "Ngày kết thúc hợp đồng không hợp lệ (endDate phải sau startDate, hoặc newEndDate phải sau endDate hiện tại).",
  [MESSAGE_CODE.MESSAGE_CODE_502]:
    "Đơn đặt chỗ (Reservation) không ở trạng thái hợp lệ để tạo hợp đồng (phải là CONFIRMED) hoặc đã có hợp đồng.",
  [MESSAGE_CODE.MESSAGE_CODE_503]: "Kho lưu trữ không khả dụng để tạo hợp đồng.",
  [MESSAGE_CODE.MESSAGE_CODE_504]: "Không đủ số lượng tồn kho tiện ích (Amenity) tại cơ sở.",
  [MESSAGE_CODE.MESSAGE_CODE_505]:
    "Bắt buộc phải đồng ý điều khoản (termsAccepted: true) khi ký xác nhận.",
  [MESSAGE_CODE.MESSAGE_CODE_506]:
    "Hợp đồng chưa được thanh toán tiền cọc (depositPaidAt === null), không thể ký xác nhận.",
  [MESSAGE_CODE.MESSAGE_CODE_121]:
    "Nhân viên được gán không thuộc cơ sở hiện tại hoặc không đúng vai trò.",
  [MESSAGE_CODE.MESSAGE_CODE_122]:
    "Nhân viên được gán không thuộc cơ sở hiện tại hoặc bạn không có quyền thao tác trên cơ sở này.",
};

const CONTRACT_ERROR_MESSAGES_EN: Record<string, string> = {
  [MESSAGE_CODE.MESSAGE_CODE_409]:
    "Cannot sign contract before first billing cycle payment is completed.",
  [MESSAGE_CODE.MESSAGE_CODE_410]: "This party has already signed the contract or addendum.",
  [MESSAGE_CODE.MESSAGE_CODE_411]: "Contract addendum not found.",
  [MESSAGE_CODE.MESSAGE_CODE_412]: "Contract addendum is not in a valid status for this operation.",
  [MESSAGE_CODE.MESSAGE_CODE_413]:
    "Requested removal quantity exceeds active contract amenity quantity.",
  [MESSAGE_CODE.MESSAGE_CODE_500]:
    "The contract is not in a valid status to perform this operation.",
  [MESSAGE_CODE.MESSAGE_CODE_501]:
    "Invalid contract end date (endDate must be after startDate, or newEndDate must be after current endDate).",
  [MESSAGE_CODE.MESSAGE_CODE_502]:
    "Reservation is not in a valid status to create a contract (must be CONFIRMED) or already has a contract.",
  [MESSAGE_CODE.MESSAGE_CODE_503]: "Storage unit is not available to create a contract.",
  [MESSAGE_CODE.MESSAGE_CODE_504]: "Insufficient amenity stock quantity at this facility.",
  [MESSAGE_CODE.MESSAGE_CODE_505]: "Terms must be accepted (termsAccepted: true) upon signing.",
  [MESSAGE_CODE.MESSAGE_CODE_506]:
    "Contract deposit has not been paid (depositPaidAt === null). Cannot proceed with signing.",
  [MESSAGE_CODE.MESSAGE_CODE_121]:
    "Assigned staff does not belong to this facility or has an invalid role.",
  [MESSAGE_CODE.MESSAGE_CODE_122]:
    "Assigned staff does not belong to this facility or you do not have permission for this facility.",
};

export function resolveContractErrorMessage(error: unknown, locale: "vi" | "en" = "vi"): string {
  const dict = locale === "en" ? CONTRACT_ERROR_MESSAGES_EN : CONTRACT_ERROR_MESSAGES_VI;

  if (error instanceof AppApiError) {
    if (error.messageCode && dict[error.messageCode]) {
      return dict[error.messageCode];
    }
    if (error.message?.trim()) {
      return error.message.trim();
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return locale === "en"
    ? "An unexpected error occurred while processing the contract."
    : "Đã có lỗi xảy ra khi xử lý hợp đồng. Vui lòng thử lại.";
}

export interface ContractLifecycleStep {
  key: "DRAFT" | "ACTIVE" | "COMPLETED";
  stepNumber: number;
  title: string;
  subtitle: string;
  state: "completed" | "current" | "upcoming" | "error";
}

export function buildContractLifecycleSteps(
  contract: ContractResponse,
  locale: "vi" | "en" = "vi"
): ContractLifecycleStep[] {
  const isEn = locale === "en";
  const status = contract.status;

  const isDraft = status === ContractStatusEnum.DRAFT;
  const isActiveOrOverdue =
    status === ContractStatusEnum.ACTIVE || status === ContractStatusEnum.OVERDUE;
  const isCompleted = status === ContractStatusEnum.COMPLETED;
  const isTerminatedOrCancelled =
    status === ContractStatusEnum.CANCELLED || status === ContractStatusEnum.TERMINATED;

  const step1State: ContractLifecycleStep["state"] =
    isCompleted || isActiveOrOverdue ? "completed" : isDraft ? "current" : "error";

  const step2State: ContractLifecycleStep["state"] = isCompleted
    ? "completed"
    : isActiveOrOverdue
      ? status === ContractStatusEnum.OVERDUE
        ? "error"
        : "current"
      : isTerminatedOrCancelled && contract.actualCheckInDate
        ? "error"
        : "upcoming";

  const step3State: ContractLifecycleStep["state"] = isCompleted ? "completed" : "upcoming";

  const step1Subtitle =
    contract.source === ContractSourceEnum.RESERVATION
      ? isEn
        ? "Deposit paid"
        : "Đã đóng cọc"
      : contract.depositPaidAt
        ? isEn
          ? `Deposit paid: ${formatDateTime(contract.depositPaidAt, locale)}`
          : `Đã thu cọc: ${formatDateTime(contract.depositPaidAt, locale)}`
        : isEn
          ? "Awaiting counter deposit & check-in"
          : "Chờ thu cọc tại quầy & khách đến nhận kho";

  return [
    {
      key: "DRAFT",
      stepNumber: 1,
      title: isEn ? "1. Draft & Deposit" : "1. Khởi tạo & Đóng cọc (DRAFT)",
      subtitle: step1Subtitle,
      state: step1State,
    },
    {
      key: "ACTIVE",
      stepNumber: 2,
      title: isEn ? "2. Handover & Active Lease" : "2. Bàn giao & Đang thuê (ACTIVE / OVERDUE)",
      subtitle: contract.actualCheckInDate
        ? isEn
          ? `Checked in: ${formatDateTime(contract.actualCheckInDate, locale)}`
          : `Nhận kho: ${formatDateTime(contract.actualCheckInDate, locale)}`
        : isEn
          ? `${formatDateOnly(contract.startDate, locale)} → ${formatDateOnly(contract.endDate, locale)}`
          : `${formatDateOnly(contract.startDate, locale)} → ${formatDateOnly(contract.endDate, locale)}`,
      state: step2State,
    },
    {
      key: "COMPLETED",
      stepNumber: 3,
      title: isEn ? "3. Check-out & Settlement" : "3. Trả kho & Thanh lý (COMPLETED)",
      subtitle: contract.actualCheckOutDate
        ? isEn
          ? `Checked out: ${formatDateTime(contract.actualCheckOutDate, locale)}`
          : `Đã trả kho: ${formatDateTime(contract.actualCheckOutDate, locale)}`
        : isEn
          ? "Inspection & deposit refund"
          : "Kiểm tra kho & quyết toán hoàn cọc",
      state: step3State,
    },
  ];
}
