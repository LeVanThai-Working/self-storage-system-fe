export enum IncidentStatusEnum {
  REPORTED = "reported",
  ASSIGNED = "assigned",
  INVESTIGATING = "investigating",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
  CANCELLED = "cancelled",
}

export enum IncidentCategoryEnum {
  STRUCTURAL = "structural",
  ELECTRICAL = "electrical",
  WATER_LEAK = "water_leak",
  SECURITY = "security",
  CLEANLINESS = "cleanliness",
  OTHER = "other",
}

export enum IncidentSeverityEnum {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum IncidentLiablePartyEnum {
  CUSTOMER = "customer",
  FACILITY = "facility",
  THIRD_PARTY = "third_party",
  FORCE_MAJEURE = "force_majeure",
}
