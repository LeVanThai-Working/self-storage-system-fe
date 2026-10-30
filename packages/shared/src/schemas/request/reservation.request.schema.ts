import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";
import { RefundStatusEnum, ReservationStatusEnum } from "../../enums/reservation.enum";
import { IncidentCategoryEnum } from "../../enums/incident.enum";
import { RentalTargetTypeEnum } from "../../enums/rental.enum";

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

/** Mirrors BE `createReservationSchema`: the customer picks the exact unit and a check-in slot. */
export const createReservationSchema = z.object({
  facilityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format"),
  storageUnitId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format"),
  checkInDate: dateStringSchema,
  checkInTimeSlot: z.string().min(3).max(50).trim(),
  facilityUnitTypeOfferingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility unit type offering ID format")
    .optional(),
  startDate: dateStringSchema.optional(),
  rentalDuration: z.number().int().min(1, "Rental duration must be at least 1"),
  rentalTargetType: z.nativeEnum(RentalTargetTypeEnum).optional(),
  /**
   * Racks picked on the seat map (WAREHOUSE_RACK only). BE reserves them atomically and prices the
   * booking per rack; an empty list holds the whole unit instead, so send at least one rack.
   */
  rentedRackIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid storage rack ID format"))
    .optional(),
  amenities: z.array(reservationAmenityInputSchema).optional().default([]),
  notes: z.string().max(1000).optional(),
  termsAccepted: z.boolean().optional(),
});

export const reassignStorageUnitSchema = z.object({
  newStorageUnitId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format"),
  reason: z.string().min(3).max(500),
  oldUnitStatus: z.enum(["under_maintenance", "available"]).default("under_maintenance").optional(),
  customerAgreed: z.boolean().optional().default(false),
});

export const respondUnitReassignSchema = z.object({
  action: z.enum(["accept", "reject"]),
  rejectReason: z.string().max(500).optional(),
});

export const confirmReservationSchema = z.object({
  assignedStaffId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid staff ID format"),
  notes: z.string().max(1000).optional(),
});

export const cancelReservationSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(500),
  refundBankName: z.string().min(2).max(100).optional(),
  refundAccountNumber: z
    .string()
    .regex(/^[0-9A-Za-z]{6,30}$/, "Invalid bank account number format")
    .optional(),
  refundAccountHolder: z.string().min(2).max(100).optional(),
});

export const assignReservationStaffSchema = z.object({
  staffId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid staff ID format"),
  notes: z.string().max(1000).optional(),
});

export const confirmRefundSchema = z.object({
  referenceCode: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const forceCancelReservationSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(10, "Reason must be at least 10 characters")
      .max(1000, "Reason cannot exceed 1000 characters"),
    incidentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid incident ID format")
      .optional(),
    incidentDetails: z
      .object({
        title: z
          .string()
          .trim()
          .min(3, "Title must be at least 3 characters")
          .max(200, "Title cannot exceed 200 characters"),
        category: z.nativeEnum(IncidentCategoryEnum).default(IncidentCategoryEnum.OTHER),
        description: z.string().trim().max(2000).optional(),
        images: z
          .array(z.string().url("Image must be a valid URL"))
          .min(1, "At least 1 evidence image is required"),
      })
      .optional(),
    refundBankName: z.string().trim().min(2).max(100).optional(),
    refundAccountNumber: z
      .string()
      .trim()
      .regex(/^[0-9A-Za-z]{6,30}$/, "Invalid bank account number format")
      .optional(),
    refundAccountHolder: z.string().trim().min(2).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.incidentId && !data.incidentDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Either incidentId (for existing incident) or incidentDetails (to create new incident) must be provided",
        path: ["incidentId"],
      });
    }
  });

export const extendGracePeriodSchema = z.object({
  extensionHours: z
    .number()
    .int("Extension hours must be an integer")
    .min(1, "Extension hours must be at least 1 hour")
    .max(72, "Extension hours cannot exceed 72 hours"),
  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason cannot exceed 500 characters"),
});

export const markCustomerArrivedSchema = z
  .object({
    notes: z.string().max(1000).optional(),
  })
  .optional()
  .default({});

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
  refundStatus: z.nativeEnum(RefundStatusEnum).optional(),
  reservationCode: z.string().optional(),
  startDateFrom: dateStringSchema.optional(),
  startDateTo: dateStringSchema.optional(),
  checkInDateFrom: dateStringSchema.optional(),
  checkInDateTo: dateStringSchema.optional(),
  sortBy: z
    .enum(["createdAt", "startDate", "checkInDate", "totalAmount", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Discovery lookup query schemas
export const availableTimeSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const availableStorageUnitQuerySchema = z.object({
  unitTypeId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  floor: z.coerce.number().int().optional(),
  zone: z.string().trim().optional(),
});

export const offeringQuerySchema = paginationQuerySchema.extend({
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format")
    .optional(),
  unitTypeId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid unit type ID format")
    .optional(),
  status: z.enum(["active", "inactive"]).optional(),
  billingUnit: z.enum(["day", "month", "year"]).optional(),
  sortBy: z.enum(["pricePerUnit", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const facilityAmenityOfferingQuerySchema = paginationQuerySchema.extend({
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format")
    .optional(),
  amenityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid amenity ID format")
    .optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// Legacy backward compatibility schemas
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

export type CreateReservationRequest = z.infer<typeof createReservationSchema>;
export type ReassignStorageUnitRequest = z.infer<typeof reassignStorageUnitSchema>;
export type RespondUnitReassignRequest = z.infer<typeof respondUnitReassignSchema>;
export type ConfirmReservationRequest = z.infer<typeof confirmReservationSchema>;
export type CancelReservationRequest = z.infer<typeof cancelReservationSchema>;
export type AssignReservationStaffRequest = z.infer<typeof assignReservationStaffSchema>;
export type ConfirmRefundRequest = z.infer<typeof confirmRefundSchema>;
export type ForceCancelReservationRequest = z.infer<typeof forceCancelReservationSchema>;
export type ExtendGracePeriodRequest = z.infer<typeof extendGracePeriodSchema>;
export type MarkCustomerArrivedRequest = z.infer<typeof markCustomerArrivedSchema>;
export type ReservationQuery = z.infer<typeof reservationQuerySchema>;
export type ReservationIdParam = z.infer<typeof reservationIdParamSchema>;

export type AvailableTimeSlotsQuery = z.infer<typeof availableTimeSlotsQuerySchema>;
export type AvailableStorageUnitQuery = z.infer<typeof availableStorageUnitQuerySchema>;
export type OfferingQuery = z.infer<typeof offeringQuerySchema>;
export type FacilityAmenityOfferingQuery = z.infer<typeof facilityAmenityOfferingQuerySchema>;

// Legacy types
export type UpdateReservationRequest = z.infer<typeof updateReservationSchema>;
export type AssignStorageUnitRequest = z.infer<typeof assignStorageUnitSchema>;
export type RejectReservationRequest = z.infer<typeof rejectReservationSchema>;
