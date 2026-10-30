import api from "@/lib/api/axios";
import {
  PaymentPurposeEnum,
  cleanQueryParams,
  type ApiResponse,
  type PaginatedData,
  type FacilityUnitTypeOfferingResponse,
  type PaymentResponse,
  type StorageRackResponse,
  type StorageUnitResponse,
} from "@self-storage-system-fe/shared";
import type { CreateReservationPayload, CustomerReservation, ReservationListParams } from "./types";

/** POST /reservations — locks the chosen unit and amenities for 15 minutes. */
export async function createReservation(
  payload: CreateReservationPayload
): Promise<CustomerReservation> {
  const { data } = await api.post<ApiResponse<CustomerReservation>>("/reservations", payload);
  return data.data;
}

/** GET /reservations — the BE scopes this to the signed-in customer. */
export async function fetchMyReservations(
  params: ReservationListParams
): Promise<PaginatedData<CustomerReservation>> {
  const { data } = await api.get<ApiResponse<PaginatedData<CustomerReservation>>>("/reservations", {
    params: cleanQueryParams({
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      status: params.status,
      reservationCode: params.reservationCode?.trim() || undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
  });
  return data.data;
}

/** GET /reservations/:id */
export async function fetchReservation(id: string): Promise<CustomerReservation> {
  const { data } = await api.get<ApiResponse<CustomerReservation>>(`/reservations/${id}`);
  return data.data;
}

/** POST /reservations/:id/cancel */
export async function cancelReservation(
  id: string,
  cancellationReason: string
): Promise<CustomerReservation> {
  const { data } = await api.post<ApiResponse<CustomerReservation>>(`/reservations/${id}/cancel`, {
    cancellationReason: cancellationReason.trim(),
  });
  return data.data;
}

/** GET /storage-units/facility/:facilityId/available — rooms still free for one unit type. */
export async function fetchAvailableUnits(
  facilityId: string,
  unitTypeId?: string
): Promise<StorageUnitResponse[]> {
  const { data } = await api.get<ApiResponse<StorageUnitResponse[]>>(
    `/storage-units/facility/${facilityId}/available`,
    { params: cleanQueryParams({ unitTypeId }) }
  );
  return data.data;
}

/** POST /payments — returns the open deposit payment for the reservation, or creates one (VietQR + bank info). */
export async function createOrGetDepositPayment(reservationId: string): Promise<PaymentResponse> {
  const { data } = await api.post<ApiResponse<PaymentResponse>>("/payments", {
    purpose: PaymentPurposeEnum.RESERVATION_DEPOSIT,
    reservationId,
  });
  return data.data;
}

/** GET /payments/:id — polled while the customer is transferring the deposit. */
export async function fetchPayment(id: string): Promise<PaymentResponse> {
  const { data } = await api.get<ApiResponse<PaymentResponse>>(`/payments/${id}`);
  return data.data;
}

/**
 * Units of one type for the booking seat map: every status from map-layout (taken ones are shown
 * greyed out), or only the free ones if map-layout is not reachable.
 */
export async function fetchBookableUnits(
  facilityId: string,
  unitTypeId?: string
): Promise<StorageUnitResponse[]> {
  try {
    const { data } = await api.get<ApiResponse<StorageUnitResponse[]>>(
      `/storage-units/facility/${facilityId}/map-layout`
    );
    return data.data.filter((unit) => !unitTypeId || unit.unitTypeId === unitTypeId);
  } catch {
    return fetchAvailableUnits(facilityId, unitTypeId);
  }
}

/** GET /storage-racks/unit/:unitId — racks inside a shared rack warehouse unit. */
export async function fetchUnitRacks(unitId: string): Promise<StorageRackResponse[]> {
  const { data } = await api.get<ApiResponse<StorageRackResponse[]>>(
    `/storage-racks/unit/${unitId}`
  );
  return data.data;
}

/** GET /facility-unit-type-offerings/:id — carries `rackZonePricing` for rack warehouses. */
export async function fetchOffering(id: string): Promise<FacilityUnitTypeOfferingResponse> {
  const { data } = await api.get<ApiResponse<FacilityUnitTypeOfferingResponse>>(
    `/facility-unit-type-offerings/${id}`
  );
  return data.data;
}
