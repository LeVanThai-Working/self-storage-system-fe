import type { BillingUnitEnum } from "../enums/billing.enum";
import type {
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  RentalUnitEnum,
} from "../enums/contract.enum";
import type { RoleEnum, UserStatusEnum } from "../enums/user.enum";
import type { OfferingSnapshot, StorageUnitSnapshot, UserSnapshot } from "./common.types";
import type { FacilitySnapshot } from "./facility.types";

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

export type ContractUserSnapshot = UserSnapshot;
export type ContractFacilitySnapshot = FacilitySnapshot;
export type ContractOfferingSnapshot = OfferingSnapshot;
export type ContractStorageUnitSnapshot = StorageUnitSnapshot;

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
  renewedBy?: UserSnapshot | null;
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
  requestedBy?: UserSnapshot | null;
  requestedAt: string;
  approvedBy?: UserSnapshot | null;
  approvedAt?: string | null;
  assignedStaffId?: string | null;
  assignedStaff?: UserSnapshot | null;
  customerSigned: boolean;
  customerSignedAt?: string | null;
  staffSigned: boolean;
  staffSignedAt?: string | null;
  completedAt?: string | null;
  rejectionReason?: string | null;
  rejectedBy?: UserSnapshot | null;
  rejectedAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: UserSnapshot | null;
  cancelledAt?: string | null;
  notes?: string | null;
}

export interface ContractResponse {
  id: string;
  contractCode: string;
  source: ContractSourceEnum;
  reservationId?: string | null;
  customerId: string;
  customer?: UserSnapshot | null;
  facilityId: string;
  facility?: FacilitySnapshot | null;
  facilityUnitTypeOfferingId: string;
  facilityUnitTypeOffering?: OfferingSnapshot | null;
  offering?: OfferingSnapshot | null;
  storageUnitId: string;
  storageUnit?: StorageUnitSnapshot | null;
  assignedStaffId?: string | null;
  assignedStaff?: UserSnapshot | null;
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
  inspectedBy?: UserSnapshot | null;
  damageFee: number;
  overdueFee: number;
  refundAmount: number;
  additionalPaymentRequired: number;
  inspectionNotes?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: UserSnapshot | null;
  cancelledAt?: string | null;
  terminationReason?: string | null;
  terminatedBy?: UserSnapshot | null;
  terminatedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ContractListResponse = ContractResponse[];
