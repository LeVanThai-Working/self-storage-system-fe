import { AuditActionEnum, AuditResourceEnum, AuditStatusEnum } from "../enums/auditLog.enum";
import { PaginationQuery } from "./common.types";

export interface AuditLogChanges {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface AuditLogResponse {
  id: string;
  version: number;
  actorId?: string | null;
  actorRole?: string | null;
  actorEmail?: string | null;
  action: AuditActionEnum;
  resourceType: AuditResourceEnum;
  resourceId?: string | null;
  status: AuditStatusEnum;
  changes?: AuditLogChanges | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  method?: string | null;
  path?: string | null;
  createdAt: string;
}

export type AuditLogListResponse = AuditLogResponse[];

export interface AuditLogQuery extends PaginationQuery {
  actorId?: string;
  action?: AuditActionEnum;
  resourceType?: AuditResourceEnum;
  resourceId?: string;
  status?: AuditStatusEnum;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "action" | "resourceType" | "status";
  sortOrder?: "asc" | "desc";
}
