import {
  BillingUnitEnum,
  IncidentCategoryEnum,
  MESSAGE_CODE,
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  RefundStatusEnum,
  ReservationCancelSourceEnum,
  ReservationStatusEnum,
  StorageUnitStatusEnum,
  assignReservationStaffSchema,
  cancelReservationSchema,
  confirmManualPaymentSchema,
  confirmRefundSchema,
  confirmReservationSchema,
  createReservationSchema,
  extendGracePeriodSchema,
  forceCancelReservationSchema,
  markCustomerArrivedSchema,
  reassignStorageUnitSchema,
  respondUnitReassignSchema,
  type AssignReservationStaffRequest,
  type AvailableStorageUnitQuery,
  type BankInfoResponse,
  type CancelReservationRequest,
  type ConfirmManualPaymentRequest,
  type ConfirmRefundRequest,
  type ConfirmReservationRequest,
  type CreatePaymentRequest,
  type CreateReservationRequest,
  type ExtendGracePeriodRequest,
  type FacilityUnitTypeOfferingResponse,
  type ForceCancelReservationRequest,
  type MarkCustomerArrivedRequest,
  type PaginatedData,
  type PaymentListResponse,
  type PaymentResponse,
  type ReassignStorageUnitRequest,
  type ReservationAmenityResponse,
  type ReservationListResponse,
  type ReservationPendingUnitChangeResponse,
  type ReservationPolicySnapshotResponse,
  type ReservationResponse,
  type ReservationStorageUnitSnapshot,
  type ReservationUnitChangeResponse,
  type RespondUnitReassignRequest,
  type StorageUnitListResponse,
  type StorageUnitResponse,
  // Legacy
  assignStorageUnitSchema,
  rejectReservationSchema,
  type AssignStorageUnitRequest,
  type RejectReservationRequest,
} from "@self-storage-system-fe/shared";

export type ReservationPaginatedResponse = PaginatedData<ReservationResponse>;
export type PaymentPaginatedResponse = PaginatedData<PaymentResponse>;

export {
  BillingUnitEnum,
  IncidentCategoryEnum,
  MESSAGE_CODE,
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  RefundStatusEnum,
  ReservationCancelSourceEnum,
  ReservationStatusEnum,
  StorageUnitStatusEnum,
  assignReservationStaffSchema,
  cancelReservationSchema,
  confirmManualPaymentSchema,
  confirmRefundSchema,
  confirmReservationSchema,
  createReservationSchema,
  extendGracePeriodSchema,
  forceCancelReservationSchema,
  markCustomerArrivedSchema,
  reassignStorageUnitSchema,
  respondUnitReassignSchema,
  type AssignReservationStaffRequest,
  type AvailableStorageUnitQuery,
  type BankInfoResponse,
  type CancelReservationRequest,
  type ConfirmManualPaymentRequest,
  type ConfirmRefundRequest,
  type ConfirmReservationRequest,
  type CreatePaymentRequest,
  type CreateReservationRequest,
  type ExtendGracePeriodRequest,
  type FacilityUnitTypeOfferingResponse,
  type ForceCancelReservationRequest,
  type MarkCustomerArrivedRequest,
  type PaginatedData,
  type PaymentListResponse,
  type PaymentResponse,
  type ReassignStorageUnitRequest,
  type ReservationAmenityResponse,
  type ReservationListResponse,
  type ReservationPendingUnitChangeResponse,
  type ReservationPolicySnapshotResponse,
  type ReservationResponse,
  type ReservationStorageUnitSnapshot,
  type ReservationUnitChangeResponse,
  type RespondUnitReassignRequest,
  type StorageUnitListResponse,
  type StorageUnitResponse,
  // Legacy
  assignStorageUnitSchema,
  rejectReservationSchema,
  type AssignStorageUnitRequest,
  type RejectReservationRequest,
};

export type ManagerReservationQuickTab =
  | "ALL"
  | "PENDING_PAYMENT"
  | "PAYMENT_SUCCESSFUL"
  | "CONFIRMED"
  | "OVERDUE"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  // Legacy support
  | "PENDING"
  | "RECEIVED"
  | "AWAITING_DEPOSIT"
  | "CLOSED";

export type ReservationSortBy =
  "createdAt" | "startDate" | "checkInDate" | "totalAmount" | "updatedAt";

export interface ManagerReservationFilterParams {
  facilityId?: string;
  page?: number;
  limit?: number;
  status?: ReservationStatusEnum;
  refundStatus?: RefundStatusEnum;
  reservationCode?: string;
  facilityUnitTypeOfferingId?: string;
  storageUnitId?: string;
  customerId?: string;
  /** ISO 8601 string */
  startDateFrom?: string;
  /** ISO 8601 string */
  startDateTo?: string;
  /** ISO 8601 string */
  checkInDateFrom?: string;
  /** ISO 8601 string */
  checkInDateTo?: string;
  sortBy?: ReservationSortBy;
  sortOrder?: "asc" | "desc";
}
