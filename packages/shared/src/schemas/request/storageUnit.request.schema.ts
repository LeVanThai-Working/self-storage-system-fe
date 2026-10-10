import { z } from "zod";
import { StorageUnitStatusEnum } from "../../enums";
import { paginationQuerySchema } from "../common/pagination.schema";
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const storageUnitIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid storage unit ID format"),
});

export const facilityIdParamSchema = z.object({
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format"),
});

export const createStorageUnitSchema = z.object({
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format"),
  unitTypeId: z.string().regex(objectIdRegex, "Invalid unit type ID format"),
  unitNumber: z
    .string()
    .min(1, "Unit number is required")
    .max(50, "Unit number must not exceed 50 characters")
    .trim(),
  floor: z.number().int().min(1, "Floor must be at least 1").default(1),
  zone: z.string().max(100, "Zone must not exceed 100 characters").trim().optional(),
  status: z
    .enum([
      StorageUnitStatusEnum.AVAILABLE,
      StorageUnitStatusEnum.UNDER_MAINTENANCE,
      StorageUnitStatusEnum.INACTIVE,
    ])
    .default(StorageUnitStatusEnum.AVAILABLE)
    .optional(),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional(),
});

export const updateStorageUnitSchema = z.object({
  unitTypeId: z.string().regex(objectIdRegex, "Invalid unit type ID format").optional(),
  unitNumber: z
    .string()
    .min(1, "Unit number is required")
    .max(50, "Unit number must not exceed 50 characters")
    .trim()
    .optional(),
  floor: z.number().int().min(1, "Floor must be at least 1").optional(),
  zone: z.string().max(100, "Zone must not exceed 100 characters").trim().optional(),
  status: z.enum([StorageUnitStatusEnum.AVAILABLE, StorageUnitStatusEnum.INACTIVE]).optional(),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional(),
});

export const toggleMaintenanceSchema = z.object({
  isUnderMaintenance: z.boolean(),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional(),
});

export const storageUnitQuerySchema = paginationQuerySchema.extend({
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format").optional(),
  unitTypeId: z.string().regex(objectIdRegex, "Invalid unit type ID format").optional(),
  status: z.nativeEnum(StorageUnitStatusEnum).optional(),
  floor: z.coerce.number().int().min(1).optional(),
  zone: z.string().optional(),
  unitNumber: z.string().optional(),
  sortBy: z.enum(["unitNumber", "floor", "status", "createdAt", "updatedAt"]).default("createdAt"),
});

export const availableStorageUnitQuerySchema = z.object({
  unitTypeId: z.string().regex(objectIdRegex, "Invalid unit type ID format").optional(),
  floor: z.coerce.number().int().min(1).optional(),
  zone: z.string().optional(),
});

export type CreateStorageUnitRequest = z.infer<typeof createStorageUnitSchema>;
export type UpdateStorageUnitRequest = z.infer<typeof updateStorageUnitSchema>;
export type ToggleMaintenanceRequest = z.infer<typeof toggleMaintenanceSchema>;
export type StorageUnitQuery = z.infer<typeof storageUnitQuerySchema>;
export type AvailableStorageUnitQuery = z.infer<typeof availableStorageUnitQuerySchema>;
