import type { BillingUnitEnum } from "../enums/billing.enum";
import type {
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractCancellationTypeEnum,
  ContractDepositStatusEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  ContractTerminationTypeEnum,
  RentalUnitEnum,
  ViolationCategoryEnum,
} from "../enums/contract.enum";
import type { RoleEnum, UserStatusEnum } from "../enums/user.enum";
import type { StorageUnitStatusEnum } from "../enums/storageUnit.enum";
import type { RentalTargetTypeEnum } from "../enums/rental.enum";
import type { OfferingSnapshot, StorageUnitSnapshot, UserSnapshot } from "./common.types";
import type { StorageRackResponse } from "./storageRack.types";
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
  billingUnit: BillingUnitEnum | "day" | "month";
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

export interface ContractSignatureHistoryResponse {
  party: "customer" | "staff";
  signedAt: string;
  previousStartDate: string;
  previousEndDate: string;
  resetAt: string;
  resetReason: string;
}

export interface ContractTerminationFileResponse {
  url: string;
  fileHash?: string | null;
  uploadedAt: string;
}

export interface ContractTerminationHistoryResponse {
  terminationType: ContractTerminationTypeEnum;
  violationCategory?: ViolationCategoryEnum | null;
  reason: string;
  reportFiles: ContractTerminationFileResponse[];
  evidenceFiles: ContractTerminationFileResponse[];
  terminatedBy?: UserSnapshot | null;
  terminatedAt: string;
  storageUnitStatus: StorageUnitStatusEnum | string;
  depositStatus: ContractDepositStatusEnum | string;
  forfeitedAmount: number;
}

export interface ContractAddendumResponse {
  id: string;
  addendumCode: string;
  type: ContractAddendumTypeEnum;
  previousEndDate?: string | null;
  newEndDate?: string | null;
  previousStorageUnitId?: string | null;
  previousStorageUnit?: StorageUnitSnapshot | null;
  newStorageUnitId?: string | null;
  newStorageUnit?: StorageUnitSnapshot | null;
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
  rentalTargetType?: RentalTargetTypeEnum | "storage_unit" | "storage_rack" | null;
  rentedRackIds?: string[] | null;
  rentedRacks?: StorageRackResponse[] | null;
  assignedStaffId?: string | null;
  assignedStaff?: UserSnapshot | null;
  billingUnit: BillingUnitEnum | "day" | "month";
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
  firstPeriodPaidAt?: string | null;
  firstPeriodPaymentId?: string | null;
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
  signedContractFileUrls?: string[];
  signatureHistory?: ContractSignatureHistoryResponse[];
  earlyCheckIn?: boolean | null;
  outOfSlot?: boolean | null;
  renewals: ContractRenewalItemResponse[];
  renewalCount?: number;
  inspectedBy?: UserSnapshot | null;
  damageFee: number;
  overdueFee: number;
  refundAmount: number;
  forfeitedAmount?: number;
  additionalPaymentRequired: number;
  inspectionNotes?: string | null;
  inspectionPhotos?: string[];
  depositStatus?: ContractDepositStatusEnum | null;
  settlementConfirmedAt?: string | null;
  disputedAt?: string | null;
  disputeReason?: string | null;
  cancellationType?: ContractCancellationTypeEnum | null;
  cancellationReason?: string | null;
  cancelledBy?: UserSnapshot | null;
  cancelledAt?: string | null;
  terminationType?: ContractTerminationTypeEnum | null;
  violationCategory?: ViolationCategoryEnum | null;
  terminationReason?: string | null;
  terminatedBy?: UserSnapshot | null;
  terminatedAt?: string | null;
  reportFiles?: ContractTerminationFileResponse[];
  evidenceFiles?: ContractTerminationFileResponse[];
  terminationHistory?: ContractTerminationHistoryResponse[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ContractListResponse = ContractResponse[];
export type { DisputeSettlementRequest } from "../schemas/request/contract.request.schema";
