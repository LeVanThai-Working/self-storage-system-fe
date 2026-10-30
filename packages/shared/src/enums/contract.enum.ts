export enum ContractStatusEnum {
  DRAFT = "draft",
  ACTIVE = "active",
  OVERDUE = "overdue",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  TERMINATED = "terminated",
}

export enum ContractSourceEnum {
  RESERVATION = "reservation",
  WALK_IN = "walk_in",
}

export enum ContractDepositStatusEnum {
  HELD = "held",
  APPLIED = "applied",
  PARTIALLY_REFUNDED = "partially_refunded",
  REFUNDED = "refunded",
  FORFEITED = "forfeited",
  DISPUTED = "disputed",
}

export enum ContractCancellationTypeEnum {
  VOID = "void", // Hủy bản nháp do nhân viên nhập sai; BẢO TOÀN reservation để tạo lại
  CANCEL = "cancel", // Khách đổi ý không thuê tại quầy; hủy luôn reservation và tính phạt cọc
}

export enum ContractTerminationTypeEnum {
  MUTUAL = "mutual",
  CUSTOMER_REQUEST = "customer_request",
  VIOLATION = "violation",
}

export enum ViolationCategoryEnum {
  PROHIBITED_GOODS = "prohibited_goods",
  OVERDUE_PAYMENT = "overdue_payment",
  PROPERTY_DAMAGE = "property_damage",
}

export enum ContractAddendumStatusEnum {
  PENDING_APPROVAL = "pending_approval",
  DRAFT = "draft",
  ACTIVE = "active",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export enum ContractAddendumTypeEnum {
  RENEW = "renew",
  UNIT_CHANGE = "unit_change",
  /** @deprecated legacy types kept for backwards compatibility */
  ADD = "add",
  /** @deprecated legacy types kept for backwards compatibility */
  REMOVE = "remove",
}

export enum RentalUnitEnum {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
  ONE_TIME = "one_time",
}
