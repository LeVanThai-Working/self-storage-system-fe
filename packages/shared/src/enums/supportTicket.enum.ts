export enum SupportTicketCategoryEnum {
  BILLING_INQUIRY = "billing_inquiry",
  CONTRACT_INQUIRY = "contract_inquiry",
  UNIT_CHANGE_REQUEST = "unit_change_request",
  ACCESS_PIN_RESET = "access_pin_reset",
  SERVICE_COMPLAINT = "service_complaint",
  PROCEDURAL_ASSISTANCE = "procedural_assistance",
  GENERAL_INQUIRY = "general_inquiry",
  INVENTORY_MOVE_REQUEST = "inventory_move_request",
}

export enum SupportTicketPriorityEnum {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum SupportTicketStatusEnum {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}
