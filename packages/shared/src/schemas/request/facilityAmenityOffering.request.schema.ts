import { z } from "zod";
import { BillingUnitEnum, FacilityAmenityOfferingStatusEnum } from "../../enums";

export const createFacilityAmenityOfferingSchema = z.object({
  facilityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format"),
  amenityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid amenity ID format"),
  pricePerUnit: z.number().min(0, "Price per unit must be greater than or equal to 0"),
  billingUnit: z.nativeEnum(BillingUnitEnum).default(BillingUnitEnum.MONTH),
  totalQuantity: z
    .number()
    .int("Total quantity must be an integer")
    .min(0, "Total quantity must be greater than or equal to 0")
    .default(0),
  status: z
    .nativeEnum(FacilityAmenityOfferingStatusEnum)
    .default(FacilityAmenityOfferingStatusEnum.ACTIVE),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
});

export const updateFacilityAmenityOfferingSchema = z
  .object({
    pricePerUnit: z.number().min(0, "Price per unit must be greater than or equal to 0").optional(),
    billingUnit: z.nativeEnum(BillingUnitEnum).optional(),
    totalQuantity: z
      .number()
      .int("Total quantity must be an integer")
      .min(0, "Total quantity must be greater than or equal to 0")
      .optional(),
    status: z.nativeEnum(FacilityAmenityOfferingStatusEnum).optional(),
    notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field must be provided for update");

export const facilityAmenityOfferingQuerySchema = paginationQuerySchema.extend({
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format")
    .optional(),
  amenityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid amenity ID format")
    .optional(),
  billingUnit: z.nativeEnum(BillingUnitEnum).optional(),
  status: z.nativeEnum(FacilityAmenityOfferingStatusEnum).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z
    .enum(["pricePerUnit", "totalQuantity", "inUseQuantity", "status", "createdAt", "updatedAt"])
    .default("createdAt"),
});

export const facilityAmenityOfferingIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid facility amenity offering ID format"),
});

export const facilityOnlyIdParamSchema = z.object({
  facilityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format"),
});

export const facilityAmenityLookupParamSchema = z.object({
  facilityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format"),
  amenityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid amenity ID format"),
});

export type CreateFacilityAmenityOfferingRequest = z.infer<
  typeof createFacilityAmenityOfferingSchema
>;
export type UpdateFacilityAmenityOfferingRequest = z.infer<
  typeof updateFacilityAmenityOfferingSchema
>;
export type FacilityAmenityOfferingQuery = z.infer<typeof facilityAmenityOfferingQuerySchema>;
export type FacilityAmenityOfferingIdParam = z.infer<typeof facilityAmenityOfferingIdParamSchema>;
export type FacilityAmenityLookupParam = z.infer<typeof facilityAmenityLookupParamSchema>;
