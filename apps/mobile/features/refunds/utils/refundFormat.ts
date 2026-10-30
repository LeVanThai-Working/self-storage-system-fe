import { RefundRequestReasonEnum } from "@self-storage-system-fe/shared";

export function formatVnd(amount: number): string {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} đ`;
  }
}

export function formatDate(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function getMobileRefundReasonLabel(reason: string, isEn: boolean): string {
  switch (reason) {
    case RefundRequestReasonEnum.CUSTOMER_CANCEL:
    case "customer_cancel":
      return isEn ? "Customer Cancellation" : "Hủy đơn trước hạn";
    case RefundRequestReasonEnum.FACILITY_CANCEL:
    case "facility_cancel":
      return isEn ? "Facility Cancellation" : "Cơ sở hủy đơn";
    case RefundRequestReasonEnum.SYSTEM_CANCEL:
    case "system_cancel":
      return isEn ? "System Auto Cancel" : "Hệ thống hủy tự động";
    case RefundRequestReasonEnum.LATE_PAYMENT:
    case "late_payment":
      return isEn ? "Late Payment" : "Chuyển khoản muộn vào đơn hết hạn";
    case RefundRequestReasonEnum.AMOUNT_MISMATCH:
    case "amount_mismatch":
      return isEn ? "Amount Mismatch" : "Chuyển sai số tiền";
    case RefundRequestReasonEnum.DEPOSIT_SETTLEMENT:
    case "deposit_settlement":
      return isEn ? "Deposit Settlement" : "Quyết toán cọc dư sau thanh lý";
    case RefundRequestReasonEnum.FACILITY_FAULT:
    case "facility_fault":
      return isEn ? "Facility Issue / Fault" : "Không nhận được kho do lỗi cơ sở";
    default:
      return reason;
  }
}
