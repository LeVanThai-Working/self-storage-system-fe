import {
  BillingUnitEnum,
  MESSAGE_CODE,
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  ReservationStatusEnum,
  StorageUnitStatusEnum,
  assignStorageUnitSchema,
  cancelReservationSchema,
  confirmManualPaymentSchema,
  confirmReservationSchema,
  rejectReservationSchema,
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
  ReservationStatusEnum,
  StorageUnitStatusEnum,
  assignStorageUnitSchema,
  cancelReservationSchema,
  confirmManualPaymentSchema,
  confirmReservationSchema,
  rejectReservationSchema,
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

export type ReservationSortBy = "createdAt" | "startDate" | "totalAmount" | "updatedAt";

export interface ManagerReservationFilterParams {
  facilityId: string;
  page?: number;
  limit?: number;
  status?: ReservationStatusEnum;
  reservationCode?: string;
  facilityUnitTypeOfferingId?: string;
  /** ISO 8601 string */
  startDateFrom?: string;
  /** ISO 8601 string */
  startDateTo?: string;
  sortBy?: ReservationSortBy;
  sortOrder?: "asc" | "desc";
}
