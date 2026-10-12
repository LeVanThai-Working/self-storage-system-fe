export enum PaymentStatusEnum {
  PENDING = "pending",
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export enum PaymentPurposeEnum {
  RESERVATION_DEPOSIT = "reservation_deposit",
  CONTRACT_DEPOSIT = "contract_deposit",
}

export enum PaymentMethodEnum {
  SEPAY_QR = "sepay_qr",
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
}

/**
 * Outcome of processing a single bank transaction received from SePay.
 * RECEIVED is the initial state (stored before processing) and also marks
 * transactions whose processing was interrupted, so a retry can resume them.
 */
export enum PaymentTransactionResultEnum {
  RECEIVED = "received",
  MATCHED = "matched",
  PARTIALLY_MATCHED = "partially_matched",
  UNMATCHED = "unmatched",
  LATE = "late",
  IGNORED = "ignored",
}
