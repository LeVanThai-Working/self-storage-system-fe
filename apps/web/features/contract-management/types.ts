import {
  BillingUnitEnum,
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractCancellationTypeEnum,
  ContractDepositStatusEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  ContractTerminationTypeEnum,
  MESSAGE_CODE,
  OVERDUE_PENALTY_MULTIPLIER,
  OVERDUE_TERMINATION_GRACE_DAYS,
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  RentalUnitEnum,
  ReservationStatusEnum,
  RoleEnum,
  STANDARD_DAYS_PER_MONTH,
  StorageUnitStatusEnum,
  UserStatusEnum,
  ViolationCategoryEnum,
  approveContractAddendumSchema,
  cancelContractAddendumSchema,
  cancelContractSchema,
  cancelDraftContractSchema,
  checkInContractSchema,
  checkOutContractSchema,
  confirmManualPaymentSchema,
  contractAddendumParamSchema,
  contractQuerySchema,
  createContractAddendumSchema,
  createContractSchema,
  customerSignContractSchema,
  disputeSettlementSchema,
  rejectContractAddendumSchema,
  renewContractSchema,
  signContractAddendumSchema,
  terminateContractSchema,
  toggleMaintenanceSchema,
  type ApproveContractAddendumRequest,
  type AvailableStorageUnitQuery,
  type CancelContractAddendumRequest,
  type CancelContractRequest,
  type CancelDraftContractRequest,
  type CheckInContractRequest,
  type CheckOutContractRequest,
  type CloudinarySignatureResponse,
  type ConfirmManualPaymentRequest,
  type ContractAddendumParam,
  type ContractAddendumResponse,
  type ContractAmenityItemResponse,
  type ContractAmenityResponse,
  type ContractListResponse,
  type ContractQuery,
  type ContractRenewalItemResponse,
  type ContractRenewalResponse,
  type ContractResponse,
  type ContractSignatureHistoryResponse,
  type ContractTerminationFileResponse,
  type ContractTerminationHistoryResponse,
  type CreateContractAddendumRequest,
  type CreateContractRequest,
  type CreatePaymentRequest,
  type CustomerSignContractRequest,
  type DisputeSettlementRequest,
  type FacilityAmenityOfferingResponse,
  type FacilityStaffItem,
  type PaginatedData,
  type PaginatedResponse,
  type PaginationMeta,
  type PaymentResponse,
  type RejectContractAddendumRequest,
  type RenewContractRequest,
  type ReservationResponse,
  type SignContractAddendumRequest,
  type StorageUnitListResponse,
  type StorageUnitResponse,
  type StorageUnitSnapshot,
  type TerminateContractRequest,
  type ToggleMaintenanceRequest,
  type UserSnapshot,
} from "@self-storage-system-fe/shared";

export type ContractPaginatedData = PaginatedData<ContractResponse>;
export type FacilityStaffPaginatedData = PaginatedData<FacilityStaffItem>;
export type PaymentPaginatedData = PaginatedData<PaymentResponse>;

export {
  BillingUnitEnum,
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractCancellationTypeEnum,
  ContractDepositStatusEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  ContractTerminationTypeEnum,
  MESSAGE_CODE,
  OVERDUE_PENALTY_MULTIPLIER,
  OVERDUE_TERMINATION_GRACE_DAYS,
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  RentalUnitEnum,
  ReservationStatusEnum,
  RoleEnum,
  STANDARD_DAYS_PER_MONTH,
  StorageUnitStatusEnum,
  UserStatusEnum,
  ViolationCategoryEnum,
  approveContractAddendumSchema,
  cancelContractAddendumSchema,
  cancelContractSchema,
  cancelDraftContractSchema,
  checkInContractSchema,
  checkOutContractSchema,
  confirmManualPaymentSchema,
  contractAddendumParamSchema,
  contractQuerySchema,
  createContractAddendumSchema,
  createContractSchema,
  customerSignContractSchema,
  disputeSettlementSchema,
  rejectContractAddendumSchema,
  renewContractSchema,
  signContractAddendumSchema,
  terminateContractSchema,
  toggleMaintenanceSchema,
  type ApproveContractAddendumRequest,
  type AvailableStorageUnitQuery,
  type CancelContractAddendumRequest,
  type CancelContractRequest,
  type CancelDraftContractRequest,
  type CheckInContractRequest,
  type CheckOutContractRequest,
  type CloudinarySignatureResponse,
  type ConfirmManualPaymentRequest,
  type ContractAddendumParam,
  type ContractAddendumResponse,
  type ContractAmenityItemResponse,
  type ContractAmenityResponse,
  type ContractListResponse,
  type ContractQuery,
  type ContractRenewalItemResponse,
  type ContractRenewalResponse,
  type ContractResponse,
  type ContractSignatureHistoryResponse,
  type ContractTerminationFileResponse,
  type ContractTerminationHistoryResponse,
  type CreateContractAddendumRequest,
  type CreateContractRequest,
  type CreatePaymentRequest,
  type CustomerSignContractRequest,
  type DisputeSettlementRequest,
  type FacilityAmenityOfferingResponse,
  type FacilityStaffItem,
  type PaginatedData,
  type PaginatedResponse,
  type PaginationMeta,
  type PaymentResponse,
  type RejectContractAddendumRequest,
  type RenewContractRequest,
  type ReservationResponse,
  type SignContractAddendumRequest,
  type StorageUnitListResponse,
  type StorageUnitResponse,
  type StorageUnitSnapshot,
  type TerminateContractRequest,
  type ToggleMaintenanceRequest,
  type UserSnapshot,
};

export type ContractFilterStatus = ContractStatusEnum | "all";
export type ContractQuickFilterTab =
  "ALL" | "DRAFT" | "ACTIVE" | "OVERDUE" | "COMPLETED" | "TERMINATED" | "CANCELLED";

export type ContractQuickStatusTab = "all" | ContractStatusEnum;
export type ContractScopeTab = "ALL" | "ASSIGNED_TO_ME";
export type ContractSortBy = "createdAt" | "startDate" | "endDate" | "contractCode" | "updatedAt";

export interface FacilityStaffQuery {
  page?: number;
  limit?: number;
  status?: UserStatusEnum;
  role?: RoleEnum;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ContractFilterParams {
  page?: number;
  limit?: number;
  customerId?: string;
  facilityId?: string;
  storageUnitId?: string;
  facilityUnitTypeOfferingId?: string;
  assignedStaffId?: string;
  status?: ContractStatusEnum;
  source?: ContractSourceEnum;
  contractCode?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  sortBy?: ContractSortBy | string;
  sortOrder?: "asc" | "desc";
}
