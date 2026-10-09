import z from "zod";
import { UnitTypeCategoryEnum, UnitTypeStatusEnum } from "../../enums";
import { paginationQuerySchema } from "../common/pagination.schema";

const dimensionsRequestSchema = z.object({
  length: z.number().positive("Length must be greater than 0"),
  width: z.number().positive("Width must be greater than 0"),
  height: z.number().positive("Height must be greater than 0"),
});

export const createUnitTypeSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  dimensions: dimensionsRequestSchema,
  category: z.enum(UnitTypeCategoryEnum).optional(),
  images: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
});

export const updateUnitTypeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  dimensions: dimensionsRequestSchema.optional(),
  category: z.enum(UnitTypeCategoryEnum).optional(),
  status: z.enum(UnitTypeStatusEnum).optional(),
  images: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
});

export const unitTypeIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid unit type ID format"),
});

export const unitTypeQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: z.enum(UnitTypeStatusEnum).optional(),
  category: z.enum(UnitTypeCategoryEnum).optional(),
  minArea: z.coerce.number().min(0).optional(),
  maxArea: z.coerce.number().min(0).optional(),
  sortBy: z.enum(["name", "area", "volume", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateUnitTypeRequest = z.infer<typeof createUnitTypeSchema>;
export type UpdateUnitTypeRequest = z.infer<typeof updateUnitTypeSchema>;
export type UnitTypeIdParam = z.infer<typeof unitTypeIdParamSchema>;
export type UnitTypeQuery = z.infer<typeof unitTypeQuerySchema>;
