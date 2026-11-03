export enum BillingUnitEnum {
  DAY = "day",
  MONTH = "month",
  ONE_TIME = "one_time",
}

export enum InvoiceStatusEnum {
  DRAFT = "draft",
  ISSUED = "issued",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
  VOID = "void",
}

export enum InvoiceTypeEnum {
  FIRST_PERIOD = "first_period",
  RECURRING = "recurring",
  INCIDENTAL = "incidental",
  CHECK_OUT_SETTLEMENT = "check_out_settlement",
}

export enum InvoiceItemTypeEnum {
  RENT = "rent",
  AMENITY = "amenity",
  DAMAGE_FEE = "damage_fee",
  OVERDUE_FEE = "overdue_fee",
  DISCOUNT = "discount",
  OTHER = "other",
}
