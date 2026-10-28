import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { fetchAuditLogs } from "@/features/audit-logs/api";
import type { AuditLogAction } from "@/features/audit-logs/types";
import { deriveTrashEntries, TRASH_TABS, type TrashTabId } from "./trash";

const tabOf = (id: TrashTabId) => TRASH_TABS.find((t) => t.id === id)!;

const logsQuery = (resourceType: string, action: AuditLogAction) => ({
  queryKey: ["trash", resourceType, action],
  queryFn: () =>
    fetchAuditLogs({
      page: 1,
      limit: 100,
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
      resourceType: resourceType as never,
      action,
      status: "success" as const,
    }),
});

export const useTrash = (tabId: TrashTabId) => {
  const { resourceType } = tabOf(tabId);
  return useQueries({
    queries: [logsQuery(resourceType, "delete"), logsQuery(resourceType, "restore")],
    combine: ([del, res]) => ({
      entries: deriveTrashEntries(del.data?.items ?? [], res.data?.items ?? []),
      isLoading: del.isLoading || res.isLoading,
      isError: del.isError || res.isError,
      refetch: () => Promise.all([del.refetch(), res.refetch()]),
    }),
  });
};

export const useRestore = (tabId: TrashTabId) => {
  const queryClient = useQueryClient();
  const { restore, resourceType } = tabOf(tabId);
  return useMutation({
    mutationFn: (id: string): Promise<unknown> => restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash", resourceType] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
};
