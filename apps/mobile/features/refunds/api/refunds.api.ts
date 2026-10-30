import api from "@/lib/api/axios";
import type {
  ApiResponse,
  CancelRefundRequest,
  PaginationMeta,
  RefundRequestPaginatedData,
  RefundRequestQuery,
  RefundRequestResponse,
} from "@self-storage-system-fe/shared";

const createDefaultPagination = (page = 1, limit = 10): PaginationMeta => ({
  page,
  limit,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});

function normalizePaginatedRefunds(
  rawEnvelope: unknown,
  fallbackPage = 1,
  fallbackLimit = 10
): RefundRequestPaginatedData {
  if (!rawEnvelope || typeof rawEnvelope !== "object") {
    return {
      items: [],
      pagination: createDefaultPagination(fallbackPage, fallbackLimit),
    };
  }

  const env = rawEnvelope as Record<string, unknown>;
  const innerData = env.data ?? env;

  if (innerData && typeof innerData === "object" && "items" in innerData) {
    const d = innerData as { items?: unknown; pagination?: unknown };
    return {
      items: Array.isArray(d.items) ? (d.items as RefundRequestResponse[]) : [],
      pagination:
        (d.pagination as PaginationMeta) || createDefaultPagination(fallbackPage, fallbackLimit),
    };
  }

  if (
    innerData &&
    typeof innerData === "object" &&
    "data" in innerData &&
    Array.isArray((innerData as { data: unknown }).data)
  ) {
    const d = innerData as { data: RefundRequestResponse[]; pagination?: PaginationMeta };
    return {
      items: d.data,
      pagination: d.pagination || createDefaultPagination(fallbackPage, fallbackLimit),
    };
  }

  return {
    items: [],
    pagination: createDefaultPagination(fallbackPage, fallbackLimit),
  };
}

/**
 * GET /refund-requests
 * Customer fetches their own refund requests list.
 */
export async function fetchCustomerRefundRequests(
  params: Partial<RefundRequestQuery> = {}
): Promise<RefundRequestPaginatedData> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    sortBy: params.sortBy ?? "createdAt",
    sortOrder: params.sortOrder ?? "desc",
  };

  if (params.status) query.status = params.status;
  if (params.reason) query.reason = params.reason;
  if (params.reservationId) query.reservationId = params.reservationId;
  if (params.contractId) query.contractId = params.contractId;

  const res = await api.get<ApiResponse<RefundRequestPaginatedData>>("/refund-requests", {
    params: query,
  });

  return normalizePaginatedRefunds(
    res.data,
    typeof params.page === "number" ? params.page : 1,
    typeof params.limit === "number" ? params.limit : 20
  );
}

/**
 * GET /refund-requests/:id
 * Customer views single refund request detail with masked bank details.
 */
export async function fetchRefundRequestById(id: string): Promise<RefundRequestResponse> {
  const res = await api.get<ApiResponse<RefundRequestResponse>>(`/refund-requests/${id}`);
  return res.data.data;
}

/**
 * POST /refund-requests/:id/cancel
 * Customer cancels their own pending refund request.
 */
export async function cancelRefundRequestApi(
  id: string,
  cancellationReason: string
): Promise<RefundRequestResponse> {
  const body: CancelRefundRequest = {
    cancellationReason: cancellationReason.trim(),
  };
  const res = await api.post<ApiResponse<RefundRequestResponse>>(
    `/refund-requests/${id}/cancel`,
    body
  );
  return res.data.data;
}
