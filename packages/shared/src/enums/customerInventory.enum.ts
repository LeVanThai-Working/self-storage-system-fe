export enum MovementTypeEnum {
  IN = "in",
  OUT = "out",
  MOVE = "move",
  ADJUST = "adjust",
}

/** Where a customer's SKU sits: on a rack tier, in the holding area, or not in storage at all. */
export enum SkuPlacementEnum {
  ON_RACK = "on_rack",
  HOLDING = "holding",
  NOT_STORED = "not_stored",
}

export enum InventoryItemStatusEnum {
  NORMAL = "normal",
  TEMPORARY_HOLDING = "temporary_holding",
  DAMAGED = "damaged",
  DISPUTED = "disputed",
}

export enum AccessScheduleStatusEnum {
  PENDING = "pending",
  CHECKED_IN = "checked_in",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
  EXPIRED = "expired",
}
