import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse,
  type InvoicePaginatedData,
  type InvoiceQuery,
  type InvoiceResponse,
  type PaginationMeta,
  type PaymentResponse,
} from "@self-storage-system-fe/shared";

const createDefaultPagination = (page = 1, limit = 10): PaginationMeta => ({
  page,
  limit,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});

function normalizeInvoiceItem(item: InvoiceResponse): InvoiceResponse {
  const raw = item as unknown as Record<string, unknown>;
  const resolvedId =
    typeof item.id === "string" && item.id.trim()
      ? item.id
      : typeof raw._id === "string" && raw._id.trim()
        ? raw._id
        : item.id;
  return {
    ...item,
    id: resolvedId,
  };
}

function normalizePaginatedInvoices(
  rawEnvelope: unknown,
  fallbackPage = 1,
  fallbackLimit = 10
): InvoicePaginatedData {
  if (!rawEnvelope || typeof rawEnvelope !== "object") {
    return {
      items: [],
      pagination: createDefaultPagination(fallbackPage, fallbackLimit),
    };
  }

  const env = rawEnvelope as Record<string, unknown>;
  const innerData = (env.data !== undefined ? env.data : env) as Record<string, unknown>;

  if (Array.isArray(innerData)) {
    const topPagination = env.pagination as PaginationMeta | undefined;
    return {
      items: (innerData as InvoiceResponse[]).map(normalizeInvoiceItem),
      pagination: topPagination ?? createDefaultPagination(fallbackPage, fallbackLimit),
    };
  }

  if (innerData && typeof innerData === "object" && "items" in innerData) {
    const d = innerData as { items?: unknown; pagination?: PaginationMeta };
    return {
      items: Array.isArray(d.items) ? (d.items as InvoiceResponse[]).map(normalizeInvoiceItem) : [],
      pagination: d.pagination ?? createDefaultPagination(fallbackPage, fallbackLimit),
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
      items: d.data.map(normalizeInvoiceItem),
      pagination: d.pagination ?? createDefaultPagination(fallbackPage, fallbackLimit),
    };
  }

  return {
    items: [],
    pagination: createDefaultPagination(fallbackPage, fallbackLimit),
  };
}

function unwrapSinglePayload<T>(rawEnvelope: unknown): T {
  if (rawEnvelope && typeof rawEnvelope === "object" && "data" in rawEnvelope) {
    const inner = (rawEnvelope as { data?: T }).data;
    if (inner !== undefined) return inner;
  }
  return rawEnvelope as T;
}

/**
 * GET /invoices
 * Fetches paginated invoices belonging to the authenticated customer.
 */
export async function getMyInvoicesApi(
  params?: Partial<InvoiceQuery>
): Promise<InvoicePaginatedData> {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);

  const query = cleanQueryParams({
    page,
    limit,
    contractId: params?.contractId,
    customerId: params?.customerId,
    facilityId: params?.facilityId,
    status: params?.status,
    type: params?.type,
    dueBefore: params?.dueBefore,
    dueAfter: params?.dueAfter,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
  });

  const response = await api.get<ApiResponse<InvoicePaginatedData>>("/invoices", {
    params: query,
  });

  return normalizePaginatedInvoices(response.data, page, limit);
}

/**
 * GET /invoices/{id}
 * Fetches detail of a single invoice by ID.
 */
export async function getInvoiceByIdApi(id: string): Promise<InvoiceResponse> {
  const response = await api.get<ApiResponse<InvoiceResponse>>(`/invoices/${id}`);
  return normalizeInvoiceItem(unwrapSinglePayload<InvoiceResponse>(response.data));
}

/**
 * POST /invoices/{id}/payments
 * Creates or resumes a SePay VietQR payment session for an issued/overdue invoice.
 */
export async function createInvoicePaymentApi(id: string): Promise<PaymentResponse> {
  const response = await api.post<ApiResponse<PaymentResponse>>(`/invoices/${id}/payments`, {});
  return unwrapSinglePayload<PaymentResponse>(response.data);
}
