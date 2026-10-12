import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";
import { ReservationStatusEnum } from "../../enums/reservation.enum";

export const reservationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reservation ID format"),
});

export const reservationAmenityInputSchema = z.object({
  facilityAmenityOfferingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility amenity offering ID format"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const dateStringSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid date format (must be a valid ISO 8601 date string)",
});

export const createReservationSchema = z.object({
  facilityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format"),
  facilityUnitTypeOfferingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility unit type offering ID format"),
  startDate: dateStringSchema,
  rentalDuration: z.number().int().min(1, "Rental duration must be at least 1"),
  amenities: z.array(reservationAmenityInputSchema).optional().default([]),
  notes: z.string().max(1000).optional(),
});

export const updateReservationSchema = z.object({
  startDate: dateStringSchema.optional(),
  rentalDuration: z.number().int().min(1).optional(),
  amenities: z.array(reservationAmenityInputSchema).optional(),
  notes: z.string().max(1000).optional(),
});

export const assignStorageUnitSchema = z.object({
  storageUnitId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format"),
  holdingHours: z.number().int().min(1).max(168).optional().default(24),
  notes: z.string().max(1000).optional(),
});

export const rejectReservationSchema = z.object({
  rejectionReason: z.string().min(3, "Rejection reason must be at least 3 characters").max(500),
});

export const confirmReservationSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const cancelReservationSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(500),
});

export const reservationQuerySchema = paginationQuerySchema.extend({
  customerId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  facilityUnitTypeOfferingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  storageUnitId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  status: z.nativeEnum(ReservationStatusEnum).optional(),
  reservationCode: z.string().optional(),
  startDateFrom: dateStringSchema.optional(),
  startDateTo: dateStringSchema.optional(),
  sortBy: z.enum(["createdAt", "startDate", "totalAmount", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateReservationRequest = z.infer<typeof createReservationSchema>;
export type UpdateReservationRequest = z.infer<typeof updateReservationSchema>;
export type AssignStorageUnitRequest = z.infer<typeof assignStorageUnitSchema>;
export type RejectReservationRequest = z.infer<typeof rejectReservationSchema>;
export type ConfirmReservationRequest = z.infer<typeof confirmReservationSchema>;
export type CancelReservationRequest = z.infer<typeof cancelReservationSchema>;
export type ReservationQuery = z.infer<typeof reservationQuerySchema>;
export type ReservationIdParam = z.infer<typeof reservationIdParamSchema>;
