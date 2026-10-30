import {
  MESSAGE_DICTIONARY_EN,
  MESSAGE_DICTIONARY_VI,
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  PaymentTransactionResultEnum,
} from "@self-storage-system-fe/shared";

export function formatVnd(amount?: number | null): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return "0 ₫";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(dateStr?: string | null, locale: string = "vi"): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function calculateRemainingSeconds(expiresAt?: string | null): number {
  if (!expiresAt) return 0;
  const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(0, diff);
}

export function formatCountdownTimer(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function getPaymentStatusConfig(status: PaymentStatusEnum | string, locale: string = "vi") {
  const isEn = locale === "en";
  switch (status) {
    case PaymentStatusEnum.PENDING:
      return {
        label: isEn ? "Pending Payment" : "Chờ thanh toán",
        variant: "amber" as const,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        dotClass: "bg-amber-500",
      };
    case PaymentStatusEnum.PAID:
    case PaymentStatusEnum.COMPLETED:
    case "paid":
      return {
        label: isEn ? "Paid" : "Đã thanh toán",
        variant: "emerald" as const,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-500",
      };
    case PaymentStatusEnum.EXPIRED:
    case "expired":
      return {
        label: isEn ? "Expired" : "Đã hết hạn",
        variant: "slate" as const,
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
        dotClass: "bg-slate-400",
      };
    case PaymentStatusEnum.CANCELLED:
    case "cancelled":
      return {
        label: isEn ? "Cancelled" : "Đã hủy",
        variant: "rose" as const,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        dotClass: "bg-rose-500",
      };
    case PaymentStatusEnum.PARTIALLY_PAID:
    case "partially_paid":
      return {
        label: isEn ? "Partially Paid (Legacy)" : "Thanh toán một phần (Cũ)",
        variant: "amber" as const,
        badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
        dotClass: "bg-amber-600",
      };
    default:
      return {
        label: String(status),
        variant: "slate" as const,
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        dotClass: "bg-slate-400",
      };
  }
}

export function getPaymentPurposeConfig(
  purpose: PaymentPurposeEnum | string,
  locale: string = "vi"
) {
  const isEn = locale === "en";
  switch (purpose) {
    case PaymentPurposeEnum.RESERVATION_DEPOSIT:
      return {
        label: isEn ? "Reservation Deposit" : "Cọc giữ chỗ",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case PaymentPurposeEnum.CONTRACT_DEPOSIT:
      return {
        label: isEn ? "Contract Deposit" : "Cọc hợp đồng",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      };
    case PaymentPurposeEnum.RENT_FIRST_PERIOD:
      return {
        label: isEn ? "1st Period Rent" : "Tiền thuê kỳ đầu",
        badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
      };
    default:
      return {
        label: String(purpose),
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export function getPaymentMethodConfig(method: PaymentMethodEnum | string, locale: string = "vi") {
  const isEn = locale === "en";
  switch (method) {
    case PaymentMethodEnum.SEPAY_QR:
    case PaymentMethodEnum.QR_CODE:
      return {
        label: isEn ? "VietQR (SePay)" : "Quét mã VietQR (SePay)",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      };
    case PaymentMethodEnum.CASH:
      return {
        label: isEn ? "Cash at Counter" : "Tiền mặt tại quầy",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case PaymentMethodEnum.BANK_TRANSFER:
      return {
        label: isEn ? "Bank Transfer" : "Chuyển khoản trực tiếp",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    default:
      return {
        label: String(method),
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export function getTransactionResultConfig(
  result: PaymentTransactionResultEnum | string,
  locale: string = "vi"
) {
  const isEn = locale === "en";
  switch (result) {
    case PaymentTransactionResultEnum.MATCHED:
      return {
        label: isEn ? "Matched" : "Khớp mã",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-500",
      };
    case PaymentTransactionResultEnum.UNMATCHED:
      return {
        label: isEn ? "Unmatched" : "Chưa khớp mã",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        dotClass: "bg-rose-500",
      };
    case PaymentTransactionResultEnum.AMOUNT_MISMATCH:
      return {
        label: isEn ? "Amount Mismatch" : "Sai số tiền (Hoàn cọc)",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        dotClass: "bg-amber-500",
      };
    case PaymentTransactionResultEnum.LATE:
      return {
        label: isEn ? "Late Transaction" : "Giao dịch trễ (Hoàn cọc)",
        badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
        dotClass: "bg-orange-500",
      };
    case PaymentTransactionResultEnum.RECEIVED:
      return {
        label: isEn ? "Received" : "Đã tiếp nhận",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        dotClass: "bg-blue-500",
      };
    case PaymentTransactionResultEnum.IGNORED:
      return {
        label: isEn ? "Ignored" : "Bỏ qua",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
        dotClass: "bg-slate-400",
      };
    default:
      return {
        label: String(result),
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        dotClass: "bg-slate-400",
      };
  }
}

export function resolvePaymentErrorMessage(err: unknown, locale: string = "vi"): string {
  const dict = locale === "en" ? MESSAGE_DICTIONARY_EN : MESSAGE_DICTIONARY_VI;
  const isEn = locale === "en";

  if (!err || typeof err !== "object") {
    return isEn ? "An unexpected error occurred." : "Đã xảy ra lỗi không xác định.";
  }

  const errObj = err as Record<string, unknown>;
  const responseData = (errObj.response as Record<string, unknown> | undefined)?.data as
    Record<string, unknown> | undefined;

  const messageCode =
    (errObj.messageCode as string | undefined) || (responseData?.messageCode as string | undefined);

  if (messageCode && dict[messageCode]) {
    return dict[messageCode];
  }

  const message =
    (responseData?.message as string | undefined) || (errObj.message as string | undefined);

  return (
    message || (isEn ? "Failed to process payment operation." : "Thao tác thanh toán thất bại.")
  );
}
