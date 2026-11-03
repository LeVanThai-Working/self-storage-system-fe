import type {
  InvoiceItemTypeEnum,
  InvoiceStatusEnum,
  InvoiceTypeEnum,
} from "../enums/billing.enum";
import type { PaymentMethodEnum } from "../enums/payment.enum";
import type { EntitySummary, PaginatedData } from "./common.types";

export interface InvoiceItemResponse {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  itemType: InvoiceItemTypeEnum;
}

export interface InvoiceResponse {
  id: string;
  invoiceCode: string;
  contractId: string;
  customerId: string;
  facilityId: string;
  facility?: EntitySummary | null;
  customer?: EntitySummary | null;
  contract?: EntitySummary | null;
  type: InvoiceTypeEnum;
  status: InvoiceStatusEnum;
  billingPeriodIndex: number;
  periodStartDate: string; // ISO 8601
  periodEndDate: string; // ISO 8601
  dueDate: string; // ISO 8601
  items: InvoiceItemResponse[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paidAt?: string | null;
  paymentId?: string | null;
  paymentMethod?: PaymentMethodEnum | null;
  notes?: string | null;
  issuedAt?: string | null;
  createdBy?: EntitySummary | null;
  confirmedBy?: EntitySummary | null;
  confirmedAt?: string | null;
  proofImageUrl?: string | null;
  cancelledBy?: EntitySummary | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePdfResponse {
  html: string;
  invoiceCode: string;
}

export interface RecurringInvoiceScanResult {
  scannedCount: number;
  generatedCount: number;
  skippedCount: number;
  failedCount: number;
}

export interface OverdueInvoiceScanResult {
  scannedCount: number;
  markedOverdueCount: number;
  contractsLockedCount: number;
  skippedCount: number;
  failedCount: number;
}

export interface RemindInvoicesScanResult {
  scannedCount: number;
  remindedT3Count: number;
  remindedT1Count: number;
  remindedT0Count: number;
  totalRemindedCount: number;
  skippedCount: number;
  failedCount: number;
}

export type InvoicePaginatedData = PaginatedData<InvoiceResponse>;
export type InvoiceListResponse = PaginatedData<InvoiceResponse>;
