import type { ApiResponse } from "@self-storage-system-fe/shared";
import api from "@/lib/api/axios";
import {
  PaymentPurposeEnum,
  type AssignStorageUnitRequest,
  type AvailableStorageUnitQuery,
  type CancelReservationRequest,
  type ConfirmManualPaymentRequest,
  type ConfirmReservationRequest,
  type ManagerReservationFilterParams,
  type PaymentPaginatedResponse,
  type PaymentResponse,
  type RejectReservationRequest,
  type ReservationPaginatedResponse,
  type ReservationResponse,
  type ReservationStatusEnum,
  type StorageUnitListResponse,
} from "./types";

function toIsoDateStringIfPresent(value?: string): string | undefined {
  if (!value || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/**
 * 3.1. GET /reservations — Danh sách đơn đặt chỗ tại cơ sở của Facility Manager
 */
export async function fetchManagerReservations(
  params: ManagerReservationFilterParams
): Promise<ReservationPaginatedResponse> {
  const query: Record<string, string | number> = {
    facilityId: params.facilityId,
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "createdAt",
    sortOrder: params.sortOrder ?? "desc",
  };

  if (params.status) query.status = params.status;
  if (params.reservationCode?.trim()) query.reservationCode = params.reservationCode.trim();
  if (params.facilityUnitTypeOfferingId) {
    query.facilityUnitTypeOfferingId = params.facilityUnitTypeOfferingId;
  }

  const isoFrom = toIsoDateStringIfPresent(params.startDateFrom);
  const isoTo = toIsoDateStringIfPresent(params.startDateTo);
  if (isoFrom) query.startDateFrom = isoFrom;
  if (isoTo) query.startDateTo = isoTo;

  const { data } = await api.get<ApiResponse<ReservationPaginatedResponse>>("/reservations", {
    params: query,
  });
  return data.data;
}

/**
 * Lấy tổng số đơn theo từng trạng thái cho các Quick Filter Cards
 */
export async function fetchManagerReservationStatusCount(
  facilityId: string,
  status?: ReservationStatusEnum
): Promise<number> {
  const params: Record<string, string | number> = {
    facilityId,
    page: 1,
    limit: 1,
  };
  if (status) params.status = status;

  const { data } = await api.get<ApiResponse<ReservationPaginatedResponse>>("/reservations", {
    params,
  });
  return data.data?.pagination?.totalItems ?? 0;
}

/**
 * 3.2. GET /reservations/{id} — Chi tiết một đơn đặt chỗ
 */
export async function fetchReservationById(id: string): Promise<ReservationResponse> {
  const { data } = await api.get<ApiResponse<ReservationResponse>>(`/reservations/${id}`);
  return data.data!;
}

/**
 * 3.3. POST /reservations/{id}/receive — Tiếp nhận đơn (PENDING -> RECEIVED)
 */
export async function receiveReservation(id: string): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(`/reservations/${id}/receive`);
  return data.data!;
}

/**
 * 3.4. GET /storage-units/facility/{facilityId}/available — Lấy danh sách ô kho vật lý đang trống (AVAILABLE)
 */
export async function fetchAvailableStorageUnitsForFacility(
  facilityId: string,
  query?: AvailableStorageUnitQuery
): Promise<StorageUnitListResponse> {
  const params: Record<string, string | number> = {};
  if (query?.unitTypeId) params.unitTypeId = query.unitTypeId;
  if (query?.floor !== undefined && Number.isFinite(query.floor)) params.floor = query.floor;
  if (query?.zone?.trim()) params.zone = query.zone.trim();

  const { data } = await api.get<ApiResponse<StorageUnitListResponse>>(
    `/storage-units/facility/${facilityId}/available`,
    { params }
  );
  return data.data ?? [];
}

/**
 * 3.5. POST /reservations/{id}/assign-unit — Phân bổ ô kho vật lý & Mở cổng cọc (PENDING/RECEIVED -> PENDING_PAYMENT)
 */
export async function assignStorageUnitToReservation(
  id: string,
  payload: AssignStorageUnitRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/assign-unit`,
    payload
  );
  return data.data!;
}

/**
 * 3.6. POST /reservations/{id}/reject — Từ chối đơn đặt chỗ (PENDING/RECEIVED -> REJECTED)
 */
export async function rejectReservation(
  id: string,
  payload: RejectReservationRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/reject`,
    payload
  );
  return data.data!;
}

/**
 * 3.7. POST /reservations/{id}/confirm — Xác nhận chốt đơn sau khi khách đã cọc (PAYMENT_SUCCESSFUL -> CONFIRMED)
 */
export async function confirmReservation(
  id: string,
  payload?: ConfirmReservationRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/confirm`,
    payload ?? {}
  );
  return data.data!;
}

/**
 * 3.8. POST /reservations/{id}/cancel — Hủy đơn đặt chỗ
 */
export async function cancelReservation(
  id: string,
  payload: CancelReservationRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/cancel`,
    payload
  );
  return data.data!;
}

/**
 * 3.9. POST /reservations/{id}/complete — Hoàn tất đơn / Bàn giao sang Hợp đồng (CONFIRMED -> COMPLETED)
 */
export async function completeReservation(id: string): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(`/reservations/${id}/complete`);
  return data.data!;
}

/**
 * 3.10a. POST /payments — Lấy hoặc khởi tạo phiên thanh toán cọc (idempotent) cho đơn ở PENDING_PAYMENT / PAYMENT_FAILED
 */
export async function createOrGetReservationDepositPayment(
  reservationId: string
): Promise<PaymentResponse> {
  const { data } = await api.post<ApiResponse<PaymentResponse>>("/payments", {
    purpose: PaymentPurposeEnum.RESERVATION_DEPOSIT,
    reservationId,
  });
  return data.data!;
}

/**
 * Lấy danh sách giao dịch thanh toán của đơn đặt chỗ
 */
export async function fetchPaymentsByReservation(
  reservationId: string
): Promise<PaymentPaginatedResponse> {
  const { data } = await api.get<ApiResponse<PaymentPaginatedResponse>>("/payments", {
    params: {
      reservationId,
      page: 1,
      limit: 10,
    },
  });
  return data.data!;
}

/**
 * 3.10b. POST /payments/{id}/confirm-manual — Xác nhận thanh toán thủ công (Tiền mặt / Chuyển khoản tại quầy)
 */
export async function confirmManualPayment(
  paymentId: string,
  payload: ConfirmManualPaymentRequest
): Promise<PaymentResponse> {
  const { data } = await api.post<ApiResponse<PaymentResponse>>(
    `/payments/${paymentId}/confirm-manual`,
    payload
  );
  return data.data!;
}
