import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  PaymentPurposeEnum,
  type ApiResponse,
  type PaginatedData,
  type PaginationMeta,
  type PaymentResponse,
  type CreatePaymentRequest,
  type CancelPaymentRequest,
  type PaymentQuery,
} from "@self-storage-system-fe/shared";
import { ensureIsoDateString } from "./reservations.api";

const createDefaultPagination = (page = 1, limit = 10): PaginationMeta => ({
  page,
  limit,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});

/**
 * 1. POST /payments
 * Creates a new payment session or returns the active payment session for a reservation deposit,
 * including dynamic SePay VietQR (`qrUrl`) and `bankInfo`.
 */
export async function createOrGetDepositPaymentApi(
  reservationId: string
): Promise<ApiResponse<PaymentResponse>> {
  const body: CreatePaymentRequest = {
    purpose: PaymentPurposeEnum.RESERVATION_DEPOSIT,
    reservationId,
  };

  const response = await api.post<ApiResponse<PaymentResponse>>("/payments", body);
  return response.data;
}

/**
 * 2. GET /payments/{id}
 * Fetches payment detail by ID (used for 3-5s real-time polling on ReservationPaymentScreen).
 */
export async function getPaymentByIdApi(id: string): Promise<PaymentResponse> {
  const response = await api.get<ApiResponse<PaymentResponse>>(`/payments/${id}`);
  return response.data.data;
}

/**
 * 3. GET /payments
 * Fetches paginated payment history for the authenticated customer.
 */
export async function getMyPaymentsApi(
  params?: Partial<PaymentQuery>
): Promise<PaginatedData<PaymentResponse>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;

  const query = cleanQueryParams({
    page,
    limit,
    reservationId: params?.reservationId,
    contractId: params?.contractId,
    facilityId: params?.facilityId,
    purpose: params?.purpose,
    status: params?.status,
    paymentCode: params?.paymentCode,
    createdAtFrom: params?.createdAtFrom ? ensureIsoDateString(params.createdAtFrom) : undefined,
    createdAtTo: params?.createdAtTo ? ensureIsoDateString(params.createdAtTo) : undefined,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
  });

  const response = await api.get<ApiResponse<PaginatedData<PaymentResponse>>>("/payments", {
    params: query,
  });

  const payload = response.data?.data;
  return {
    items: payload?.items ?? [],
    pagination: payload?.pagination ?? createDefaultPagination(page, limit),
  };
}

/**
 * 4. POST /payments/{id}/cancel
 * Customer cancels an active payment session (only allowed when status is PENDING or PARTIALLY_PAID).
 */
export async function cancelPaymentApi(
  id: string,
  payload: CancelPaymentRequest
): Promise<ApiResponse<PaymentResponse>> {
  const response = await api.post<ApiResponse<PaymentResponse>>(`/payments/${id}/cancel`, {
    cancellationReason: payload.cancellationReason.trim(),
  });
  return response.data;
}
