import { z } from "zod";
import { CustomerSkuStatusEnum } from "../../enums/customerSku.enum";
import { paginationQuerySchema } from "../common/pagination.schema";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const dimensionsSchema = z.object({
  length: z.number().min(0.1, "Length must be at least 0.1 cm"),
  width: z.number().min(0.1, "Width must be at least 0.1 cm"),
  height: z.number().min(0.1, "Height must be at least 0.1 cm"),
});

export const createCustomerSkuSchema = z.object({
  skuCode: z
    .string()
    .trim()
    .min(1, "SKU code is required")
    .max(50, "SKU code must not exceed 50 characters"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  category: z.string().trim().max(50, "Category must not exceed 50 characters").optional(),
  barcode: z.string().trim().max(50, "Barcode must not exceed 50 characters").optional(),
  uom: z
    .string()
    .trim()
    .max(30, "Unit of measure must not exceed 30 characters")
    .default("cái")
    .optional(),
  dimensions: dimensionsSchema.optional(),
  weightKg: z.number().min(0, "Weight must be greater than or equal to 0").optional(),
  imageUrl: z.string().trim().url("Invalid image URL format").optional().or(z.literal("")),
  status: z.nativeEnum(CustomerSkuStatusEnum).default(CustomerSkuStatusEnum.ACTIVE).optional(),
  notes: z.string().trim().max(1000, "Notes must not exceed 1000 characters").optional(),
});

export const updateCustomerSkuSchema = z.object({
  skuCode: z
    .string()
    .trim()
    .min(1, "SKU code cannot be empty")
    .max(50, "SKU code must not exceed 50 characters")
    .optional(),
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name must not exceed 100 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  category: z.string().trim().max(50, "Category must not exceed 50 characters").optional(),
  barcode: z.string().trim().max(50, "Barcode must not exceed 50 characters").optional(),
  uom: z.string().trim().max(30, "Unit of measure must not exceed 30 characters").optional(),
  dimensions: dimensionsSchema.optional(),
  weightKg: z.number().min(0, "Weight must be greater than or equal to 0").optional(),
  imageUrl: z.string().trim().url("Invalid image URL format").optional().or(z.literal("")),
  status: z.nativeEnum(CustomerSkuStatusEnum).optional(),
  notes: z.string().trim().max(1000, "Notes must not exceed 1000 characters").optional(),
});

export const customerSkuQuerySchema = paginationQuerySchema.extend({
  customerId: z.string().regex(objectIdRegex, "Invalid customer ID format").optional(),
  status: z.nativeEnum(CustomerSkuStatusEnum).optional(),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  skuCode: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name", "skuCode"]).default("createdAt"),
});

export const customerSkuIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid SKU ID format"),
});

export const barcodeParamSchema = z.object({
  barcode: z.string().trim().min(1, "Barcode parameter is required"),
});

export type CreateCustomerSkuRequest = z.infer<typeof createCustomerSkuSchema>;
export type UpdateCustomerSkuRequest = z.infer<typeof updateCustomerSkuSchema>;
export type CustomerSkuQuery = z.infer<typeof customerSkuQuerySchema>;
export type CustomerSkuIdParam = z.infer<typeof customerSkuIdParamSchema>;
export type BarcodeParam = z.infer<typeof barcodeParamSchema>;
