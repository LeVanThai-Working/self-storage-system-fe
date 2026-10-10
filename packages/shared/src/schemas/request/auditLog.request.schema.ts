import { z } from "zod";
import { paginationQuerySchema } from "../../../common/schemas/pagination.schema.ts";
import {
  AuditActionEnum,
  AuditResourceEnum,
  AuditStatusEnum,
} from "../../../common/enums/auditLog.enum.ts";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const auditLogIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid audit log ID format"),
});

export const auditLogResourceParamSchema = z.object({
  resourceType: z.enum(AuditResourceEnum),
  resourceId: z.string().min(1, "Resource ID is required"),
});

export const auditLogQuerySchema = paginationQuerySchema
  .extend({
    actorId: z.string().regex(objectIdRegex, "Invalid actor ID format").optional(),
    action: z.enum(AuditActionEnum).optional(),
    resourceType: z.enum(AuditResourceEnum).optional(),
    resourceId: z.string().optional(),
    status: z.enum(AuditStatusEnum).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    sortBy: z.enum(["createdAt", "action", "resourceType", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        const fromDate = new Date(data.from).getTime();
        const toDate = new Date(data.to).getTime();
        if (Number.isNaN(fromDate) || Number.isNaN(toDate)) {
          return false;
        }
        return fromDate <= toDate;
      }
      return true;
    },
    {
      message: '"from" date must be earlier than or equal to "to" date',
      path: ["from"],
    }
  );

export type AuditLogIdParam = z.infer<typeof auditLogIdParamSchema>;
export type AuditLogResourceParam = z.infer<typeof auditLogResourceParamSchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
