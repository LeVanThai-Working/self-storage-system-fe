import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CompleteSupportTicketRequest,
  ProcessSupportTicketRequest,
  SupportTicketQuery,
} from "@self-storage-system-fe/shared";
import {
  completeSupportTicket,
  fetchSupportTicket,
  fetchSupportTickets,
  processSupportTicket,
} from "./api";

export const supportDeskKeys = {
  all: ["support-desk"] as const,
  list: (query: Partial<SupportTicketQuery>) => [...supportDeskKeys.all, "list", query] as const,
  detail: (id?: string) => [...supportDeskKeys.all, "detail", id] as const,
};

export const useSupportTickets = (query: Partial<SupportTicketQuery>, enabled = true) =>
  useQuery({
    queryKey: supportDeskKeys.list(query),
    queryFn: () => fetchSupportTickets(query),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useSupportTicket = (id?: string) =>
  useQuery({
    queryKey: supportDeskKeys.detail(id),
    queryFn: () => fetchSupportTicket(id!),
    enabled: Boolean(id),
  });

export const useProcessSupportTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProcessSupportTicketRequest) => processSupportTicket(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: supportDeskKeys.all }),
  });
};

export const useCompleteSupportTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompleteSupportTicketRequest) => completeSupportTicket(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: supportDeskKeys.all }),
  });
};
