import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse,
  type PaginatedData,
  type PaginationMeta,
  type ReservationResponse,
  type CreateReservationRequest,
  type UpdateReservationRequest,
  type CancelReservationRequest,
  type ReservationQuery,
} from "@self-storage-system-fe/shared";

const createDefaultPagination = (page = 1, limit = 10): PaginationMeta => ({
  page,
  limit,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});

/**
 * Ensures any date input (Date object, YYYY-MM-DD, or ISO string) is serialized
 * as a strict ISO 8601 string (`new Date(...).toISOString()`) before sending to Backend.
 */
export function ensureIsoDateString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return value;
}

/**
 * 1. POST /reservations
 * Customer creates a new reservation (initial status = PENDING).
 */
export async function createReservationApi(
  payload: CreateReservationRequest
): Promise<ApiResponse<ReservationResponse>> {
  const body: CreateReservationRequest = {
    facilityId: payload.facilityId,
    facilityUnitTypeOfferingId: payload.facilityUnitTypeOfferingId,
    startDate: ensureIsoDateString(payload.startDate),
    rentalDuration: Number(payload.rentalDuration),
    amenities: payload.amenities ?? [],
    notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
  };

  const response = await api.post<ApiResponse<ReservationResponse>>("/reservations", body);
  return response.data;
}

/**
 * 2. GET /reservations
 * Fetches paginated list of reservations belonging to the authenticated customer.
 */
export async function getMyReservationsApi(
  params?: Partial<ReservationQuery>
): Promise<PaginatedData<ReservationResponse>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;

  const query = cleanQueryParams({
    page,
    limit,
    status: params?.status,
    reservationCode: params?.reservationCode,
    facilityId: params?.facilityId,
    facilityUnitTypeOfferingId: params?.facilityUnitTypeOfferingId,
    startDateFrom: params?.startDateFrom ? ensureIsoDateString(params.startDateFrom) : undefined,
    startDateTo: params?.startDateTo ? ensureIsoDateString(params.startDateTo) : undefined,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
  });

  const response = await api.get<ApiResponse<PaginatedData<ReservationResponse>>>("/reservations", {
    params: query,
  });

  const payload = response.data?.data;
  return {
    items: payload?.items ?? [],
    pagination: payload?.pagination ?? createDefaultPagination(page, limit),
  };
}

/**
 * 3. GET /reservations/{id}
 * Fetches detail of a single reservation by ID.
 */
export async function getReservationByIdApi(id: string): Promise<ReservationResponse> {
  const response = await api.get<ApiResponse<ReservationResponse>>(`/reservations/${id}`);
  return response.data.data;
}

/**
 * 4. PATCH /reservations/{id}
 * Customer updates an existing reservation (ONLY allowed when status === 'pending').
 */
export async function updateReservationApi(
  id: string,
  payload: UpdateReservationRequest
): Promise<ApiResponse<ReservationResponse>> {
  const body: UpdateReservationRequest = {
    ...(payload.startDate !== undefined
      ? { startDate: ensureIsoDateString(payload.startDate) }
      : {}),
    ...(payload.rentalDuration !== undefined
      ? { rentalDuration: Number(payload.rentalDuration) }
      : {}),
    ...(payload.amenities !== undefined ? { amenities: payload.amenities } : {}),
    ...(payload.notes !== undefined ? { notes: payload.notes.trim() } : {}),
  };

  const response = await api.patch<ApiResponse<ReservationResponse>>(`/reservations/${id}`, body);
  return response.data;
}

/**
 * 5. POST /reservations/{id}/cancel
 * Customer cancels a reservation with a required cancellationReason.
 */
export async function cancelReservationApi(
  id: string,
  payload: CancelReservationRequest
): Promise<ApiResponse<ReservationResponse>> {
  const response = await api.post<ApiResponse<ReservationResponse>>(`/reservations/${id}/cancel`, {
    cancellationReason: payload.cancellationReason.trim(),
  });
  return response.data;
}

/**
 * 6. POST /reservations/{id}/retry-payment
 * Transitions reservation from PAYMENT_FAILED back to PENDING_PAYMENT so customer can retry deposit payment.
 */
export async function retryReservationPaymentApi(
  id: string
): Promise<ApiResponse<ReservationResponse>> {
  const response = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/retry-payment`
  );
  return response.data;
}
