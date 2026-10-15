import { z } from "zod";
import { GenderEnum } from "../../enums/user.enum";

const MAX_AGE_YEARS = 120;

export const updateProfileSchema = z.object({
  avatarUrl: z.string().url("avatarUrl must be a valid URL").optional(),
  dateOfBirth: z
    .string()
    .date("dateOfBirth must be a valid date (YYYY-MM-DD)")
    .refine((val) => new Date(val) <= new Date(), "dateOfBirth cannot be in the future")
    .refine((val) => {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - MAX_AGE_YEARS);
      return new Date(val) >= minDate;
    }, `dateOfBirth cannot be more than ${MAX_AGE_YEARS} years ago`)
    .optional(),
  address: z.string().max(200, "address must be at most 200 characters").optional(),
  gender: z.nativeEnum(GenderEnum).optional(),
});

export const profileUserIdParamSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid userId format"),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type ProfileUserIdParam = z.infer<typeof profileUserIdParamSchema>;
