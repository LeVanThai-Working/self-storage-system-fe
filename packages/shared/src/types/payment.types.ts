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
  bankInfo?: BankInfoResponse | null;
  expiresAt?: string | null;
  paidAt?: string | null;
  sepayTransactionId?: number | null;
  referenceCode?: string | null;
  confirmedBy?: ReservationUserSnapshot | null;
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
