import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";
import { MovementTypeEnum, InventoryItemStatusEnum } from "../../enums";

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
    reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(1000),
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
  reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(1000),
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
  status: z.nativeEnum(InventoryItemStatusEnum).optional(),
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

export const customerInventorySummaryQuerySchema = z.object({
  customerId: z.string().regex(objectIdRegex, "Invalid customerId format").optional(),
  userId: z.string().regex(objectIdRegex, "Invalid userId format").optional(),
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

export interface CustomerInventorySummaryQuery {
  customerId?: string;
  userId?: string;
}

export type CustomerInventoryQuery = z.infer<typeof customerInventoryQuerySchema>;
export type InventoryMovementQuery = z.infer<typeof inventoryMovementQuerySchema>;
export type InventoryIdParam = z.infer<typeof inventoryIdParamSchema>;
export type StorageUnitTreeParam = z.infer<typeof storageUnitTreeParamSchema>;
export type SkuLocationsParam = z.infer<typeof skuLocationsParamSchema>;
export type BarcodeParam = z.infer<typeof barcodeParamSchema>;

export const batchMigrateRackRequestSchema = z
  .object({
    fromRackId: z.string().regex(objectIdRegex, "Invalid fromRackId format"),
    toRackId: z.string().regex(objectIdRegex, "Invalid toRackId format"),
    contractId: z.string().regex(objectIdRegex, "Invalid contractId format").optional(),
    addendumId: z.string().regex(objectIdRegex, "Invalid addendumId format").optional(),
    incidentId: z.string().regex(objectIdRegex, "Invalid incidentId format").optional(),
    emergencyReason: z
      .string()
      .trim()
      .min(10, "Emergency reason must be at least 10 characters")
      .max(1000)
      .optional(),
    reason: z.string().trim().max(1000).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((data) => data.fromRackId !== data.toRackId, {
    message: "Destination rack must be different from source rack",
    path: ["toRackId"],
  })
  .refine((data) => Boolean(data.addendumId || data.emergencyReason || data.incidentId), {
    message:
      "Either addendumId (signed Addendum), incidentId (Incident Report), or emergencyReason (at least 10 characters) is required",
    path: ["emergencyReason"],
  });

export type BatchMigrateRackRequest = z.infer<typeof batchMigrateRackRequestSchema>;

export const evacuateRackToHoldingRequestSchema = z
  .object({
    fromRackId: z.string().regex(objectIdRegex, "Invalid fromRackId format"),
    emergencyReason: z.string().trim().max(1000).optional(),
    incidentId: z.string().regex(objectIdRegex, "Invalid incidentId format").optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => {
      const hasReason = Boolean(data.emergencyReason && data.emergencyReason.trim().length >= 10);
      const hasIncident = Boolean(data.incidentId && data.incidentId.trim().length > 0);
      return hasReason || hasIncident;
    },
    {
      message: "Either emergencyReason (minimum 10 characters) or valid incidentId is required",
      path: ["emergencyReason"],
    }
  );

export type EvacuateRackToHoldingRequest = z.infer<typeof evacuateRackToHoldingRequestSchema>;

export const updateInventoryStatusRequestSchema = z
  .object({
    status: z.nativeEnum(InventoryItemStatusEnum),
    reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(1000),
    incidentId: z.string().regex(objectIdRegex, "Invalid incidentId format").optional(),
    holdingReason: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === InventoryItemStatusEnum.DAMAGED && !data.incidentId) {
      ctx.addIssue({
        code: "custom",
        message: "incidentId is required when status is DAMAGED",
        path: ["incidentId"],
      });
    }
  });

export type UpdateInventoryStatusRequest = z.infer<typeof updateInventoryStatusRequestSchema>;
