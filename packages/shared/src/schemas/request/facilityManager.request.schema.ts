import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.schema";
import { UserStatusEnum } from "../../enums/user.enum";

export const facilityStaffQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(UserStatusEnum).optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
});

export type FacilityStaffQuery = z.infer<typeof facilityStaffQuerySchema>;
