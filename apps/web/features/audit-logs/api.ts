import api from "@/lib/api/axios";
import type { AuditLog, AuditLogListResponse, AuditLogQueryParams } from "./types";

/**
 * Fetches paginated audit logs from the backend.
 * Endpoint: GET /audit-logs
 * Docs: https://self-storage-system-be.onrender.com/api-docs/#/AuditLogs/FindAll
 */
export const fetchAuditLogs = async (
  params: AuditLogQueryParams
): Promise<AuditLogListResponse> => {
  // Remove undefined/empty optional filters before sending
  const cleanParams: Record<string, unknown> = {
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };

  if (params.search) cleanParams.search = params.search;
  if (params.actorId) cleanParams.actorId = params.actorId;
  if (params.action) cleanParams.action = params.action;
  if (params.resourceType) cleanParams.resourceType = params.resourceType;
  if (params.resourceId) cleanParams.resourceId = params.resourceId;
  if (params.status) cleanParams.status = params.status;
  if (params.from) cleanParams.from = params.from;
  if (params.to) cleanParams.to = params.to;

  const { data } = await api.get<{
    success: boolean;
    data: AuditLogListResponse;
  }>("/audit-logs", { params: cleanParams });

  return data.data;
};

/**
 * Fetches a single audit log entry by ID.
 * Endpoint: GET /audit-logs/:id (if available)
 */
export const fetchAuditLogById = async (id: string): Promise<AuditLog> => {
  const { data } = await api.get<{
    success: boolean;
    data: AuditLog;
  }>(`/audit-logs/${id}`);

  return data.data;
};
