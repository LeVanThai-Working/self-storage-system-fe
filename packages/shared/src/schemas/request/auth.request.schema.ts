import { z } from "zod";

const PHONE_REGEX = /^0(3|5|7|8|9)[0-9]{8}$/;

export const sendOtpSchema = z.object({
  email: z.string().trim().min(1, "emailRequired").email("emailInvalid"),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "emailRequired").email("emailInvalid"),
  password: z.string().min(6, "passwordMin").max(100, "passwordMax"),
});

export const registerSchema = z.object({
  email: z.string().trim().min(1, "emailRequired").email("emailInvalid"),
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
  password: z.string().min(6, "passwordMin").max(100, "passwordMax"),
  name: z.string().trim().min(2, "fullNameMin").max(50, "fullNameMax"),
  phoneNumber: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s.-]/g, "").replace(/^\+84/, "0"))
    .refine((value) => value === "" || PHONE_REGEX.test(value), "phoneInvalid")
    .optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "emailRequired").email("emailInvalid"),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().min(1, "emailRequired").email("emailInvalid"),
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
  newPassword: z.string().min(6, "passwordMin").max(100, "passwordMax"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6).max(100),
    newPassword: z.string().min(6).max(100),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "otpInvalid"),
});

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(2, "fullNameMin").max(50, "fullNameMax"),
    phoneNumber: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s.-]/g, "").replace(/^\+84/, "0"))
      .refine((value) => value === "" || PHONE_REGEX.test(value), "phoneInvalid"),
    email: z.string().trim().min(1, "emailRequired").email("emailInvalid"),
    password: z.string().min(6, "passwordMin").max(100, "passwordMax"),
    confirmPassword: z.string().min(1, "confirmPasswordRequired"),
    agreeTerms: z.boolean().refine((value) => value, "agreeTermsRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export type SendOtpRequest = z.infer<typeof sendOtpSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginFormOutput = z.output<typeof loginSchema>;
export type RegisterFormValues = z.input<typeof registerFormSchema>;
export type RegisterFormOutput = z.output<typeof registerFormSchema>;
export type OtpFormValues = z.input<typeof otpSchema>;
