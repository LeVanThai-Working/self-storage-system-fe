export enum MovementTypeEnum {
  IN = "in",
  OUT = "out",
  MOVE = "move",
  ADJUST = "adjust",
}

export enum InventoryRequestTypeEnum {
  INBOUND = "inbound",
  OUTBOUND = "outbound",
}

export enum InventoryRequestStatusEnum {
  PENDING = "pending",
  PENDING_CUSTOMER_CONFIRMATION = "pending_confirmation",
  ASSIGNED = "assigned",
  PROCESSING = "processing",
  READY_TO_PUTAWAY = "ready_to_putaway",
  COMPLETED = "completed",
  DISPUTED = "disputed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
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
