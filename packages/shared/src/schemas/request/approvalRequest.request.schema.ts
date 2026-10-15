import { z } from "zod";
import {
  ApprovalRequestActionEnum,
  ApprovalRequestStatusEnum,
  ApprovalRequestTargetTypeEnum,
  ApprovalReviewDecisionEnum,
} from "../../enums/approvalRequest.enum";
import { paginationQuerySchema } from "../common/pagination.schema";

export const createApprovalRequestSchema = z
  .object({
    facilityId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format")
      .optional(),
    targetType: z.nativeEnum(ApprovalRequestTargetTypeEnum),
    action: z.nativeEnum(ApprovalRequestActionEnum),
    targetId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid target ID format")
      .optional(),
    payload: z.record(z.string(), z.unknown()).refine((obj) => Object.keys(obj).length > 0, {
      message: "Payload must not be empty",
    }),
    reason: z
      .string()
      .trim()
      .min(5, "Reason must be at least 5 characters")
      .max(500, "Reason cannot exceed 500 characters"),
  })
  .refine(
    (data) => {
      if (data.action === ApprovalRequestActionEnum.UPDATE) {
        return Boolean(data.targetId);
      }
      return true;
    },
    {
      message: "targetId is required when action is update",
      path: ["targetId"],
    }
  );

export const reviewApprovalRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(ApprovalReviewDecisionEnum.APPROVE),
    notes: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal(ApprovalReviewDecisionEnum.REJECT),
    rejectionReason: z
      .string()
      .trim()
      .min(5, "Rejection reason must be at least 5 characters")
      .max(500, "Rejection reason cannot exceed 500 characters"),
  }),
]);

export const approvalRequestIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid approval request ID format"),
});

export const approvalRequestQuerySchema = paginationQuerySchema.extend({
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format")
    .optional(),
  targetType: z.nativeEnum(ApprovalRequestTargetTypeEnum).optional(),
  status: z.nativeEnum(ApprovalRequestStatusEnum).optional(),
  sortBy: z.enum(["createdAt", "status", "targetType"]).default("createdAt"),
});

export interface CreateApprovalRequest {
  facilityId?: string;
  targetType: ApprovalRequestTargetTypeEnum;
  action: ApprovalRequestActionEnum;
  targetId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: { [key: string]: any };
  reason: string;
}

export type ReviewApprovalRequest = z.infer<typeof reviewApprovalRequestSchema>;
export type ApprovalRequestIdParam = z.infer<typeof approvalRequestIdParamSchema>;
export type ApprovalRequestQuery = z.infer<typeof approvalRequestQuerySchema>;
