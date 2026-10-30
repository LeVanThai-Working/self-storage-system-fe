import type { ApiResponse, PaginatedData, PaginationMeta } from "@self-storage-system-fe/shared";
import api from "@/lib/api/axios";
import type {
  ApproveRefundRequest,
  CancelRefundRequest,
  ConfirmPaidRefund,
  CreateRefundRequest,
  RefundRequestPaginatedData,
  RefundRequestQuery,
  RefundRequestResponse,
  RejectRefundRequest,
} from "./types";

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

function normalizePaginatedRefunds(
  rawEnvelope: unknown,
  fallbackPage = 1,
  fallbackLimit = 10
): RefundRequestPaginatedData {
  if (!rawEnvelope || typeof rawEnvelope !== "object") {
    return {
      items: [],
      pagination: { ...DEFAULT_PAGINATION, page: fallbackPage, limit: fallbackLimit },
    };
  }

  const env = rawEnvelope as Record<string, unknown>;
  const innerData = env.data ?? env;

  if (innerData && typeof innerData === "object" && "items" in innerData) {
    const d = innerData as { items?: unknown; pagination?: unknown };
    return {
      items: Array.isArray(d.items) ? (d.items as RefundRequestResponse[]) : [],
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
    const d = innerData as { data: RefundRequestResponse[]; pagination?: PaginationMeta };
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
 * GET /refund-requests
 */
export async function fetchRefundRequests(
  params: Partial<RefundRequestQuery> = {}
): Promise<RefundRequestPaginatedData> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "createdAt",
    sortOrder: params.sortOrder ?? "desc",
  };

  if (params.facilityId) query.facilityId = params.facilityId;
  if (params.customerId) query.customerId = params.customerId;
  if (params.reservationId) query.reservationId = params.reservationId;
  if (params.contractId) query.contractId = params.contractId;
  if (params.status) query.status = params.status;
  if (params.reason) query.reason = params.reason;
  if (params.search) query.search = params.search;

  const res = await api.get<ApiResponse<RefundRequestPaginatedData>>("/refund-requests", {
    params: query,
  });

  return normalizePaginatedRefunds(
    res.data,
    typeof params.page === "number" ? params.page : 1,
    typeof params.limit === "number" ? params.limit : 10
  );
}

/**
 * GET /refund-requests/:id
 */
export async function fetchRefundRequestById(id: string): Promise<RefundRequestResponse> {
  const res = await api.get<ApiResponse<RefundRequestResponse>>(`/refund-requests/${id}`);
  return res.data.data;
}

/**
 * POST /refund-requests
 */
export async function createRefundRequest(
  payload: CreateRefundRequest
): Promise<RefundRequestResponse> {
  const res = await api.post<ApiResponse<RefundRequestResponse>>("/refund-requests", payload);
  return res.data.data;
}

/**
 * POST /refund-requests/:id/approve
 */
export async function approveRefundRequest(
  id: string,
  payload?: ApproveRefundRequest
): Promise<RefundRequestResponse> {
  const res = await api.post<ApiResponse<RefundRequestResponse>>(
    `/refund-requests/${id}/approve`,
    payload || {}
  );
  return res.data.data;
}

/**
 * POST /refund-requests/:id/reject
 */
export async function rejectRefundRequest(
  id: string,
  payload: RejectRefundRequest
): Promise<RefundRequestResponse> {
  const res = await api.post<ApiResponse<RefundRequestResponse>>(
    `/refund-requests/${id}/reject`,
    payload
  );
  return res.data.data;
}

/**
 * POST /refund-requests/:id/confirm-paid
 */
export async function confirmPaidRefund(
  id: string,
  payload: ConfirmPaidRefund
): Promise<RefundRequestResponse> {
  const res = await api.post<ApiResponse<RefundRequestResponse>>(
    `/refund-requests/${id}/confirm-paid`,
    payload
  );
  return res.data.data;
}

/**
 * POST /refund-requests/:id/cancel
 */
export async function cancelRefundRequest(
  id: string,
  payload: CancelRefundRequest
): Promise<RefundRequestResponse> {
  const res = await api.post<ApiResponse<RefundRequestResponse>>(
    `/refund-requests/${id}/cancel`,
    payload
  );
  return res.data.data;
}
