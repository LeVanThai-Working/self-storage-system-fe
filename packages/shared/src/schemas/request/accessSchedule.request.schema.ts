import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";
import { AccessScheduleStatusEnum } from "../../enums";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAccessScheduleSchema = z.object({
  contractId: z.string().regex(objectIdRegex, "Invalid contract ID format").trim(),
  timeSlotId: z.string().regex(objectIdRegex, "Invalid time slot ID format").trim(),
  scheduledDate: z
    .string()
    .regex(dateStringRegex, "Scheduled date must be in YYYY-MM-DD format")
    .trim(),
  numberOfPeople: z
    .number()
    .int("Number of people must be an integer")
    .min(1, "At least 1 person is required")
    .max(10, "Maximum 10 people allowed per schedule")
    .default(1)
    .optional(),
  vehicleType: z.string().trim().max(100).optional().nullable(),
  vehiclePlate: z.string().trim().max(20).optional().nullable(),
  purpose: z.string().trim().max(500).optional().nullable(),
});

/** Gate check-in accepts only a six-digit OTP supplied by the customer. */
export const checkInAccessScheduleSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter 6-digit OTP"),
  staffNotes: z.string().trim().max(500).optional().nullable(),
});

export const checkOutAccessScheduleSchema = z.object({
  staffNotes: z.string().trim().max(500).optional().nullable(),
});

export const cancelAccessScheduleSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable(),
});

export const availableAccessSlotsQuerySchema = z.object({
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format").trim(),
  date: z.string().regex(dateStringRegex, "Date must be in YYYY-MM-DD format").trim(),
});

export const accessScheduleQuerySchema = paginationQuerySchema.extend({
  facilityId: z.string().regex(objectIdRegex).optional(),
  customerId: z.string().regex(objectIdRegex).optional(),
  contractId: z.string().regex(objectIdRegex).optional(),
  status: z.nativeEnum(AccessScheduleStatusEnum).optional(),
  assignmentScope: z.enum(["unassigned", "mine", "all"]).optional(),
  startDate: z.string().regex(dateStringRegex).optional(),
  endDate: z.string().regex(dateStringRegex).optional(),
});

export const accessScheduleIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid Access Schedule ID format"),
});

export const assignAccessScheduleSchema = z.object({
  staffId: z.string().regex(objectIdRegex),
  assignmentVersion: z.number().int().min(0),
});

export const unassignAccessScheduleSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  assignmentVersion: z.number().int().min(0),
});

export type AssignAccessScheduleRequest = z.infer<typeof assignAccessScheduleSchema>;
export type UnassignAccessScheduleRequest = z.infer<typeof unassignAccessScheduleSchema>;

export type CreateAccessScheduleRequest = z.infer<typeof createAccessScheduleSchema>;
export type CheckInAccessScheduleRequest = z.infer<typeof checkInAccessScheduleSchema>;
export type CheckOutAccessScheduleRequest = z.infer<typeof checkOutAccessScheduleSchema>;
export type CancelAccessScheduleRequest = z.infer<typeof cancelAccessScheduleSchema>;
export type AvailableAccessSlotsQuery = z.infer<typeof availableAccessSlotsQuerySchema>;
export type AccessScheduleQuery = z.infer<typeof accessScheduleQuerySchema>;
export type AccessScheduleIdParam = z.infer<typeof accessScheduleIdParamSchema>;
