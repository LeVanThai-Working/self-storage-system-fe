import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";

export const createSigningAuthorizationSchema = z
  .object({
    legalEntityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Legal Entity ID format"),
    authorizedUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID format"),
    facilityIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Facility ID format"))
      .min(1, "At least one facility must be authorized"),
    authorizationNumber: z.string().min(3).max(100),
    issuedDate: z.union([z.string(), z.coerce.date()]),
    validFrom: z.union([z.string(), z.coerce.date()]),
    validTo: z.union([z.string(), z.coerce.date()]),
    documentUrl: z.string().url(),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine((data) => new Date(data.validTo).getTime() >= new Date(data.validFrom).getTime(), {
    message: "validTo must be greater than or equal to validFrom",
    path: ["validTo"],
  });

export const updateSigningAuthorizationSchema = z.object({
  validTo: z.union([z.string(), z.coerce.date()]).optional(),
  documentUrl: z.string().url().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const signingAuthorizationQuerySchema = paginationQuerySchema.extend({
  authorizedUserId: z.string().optional(),
  legalEntityId: z.string().optional(),
  facilityId: z.string().optional(),
  status: z.enum(["active", "revoked", "expired"]).optional(),
  sortBy: z.enum(["issuedDate", "validFrom", "validTo", "createdAt"]).default("createdAt"),
});

export const signingAuthorizationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Signing Authorization ID format"),
});

export type CreateSigningAuthorizationRequest = z.infer<typeof createSigningAuthorizationSchema>;
export type UpdateSigningAuthorizationRequest = z.infer<typeof updateSigningAuthorizationSchema>;
export type SigningAuthorizationQuery = z.infer<typeof signingAuthorizationQuerySchema>;
export type SigningAuthorizationIdParam = z.infer<typeof signingAuthorizationIdParamSchema>;
