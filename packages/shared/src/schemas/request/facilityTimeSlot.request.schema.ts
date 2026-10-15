import { z } from "zod";

export const timeSlotIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid time slot ID format"),
});

export const facilityIdParamSchema = z.object({
  facilityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format"),
});

export const availableTimeSlotsQuerySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format (must be a valid date string)",
  }),
});

export const createFacilityTimeSlotSchema = z.object({
  facilityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format"),
  slotName: z.string().min(3).max(50).trim(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid start time (HH:mm format)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time (HH:mm format)"),
  maxCapacity: z.number().int().min(1).max(50).default(2),
  isActive: z.boolean().optional().default(true),
  notes: z.string().max(500).optional(),
});

export const updateFacilityTimeSlotSchema = z.object({
  slotName: z.string().min(3).max(50).trim().optional(),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid start time (HH:mm format)")
    .optional(),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time (HH:mm format)")
    .optional(),
  maxCapacity: z.number().int().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export type CreateFacilityTimeSlotRequest = z.infer<typeof createFacilityTimeSlotSchema>;
export type UpdateFacilityTimeSlotRequest = z.infer<typeof updateFacilityTimeSlotSchema>;
export type AvailableTimeSlotsQuery = z.infer<typeof availableTimeSlotsQuerySchema>;
export type TimeSlotIdParam = z.infer<typeof timeSlotIdParamSchema>;
