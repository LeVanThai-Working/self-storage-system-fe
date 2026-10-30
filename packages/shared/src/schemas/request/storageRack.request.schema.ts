import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";
import { RackStatusEnum, RackTierStatusEnum, RackZoneEnum } from "../../enums/storageRack.enum";

const dimensionsSchema = z.object({
  length: z.number().positive("Length must be greater than 0"),
  width: z.number().positive("Width must be greater than 0"),
  height: z.number().positive("Height must be greater than 0"),
});

export const createStorageRackSchema = z.object({
  storageUnitId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format"),
  rackCode: z
    .string()
    .min(1, "Rack code is required")
    .max(20, "Rack code cannot exceed 20 characters")
    .trim(),
  aisle: z.string().trim().toUpperCase().optional(),
  bay: z.number().int().min(1).optional(),
  zone: z.nativeEnum(RackZoneEnum).optional(),
  customPrice: z.number().min(0).nullable().optional(),
  name: z.string().max(100).optional(),
  tierCount: z
    .number()
    .int("Tier count must be an integer")
    .min(1, "Tier count must be at least 1")
    .default(1),
  status: z.nativeEnum(RackStatusEnum).optional(),
  notes: z.string().max(1000).optional(),
  defaultTierMaxWeightKg: z.number().positive().optional(),
  defaultTierDimensions: dimensionsSchema.optional(),
});

export const updateStorageRackSchema = z.object({
  name: z.string().max(100).optional(),
  aisle: z.string().trim().toUpperCase().optional(),
  bay: z.number().int().min(1).optional(),
  zone: z.nativeEnum(RackZoneEnum).optional(),
  customPrice: z.number().min(0).nullable().optional(),
  status: z.nativeEnum(RackStatusEnum).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateRackTierSchema = z.object({
  maxWeightKg: z.number().positive().optional(),
  dimensions: dimensionsSchema.optional(),
  status: z.nativeEnum(RackTierStatusEnum).optional(),
  notes: z.string().max(1000).optional(),
});

export const storageRackIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid rack ID format"),
});

export const rackTierIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid rack tier ID format"),
});

export const storageUnitIdParamSchema = z.object({
  unitId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format"),
});

export const storageRackQuerySchema = paginationQuerySchema.extend({
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format")
    .optional(),
  storageUnitId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format")
    .optional(),
  status: z.nativeEnum(RackStatusEnum).optional(),
  rackCode: z.string().optional(),
  aisle: z.string().optional(),
  zone: z.nativeEnum(RackZoneEnum).optional(),
  sortBy: z
    .enum(["rackCode", "aisle", "bay", "tierCount", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateStorageRackRequest = z.infer<typeof createStorageRackSchema>;
export type UpdateStorageRackRequest = z.infer<typeof updateStorageRackSchema>;
export type UpdateRackTierRequest = z.infer<typeof updateRackTierSchema>;
export type StorageRackIdParam = z.infer<typeof storageRackIdParamSchema>;
export type RackTierIdParam = z.infer<typeof rackTierIdParamSchema>;
export type StorageUnitIdParam = z.infer<typeof storageUnitIdParamSchema>;
export type StorageRackQuery = z.infer<typeof storageRackQuerySchema>;
