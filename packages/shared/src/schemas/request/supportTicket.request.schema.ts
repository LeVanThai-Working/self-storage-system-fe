import { z } from "zod";
import {
  SupportTicketCategoryEnum,
  SupportTicketPriorityEnum,
  SupportTicketStatusEnum,
} from "../../enums";
import { paginationQuerySchema } from "../common/pagination.schema";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, "Invalid ObjectId format");

export const createSupportTicketSchema = z.object({
  facilityId: objectIdSchema.optional(),
  contractId: objectIdSchema.optional(),
  category: z.nativeEnum(SupportTicketCategoryEnum),
  priority: z.nativeEnum(SupportTicketPriorityEnum).default(SupportTicketPriorityEnum.MEDIUM),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(3000, "Description cannot exceed 3000 characters"),
  attachments: z
    .array(z.string().url("Attachment must be a valid URL or path"))
    .max(5, "Maximum 5 attachments allowed")
    .default([]),
});

export const processSupportTicketSchema = z.object({
  assignedStaffId: objectIdSchema.optional(),
});

export const completeSupportTicketSchema = z.object({
  responseMessage: z
    .string()
    .trim()
    .min(5, "Response message must be at least 5 characters")
    .max(3000, "Response message cannot exceed 3000 characters"),
  attachments: z
    .array(z.string().url("Attachment must be a valid URL or path"))
    .max(5, "Maximum 5 attachments allowed")
    .default([]),
});

export const cancelSupportTicketSchema = z.object({
  cancellationReason: z
    .string()
    .trim()
    .max(500, "Cancellation reason cannot exceed 500 characters")
    .optional(),
});

export const supportTicketIdParamSchema = z.object({
  id: objectIdSchema,
});

export const supportTicketQuerySchema = paginationQuerySchema.extend({
  customerId: objectIdSchema.optional(),
  facilityId: objectIdSchema.optional(),
  contractId: objectIdSchema.optional(),
  assignedStaffId: objectIdSchema.optional(),
  status: z.nativeEnum(SupportTicketStatusEnum).optional(),
  category: z.nativeEnum(SupportTicketCategoryEnum).optional(),
  priority: z.nativeEnum(SupportTicketPriorityEnum).optional(),
  search: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateSupportTicketRequest = z.infer<typeof createSupportTicketSchema>;
export type ProcessSupportTicketRequest = z.infer<typeof processSupportTicketSchema>;
export type CompleteSupportTicketRequest = z.infer<typeof completeSupportTicketSchema>;
export type CancelSupportTicketRequest = z.infer<typeof cancelSupportTicketSchema>;
export type SupportTicketIdParam = z.infer<typeof supportTicketIdParamSchema>;
export type SupportTicketQuery = z.infer<typeof supportTicketQuerySchema>;
