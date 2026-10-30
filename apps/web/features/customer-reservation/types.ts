import type {
  PaymentResponse,
  ReservationResponse,
  RespondUnitReassignRequest,
} from "@self-storage-system-fe/shared";
import {
  ReservationStatusEnum as CustomerReservationStatus,
  RefundStatusEnum as RefundStatus,
  ReservationCancelSourceEnum as CancelSource,
} from "@self-storage-system-fe/shared";

export { CustomerReservationStatus, RefundStatus, CancelSource };

/** Customer-facing reservation model matches shared canonical ReservationResponse */
export type CustomerReservation = ReservationResponse;

export interface CreateReservationPayload {
  facilityId: string;
  storageUnitId: string;
  facilityUnitTypeOfferingId: string;
  /** ISO 8601 */
  checkInDate: string;
  checkInTimeSlot: string;
  /** ISO 8601, never earlier than checkInDate */
  startDate: string;
  rentalDuration: number;
  amenities: Array<{ facilityAmenityOfferingId: string; quantity: number }>;
  notes?: string;
  termsAccepted?: boolean;
}

export interface ReservationListParams {
  page?: number;
  limit?: number;
  status?: CustomerReservationStatus | string;
  reservationCode?: string;
}

export type { PaymentResponse, RespondUnitReassignRequest };
