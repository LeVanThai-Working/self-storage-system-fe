import type { ReservationStatusEnum } from "../enums/reservation.enum";
import type { BillingUnitEnum } from "../enums/billing.enum";

export interface ReservationUserSnapshot {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role?: string | null;
}

export interface ReservationFacilitySnapshot {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
}

export interface ReservationOfferingSnapshot {
  id: string;
  unitTypeId?: string | null;
  billingUnit: string;
  pricePerUnit: number;
  depositMultiplier?: number | null;
  minRentalDays?: number | null;
  status?: string | null;
}

export interface ReservationStorageUnitSnapshot {
  id: string;
  unitNumber: string;
  floor: number;
  zone?: string | null;
  status: string;
}

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
  rentalDuration: number;
  billingUnit: BillingUnitEnum;
  basePrice: number;
  depositAmount: number;
  amenities: ReservationAmenityResponse[];
  totalAmount: number;
  status: ReservationStatusEnum;
  expiresAt?: string | null;
  receivedBy?: ReservationUserSnapshot | null;
  receivedAt?: string | null;
  assignedBy?: ReservationUserSnapshot | null;
  assignedAt?: string | null;
  confirmedBy?: ReservationUserSnapshot | null;
  confirmedAt?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: ReservationUserSnapshot | null;
  cancelledAt?: string | null;
  refundAmount: number;
  paidAt?: string | null;
  paidAmount?: number | null;
  paymentId?: string | null;
  lastPaymentError?: string | null;
  notes?: string | null;
  customer?: ReservationUserSnapshot | null;
  facility?: ReservationFacilitySnapshot | null;
  offering?: ReservationOfferingSnapshot | null;
  storageUnit?: ReservationStorageUnitSnapshot | null;
  createdAt: string;
  updatedAt: string;
}

export type ReservationListResponse = ReservationResponse[];
