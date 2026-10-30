import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateSupportTicketRequest,
  SupportTicketQuery,
  SupportTicketResponse,
} from "@self-storage-system-fe/shared";
import {
  cancelSupportTicketApi,
  createSupportTicketApi,
  getSupportTicketApi,
  getSupportTicketsApi,
} from "../api/supportTicket.api";

const TICKET_PAGE_SIZE = 15;

export type SupportTicketFilters = Pick<SupportTicketQuery, "status" | "contractId" | "category">;

export const supportTicketKeys = {
  all: ["support-tickets"] as const,
  list: (filters: Partial<SupportTicketFilters>) =>
    [...supportTicketKeys.all, "list", filters] as const,
  detail: (id?: string) => [...supportTicketKeys.all, "detail", id] as const,
};

export function useSupportTicketList(filters: Partial<SupportTicketFilters>, enabled = true) {
  return useInfiniteQuery({
    queryKey: supportTicketKeys.list(filters),
    queryFn: ({ pageParam }) =>
      getSupportTicketsApi({
        ...filters,
        page: pageParam,
        limit: TICKET_PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    enabled,
  });
}

export function useSupportTicket(id?: string) {
  return useQuery({
    queryKey: supportTicketKeys.detail(id),
    queryFn: () => getSupportTicketApi(id!),
    enabled: Boolean(id),
  });
}

function useTicketMutationSuccess() {
  const qc = useQueryClient();
  return (ticket: SupportTicketResponse) => {
    qc.setQueryData(supportTicketKeys.detail(ticket.id), ticket);
    qc.invalidateQueries({ queryKey: [...supportTicketKeys.all, "list"] });
  };
}

export function useCreateSupportTicket() {
  const onSuccess = useTicketMutationSuccess();
  return useMutation({
    mutationFn: (payload: CreateSupportTicketRequest) => createSupportTicketApi(payload),
    onSuccess,
  });
}

export function useCancelSupportTicket(id: string) {
  const onSuccess = useTicketMutationSuccess();
  return useMutation({
    mutationFn: (reason?: string) => cancelSupportTicketApi(id, reason),
    onSuccess,
  });
}
