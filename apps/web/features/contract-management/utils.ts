import { AppApiError } from "@/lib/api/axios";
import {
  BillingUnitEnum,
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractDepositStatusEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  ContractTerminationTypeEnum,
  MESSAGE_CODE,
  OVERDUE_PENALTY_MULTIPLIER,
  OVERDUE_TERMINATION_GRACE_DAYS,
  RentalUnitEnum,
  RoleEnum,
  ViolationCategoryEnum,
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
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Lấy ngày hôm nay theo định dạng YYYY-MM-DD
 */
export function getTodayDateInputString(): string {
  return toDateInputString(new Date().toISOString());
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
 * Nhãn loại phụ lục hợp đồng (RENEW vs UNIT_CHANGE)
 */
export function getContractAddendumTypeLabel(
  type: ContractAddendumTypeEnum | string,
  locale: "vi" | "en" = "vi"
): string {
  const isEn = locale === "en";
  switch (String(type).toLowerCase()) {
    case ContractAddendumTypeEnum.RENEW:
      return isEn ? "Contract Extension (RENEW)" : "Gia hạn hợp đồng (RENEW)";
    case ContractAddendumTypeEnum.UNIT_CHANGE:
      return isEn ? "Emergency Unit Transfer (UNIT_CHANGE)" : "Điều chuyển kho sự cố (UNIT_CHANGE)";
    case ContractAddendumTypeEnum.ADD:
      return isEn ? "Add Amenities" : "Thuê thêm tiện ích";
    case ContractAddendumTypeEnum.REMOVE:
      return isEn ? "Remove Amenities" : "Trả bớt tiện ích";
    default:
      return String(type);
  }
}

/**
 * Nhãn trạng thái cọc hợp đồng (depositStatus)
 */
export function getContractDepositStatusLabel(
  status?: ContractDepositStatusEnum | string | null,
  locale: "vi" | "en" = "vi"
): string {
  const isEn = locale === "en";
  switch (String(status ?? "").toLowerCase()) {
    case ContractDepositStatusEnum.HELD:
      return isEn ? "Deposit Held" : "Đang giữ cọc";
    case ContractDepositStatusEnum.APPLIED:
      return isEn ? "Deposit Applied" : "Đã đối trừ";
    case ContractDepositStatusEnum.PARTIALLY_REFUNDED:
      return isEn ? "Partially Refunded" : "Hoàn trả một phần";
    case ContractDepositStatusEnum.REFUNDED:
      return isEn ? "Deposit Refunded" : "Đã hoàn cọc";
    case ContractDepositStatusEnum.FORFEITED:
      return isEn ? "Deposit Forfeited" : "Tịch thu cọc";
    case ContractDepositStatusEnum.DISPUTED:
      return isEn ? "Settlement Disputed" : "Đang tranh chấp cọc";
    default:
      return isEn ? "Unsettled" : "Chưa thanh toán cọc";
  }
}

/**
 * Nhãn phương thức chấm dứt hợp đồng (terminationType)
 */
export function getContractTerminationTypeLabel(
  type?: ContractTerminationTypeEnum | string | null,
  locale: "vi" | "en" = "vi"
): string {
  const isEn = locale === "en";
  switch (String(type ?? "").toLowerCase()) {
    case ContractTerminationTypeEnum.MUTUAL:
      return isEn ? "Mutual Agreement" : "Thỏa thuận đôi bên (MUTUAL)";
    case ContractTerminationTypeEnum.CUSTOMER_REQUEST:
      return isEn ? "Customer Request" : "Khách yêu cầu chấm dứt (CUSTOMER_REQUEST)";
    case ContractTerminationTypeEnum.VIOLATION:
      return isEn ? "Policy Violation" : "Vi phạm hợp đồng (VIOLATION)";
    default:
      return String(type ?? "—");
  }
}

/**
 * Nhãn phân loại vi phạm chấm dứt (violationCategory)
 */
export function getViolationCategoryLabel(
  category?: ViolationCategoryEnum | string | null,
  locale: "vi" | "en" = "vi"
): string {
  const isEn = locale === "en";
  switch (String(category ?? "").toLowerCase()) {
    case ViolationCategoryEnum.PROHIBITED_GOODS:
      return isEn ? "Prohibited Goods Stored" : "Chứa hàng cấm / nguy hại";
    case ViolationCategoryEnum.OVERDUE_PAYMENT:
      return isEn ? "Overdue Payment (>= 5 Days)" : "Nợ tiền quá hạn (>= 5 ngày)";
    case ViolationCategoryEnum.PROPERTY_DAMAGE:
      return isEn ? "Facility / Property Damage" : "Phá hoại tài sản / cơ sở vật chất";
    default:
      return String(category ?? "—");
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
 * Tính số ngày quá hạn (overdue days) dựa trên endDate và hiện tại
 */
export function getContractOverdueDays(endDate: string, referenceNowMs = Date.now()): number {
  const endMs = new Date(endDate).getTime();
  if (Number.isNaN(endMs)) return 0;
  const diffMs = referenceNowMs - endMs;
  return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
}

/**
 * Kiểm tra xem hợp đồng có đủ điều kiện chấm dứt do vi phạm nợ tiền OVERDUE_PAYMENT hay không:
 * - Phải ở trạng thái OVERDUE
 * - Số ngày quá hạn phải >= OVERDUE_TERMINATION_GRACE_DAYS (5 ngày)
 */
export function canTerminateForOverduePayment(
  contract: ContractResponse,
  referenceNowMs = Date.now()
): { allowed: boolean; overdueDays: number; requiredDays: number } {
  const overdueDays = getContractOverdueDays(contract.endDate, referenceNowMs);
  const isOverdueStatus = contract.status === ContractStatusEnum.OVERDUE;
  const allowed = isOverdueStatus && overdueDays >= OVERDUE_TERMINATION_GRACE_DAYS;

  return {
    allowed,
    overdueDays,
    requiredDays: OVERDUE_TERMINATION_GRACE_DAYS,
  };
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
 * Kiểm tra đã thanh toán tiền thuê kỳ đầu (`firstPeriodPaidAt` hoặc `firstCyclePaidAt`)
 */
export function isContractFirstPeriodPaid(contract: ContractResponse): boolean {
  return Boolean(contract.firstPeriodPaidAt || contract.firstCyclePaidAt);
}

/**
 * Điều kiện cho phép Quản lý bấm "Xác nhận bàn giao kho & Ký Check-in" (POST /contracts/{id}/check-in):
 * - status === 'draft'
 * - Đã thanh toán đủ tiền cọc (source === 'reservation' hoặc Boolean(contract.depositPaidAt))
 * - Khách hàng đã ký điều khoản trên App Mobile (contract.customerSigned === true)
 * - !contract.staffSigned
 * - Chỉ Quản lý cơ sở / Admin / Ops (facility_staff bị chặn 403)
 */
export function canCheckInContract(contract: ContractResponse, userRole?: string | null): boolean {
  const normalizedRole = String(userRole ?? "").toLowerCase();
  const isManagerOrAdmin =
    !userRole ||
    normalizedRole === RoleEnum.FACILITY_MANAGER ||
    normalizedRole === RoleEnum.BUSINESS_OPS_MANAGER ||
    normalizedRole === RoleEnum.SYSTEM_ADMIN;

  return (
    isManagerOrAdmin &&
    contract.status === ContractStatusEnum.DRAFT &&
    isContractDepositSatisfied(contract) &&
    contract.customerSigned === true &&
    !contract.staffSigned
  );
}

/**
 * Tính tổng số lượng của một tiện ích đang nằm trong các phụ lục REMOVE chờ duyệt/ký
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
 * Tính số lượng tối đa có thể yêu cầu tháo dỡ / trả bớt cho một tiện ích đang thuê
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
      : Math.round(OVERDUE_PENALTY_MULTIPLIER * dailyRate * computedOverdueDays);

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
  [MESSAGE_CODE.MESSAGE_CODE_103]: "Bạn không có quyền thao tác trên cơ sở này.",
  [MESSAGE_CODE.MESSAGE_CODE_104]: "Không tìm thấy dữ liệu yêu cầu.",
  [MESSAGE_CODE.MESSAGE_CODE_105]: "Hợp đồng cho đơn đặt chỗ này đã tồn tại trong hệ thống.",
  [MESSAGE_CODE.MESSAGE_CODE_319]: "Đã quá ngày hẹn nhận kho, không thể xác nhận đơn đặt chỗ.",
  [MESSAGE_CODE.MESSAGE_CODE_400]: "Không tìm thấy hợp đồng.",
  [MESSAGE_CODE.MESSAGE_CODE_401]: "Chuyển đổi trạng thái hợp đồng không hợp lệ.",
  [MESSAGE_CODE.MESSAGE_CODE_402]: "Phòng kho không khả dụng để lập hợp đồng.",
  [MESSAGE_CODE.MESSAGE_CODE_403]: "Hợp đồng đã được ký nhận kho và kích hoạt trước đó.",
  [MESSAGE_CODE.MESSAGE_CODE_404]: "Ngày gia hạn mới phải lớn hơn ngày kết thúc hiện tại.",
  [MESSAGE_CODE.MESSAGE_CODE_405]: "Không thể xóa đối tượng đang có hợp đồng hoạt động.",
  [MESSAGE_CODE.MESSAGE_CODE_406]: "Đơn đặt chỗ phải ở trạng thái đã xác nhận để lập hợp đồng.",
  [MESSAGE_CODE.MESSAGE_CODE_407]: "Phòng kho không thuộc cơ sở của hợp đồng.",
  [MESSAGE_CODE.MESSAGE_CODE_408]: "Không đủ số lượng tiện ích khả dụng cho hợp đồng.",
  [MESSAGE_CODE.MESSAGE_CODE_409]: "Không tìm thấy phụ lục hợp đồng.",
  [MESSAGE_CODE.MESSAGE_CODE_410]: "Chuyển đổi trạng thái phụ lục hợp đồng không hợp lệ.",
  [MESSAGE_CODE.MESSAGE_CODE_411]: "Quý khách vui lòng đồng ý với Điều khoản hợp đồng.",
  [MESSAGE_CODE.MESSAGE_CODE_412]: "Bên ký đã hoàn tất ký trước đó.",
  [MESSAGE_CODE.MESSAGE_CODE_413]:
    "Số lượng tiện ích yêu cầu tháo dỡ vượt quá số lượng đang thuê hợp lệ.",
  [MESSAGE_CODE.MESSAGE_CODE_414]:
    "Khách hàng phải ký hợp đồng trước khi Quản lý hoàn tất nhận kho.",
  [MESSAGE_CODE.MESSAGE_CODE_415]: "Khách hàng phải ký phụ lục trước khi Quản lý ký duyệt.",
  [MESSAGE_CODE.MESSAGE_CODE_416]:
    "Tính năng gia hạn trực tiếp đã đóng. Vui lòng tạo phụ lục gia hạn (RENEW).",
  [MESSAGE_CODE.MESSAGE_CODE_417]: "Quyết toán cọc đang trong quá trình giải quyết tranh chấp.",
  [MESSAGE_CODE.MESSAGE_CODE_418]:
    "Bắt buộc đính kèm ảnh hiện trường khi có phát sinh chi phí hư hại.",
  [MESSAGE_CODE.MESSAGE_CODE_419]: "Quyết toán tiền cọc đã được xác nhận trước đó.",
  [MESSAGE_CODE.MESSAGE_CODE_420]:
    "Không thể nghiệm thu trả kho: vẫn còn hàng hóa của khách lưu trong kho.",
  [MESSAGE_CODE.MESSAGE_CODE_421]:
    "Không thể nghiệm thu trả kho: hợp đồng đang có sự cố hư hỏng chưa đóng.",
  [MESSAGE_CODE.MESSAGE_CODE_422]:
    "Không thể hủy vô hiệu (VOID): đơn đặt chỗ liên kết không còn hoạt động.",
  [MESSAGE_CODE.MESSAGE_CODE_423]: "Chưa đến ngày hẹn nhận kho và khách chưa có mặt tại cơ sở.",
  [MESSAGE_CODE.MESSAGE_CODE_424]:
    "Đã quá hạn nhận kho của đơn đặt chỗ và khách chưa có mặt tại cơ sở.",
  [MESSAGE_CODE.MESSAGE_CODE_425]:
    "Ngày thuê đã thay đổi do nhận kho trễ. Khách hàng cần ký lại bản nháp đã cập nhật trước khi kích hoạt.",
  [MESSAGE_CODE.MESSAGE_CODE_426]:
    "Chấm dứt hợp đồng yêu cầu tối thiểu 1 biên bản thanh lý và 1 ảnh hiện trường.",
  [MESSAGE_CODE.MESSAGE_CODE_427]: "Chấm dứt do vi phạm yêu cầu phân loại hành vi vi phạm cụ thể.",
  [MESSAGE_CODE.MESSAGE_CODE_428]:
    "Chấm dứt do nợ tiền yêu cầu hợp đồng phải ở trạng thái quá hạn (OVERDUE) tối thiểu 5 ngày.",
  [MESSAGE_CODE.MESSAGE_CODE_629]:
    "Không thể thực hiện thao tác: vẫn còn hàng hóa của khách trong kho.",
  [MESSAGE_CODE.MESSAGE_CODE_121]: "Cần vai trò Quản lý cơ sở để thực hiện hành động này.",
  [MESSAGE_CODE.MESSAGE_CODE_122]:
    "Nhân viên được gán không thuộc cơ sở hiện tại hoặc bạn không có quyền thao tác trên cơ sở này.",
};

const CONTRACT_ERROR_MESSAGES_EN: Record<string, string> = {
  [MESSAGE_CODE.MESSAGE_CODE_103]: "You do not have permission to operate on this facility.",
  [MESSAGE_CODE.MESSAGE_CODE_104]: "Requested record was not found.",
  [MESSAGE_CODE.MESSAGE_CODE_105]: "A contract for this reservation already exists.",
  [MESSAGE_CODE.MESSAGE_CODE_319]: "Check-in date has already passed, cannot confirm reservation.",
  [MESSAGE_CODE.MESSAGE_CODE_400]: "Contract not found.",
  [MESSAGE_CODE.MESSAGE_CODE_401]: "Invalid contract status transition.",
  [MESSAGE_CODE.MESSAGE_CODE_402]: "Storage unit is not available to create a contract.",
  [MESSAGE_CODE.MESSAGE_CODE_403]: "Contract has already been checked in.",
  [MESSAGE_CODE.MESSAGE_CODE_404]: "Contract extension date must be greater than current end date.",
  [MESSAGE_CODE.MESSAGE_CODE_405]: "Cannot delete entity with active contracts.",
  [MESSAGE_CODE.MESSAGE_CODE_406]:
    "Reservation must be confirmed or completed to create a contract.",
  [MESSAGE_CODE.MESSAGE_CODE_407]: "Storage unit facility mismatch.",
  [MESSAGE_CODE.MESSAGE_CODE_408]: "Insufficient amenity quantity for contract.",
  [MESSAGE_CODE.MESSAGE_CODE_409]: "Contract addendum not found.",
  [MESSAGE_CODE.MESSAGE_CODE_410]: "Invalid contract addendum status transition.",
  [MESSAGE_CODE.MESSAGE_CODE_411]: "Contract terms must be accepted before signing.",
  [MESSAGE_CODE.MESSAGE_CODE_412]: "Party has already signed.",
  [MESSAGE_CODE.MESSAGE_CODE_413]:
    "Requested removal quantity exceeds active contract amenity quantity.",
  [MESSAGE_CODE.MESSAGE_CODE_414]: "Customer must sign contract before check-in handover.",
  [MESSAGE_CODE.MESSAGE_CODE_415]: "Customer must sign contract addendum before staff sign.",
  [MESSAGE_CODE.MESSAGE_CODE_416]:
    "Direct contract renewal is deprecated. Please use contract addendum (RENEW).",
  [MESSAGE_CODE.MESSAGE_CODE_417]: "Contract deposit settlement is disputed.",
  [MESSAGE_CODE.MESSAGE_CODE_418]: "Inspection photos are required when damage fee is assessed.",
  [MESSAGE_CODE.MESSAGE_CODE_419]: "Deposit settlement has already been confirmed.",
  [MESSAGE_CODE.MESSAGE_CODE_420]:
    "Cannot check out contract while customer inventory remains in storage unit.",
  [MESSAGE_CODE.MESSAGE_CODE_421]: "Cannot check out contract while open incidents exist.",
  [MESSAGE_CODE.MESSAGE_CODE_422]: "Cannot void contract: linked reservation is no longer active.",
  [MESSAGE_CODE.MESSAGE_CODE_423]:
    "Cannot create contract draft before check-in date unless customer has arrived.",
  [MESSAGE_CODE.MESSAGE_CODE_424]: "Reservation check-in deadline has expired.",
  [MESSAGE_CODE.MESSAGE_CODE_425]:
    "Contract dates were adjusted. Customer must re-sign the updated draft before check-in.",
  [MESSAGE_CODE.MESSAGE_CODE_426]:
    "Contract termination requires at least one report file and one evidence photo.",
  [MESSAGE_CODE.MESSAGE_CODE_427]: "Violation termination requires violation category.",
  [MESSAGE_CODE.MESSAGE_CODE_428]:
    "Overdue payment termination requires overdue grace period exceeded (at least 5 days overdue).",
  [MESSAGE_CODE.MESSAGE_CODE_431]:
    "Valid Signing Authorization is required for Facility Manager to sign or check-in.",
  [MESSAGE_CODE.MESSAGE_CODE_629]:
    "Cannot perform operation while customer inventory remains in unit.",
  [MESSAGE_CODE.MESSAGE_CODE_121]: "Facility Manager role required for this action.",
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
