import { z } from "zod";
import { ContractSourceEnum, ContractStatusEnum } from "../../enums/contract.enum";
import { BillingUnitEnum } from "../../enums";
import { paginationQuerySchema } from "../common/pagination.schema";

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

export const dateStringSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid date format (must be ISO-8601)",
});

export const contractAmenityInputSchema = z.object({
  facilityAmenityOfferingId: objectIdSchema,
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const createContractSchema = z
  .object({
    source: z.nativeEnum(ContractSourceEnum),
    reservationId: objectIdSchema.optional(),

    customerId: objectIdSchema.optional(),
    facilityId: objectIdSchema.optional(),
    storageUnitId: objectIdSchema.optional(),
    facilityUnitTypeOfferingId: objectIdSchema.optional(),

    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),

    billingUnit: z.nativeEnum(BillingUnitEnum).optional(),
    rentalPrice: z.number().min(0).optional(),
    depositAmount: z.number().min(0).optional(),

    amenities: z.array(contractAmenityInputSchema).optional(),
    assignedStaffId: objectIdSchema.optional(),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.source === ContractSourceEnum.RESERVATION) {
      if (!data.reservationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "reservationId is required when source is RESERVATION",
          path: ["reservationId"],
        });
      }
    } else if (data.source === ContractSourceEnum.WALK_IN) {
      if (!data.customerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "customerId is required for WALK_IN contracts",
          path: ["customerId"],
        });
      }
      if (!data.facilityId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "facilityId is required for WALK_IN contracts",
          path: ["facilityId"],
        });
      }
      if (!data.storageUnitId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "storageUnitId is required for WALK_IN contracts",
          path: ["storageUnitId"],
        });
      }
      if (!data.facilityUnitTypeOfferingId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "facilityUnitTypeOfferingId is required for WALK_IN contracts",
          path: ["facilityUnitTypeOfferingId"],
        });
      }
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "startDate is required for WALK_IN contracts",
          path: ["startDate"],
        });
      }
      if (!data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endDate is required for WALK_IN contracts",
          path: ["endDate"],
        });
      }
      if (!data.billingUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "billingUnit is required for WALK_IN contracts",
          path: ["billingUnit"],
        });
      }
      if (data.rentalPrice === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "rentalPrice is required for WALK_IN contracts",
          path: ["rentalPrice"],
        });
      }
      if (data.depositAmount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "depositAmount is required for WALK_IN contracts",
          path: ["depositAmount"],
        });
      }
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate).getTime();
        const end = new Date(data.endDate).getTime();
        if (end <= start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "endDate must be greater than startDate",
            path: ["endDate"],
          });
        }
      }
    }
  });

export const checkInContractSchema = z.object({
  termsAccepted: z.boolean().default(true),
  actualCheckInDate: dateStringSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export const cancelContractSchema = z.object({
  cancellationReason: z.string().min(1, "Cancellation reason is required").max(1000),
});

export const renewContractSchema = z.object({
  newEndDate: dateStringSchema,
  note: z.string().max(1000).optional(),
});

export const addContractAmenitySchema = z.object({
  facilityAmenityOfferingId: objectIdSchema,
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const checkOutContractSchema = z.object({
  damageFee: z.number().min(0).default(0),
  inspectionNotes: z.string().max(1000).optional(),
  actualCheckOutDate: dateStringSchema.optional(),
});

export const terminateContractSchema = z.object({
  terminationReason: z.string().min(1, "Termination reason is required").max(1000),
});

export const contractQuerySchema = paginationQuerySchema.extend({
  customerId: objectIdSchema.optional(),
  facilityId: objectIdSchema.optional(),
  storageUnitId: objectIdSchema.optional(),
  facilityUnitTypeOfferingId: objectIdSchema.optional(),
  status: z.nativeEnum(ContractStatusEnum).optional(),
  source: z.nativeEnum(ContractSourceEnum).optional(),
  contractCode: z.string().optional(),
  startDateFrom: dateStringSchema.optional(),
  startDateTo: dateStringSchema.optional(),
  endDateFrom: dateStringSchema.optional(),
  endDateTo: dateStringSchema.optional(),
});

export const contractIdParamSchema = z.object({
  id: objectIdSchema,
});

export const contractAmenityParamSchema = z.object({
  id: objectIdSchema,
  amenityOfferingId: objectIdSchema,
});

export type CreateContractRequest = z.infer<typeof createContractSchema>;
export type CheckInContractRequest = z.infer<typeof checkInContractSchema>;
export type CancelContractRequest = z.infer<typeof cancelContractSchema>;
export type RenewContractRequest = z.infer<typeof renewContractSchema>;
export type AddContractAmenityRequest = z.infer<typeof addContractAmenitySchema>;
export type CheckOutContractRequest = z.infer<typeof checkOutContractSchema>;
export type TerminateContractRequest = z.infer<typeof terminateContractSchema>;
export type ContractQuery = z.infer<typeof contractQuerySchema>;
