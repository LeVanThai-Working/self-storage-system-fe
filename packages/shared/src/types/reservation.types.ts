import type {
  RefundStatusEnum,
  ReservationCancelSourceEnum,
  ReservationStatusEnum,
} from "../enums/reservation.enum";
import type { BillingUnitEnum } from "../enums/billing.enum";
import type { RentalTargetTypeEnum } from "../enums/rental.enum";
import type { OfferingSnapshot, StorageUnitSnapshot, UserSnapshot } from "./common.types";
import type { FacilitySnapshot } from "./facility.types";
import type { StorageRackResponse } from "./storageRack.types";

export type ReservationUserSnapshot = UserSnapshot;
export type ReservationFacilitySnapshot = FacilitySnapshot;
export type ReservationOfferingSnapshot = OfferingSnapshot;
export type ReservationStorageUnitSnapshot = StorageUnitSnapshot;

export interface ReservationPendingUnitChangeResponse {
  newStorageUnitId: string;
  newStorageUnit?: StorageUnitSnapshot | null;
  newFacilityUnitTypeOfferingId: string;
  newOffering?: OfferingSnapshot | null;
  newPricePerUnit: number;
  priceDifference?: number | null;
  reason: string;
  oldUnitStatus: string;
  proposedBy?: UserSnapshot | null;
  proposedAt: string;
}

export interface ReservationUnitChangeResponse {
  fromUnitId: string;
  toUnitId: string;
  fromUnit?: StorageUnitSnapshot | null;
  toUnit?: StorageUnitSnapshot | null;
  fromOfferingId?: string | null;
  toOfferingId?: string | null;
  fromPrice?: number | null;
  toPrice?: number | null;
  reason: string;
  status?: "pending" | "accepted" | "rejected" | null;
  proposedBy?: UserSnapshot | null;
  proposedAt?: string | null;
  decisionBy?: UserSnapshot | null;
  decisionAt?: string | null;
  rejectReason?: string | null;
  changedBy?: UserSnapshot | null;
  changedAt?: string | null;
}

export interface ReservationAmenityResponse {
  facilityAmenityOfferingId: string;
  amenityId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  billingUnit: BillingUnitEnum | "day" | "month" | "one_time";
  totalPrice: number;
}

export interface ReservationPolicySnapshotResponse {
  freeCancelHours: number;
  forfeitPercent: number;
  noShowGraceHours: number;
  cancellationMode?: "slot_start" | "calendar_day" | null;
}

export interface ReservationResponse {
  id: string;
  reservationCode: string;
  customerId: string;
  facilityId: string;
  facilityUnitTypeOfferingId: string;
  storageUnitId?: string | null;
  startDate: string;
  checkInDate: string;
  checkInTimeSlot: string;
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
  confirmedBy?: UserSnapshot | null;
  confirmedAt?: string | null;
  assignedStaffId?: string | null;
  assignedStaff?: UserSnapshot | null;
  assignedStaffAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: UserSnapshot | null;
  cancelledAt?: string | null;
  cancellationSource?:
    ReservationCancelSourceEnum | "customer" | "facility" | "system" | "facility_fault" | null;
  incidentId?: string | null;
  evidenceImages: string[];
  forceCancelledBy?: UserSnapshot | null;
  forceCancelledAt?: string | null;
  arrivedAt?: string | null;
  arrivedBy?: UserSnapshot | null;
  graceExtendedAt?: string | null;
  graceExtendedBy?: UserSnapshot | null;
  graceExtensionReason?: string | null;
  gracePeriodExtendedHours?: number | null;
  extendedUntil?: string | null;
  refundAmount: number;
  forfeitedAmount: number;
  refundStatus: RefundStatusEnum | "none" | "pending" | "refunded";
  refundedAt?: string | null;
  refundedBy?: UserSnapshot | null;
  refundReference?: string | null;
  refundNote?: string | null;
  paidAt?: string | null;
  paidAmount?: number | null;
  paymentId?: string | null;
  termsAccepted: boolean;
  policyVersion?: string | null;
  acceptedAt?: string | null;
  policySnapshot?: ReservationPolicySnapshotResponse | null;
  immediateForfeitWarning?: boolean | null;
  earlyCheckIn?: boolean | null;
  outOfSlot?: boolean | null;
  pendingUnitChange?: ReservationPendingUnitChangeResponse | null;
  unitChangeHistory: ReservationUnitChangeResponse[];
  notes?: string | null;
  customer?: UserSnapshot | null;
  facility?: FacilitySnapshot | null;
  offering?: OfferingSnapshot | null;
  storageUnit?: StorageUnitSnapshot | null;
  rentalTargetType?: RentalTargetTypeEnum | "storage_unit" | "storage_rack" | null;
  rentedRackIds?: string[] | null;
  rentedRacks?: StorageRackResponse[] | null;
  createdAt: string;
  updatedAt: string;

  // Compatibility fields
  receivedBy?: UserSnapshot | null;
  receivedAt?: string | null;
  assignedBy?: UserSnapshot | null;
  assignedAt?: string | null;
  rejectionReason?: string | null;
  lastPaymentError?: string | null;
}

export type ReservationListResponse = ReservationResponse[];

export interface AvailableTimeSlotItemResponse {
  id: string;
  facilityId: string;
  slotName: string;
  startTime: string; // VD: "08:00"
  endTime: string; // VD: "10:00"
  maxCapacity: number;
  bookedCount: number;
  availableCapacity: number; // Sức chứa còn lại
  remainingCapacity?: number; // Alias tương thích
  isAvailable: boolean;
}
