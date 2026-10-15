export enum ApprovalRequestTargetTypeEnum {
  UNIT_TYPE = "unit_type",
  FACILITY_UNIT_TYPE_OFFERING = "facility_unit_type_offering",
  AMENITY = "amenity",
  FACILITY_AMENITY_OFFERING = "facility_amenity_offering",
}

export enum ApprovalRequestActionEnum {
  CREATE = "create",
  UPDATE = "update",
}

export enum ApprovalRequestStatusEnum {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export enum ApprovalReviewDecisionEnum {
  APPROVE = "approve",
  REJECT = "reject",
}
