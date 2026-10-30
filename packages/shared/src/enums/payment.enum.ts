export enum PaymentStatusEnum {
  PENDING = "pending",
  /** @deprecated T1.8 single payment invariant: Underpayment no longer changes status to partially_paid */
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  EXPIRED = "expired",
  CANCELLED = "cancelled",

  // Aliases for compatibility
  COMPLETED = "paid",
  FAILED = "failed",
}

export enum PaymentPurposeEnum {
  RESERVATION_DEPOSIT = "reservation_deposit",
  CONTRACT_DEPOSIT = "contract_deposit",
  RENT_FIRST_PERIOD = "rent_first_period",
}

export enum PaymentMethodEnum {
  SEPAY_QR = "sepay_qr",
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",

  // Alias for compatibility
  QR_CODE = "sepay_qr",
}

/**
 * Outcome of processing a single bank transaction received from SePay.
 * RECEIVED is the initial state (stored before processing) and also marks
 * transactions whose processing was interrupted, so a retry can resume them.
 */
export enum PaymentTransactionResultEnum {
  RECEIVED = "received",
  MATCHED = "matched",
  /** @deprecated T1.8 single payment invariant: Underpayment is recorded as amount_mismatch */
  PARTIALLY_MATCHED = "partially_matched",
  UNMATCHED = "unmatched",
  AMOUNT_MISMATCH = "amount_mismatch",
  LATE = "late",
  IGNORED = "ignored",
}
