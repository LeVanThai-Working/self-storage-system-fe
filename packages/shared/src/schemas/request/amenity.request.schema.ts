import { z } from "zod";
import { AmenityStatusEnum, AmenityTypeEnum } from "../../enums";
import { paginationQuerySchema } from "../common/pagination.schema";

export const createAmenitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Amenity name must be at least 2 characters")
    .max(100, "Amenity name cannot exceed 100 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  type: z.nativeEnum(AmenityTypeEnum),
  status: z.nativeEnum(AmenityStatusEnum).default(AmenityStatusEnum.ACTIVE),
  images: z.array(z.string().trim().url("Invalid image URL format")).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export const updateAmenitySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Amenity name must be at least 2 characters")
      .max(100, "Amenity name cannot exceed 100 characters")
      .optional(),
    description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
    type: z.nativeEnum(AmenityTypeEnum).optional(),
    status: z.nativeEnum(AmenityStatusEnum).optional(),
    images: z.array(z.string().trim().url("Invalid image URL format")).optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field must be provided for update");

export const amenityQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  type: z.nativeEnum(AmenityTypeEnum).optional(),
  status: z.nativeEnum(AmenityStatusEnum).optional(),
  sortBy: z.enum(["name", "type", "status", "createdAt"]).default("createdAt"),
});

export const amenityIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid amenity ID format"),
});

export type CreateAmenityRequest = z.infer<typeof createAmenitySchema>;
export type UpdateAmenityRequest = z.infer<typeof updateAmenitySchema>;
export type AmenityQuery = z.infer<typeof amenityQuerySchema>;
export type AmenityIdParam = z.infer<typeof amenityIdParamSchema>;
