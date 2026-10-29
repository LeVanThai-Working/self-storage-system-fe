import type {
  BillingUnitEnum,
  PaymentResponse,
  ReservationAmenityResponse,
  ReservationFacilitySnapshot,
  ReservationOfferingSnapshot,
  ReservationStorageUnitSnapshot,
  ReservationUserSnapshot,
} from "@self-storage-system-fe/shared";

/**
 * Reservation lifecycle of the current BE (docs/agent/booking/business-rules-current.md).
 * `ReservationStatusEnum` in the shared package still lists the retired statuses
 * (pending / received / rejected / payment_failed) and lacks `overdue`, so the customer
 * flow uses these instead.
 */
export enum CustomerReservationStatus {
  PENDING_PAYMENT = "pending_payment",
  PAYMENT_SUCCESSFUL = "payment_successful",
  CONFIRMED = "confirmed",
  OVERDUE = "overdue",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

export enum RefundStatus {
  NONE = "none",
  PENDING = "pending",
  REFUNDED = "refunded",
}

export enum CancelSource {
  CUSTOMER = "customer",
  FACILITY = "facility",
  SYSTEM = "system",
}

/** Reservation as returned by the BE now (shared `ReservationResponse` predates check-in fields). */
export interface CustomerReservation {
  id: string;
  reservationCode: string;
  customerId: string;
  facilityId: string;
  facilityUnitTypeOfferingId: string;
  storageUnitId?: string | null;
  startDate: string;
  checkInDate: string;
  /** Equals the `slotName` of a facility time slot. */
  checkInTimeSlot: string;
  rentalDuration: number;
  billingUnit: BillingUnitEnum;
  basePrice: number;
  depositAmount: number;
  amenities: ReservationAmenityResponse[];
  totalAmount: number;
  status: CustomerReservationStatus;
  expiresAt?: string | null;
  confirmedAt?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  cancellationSource?: CancelSource | null;
  refundAmount: number;
  forfeitedAmount: number;
  refundStatus: RefundStatus;
  refundedAt?: string | null;
  paidAt?: string | null;
  paidAmount?: number | null;
  paymentId?: string | null;
  notes?: string | null;
  facility?: ReservationFacilitySnapshot | null;
  offering?: ReservationOfferingSnapshot | null;
  storageUnit?: ReservationStorageUnitSnapshot | null;
  customer?: ReservationUserSnapshot | null;
  createdAt: string;
  updatedAt: string;
}

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
  /** Backend rejects the reservation unless this is true. */
  termsAccepted: boolean;
}

export interface ReservationListParams {
  page?: number;
  limit?: number;
  status?: CustomerReservationStatus;
  reservationCode?: string;
}

export type { PaymentResponse };
