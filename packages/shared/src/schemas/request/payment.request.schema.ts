import { z } from "zod";
import { PaymentMethodEnum, PaymentPurposeEnum, PaymentStatusEnum } from "../../enums/payment.enum";
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
      if (data.purpose === PaymentPurposeEnum.CONTRACT_DEPOSIT) {
        return !!data.contractId;
      }
      return false;
    },
    {
      message:
        "Must provide reservationId for RESERVATION_DEPOSIT, or contractId for CONTRACT_DEPOSIT",
    }
  );

export const confirmManualPaymentSchema = z.object({
  method: z
    .enum([PaymentMethodEnum.CASH, PaymentMethodEnum.BANK_TRANSFER])
    .default(PaymentMethodEnum.CASH),
  referenceCode: z.string().max(100).optional(),
  note: z.string().min(2, "Note is required for manual payment verification").max(1000),
});

export const cancelPaymentSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(500),
});

export const paymentQuerySchema = paginationQuerySchema.extend({
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
