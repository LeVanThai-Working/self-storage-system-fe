import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";
import { RefundRequestReasonEnum, RefundRequestStatusEnum } from "../../enums/refundRequest.enum";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const refundRequestIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid refund request ID format"),
});

export const createRefundRequestSchema = z
  .object({
    reservationId: z.string().regex(objectIdRegex).optional(),
    contractId: z.string().regex(objectIdRegex).optional(),
    paymentId: z.string().regex(objectIdRegex).optional(),
    facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format"),
    customerId: z.string().regex(objectIdRegex, "Invalid customer ID format"),
    amount: z.number().int().positive("Refund amount must be a positive integer"),
    reason: z.nativeEnum(RefundRequestReasonEnum),
    refundBankName: z.string().max(100).optional(),
    refundAccountNumber: z.string().min(4).max(30).optional(),
    refundAccountHolder: z.string().max(100).optional(),
    note: z.string().max(1000).optional(),
  })
  .refine((data) => !!data.reservationId || !!data.contractId, {
    message: "Either reservationId or contractId must be provided",
  });

export const approveRefundRequestSchema = z.object({
  note: z.string().max(1000).optional(),
});

export const rejectRefundRequestSchema = z.object({
  rejectionReason: z.string().min(3, "Rejection reason must be at least 3 characters").max(500),
});

export const confirmPaidRefundSchema = z.object({
  referenceCode: z.string().min(3, "Bank reference code is required for paid refunds").max(100),
  proofImageUrl: z.string().url("Proof image URL must be a valid URL").optional(),
  note: z.string().max(1000).optional(),
});

export const cancelRefundRequestSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(500),
});

export const refundRequestQuerySchema = paginationQuerySchema.extend({
  facilityId: z.string().regex(objectIdRegex).optional(),
  customerId: z.string().regex(objectIdRegex).optional(),
  reservationId: z.string().regex(objectIdRegex).optional(),
  contractId: z.string().regex(objectIdRegex).optional(),
  status: z.nativeEnum(RefundRequestStatusEnum).optional(),
  reason: z.nativeEnum(RefundRequestReasonEnum).optional(),
  sortBy: z.enum(["amount", "createdAt", "status"]).default("createdAt"),
});

export type CreateRefundRequest = z.infer<typeof createRefundRequestSchema>;
export type ApproveRefundRequest = z.infer<typeof approveRefundRequestSchema>;
export type RejectRefundRequest = z.infer<typeof rejectRefundRequestSchema>;
export type ConfirmPaidRefund = z.infer<typeof confirmPaidRefundSchema>;
export type CancelRefundRequest = z.infer<typeof cancelRefundRequestSchema>;
export type RefundRequestQuery = z.infer<typeof refundRequestQuerySchema>;
export type RefundRequestIdParam = z.infer<typeof refundRequestIdParamSchema>;
