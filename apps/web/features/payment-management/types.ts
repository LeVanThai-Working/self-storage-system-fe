import {
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  PaymentTransactionResultEnum,
  type AssignUnmatchedTransactionRequest,
  type CancelPaymentRequest,
  type ConfirmManualPaymentRequest,
  type CreatePaymentRequest,
  type PaymentPaginatedData,
  type PaymentQuery,
  type PaymentResponse,
  type PaymentTransactionPaginatedData,
  type PaymentTransactionResponse,
  type UnmatchedTransactionQuery,
} from "@self-storage-system-fe/shared";

export {
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  PaymentTransactionResultEnum,
  type AssignUnmatchedTransactionRequest,
  type CancelPaymentRequest,
  type ConfirmManualPaymentRequest,
  type CreatePaymentRequest,
  type PaymentPaginatedData,
  type PaymentQuery,
  type PaymentResponse,
  type PaymentTransactionPaginatedData,
  type PaymentTransactionResponse,
  type UnmatchedTransactionQuery,
};

export interface PaymentFilterState {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: PaymentStatusEnum;
  purpose?: PaymentPurposeEnum;
  facilityId?: string;
  customerId?: string;
  contractId?: string;
  reservationId?: string;
  paymentCode?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface UnmatchedTransactionFilterState {
  page: number;
  limit: number;
  result?: PaymentTransactionResultEnum;
  gateway?: string;
  accountNumber?: string;
  code?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
