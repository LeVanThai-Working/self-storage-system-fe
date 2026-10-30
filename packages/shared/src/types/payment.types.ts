import type {
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  PaymentTransactionResultEnum,
} from "../enums/payment.enum";
import type { PaginatedData, UserSnapshot } from "./common.types";
import type { FacilitySnapshot } from "./facility.types";

export interface BankInfo {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

// Aliases for compatibility
export type BankInfoResponse = BankInfo;
export interface BankAccountResponse {
  bankName?: string;
  bankCode?: string;
  accountNumber: string;
  accountHolder?: string;
  accountName?: string;
}

export interface PaymentResponse {
  id: string;
  paymentCode: string;
  purpose: PaymentPurposeEnum;
  reservationId?: string | null;
  contractId?: string | null;
  customerId: string;
  facilityId: string;
  amount: number;
  paidAmount: number;
  overpaidAmount: number;
  method: PaymentMethodEnum;
  status: PaymentStatusEnum;
  qrUrl?: string | null;
  bankInfo?: BankInfo | null;
  bankAccount?: BankAccountResponse | null;
  currency?: string;
  expiresAt?: string | null;
  expiredAt?: string | null;
  paidAt?: string | null;
  sepayTransactionId?: number | string | null;
  referenceCode?: string | null;
  confirmedBy?: UserSnapshot | string | null;
  confirmedAt?: string | null;
  proofImageUrl?: string | null;
  cancelledBy?: UserSnapshot | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  note?: string | null;
  customer?: UserSnapshot | null;
  facility?: FacilitySnapshot | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransactionResponse {
  id: string;
  sepayId: number;
  gateway?: string | null;
  transactionDate?: string | null;
  accountNumber?: string | null;
  subAccount?: string | null;
  code?: string | null;
  content?: string | null;
  transferType?: string | null;
  transferAmount?: number | null;
  accumulated?: number | null;
  referenceCode?: string | null;
  description?: string | null;
  matchedPaymentId?: string | null;
  result: PaymentTransactionResultEnum;
  createdAt: string;
  updatedAt: string;
}

export type PaymentListResponse = PaymentResponse[];
export type PaymentPaginatedData = PaginatedData<PaymentResponse>;
export type PaymentPaginatedResponse = PaginatedData<PaymentResponse>;
export type PaymentTransactionPaginatedData = PaginatedData<PaymentTransactionResponse>;
