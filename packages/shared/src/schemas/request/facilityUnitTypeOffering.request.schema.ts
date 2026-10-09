import z from "zod";
import { BillingUnitEnum, FacilityUnitTypeOfferingStatusEnum } from "../../enums";
import { paginationQuerySchema } from "../common/pagination.schema";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createOfferingSchema = z.object({
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format"),
  unitTypeId: z.string().regex(objectIdRegex, "Invalid unit type ID format"),
  billingUnit: z.enum(BillingUnitEnum).default(BillingUnitEnum.MONTH),
  pricePerUnit: z.number().min(0, "Price must be >= 0"),
  depositMultiplier: z.number().min(0, "Deposit multiplier must be >= 0").default(1),
  minRentalDays: z.number().int().min(1, "Minimum rental days must be >= 1").default(1),
  status: z
    .enum(FacilityUnitTypeOfferingStatusEnum)
    .default(FacilityUnitTypeOfferingStatusEnum.ACTIVE)
    .optional(),
  notes: z.string().max(1000).optional(),
});

export const updateOfferingSchema = z.object({
  billingUnit: z.enum(BillingUnitEnum).optional(),
  pricePerUnit: z.number().min(0, "Price must be >= 0").optional(),
  depositMultiplier: z.number().min(0, "Deposit multiplier must be >= 0").optional(),
  minRentalDays: z.number().int().min(1, "Minimum rental days must be >= 1").optional(),
  status: z.enum(FacilityUnitTypeOfferingStatusEnum).optional(),
  notes: z.string().max(1000).optional(),
});

export const offeringIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid offering ID format"),
});

export const facilityUnitTypeParamSchema = z.object({
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format"),
  unitTypeId: z.string().regex(objectIdRegex, "Invalid unit type ID format"),
});

export const offeringQuerySchema = paginationQuerySchema.extend({
  facilityId: z.string().regex(objectIdRegex).optional(),
  unitTypeId: z.string().regex(objectIdRegex).optional(),
  billingUnit: z.enum(BillingUnitEnum).optional(),
  status: z.enum(FacilityUnitTypeOfferingStatusEnum).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(["pricePerUnit", "minRentalDays", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateOfferingRequest = z.infer<typeof createOfferingSchema>;
export type UpdateOfferingRequest = z.infer<typeof updateOfferingSchema>;
export type OfferingIdParam = z.infer<typeof offeringIdParamSchema>;
export type FacilityUnitTypeParam = z.infer<typeof facilityUnitTypeParamSchema>;
export type OfferingQuery = z.infer<typeof offeringQuerySchema>;
