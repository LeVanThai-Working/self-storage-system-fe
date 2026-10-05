// Audit Log resource types as returned by the backend
export type AuditLogResourceType =
  | "auth"
  | "user"
  | "profile"
  | "facility"
  | "unit_type"
  | "amenity"
  | "facility_unit_type_offering"
  | "facility_amenity_offerings"
  | "storage_unit"
  | "reservation"
  | "approval_request";

// Audit Log actions as returned by the backend
export type AuditLogAction =
  | "register"
  | "login"
  | "login_google"
  | "logout"
  | "send_otp"
  | "forgot_password"
  | "reset_password"
  | "change_password"
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "assign_manager"
  | "toggle_maintenance"
  | "approve"
  | "reject"
  | "cancel";

export type AuditLogStatus = "success" | "failure";

export type AuditLogSortBy = "status" | "createdAt" | "action" | "resourceType";

export type AuditLogSortOrder = "asc" | "desc";

export interface AuditLogChanges {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  version: number;
  actorId: string | null;
  actorRole: string | null;
  actorEmail: string | null;
  action: AuditLogAction | string;
  resourceType: AuditLogResourceType | string;
  resourceId: string;
  status: AuditLogStatus;
  changes: AuditLogChanges | null;
  metadata: Record<string, unknown> | null;
  ip: string;
  userAgent: string;
  requestId: string;
  method: string;
  path: string;
  createdAt: string;
}

export interface AuditLogQueryParams {
  page: number;
  limit: number;
  sortBy: AuditLogSortBy;
  sortOrder: AuditLogSortOrder;
  // Optional filters
  search?: string;
  actorId?: string;
  action?: AuditLogAction;
  resourceType?: AuditLogResourceType;
  resourceId?: string;
  status?: AuditLogStatus;
  from?: string; // ISO date string
  to?: string; // ISO date string
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  pagination: AuditLogPagination;
}
