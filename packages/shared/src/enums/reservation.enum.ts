export enum ReservationStatusEnum {
  PENDING_PAYMENT = "pending_payment",
  PAYMENT_SUCCESSFUL = "payment_successful",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  OVERDUE = "overdue",

  // Legacy values kept for backward compatibility:
  PENDING = "pending",
  RECEIVED = "received",
  PAYMENT_FAILED = "payment_failed",
  REJECTED = "rejected",
}

export enum RefundStatusEnum {
  NONE = "none",
  PENDING = "pending",
  REFUNDED = "refunded",
}

export enum ReservationCancelSourceEnum {
  CUSTOMER = "customer",
  FACILITY = "facility",
  SYSTEM = "system",
  FACILITY_FAULT = "facility_fault",
}
