export enum RefundRequestStatusEnum {
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  PAID = "paid",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export enum RefundRequestReasonEnum {
  CUSTOMER_CANCEL = "customer_cancel",
  FACILITY_CANCEL = "facility_cancel",
  SYSTEM_CANCEL = "system_cancel",
  LATE_PAYMENT = "late_payment",
  AMOUNT_MISMATCH = "amount_mismatch",
  DEPOSIT_SETTLEMENT = "deposit_settlement",
  FACILITY_FAULT = "facility_fault",
}
