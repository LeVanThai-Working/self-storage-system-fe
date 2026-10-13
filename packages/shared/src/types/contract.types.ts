import type { BillingUnitEnum } from "../enums/billing.enum";
import type {
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  RentalUnitEnum,
} from "../enums/contract.enum";
import type { RoleEnum, UserStatusEnum } from "../enums/user.enum";

export interface FacilityStaffItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  phoneNumber?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  address?: string | null;
  role: RoleEnum;
  facilityId?: string | null;
  status: UserStatusEnum;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityStaffQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatusEnum;
  sortBy?: "name" | "email" | "status" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ContractUserSnapshot {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role?: string | null;
}

export type UserSnapshot = ContractUserSnapshot;

export interface ContractFacilitySnapshot {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
}

export interface ContractOfferingSnapshot {
  id: string;
  unitTypeId: string;
  billingUnit: string;
  pricePerUnit: number;
  depositMultiplier?: number | null;
  minRentalDays?: number | null;
  status?: string | null;
}

export type OfferingSnapshot = ContractOfferingSnapshot;

export interface ContractStorageUnitSnapshot {
  id: string;
  unitNumber: string;
  floor: number;
  zone?: string | null;
  status: string;
}

export type StorageUnitSnapshot = ContractStorageUnitSnapshot;

export interface ContractAmenityItemResponse {
  facilityAmenityOfferingId: string;
  amenityId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  billingUnit: BillingUnitEnum;
  totalPrice: number;
  addedAt: string;
}

export type ContractAmenityResponse = ContractAmenityItemResponse;

export interface ContractRenewalItemResponse {
  previousEndDate: string;
  newEndDate: string;
  renewedAt: string;
  renewedBy?: ContractUserSnapshot | null;
  note?: string | null;
  additionalDuration?: number;
  billingUnit?: BillingUnitEnum | RentalUnitEnum;
  additionalAmount?: number;
  paymentId?: string | null;
}

export type ContractRenewalResponse = ContractRenewalItemResponse;

export interface ContractAddendumResponse {
  id: string;
  addendumCode: string;
  type: ContractAddendumTypeEnum;
  amenities: ContractAmenityItemResponse[];
  totalPeriodicPrice: number;
  damageFee: number;
  status: ContractAddendumStatusEnum;
  requestedBy?: ContractUserSnapshot | null;
  requestedAt: string;
  approvedBy?: ContractUserSnapshot | null;
  approvedAt?: string | null;
  assignedStaffId?: string | null;
  assignedStaff?: ContractUserSnapshot | null;
  customerSigned: boolean;
  customerSignedAt?: string | null;
  staffSigned: boolean;
  staffSignedAt?: string | null;
  completedAt?: string | null;
  rejectionReason?: string | null;
  rejectedBy?: ContractUserSnapshot | null;
  rejectedAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: ContractUserSnapshot | null;
  cancelledAt?: string | null;
  notes?: string | null;
}

export interface ContractResponse {
  id: string;
  contractCode: string;
  source: ContractSourceEnum;
  reservationId?: string | null;
  customerId: string;
  customer?: ContractUserSnapshot | null;
  facilityId: string;
  facility?: ContractFacilitySnapshot | null;
  facilityUnitTypeOfferingId: string;
  facilityUnitTypeOffering?: ContractOfferingSnapshot | null;
  offering?: ContractOfferingSnapshot | null;
  storageUnitId: string;
  storageUnit?: ContractStorageUnitSnapshot | null;
  assignedStaffId: string;
  assignedStaff?: ContractUserSnapshot | null;
  billingUnit: BillingUnitEnum;
  startDate: string;
  endDate: string;
  actualCheckInDate?: string | null;
  actualCheckOutDate?: string | null;
  rentalPrice: number;
  amenities: ContractAmenityItemResponse[];
  amenitiesTotalPrice?: number;
  addendums: ContractAddendumResponse[];
  totalPeriodicPrice: number;
  depositAmount: number;
  depositPaidAt?: string | null;
  depositPaymentId?: string | null;
  firstCyclePaidAt?: string | null;
  firstCyclePaymentId?: string | null;
  nextBillingDate?: string | null;
  status: ContractStatusEnum;
  termsAccepted: boolean;
  termsAcceptedAt?: string | null;
  customerSigned: boolean;
  customerSignedAt?: string | null;
  staffSigned: boolean;
  staffSignedAt?: string | null;
  signedAt?: string | null;
  renewals: ContractRenewalItemResponse[];
  renewalCount?: number;
  inspectedBy?: ContractUserSnapshot | null;
  damageFee: number;
  overdueFee: number;
  refundAmount: number;
  additionalPaymentRequired: number;
  inspectionNotes?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: ContractUserSnapshot | null;
  cancelledAt?: string | null;
  terminationReason?: string | null;
  terminatedBy?: ContractUserSnapshot | null;
  terminatedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ContractListResponse = ContractResponse[];
