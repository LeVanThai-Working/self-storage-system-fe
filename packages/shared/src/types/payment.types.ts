import type {
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
} from "../enums/payment.enum";
import type { ReservationFacilitySnapshot, ReservationUserSnapshot } from "./reservation.types";

export interface BankInfoResponse {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface BankAccountResponse {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
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
  currency?: string;
  paidAmount: number;
  overpaidAmount: number;
  method: PaymentMethodEnum;
  status: PaymentStatusEnum;
  qrUrl?: string | null;
  bankInfo?: BankInfoResponse | null;
  bankAccount?: BankAccountResponse | null;
  expiresAt?: string | null;
  expiredAt?: string | null;
  paidAt?: string | null;
  sepayTransactionId?: string | number | null;
  referenceCode?: string | null;
  confirmedBy?: ReservationUserSnapshot | string | null;
  confirmedAt?: string | null;
  cancelledBy?: ReservationUserSnapshot | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  note?: string | null;
  customer?: ReservationUserSnapshot | null;
  facility?: ReservationFacilitySnapshot | null;
  createdAt: string;
  updatedAt: string;
}

export type PaymentListResponse = PaymentResponse[];
