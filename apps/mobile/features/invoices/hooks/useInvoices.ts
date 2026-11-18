import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InvoiceQuery } from "@self-storage-system-fe/shared";
import { createInvoicePaymentApi, getInvoiceByIdApi, getMyInvoicesApi } from "../api/invoices.api";

export const INVOICE_QUERY_KEYS = {
  all: ["my-invoices"] as const,
  lists: () => [...INVOICE_QUERY_KEYS.all, "list"] as const,
  list: (params?: Partial<InvoiceQuery>) => [...INVOICE_QUERY_KEYS.lists(), params ?? {}] as const,
  details: () => [...INVOICE_QUERY_KEYS.all, "detail"] as const,
  detail: (id?: string | null) => [...INVOICE_QUERY_KEYS.details(), id ?? ""] as const,
};

/**
 * Fetches paginated customer invoices (`GET /invoices`).
 */
export function useMyInvoices(params?: Partial<InvoiceQuery>, enabled = true) {
  return useQuery({
    queryKey: INVOICE_QUERY_KEYS.list(params),
    queryFn: () => getMyInvoicesApi(params),
    enabled,
    staleTime: 10_000,
  });
}

/**
 * Fetches single invoice detail (`GET /invoices/{id}`).
 */
export function useInvoiceDetail(id?: string | null, enabled = true) {
  return useQuery({
    queryKey: INVOICE_QUERY_KEYS.detail(id),
    queryFn: () => getInvoiceByIdApi(id!),
    enabled: Boolean(id) && enabled,
    staleTime: 15_000,
  });
}

/**
 * Initializes or retrieves a VietQR payment session for an invoice (`POST /invoices/{id}/payments`).
 */
export function useCreateInvoicePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => createInvoicePaymentApi(invoiceId),
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });
    },
  });
}
