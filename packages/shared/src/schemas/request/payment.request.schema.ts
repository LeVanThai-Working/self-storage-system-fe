import { z } from "zod";
import {
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  PaymentTransactionResultEnum,
} from "../../enums/payment.enum";
import { paginationQuerySchema } from "../common/pagination.schema";

export const paymentIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid payment ID format"),
});

export const createPaymentSchema = z
  .object({
    purpose: z.nativeEnum(PaymentPurposeEnum),
    reservationId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid reservation ID format")
      .optional(),
    contractId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid contract ID format")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.purpose === PaymentPurposeEnum.RESERVATION_DEPOSIT) {
        return !!data.reservationId;
      }
      if (
        data.purpose === PaymentPurposeEnum.CONTRACT_DEPOSIT ||
        data.purpose === PaymentPurposeEnum.RENT_FIRST_PERIOD
      ) {
        return !!data.contractId;
      }
      return false;
    },
    {
      message:
        "Must provide reservationId for RESERVATION_DEPOSIT, or contractId for CONTRACT_DEPOSIT or RENT_FIRST_PERIOD",
    }
  );

export const confirmManualPaymentSchema = z.object({
  method: z
    .enum([PaymentMethodEnum.CASH, PaymentMethodEnum.BANK_TRANSFER])
    .default(PaymentMethodEnum.CASH),
  referenceCode: z.string().max(100).optional(),
  proofImageUrl: z.string().url("Proof image URL is required for manual payment verification"),
  note: z.string().min(2, "Note is required for manual payment verification").max(1000),
});

export const cancelPaymentSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(500),
});

export const paymentQuerySchema = paginationQuerySchema.extend({
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  customerId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  reservationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  contractId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  purpose: z.nativeEnum(PaymentPurposeEnum).optional(),
  status: z.nativeEnum(PaymentStatusEnum).optional(),
  paymentCode: z.string().optional(),
  createdAtFrom: z.string().optional(),
  createdAtTo: z.string().optional(),
});

export const sepayWebhookSchema = z.object({
  id: z.number(),
  gateway: z.string().nullish(),
  transactionDate: z.string().nullish(),
  accountNumber: z.string().nullish(),
  subAccount: z.string().nullish(),
  code: z.string().nullish(),
  content: z.string().nullish(),
  transferType: z.string().nullish(),
  transferAmount: z.number(),
  accumulated: z.number().nullish(),
  referenceCode: z.string().nullish(),
  description: z.string().nullish(),
});

export interface SepayWebhookPayload {
  id: number;
  gateway?: string | null;
  transactionDate?: string | null;
  accountNumber?: string | null;
  subAccount?: string | null;
  code?: string | null;
  content?: string | null;
  transferType?: string | null;
  transferAmount: number;
  accumulated?: number | null;
  referenceCode?: string | null;
  description?: string | null;
}

export type CreatePaymentRequest = z.infer<typeof createPaymentSchema>;
export type ConfirmManualPaymentRequest = z.infer<typeof confirmManualPaymentSchema>;
export type CancelPaymentRequest = z.infer<typeof cancelPaymentSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>;

export const paymentTransactionIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid transaction ID format"),
});

export const assignUnmatchedTransactionSchema = z.object({
  paymentCode: z.string().min(3).max(50).trim(),
});

export const unmatchedTransactionQuerySchema = paginationQuerySchema.extend({
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  result: z.nativeEnum(PaymentTransactionResultEnum).optional(),
  gateway: z.string().optional(),
  accountNumber: z.string().optional(),
  code: z.string().optional(),
});

export type PaymentTransactionIdParam = z.infer<typeof paymentTransactionIdParamSchema>;
export type AssignUnmatchedTransactionRequest = z.infer<typeof assignUnmatchedTransactionSchema>;
export type UnmatchedTransactionQuery = z.infer<typeof unmatchedTransactionQuerySchema>;
