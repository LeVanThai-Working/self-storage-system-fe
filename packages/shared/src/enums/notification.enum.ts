export enum NotificationTypeEnum {
  SYSTEM = "system",
  SYSTEM_ALERT = "system_alert",
  APPROVAL_REQUEST = "approval_request",
  STORAGE_UNIT = "storage_unit",
  RESERVATION = "reservation",
  CONTRACT = "contract",
  PAYMENT = "payment",
  ACCESS_SCHEDULE = "access_schedule",
}

export enum NotificationPriorityEnum {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export enum NotificationChannelEnum {
  IN_APP = "in_app",
  EMAIL = "email",
}
