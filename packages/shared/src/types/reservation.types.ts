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
  billingUnit: BillingUnitEnum | "day" | "month" | "one_time";
  totalPrice: number;
}

export interface ReservationResponse {
  id: string;
  reservationCode: string;
  customerId: string;
  facilityId: string;
  facilityUnitTypeOfferingId: string;
  storageUnitId?: string | null;
  /** `storage_rack` when the customer booked racks inside a WAREHOUSE_RACK unit. */
  rentalTargetType?: "storage_unit" | "storage_rack" | null;
  rentedRackIds?: string[];
  startDate: string;
  checkInDate?: string;
  checkInTimeSlot?: string | null;
  rentalDuration: number;
  billingUnit: BillingUnitEnum | "day" | "month" | "one_time";
  basePrice: number;
  depositAmount: number;
  amenities: ReservationAmenityResponse[];
  totalAmount: number;
  status:
    | ReservationStatusEnum
    | "pending_payment"
    | "payment_successful"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "expired"
    | "overdue";
  expiresAt?: string | null;
  graceExpiresAt?: string | null;
  arrivedAt?: string | null;
  arrivedBy?: UserSnapshot | null;
  earlyCheckIn?: boolean | null;
  outOfSlot?: boolean | null;
  graceExtendedAt?: string | null;
  graceExtensionReason?: string | null;
  /** Set while a unit reassignment proposal is awaiting the customer. */
  pendingUnitChange?: unknown | null;
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
  refundStatus?: RefundStatusEnum | "none" | "pending" | "refunded";
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
