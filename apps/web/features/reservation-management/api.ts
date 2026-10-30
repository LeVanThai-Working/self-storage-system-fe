import type { ApiResponse } from "@self-storage-system-fe/shared";
import api from "@/lib/api/axios";
import {
  PaymentPurposeEnum,
  type AssignReservationStaffRequest,
  type AssignStorageUnitRequest,
  type AvailableStorageUnitQuery,
  type CancelReservationRequest,
  type ConfirmManualPaymentRequest,
  type ConfirmRefundRequest,
  type ConfirmReservationRequest,
  type ExtendGracePeriodRequest,
  type ForceCancelReservationRequest,
  type ManagerReservationFilterParams,
  type MarkCustomerArrivedRequest,
  type PaymentPaginatedResponse,
  type PaymentResponse,
  type ReassignStorageUnitRequest,
  type RejectReservationRequest,
  type ReservationPaginatedResponse,
  type ReservationResponse,
  type ReservationStatusEnum,
  type RespondUnitReassignRequest,
  type StorageUnitListResponse,
} from "./types";

function toIsoDateStringIfPresent(value?: string): string | undefined {
  if (!value || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/**
 * 1. GET /reservations — Danh sách đơn đặt chỗ
 */
export async function fetchManagerReservations(
  params: ManagerReservationFilterParams
): Promise<ReservationPaginatedResponse> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "createdAt",
    sortOrder: params.sortOrder ?? "desc",
  };

  if (params.facilityId) query.facilityId = params.facilityId;

  if (params.status) query.status = params.status;
  if (params.refundStatus) query.refundStatus = params.refundStatus;
  if (params.customerId) query.customerId = params.customerId;
  if (params.storageUnitId) query.storageUnitId = params.storageUnitId;
  if (params.reservationCode?.trim()) query.reservationCode = params.reservationCode.trim();
  if (params.facilityUnitTypeOfferingId) {
    query.facilityUnitTypeOfferingId = params.facilityUnitTypeOfferingId;
  }

  const isoFrom = toIsoDateStringIfPresent(params.startDateFrom);
  const isoTo = toIsoDateStringIfPresent(params.startDateTo);
  if (isoFrom) query.startDateFrom = isoFrom;
  if (isoTo) query.startDateTo = isoTo;

  const isoCheckInFrom = toIsoDateStringIfPresent(params.checkInDateFrom);
  const isoCheckInTo = toIsoDateStringIfPresent(params.checkInDateTo);
  if (isoCheckInFrom) query.checkInDateFrom = isoCheckInFrom;
  if (isoCheckInTo) query.checkInDateTo = isoCheckInTo;

  const { data } = await api.get<ApiResponse<ReservationPaginatedResponse>>("/reservations", {
    params: query,
  });
  return data.data;
}

/**
 * Lấy tổng số đơn theo từng trạng thái cho các Quick Filter Tabs
 */
export async function fetchManagerReservationStatusCount(
  facilityId?: string,
  status?: ReservationStatusEnum
): Promise<number> {
  const params: Record<string, string | number> = {
    page: 1,
    limit: 1,
  };
  if (facilityId) params.facilityId = facilityId;
  if (status) params.status = status;

  const { data } = await api.get<ApiResponse<ReservationPaginatedResponse>>("/reservations", {
    params,
  });
  return data.data?.pagination?.totalItems ?? 0;
}

/**
 * 2. GET /reservations/{id} — Chi tiết một đơn đặt chỗ
 */
export async function fetchReservationById(id: string): Promise<ReservationResponse> {
  const { data } = await api.get<ApiResponse<ReservationResponse>>(`/reservations/${id}`);
  return data.data!;
}

/**
 * 3. POST /reservations/{id}/confirm — Xác nhận đơn sau thanh toán & phân công nhân viên
 */
export async function confirmReservation(
  id: string,
  payload: ConfirmReservationRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/confirm`,
    payload
  );
  return data.data!;
}

/**
 * 4. POST /reservations/{id}/assign-staff — Đổi nhân viên đón tiếp phụ trách đơn
 */
export async function assignReservationStaff(
  id: string,
  payload: AssignReservationStaffRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/assign-staff`,
    payload
  );
  return data.data!;
}

/**
 * 5. POST /reservations/{id}/mark-arrived — Ghi nhận khách đã đến cơ sở (chống hủy No-show)
 */
export async function markCustomerArrived(
  id: string,
  payload?: MarkCustomerArrivedRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/mark-arrived`,
    payload ?? {}
  );
  return data.data!;
}

/**
 * 6. POST /reservations/{id}/extend-grace — Gia hạn thời gian ân hạn nhận kho (1–72 giờ)
 */
export async function extendGracePeriod(
  id: string,
  payload: ExtendGracePeriodRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/extend-grace`,
    payload
  );
  return data.data!;
}

/**
 * 7. POST /reservations/{id}/reassign-unit — Đổi kho hoặc gửi đề xuất đổi kho 2 bước
 */
export async function reassignStorageUnit(
  id: string,
  payload: ReassignStorageUnitRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/reassign-unit`,
    payload
  );
  return data.data!;
}

/**
 * 8. POST /reservations/{id}/respond-reassign — Khách phản hồi chấp thuận / từ chối đổi kho
 */
export async function respondUnitReassign(
  id: string,
  payload: RespondUnitReassignRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/respond-reassign`,
    payload
  );
  return data.data!;
}

/**
 * 9. POST /reservations/{id}/cancel — Hủy đơn đặt chỗ (áp dụng phạt cọc 2 bậc)
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
 * 10. POST /reservations/{id}/force-cancel — Hủy khẩn cấp do sự cố kho (hoàn 100% cọc)
 */
export async function forceCancelReservation(
  id: string,
  payload: ForceCancelReservationRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/force-cancel`,
    payload
  );
  return data.data!;
}

/**
 * 11. POST /reservations/{id}/confirm-refund — Quản lý xác nhận đã hoàn cọc (Maker-Checker)
 */
export async function confirmRefund(
  id: string,
  payload: ConfirmRefundRequest
): Promise<ReservationResponse> {
  const { data } = await api.post<ApiResponse<ReservationResponse>>(
    `/reservations/${id}/confirm-refund`,
    payload
  );
  return data.data!;
}

/**
 * 12. POST /reservations/process-expired — Quét xử lý đơn hết hạn giữ chỗ (15 phút)
 */
export async function processExpiredReservations(): Promise<{ processedCount: number }> {
  const { data } = await api.post<ApiResponse<{ processedCount: number }>>(
    "/reservations/process-expired"
  );
  return data.data!;
}

/**
 * 13. POST /reservations/process-overdue — Quét đơn trễ hẹn (OVERDUE) và đơn bỏ hẹn (No-show)
 */
export async function processOverdueReservations(): Promise<{ processedCount: number }> {
  const { data } = await api.post<ApiResponse<{ processedCount: number }>>(
    "/reservations/process-overdue"
  );
  return data.data!;
}

/**
 * 14. GET /storage-units/facility/{facilityId}/available — Lấy danh sách ô kho vật lý đang trống
 */
export async function fetchAvailableStorageUnitsForFacility(
  facilityId: string,
  query?: AvailableStorageUnitQuery
): Promise<StorageUnitListResponse> {
  const { data } = await api.get<ApiResponse<StorageUnitListResponse>>(
    `/storage-units/facility/${facilityId}/available`,
    {
      params: query,
    }
  );
  return data.data!;
}

/**
 * 15. POST /payments — Khởi tạo phiên thanh toán cọc
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
 * GET /payments — Lấy danh sách giao dịch thanh toán
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
 * GET /payments/{id}
 */
export async function fetchPaymentById(paymentId: string): Promise<PaymentResponse> {
  const { data } = await api.get<ApiResponse<PaymentResponse>>(`/payments/${paymentId}`);
  return data.data!;
}

/**
 * POST /payments/{id}/confirm-manual — Xác nhận thanh toán tiền mặt tại quầy kèm ảnh hóa đơn
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

/**
 * POST /payments/{id}/cancel — Hủy phiên thanh toán
 */
export async function cancelPayment(
  paymentId: string,
  cancellationReason: string
): Promise<PaymentResponse> {
  const { data } = await api.post<ApiResponse<PaymentResponse>>(`/payments/${paymentId}/cancel`, {
    cancellationReason,
  });
  return data.data!;
}

// Legacy compatibility stubs
export async function receiveReservation(id: string): Promise<ReservationResponse> {
  return fetchReservationById(id);
}

export async function assignStorageUnitToReservation(
  id: string,
  payload: AssignStorageUnitRequest
): Promise<ReservationResponse> {
  return reassignStorageUnit(id, {
    newStorageUnitId: payload.storageUnitId,
    reason: payload.notes || "Assigned storage unit",
    customerAgreed: true,
  });
}

export async function rejectReservation(
  id: string,
  payload: RejectReservationRequest
): Promise<ReservationResponse> {
  return cancelReservation(id, {
    cancellationReason: payload.rejectionReason,
  });
}

export async function completeReservation(id: string): Promise<ReservationResponse> {
  return fetchReservationById(id);
}
