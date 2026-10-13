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

export enum ContractAddendumStatusEnum {
  PENDING_APPROVAL = "pending_approval",
  DRAFT = "draft",
  ACTIVE = "active",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export enum ContractAddendumTypeEnum {
  ADD = "add",
  REMOVE = "remove",
}

export enum RentalUnitEnum {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
  ONE_TIME = "one_time",
}
