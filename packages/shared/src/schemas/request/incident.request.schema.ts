import { z } from "zod";
import {
  IncidentCategoryEnum,
  IncidentSeverityEnum,
  IncidentStatusEnum,
  IncidentLiablePartyEnum,
} from "../../enums";
import { paginationQuerySchema } from "../common/pagination.schema";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, "Invalid ObjectId format");

export const incidentIdParamSchema = z.object({
  id: objectIdSchema,
});

export const reportIncidentSchema = z.object({
  facilityId: objectIdSchema,
  storageUnitId: objectIdSchema.optional(),
  storageRackId: objectIdSchema.optional(),
  rackTierId: objectIdSchema.optional(),
  contractId: objectIdSchema.optional(),
  category: z.nativeEnum(IncidentCategoryEnum),
  severity: z.nativeEnum(IncidentSeverityEnum).default(IncidentSeverityEnum.LOW),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  images: z
    .array(z.string().url("Image must be a valid URL"))
    .min(1, "At least 1 evidence image is required"),
  putUnitUnderMaintenance: z.boolean().optional().default(false),
  requiresRelocation: z.boolean().optional().default(false),
});

export const assignIncidentSchema = z.object({
  assignedStaffId: objectIdSchema,
});

export const investigateIncidentSchema = z.object({
  investigationNotes: z
    .string()
    .trim()
    .min(5, "Investigation notes must be at least 5 characters")
    .max(2000, "Investigation notes cannot exceed 2000 characters"),
  putUnitUnderMaintenance: z.boolean().optional(),
  requiresRelocation: z.boolean().optional(),
});

export const resolveIncidentSchema = z.object({
  resolutionNotes: z
    .string()
    .trim()
    .min(5, "Resolution notes must be at least 5 characters")
    .max(2000, "Resolution notes cannot exceed 2000 characters"),
  staffEvidenceImages: z
    .array(z.string().url("Evidence image must be a valid URL"))
    .min(1, "At least 1 resolution evidence image is required"),
  repairCost: z
    .number()
    .int("Repair cost must be an integer")
    .min(0, "Repair cost cannot be negative")
    .default(0),
  liableParty: z.nativeEnum(IncidentLiablePartyEnum).default(IncidentLiablePartyEnum.FACILITY),
  damageFee: z
    .number()
    .int("Damage fee must be an integer")
    .min(0, "Damage fee cannot be negative")
    .default(0),
});

export const closeIncidentSchema = z.object({
  notes: z.string().trim().max(1000).optional(),
});

export const cancelIncidentSchema = z.object({
  cancellationReason: z
    .string()
    .trim()
    .min(5, "Cancellation reason must be at least 5 characters")
    .max(500, "Cancellation reason cannot exceed 500 characters"),
});

export const incidentQuerySchema = paginationQuerySchema.extend({
  facilityId: objectIdSchema.optional(),
  storageUnitId: objectIdSchema.optional(),
  storageRackId: objectIdSchema.optional(),
  contractId: objectIdSchema.optional(),
  reporterId: objectIdSchema.optional(),
  assignedStaffId: objectIdSchema.optional(),
  status: z.nativeEnum(IncidentStatusEnum).optional(),
  category: z.nativeEnum(IncidentCategoryEnum).optional(),
  severity: z.nativeEnum(IncidentSeverityEnum).optional(),
  search: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ReportIncidentRequest = z.infer<typeof reportIncidentSchema>;
export type AssignIncidentRequest = z.infer<typeof assignIncidentSchema>;
export type InvestigateIncidentRequest = z.infer<typeof investigateIncidentSchema>;
export type ResolveIncidentRequest = z.infer<typeof resolveIncidentSchema>;
export type CloseIncidentRequest = z.infer<typeof closeIncidentSchema>;
export type CancelIncidentRequest = z.infer<typeof cancelIncidentSchema>;
export type IncidentQuery = z.infer<typeof incidentQuerySchema>;
