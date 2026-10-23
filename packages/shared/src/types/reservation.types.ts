import type { RefundStatusEnum, ReservationStatusEnum } from "../enums/reservation.enum";
import type { BillingUnitEnum } from "../enums/billing.enum";
import type { OfferingSnapshot, StorageUnitSnapshot, UserSnapshot } from "./common.types";
import type { FacilitySnapshot } from "./facility.types";

export type ReservationUserSnapshot = UserSnapshot;
export type ReservationFacilitySnapshot = FacilitySnapshot;
export type ReservationOfferingSnapshot = OfferingSnapshot;
export type ReservationStorageUnitSnapshot = StorageUnitSnapshot;

export interface ReservationAmenityResponse {
  facilityAmenityOfferingId: string;
  amenityId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  billingUnit: BillingUnitEnum;
  totalPrice: number;
}

export interface ReservationResponse {
  id: string;
  reservationCode: string;
  customerId: string;
  facilityId: string;
  facilityUnitTypeOfferingId: string;
  storageUnitId?: string | null;
  startDate: string;
  checkInDate?: string;
  checkInTimeSlot?: string | null;
  rentalDuration: number;
  billingUnit: BillingUnitEnum;
  basePrice: number;
  depositAmount: number;
  amenities: ReservationAmenityResponse[];
  totalAmount: number;
  status: ReservationStatusEnum;
  expiresAt?: string | null;
  graceExpiresAt?: string | null;
  receivedBy?: UserSnapshot | null;
  receivedAt?: string | null;
  assignedBy?: UserSnapshot | null;
  assignedAt?: string | null;
  confirmedBy?: UserSnapshot | null;
  confirmedAt?: string | null;
  assignedStaffId?: string | null;
  assignedStaff?: UserSnapshot | null;
  assignedStaffAt?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: UserSnapshot | null;
  cancelledAt?: string | null;
  cancellationSource?: "customer" | "facility" | "system" | null;
  refundAmount: number;
  forfeitedAmount?: number;
  refundStatus?: RefundStatusEnum;
  refundedAt?: string | null;
  refundedBy?: UserSnapshot | null;
  refundReference?: string | null;
  refundNote?: string | null;
  paidAt?: string | null;
  paidAmount?: number | null;
  paymentId?: string | null;
  lastPaymentError?: string | null;
  notes?: string | null;
  customer?: UserSnapshot | null;
  facility?: FacilitySnapshot | null;
  offering?: OfferingSnapshot | null;
  storageUnit?: StorageUnitSnapshot | null;
  createdAt: string;
  updatedAt: string;
}

export type ReservationListResponse = ReservationResponse[];
