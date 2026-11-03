import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelInvoice,
  confirmManualInvoicePayment,
  createInvoicePayment,
  createManualInvoice,
  fetchInvoiceDetail,
  fetchInvoicePdf,
  fetchInvoices,
  triggerOverdueInvoiceScan,
  triggerRecurringInvoiceScan,
  triggerRemindInvoicesScan,
} from "./api";
import type {
  CancelInvoiceRequest,
  ConfirmManualInvoicePaymentRequest,
  CreateManualInvoiceRequest,
  InvoiceQuery,
} from "./types";

export const INVOICE_QUERY_KEYS = {
  all: ["invoices"] as const,
  lists: () => [...INVOICE_QUERY_KEYS.all, "list"] as const,
  list: (params: Partial<InvoiceQuery>) => [...INVOICE_QUERY_KEYS.lists(), params] as const,
  details: () => [...INVOICE_QUERY_KEYS.all, "detail"] as const,
  detail: (id?: string | null) => [...INVOICE_QUERY_KEYS.details(), id] as const,
  pdf: (id?: string | null) => [...INVOICE_QUERY_KEYS.all, "pdf", id] as const,
};

export function useInvoices(params: Partial<InvoiceQuery> = {}, enabled = true) {
  return useQuery({
    queryKey: INVOICE_QUERY_KEYS.list(params),
    queryFn: () => fetchInvoices(params),
    enabled,
    staleTime: 10_000,
  });
}

export function useInvoiceDetail(id?: string | null, enabled = true) {
  return useQuery({
    queryKey: INVOICE_QUERY_KEYS.detail(id),
    queryFn: () => fetchInvoiceDetail(id!),
    enabled: Boolean(id) && enabled,
    staleTime: 15_000,
  });
}

export function useInvoicePdf(id?: string | null, enabled = false) {
  return useQuery({
    queryKey: INVOICE_QUERY_KEYS.pdf(id),
    queryFn: () => fetchInvoicePdf(id!),
    enabled: Boolean(id) && enabled,
    staleTime: 60_000,
  });
}

export function useCreateManualInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateManualInvoiceRequest) => createManualInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.all });
    },
  });
}

export function useCreateInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => createInvoicePayment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.lists() });
    },
  });
}

export function useConfirmManualInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfirmManualInvoicePaymentRequest }) =>
      confirmManualInvoicePayment(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelInvoiceRequest }) =>
      cancelInvoice(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.lists() });
    },
  });
}

export function useTriggerRecurringScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => triggerRecurringInvoiceScan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.all });
    },
  });
}

export function useTriggerOverdueScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => triggerOverdueInvoiceScan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}

export function useTriggerRemindersScan() {
  return useMutation({
    mutationFn: () => triggerRemindInvoicesScan(),
  });
}
