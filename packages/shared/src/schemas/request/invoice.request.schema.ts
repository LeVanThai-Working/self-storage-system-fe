import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";
import { InvoiceStatusEnum, InvoiceTypeEnum, InvoiceItemTypeEnum } from "../../enums/billing.enum";
import { PaymentMethodEnum } from "../../enums/payment.enum";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const dateOrDatetimeRegex =
  /^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:?\d{2})?)?)$/;

export const invoiceIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid invoice ID format"),
});

export const invoiceItemInputSchema = z.object({
  name: z.string().min(1, "Item name is required").max(200),
  description: z.string().max(500).optional().nullable(),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  unitPrice: z
    .number()
    .int("Unit price must be an integer")
    .min(0, "Unit price must be non-negative"),
  amount: z
    .number()
    .int("Amount must be an integer")
    .min(0, "Amount must be non-negative")
    .optional(),
  itemType: z.nativeEnum(InvoiceItemTypeEnum),
});

export const createManualInvoiceSchema = z.object({
  contractId: z.string().regex(objectIdRegex, "Invalid contract ID format"),
  periodStartDate: z.string().regex(dateOrDatetimeRegex, "Invalid period start date format"),
  periodEndDate: z.string().regex(dateOrDatetimeRegex, "Invalid period end date format"),
  dueDate: z.string().regex(dateOrDatetimeRegex, "Invalid due date format"),
  items: z.array(invoiceItemInputSchema).min(1, "Invoice must have at least one item"),
  discountAmount: z
    .number()
    .int("Discount amount must be an integer")
    .min(0, "Discount amount must be non-negative")
    .default(0),
  taxAmount: z
    .number()
    .int("Tax amount must be an integer")
    .min(0, "Tax amount must be non-negative")
    .default(0),
  notes: z.string().max(1000).optional().nullable(),
});

export const invoiceQuerySchema = paginationQuerySchema.extend({
  contractId: z.string().regex(objectIdRegex, "Invalid contract ID format").optional(),
  customerId: z.string().regex(objectIdRegex, "Invalid customer ID format").optional(),
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format").optional(),
  status: z.nativeEnum(InvoiceStatusEnum).optional(),
  type: z.nativeEnum(InvoiceTypeEnum).optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "totalAmount", "status"]).default("createdAt"),
});

export const cancelInvoiceSchema = z.object({
  reason: z.string().min(5, "Cancellation reason must be at least 5 characters").max(500),
});

export const confirmManualInvoicePaymentSchema = z.object({
  proofImageUrl: z.string().url("Proof image URL must be a valid URL"),
  paymentMethod: z
    .enum([PaymentMethodEnum.CASH, PaymentMethodEnum.BANK_TRANSFER])
    .default(PaymentMethodEnum.CASH),
  referenceCode: z.string().max(100).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export type InvoiceIdParam = z.infer<typeof invoiceIdParamSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;
export type CreateManualInvoiceRequest = z.infer<typeof createManualInvoiceSchema>;
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>;
export type CancelInvoiceRequest = z.infer<typeof cancelInvoiceSchema>;
export type ConfirmManualInvoicePaymentRequest = z.infer<typeof confirmManualInvoicePaymentSchema>;
