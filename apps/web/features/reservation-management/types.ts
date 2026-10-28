import {
  BillingUnitEnum,
  MESSAGE_CODE,
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  RefundStatusEnum,
  ReservationStatusEnum,
  StorageUnitStatusEnum,
  assignReservationStaffSchema,
  assignStorageUnitSchema,
  cancelReservationSchema,
  confirmManualPaymentSchema,
  confirmReservationSchema,
  rejectReservationSchema,
  type AssignReservationStaffRequest,
  type AssignStorageUnitRequest,
  type AvailableStorageUnitQuery,
  type BankInfoResponse,
  type CancelReservationRequest,
  type ConfirmManualPaymentRequest,
  type ConfirmReservationRequest,
  type CreatePaymentRequest,
  type FacilityUnitTypeOfferingResponse,
  type PaginatedData,
  type PaymentListResponse,
  type PaymentResponse,
  type RejectReservationRequest,
  type ReservationAmenityResponse,
  type ReservationListResponse,
  type ReservationResponse,
  type ReservationStorageUnitSnapshot,
  type StorageUnitListResponse,
  type StorageUnitResponse,
} from "@self-storage-system-fe/shared";

export type ReservationPaginatedResponse = PaginatedData<ReservationResponse>;
export type PaymentPaginatedResponse = PaginatedData<PaymentResponse>;

export {
  BillingUnitEnum,
  MESSAGE_CODE,
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  RefundStatusEnum,
  ReservationStatusEnum,
  StorageUnitStatusEnum,
  assignReservationStaffSchema,
  assignStorageUnitSchema,
  cancelReservationSchema,
  confirmManualPaymentSchema,
  confirmReservationSchema,
  rejectReservationSchema,
  type AssignReservationStaffRequest,
  type AssignStorageUnitRequest,
  type AvailableStorageUnitQuery,
  type BankInfoResponse,
  type CancelReservationRequest,
  type ConfirmManualPaymentRequest,
  type ConfirmReservationRequest,
  type CreatePaymentRequest,
  type FacilityUnitTypeOfferingResponse,
  type PaginatedData,
  type PaymentListResponse,
  type PaymentResponse,
  type RejectReservationRequest,
  type ReservationAmenityResponse,
  type ReservationListResponse,
  type ReservationResponse,
  type ReservationStorageUnitSnapshot,
  type StorageUnitListResponse,
  type StorageUnitResponse,
};

export type ManagerReservationQuickTab =
  | "ALL"
  | "PENDING"
  | "RECEIVED"
  | "AWAITING_DEPOSIT"
  | "PAYMENT_SUCCESSFUL"
  | "CONFIRMED"
  | "CLOSED";

export type ReservationSortBy =
  "createdAt" | "startDate" | "checkInDate" | "totalAmount" | "updatedAt";

export interface ManagerReservationFilterParams {
  facilityId: string;
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
