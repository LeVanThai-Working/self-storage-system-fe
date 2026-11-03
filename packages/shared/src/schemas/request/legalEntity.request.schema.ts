import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";

export const legalRepresentativeSchema = z.object({
  name: z.string().min(2, "Tên người đại diện tối thiểu 2 ký tự").max(100),
  title: z.string().min(2, "Chức danh tối thiểu 2 ký tự").max(100),
  idNumber: z.string().min(9).max(20).optional().nullable(),
});

export const legalEntityBankAccountSchema = z.object({
  bankName: z.string().min(2, "Tên ngân hàng tối thiểu 2 ký tự").max(100),
  accountNumber: z.string().min(6, "Số tài khoản tối thiểu 6 ký tự").max(30),
  accountHolder: z.string().min(2, "Tên chủ tài khoản tối thiểu 2 ký tự").max(100),
});

export const createLegalEntitySchema = z.object({
  companyName: z.string().min(3, "Tên doanh nghiệp tối thiểu 3 ký tự").max(255),
  taxCode: z.string().min(10, "Mã số thuế tối thiểu 10 ký tự").max(14),
  registeredAddress: z.string().min(5, "Địa chỉ trụ sở tối thiểu 5 ký tự").max(500),
  legalRepresentative: legalRepresentativeSchema,
  bankAccount: legalEntityBankAccountSchema,
  phone: z.string().min(10).max(15).optional().nullable(),
  email: z.string().email("Email không hợp lệ").optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateLegalEntitySchema = createLegalEntitySchema.partial();

export const legalEntityQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sortBy: z.enum(["companyName", "taxCode", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const legalEntityIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Legal Entity ID format"),
});

export type CreateLegalEntityRequest = z.infer<typeof createLegalEntitySchema>;
export type UpdateLegalEntityRequest = z.infer<typeof updateLegalEntitySchema>;
export type LegalEntityQuery = z.infer<typeof legalEntityQuerySchema>;
export type LegalEntityIdParam = z.infer<typeof legalEntityIdParamSchema>;
