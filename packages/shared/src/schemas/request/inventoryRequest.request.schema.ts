import { z } from "zod";
import { InventoryRequestTypeEnum, InventoryRequestStatusEnum } from "../../enums";
import { paginationQuerySchema } from "../common/pagination.schema";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const transporterInfoSchema = z.object({
  name: z.string().min(1, "Transporter name is required").max(100),
  phoneNumber: z.string().min(8, "Phone number must be at least 8 digits").max(20),
  vehiclePlate: z.string().max(30).optional(),
  deliveryCompany: z.string().max(100).optional(),
});

export const outboundRequestItemSchema = z.object({
  skuId: z.string().regex(objectIdRegex, "Invalid SKU ID format"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  storageRackId: z.string().regex(objectIdRegex, "Invalid Storage Rack ID format"),
  rackTierId: z.string().regex(objectIdRegex, "Invalid Rack Tier ID format"),
});

export const createOutboundRequestSchema = z.object({
  contractId: z.string().regex(objectIdRegex, "Invalid Contract ID format"),
  items: z.array(outboundRequestItemSchema).min(1, "Request must contain at least one item"),
  transporterInfo: transporterInfoSchema.optional(),
  /** BE accepts at most 7 days from now (default 48h). */
  expiresAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const verifyPickupCodeSchema = z.object({
  pickupCode: z.string().min(1, "Pickup Code or OTP is required").trim(),
  requestCode: z.string().trim().optional(),
});

export const actualHandoverItemSchema = z.object({
  skuId: z.string().regex(objectIdRegex, "Invalid SKU ID format"),
  actualQuantity: z.number().int().min(0, "Actual quantity must be non-negative"),
  storageRackId: z.string().regex(objectIdRegex, "Invalid Storage Rack ID format").optional(),
  rackTierId: z.string().regex(objectIdRegex, "Invalid Rack Tier ID format").optional(),
});

export const completeOutboundHandoverSchema = z.object({
  evidenceImages: z
    .array(z.string().url("Invalid evidence image URL"))
    .min(1, "At least one evidence image is required for outbound handover"),
  signatureUrl: z.string().url("Invalid signature URL").optional(),
  staffNotes: z.string().max(500).optional(),
  actualItems: z.array(actualHandoverItemSchema).optional(),
  discrepancyReason: z.string().max(500).optional(),
  discrepancyImages: z.array(z.string().url("Invalid discrepancy image URL")).optional(),
});

export const cancelOutboundRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const inboundRequestItemSchema = z.object({
  skuId: z.string().regex(objectIdRegex, "Invalid SKU ID format"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  storageRackId: z.string().regex(objectIdRegex, "Invalid Storage Rack ID format").optional(),
  rackTierId: z.string().regex(objectIdRegex, "Invalid Rack Tier ID format").optional(),
});

export const createInboundRequestSchema = z.object({
  contractId: z.string().regex(objectIdRegex, "Invalid Contract ID format"),
  items: z.array(inboundRequestItemSchema).min(1, "Inbound request must contain at least one item"),
  transporterInfo: transporterInfoSchema,
  evidenceImages: z
    .array(z.string().url("Invalid evidence image URL"))
    .min(3, "At least 3 evidence images are required when staff assists inbound delivery"),
  signatureUrl: z.string().url("Invalid driver signature URL").optional(),
  staffNotes: z.string().max(500).optional(),
});

export const cancelInboundRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

/** Customer pre-advises a delivery; BE returns a one-time QR (`INBOUND:...`) and OTP (7 days). */
export const createPreAdvisedInboundRequestSchema = z.object({
  contractId: z.string().regex(objectIdRegex, "Invalid Contract ID format"),
  items: z.array(inboundRequestItemSchema).min(1, "Inbound request must contain at least one item"),
  transporterInfo: transporterInfoSchema.optional(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const disputeInboundRequestSchema = z.object({
  disputeReason: z.string().min(5, "Dispute reason must be at least 5 characters").max(1000),
});

export const putawayItemSchema = z.object({
  skuId: z.string().regex(objectIdRegex, "Invalid SKU ID format"),
  quantity: z.number().int().positive("Putaway quantity must be greater than 0"),
  storageRackId: z.string().regex(objectIdRegex, "Invalid Storage Rack ID format"),
  rackTierId: z.string().regex(objectIdRegex, "Invalid Rack Tier ID format"),
});

export const putawayInboundRequestSchema = z.object({
  placements: z
    .array(putawayItemSchema)
    .min(1, "Must specify at least one shelf tier placement for putaway"),
});

export const inventoryRequestIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid Inventory Request ID format"),
});

export const inventoryRequestQuerySchema = paginationQuerySchema.extend({
  customerId: z.string().regex(objectIdRegex).optional(),
  facilityId: z.string().regex(objectIdRegex).optional(),
  contractId: z.string().regex(objectIdRegex).optional(),
  type: z.nativeEnum(InventoryRequestTypeEnum).optional(),
  status: z.nativeEnum(InventoryRequestStatusEnum).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
});

export type TransporterInfo = z.infer<typeof transporterInfoSchema>;
export type OutboundRequestItem = z.infer<typeof outboundRequestItemSchema>;
export type CreateOutboundRequest = z.infer<typeof createOutboundRequestSchema>;
export type VerifyPickupCodeRequest = z.infer<typeof verifyPickupCodeSchema>;
export type ActualHandoverItem = z.infer<typeof actualHandoverItemSchema>;
export type CompleteOutboundHandoverRequest = z.infer<typeof completeOutboundHandoverSchema>;
export type CancelOutboundRequest = z.infer<typeof cancelOutboundRequestSchema>;
export type InboundRequestItem = z.infer<typeof inboundRequestItemSchema>;
export type CreateInboundRequest = z.infer<typeof createInboundRequestSchema>;
export type CancelInboundRequest = z.infer<typeof cancelInboundRequestSchema>;
export type CreatePreAdvisedInboundRequest = z.infer<typeof createPreAdvisedInboundRequestSchema>;
export type DisputeInboundRequest = z.infer<typeof disputeInboundRequestSchema>;
export type PutawayItem = z.infer<typeof putawayItemSchema>;
export type PutawayInboundRequest = z.infer<typeof putawayInboundRequestSchema>;
export type InventoryRequestIdParam = z.infer<typeof inventoryRequestIdParamSchema>;
export interface InventoryRequestQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  customerId?: string;
  facilityId?: string;
  contractId?: string;
  type?: InventoryRequestTypeEnum;
  status?: InventoryRequestStatusEnum;
  startDate?: string;
  endDate?: string;
}
