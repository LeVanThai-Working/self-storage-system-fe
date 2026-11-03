import api from "@/lib/api/axios";
import type {
  ApiResponse,
  CancelInvoiceRequest,
  ConfirmManualInvoicePaymentRequest,
  CreateManualInvoiceRequest,
  InvoicePaginatedData,
  InvoicePdfResponse,
  InvoiceQuery,
  InvoiceResponse,
  OverdueInvoiceScanResult,
  PaginationMeta,
  PaymentResponse,
  RecurringInvoiceScanResult,
  RemindInvoicesScanResult,
} from "./types";

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

function normalizePaginatedInvoices(
  rawEnvelope: unknown,
  fallbackPage = 1,
  fallbackLimit = 10
): InvoicePaginatedData {
  if (!rawEnvelope || typeof rawEnvelope !== "object") {
    return {
      items: [],
      pagination: { ...DEFAULT_PAGINATION, page: fallbackPage, limit: fallbackLimit },
    };
  }

  const env = rawEnvelope as Record<string, unknown>;
  const innerData = (env.data !== undefined ? env.data : env) as Record<string, unknown>;

  if (innerData && typeof innerData === "object" && "items" in innerData) {
    const d = innerData as { items?: unknown; pagination?: unknown };
    return {
      items: Array.isArray(d.items) ? (d.items as InvoiceResponse[]) : [],
      pagination: (d.pagination as PaginationMeta) || {
        ...DEFAULT_PAGINATION,
        page: fallbackPage,
        limit: fallbackLimit,
      },
    };
  }

  if (
    innerData &&
    typeof innerData === "object" &&
    "data" in innerData &&
    Array.isArray((innerData as { data: unknown }).data)
  ) {
    const d = innerData as { data: InvoiceResponse[]; pagination?: PaginationMeta };
    return {
      items: d.data,
      pagination: d.pagination || {
        ...DEFAULT_PAGINATION,
        page: fallbackPage,
        limit: fallbackLimit,
      },
    };
  }

  return {
    items: [],
    pagination: { ...DEFAULT_PAGINATION, page: fallbackPage, limit: fallbackLimit },
  };
}

/**
 * GET /invoices
 */
export async function fetchInvoices(
  params: Partial<InvoiceQuery> = {}
): Promise<InvoicePaginatedData> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "createdAt",
    sortOrder: params.sortOrder ?? "desc",
  };

  if (params.contractId) query.contractId = params.contractId;
  if (params.customerId) query.customerId = params.customerId;
  if (params.facilityId) query.facilityId = params.facilityId;
  if (params.status) query.status = params.status;
  if (params.type) query.type = params.type;
  if (params.dueBefore) query.dueBefore = params.dueBefore;
  if (params.dueAfter) query.dueAfter = params.dueAfter;
  if (params.search) query.search = params.search;

  const res = await api.get<ApiResponse<InvoicePaginatedData>>("/invoices", {
    params: query,
  });

  return normalizePaginatedInvoices(
    res.data,
    typeof params.page === "number" ? params.page : 1,
    typeof params.limit === "number" ? params.limit : 10
  );
}

/**
 * GET /invoices/{id}
 */
export async function fetchInvoiceDetail(id: string): Promise<InvoiceResponse> {
  const res = await api.get<ApiResponse<InvoiceResponse>>(`/invoices/${id}`);
  const payload = res.data;
  return (payload as { data?: InvoiceResponse }).data ?? (payload as unknown as InvoiceResponse);
}

/**
 * GET /invoices/{id}/pdf
 */
export async function fetchInvoicePdf(id: string): Promise<InvoicePdfResponse> {
  const res = await api.get<ApiResponse<InvoicePdfResponse>>(`/invoices/${id}/pdf`);
  const payload = res.data;
  return (
    (payload as { data?: InvoicePdfResponse }).data ?? (payload as unknown as InvoicePdfResponse)
  );
}

/**
 * POST /invoices/manual
 */
export async function createManualInvoice(
  payload: CreateManualInvoiceRequest
): Promise<InvoiceResponse> {
  const res = await api.post<ApiResponse<InvoiceResponse>>("/invoices/manual", payload);
  const data = res.data;
  return (data as { data?: InvoiceResponse }).data ?? (data as unknown as InvoiceResponse);
}

/**
 * POST /invoices/{id}/payments
 */
export async function createInvoicePayment(id: string): Promise<PaymentResponse> {
  const res = await api.post<ApiResponse<PaymentResponse>>(`/invoices/${id}/payments`, {});
  const data = res.data;
  return (data as { data?: PaymentResponse }).data ?? (data as unknown as PaymentResponse);
}

/**
 * POST /invoices/{id}/confirm-manual
 */
export async function confirmManualInvoicePayment(
  id: string,
  payload: ConfirmManualInvoicePaymentRequest
): Promise<InvoiceResponse> {
  const res = await api.post<ApiResponse<InvoiceResponse>>(
    `/invoices/${id}/confirm-manual`,
    payload
  );
  const data = res.data;
  return (data as { data?: InvoiceResponse }).data ?? (data as unknown as InvoiceResponse);
}

/**
 * POST /invoices/{id}/cancel
 */
export async function cancelInvoice(
  id: string,
  payload: CancelInvoiceRequest
): Promise<InvoiceResponse> {
  const res = await api.post<ApiResponse<InvoiceResponse>>(`/invoices/${id}/cancel`, payload);
  const data = res.data;
  return (data as { data?: InvoiceResponse }).data ?? (data as unknown as InvoiceResponse);
}

/**
 * POST /invoices/process-recurring
 */
export async function triggerRecurringInvoiceScan(): Promise<RecurringInvoiceScanResult> {
  const res = await api.post<ApiResponse<RecurringInvoiceScanResult>>(
    "/invoices/process-recurring",
    {}
  );
  const data = res.data;
  return (
    (data as { data?: RecurringInvoiceScanResult }).data ??
    (data as unknown as RecurringInvoiceScanResult)
  );
}

/**
 * POST /invoices/process-overdue
 */
export async function triggerOverdueInvoiceScan(): Promise<OverdueInvoiceScanResult> {
  const res = await api.post<ApiResponse<OverdueInvoiceScanResult>>(
    "/invoices/process-overdue",
    {}
  );
  const data = res.data;
  return (
    (data as { data?: OverdueInvoiceScanResult }).data ??
    (data as unknown as OverdueInvoiceScanResult)
  );
}

/**
 * POST /invoices/process-reminders
 */
export async function triggerRemindInvoicesScan(): Promise<RemindInvoicesScanResult> {
  const res = await api.post<ApiResponse<RemindInvoicesScanResult>>(
    "/invoices/process-reminders",
    {}
  );
  const data = res.data;
  return (
    (data as { data?: RemindInvoicesScanResult }).data ??
    (data as unknown as RemindInvoicesScanResult)
  );
}
