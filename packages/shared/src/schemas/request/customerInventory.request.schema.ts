import { z } from "zod";
import { MovementTypeEnum } from "../../enums";
import { paginationQuerySchema } from "../common/pagination.schema";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const stockInRequestSchema = z.object({
  contractId: z.string().regex(objectIdRegex, "Invalid contractId format"),
  skuId: z.string().regex(objectIdRegex, "Invalid skuId format"),
  rackTierId: z.string().regex(objectIdRegex, "Invalid rackTierId format").nullable().optional(),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  referenceCode: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const stockOutRequestSchema = z.object({
  contractId: z.string().regex(objectIdRegex, "Invalid contractId format"),
  skuId: z.string().regex(objectIdRegex, "Invalid skuId format"),
  rackTierId: z.string().regex(objectIdRegex, "Invalid rackTierId format").nullable().optional(),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  reason: z.string().trim().max(1000).optional(),
  referenceCode: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const stockMoveRequestSchema = z
  .object({
    contractId: z.string().regex(objectIdRegex, "Invalid contractId format"),
    skuId: z.string().regex(objectIdRegex, "Invalid skuId format"),
    fromRackTierId: z
      .string()
      .regex(objectIdRegex, "Invalid fromRackTierId format")
      .nullable()
      .optional(),
    toRackTierId: z
      .string()
      .regex(objectIdRegex, "Invalid toRackTierId format")
      .nullable()
      .optional(),
    quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
    reason: z.string().trim().max(1000).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => {
      const from = data.fromRackTierId || null;
      const to = data.toRackTierId || null;
      return from !== to;
    },
    {
      message: "Destination position must be different from source position",
      path: ["toRackTierId"],
    }
  );

export const stockAdjustRequestSchema = z.object({
  contractId: z.string().regex(objectIdRegex, "Invalid contractId format"),
  skuId: z.string().regex(objectIdRegex, "Invalid skuId format"),
  rackTierId: z.string().regex(objectIdRegex, "Invalid rackTierId format").nullable().optional(),
  newQuantity: z.number().int("Quantity must be an integer").min(0, "Quantity cannot be negative"),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(1000),
  notes: z.string().trim().max(1000).optional(),
});

export const customerInventoryQuerySchema = paginationQuerySchema.extend({
  contractId: z.string().regex(objectIdRegex).optional(),
  facilityId: z.string().regex(objectIdRegex).optional(),
  storageUnitId: z.string().regex(objectIdRegex).optional(),
  storageRackId: z.string().regex(objectIdRegex).optional(),
  rackTierId: z.string().regex(objectIdRegex).optional(),
  skuId: z.string().regex(objectIdRegex).optional(),
  customerId: z.string().regex(objectIdRegex).optional(),
  minQuantity: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(["quantity", "lastMovementAt", "createdAt"]).default("lastMovementAt"),
});

export const inventoryMovementQuerySchema = paginationQuerySchema.extend({
  contractId: z.string().regex(objectIdRegex).optional(),
  facilityId: z.string().regex(objectIdRegex).optional(),
  storageUnitId: z.string().regex(objectIdRegex).optional(),
  skuId: z.string().regex(objectIdRegex).optional(),
  rackTierId: z.string().regex(objectIdRegex, "Invalid rackTierId format").optional(),
  customerId: z.string().regex(objectIdRegex).optional(),
  type: z.nativeEnum(MovementTypeEnum).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["createdAt", "quantity", "type"]).default("createdAt"),
});

export const inventoryIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid inventory ID format"),
});

export const storageUnitTreeParamSchema = z.object({
  storageUnitId: z.string().regex(objectIdRegex, "Invalid storageUnitId format"),
});

export const skuLocationsParamSchema = z.object({
  skuId: z.string().regex(objectIdRegex, "Invalid skuId format"),
});

export const barcodeParamSchema = z.object({
  barcode: z.string().trim().min(1, "Barcode cannot be empty"),
});

export type StockInRequest = z.infer<typeof stockInRequestSchema>;
export type StockOutRequest = z.infer<typeof stockOutRequestSchema>;
export type StockMoveRequest = z.infer<typeof stockMoveRequestSchema>;
export type StockAdjustRequest = z.infer<typeof stockAdjustRequestSchema>;
export type CustomerInventoryQuery = z.infer<typeof customerInventoryQuerySchema>;
export type InventoryMovementQuery = z.infer<typeof inventoryMovementQuerySchema>;
export type InventoryIdParam = z.infer<typeof inventoryIdParamSchema>;
export type StorageUnitTreeParam = z.infer<typeof storageUnitTreeParamSchema>;
export type SkuLocationsParam = z.infer<typeof skuLocationsParamSchema>;
export type BarcodeParam = z.infer<typeof barcodeParamSchema>;
