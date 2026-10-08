import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs, fetchAuditLogById } from "./api";
import type { AuditLogQueryParams } from "./types";

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  lists: () => [...auditLogKeys.all, "list"] as const,
  list: (params: AuditLogQueryParams) => [...auditLogKeys.lists(), { params }] as const,
  details: () => [...auditLogKeys.all, "detail"] as const,
  detail: (id: string) => [...auditLogKeys.details(), id] as const,
};

/**
 * Hook to fetch a paginated, filtered list of audit logs.
 * Automatically refetches when params change.
 */
export const useAuditLogs = (params: AuditLogQueryParams) => {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => fetchAuditLogs(params),
    // Keep previous data while fetching next page for smooth UX
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook to fetch a single audit log entry by ID.
 */
export const useAuditLog = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: auditLogKeys.detail(id),
    queryFn: () => fetchAuditLogById(id),
    enabled: !!id && (options?.enabled ?? true),
  });
};
