import { z } from "zod";

/**
 * Rules mirror the backend auth request schemas.
 * Error messages are i18n keys (resolved under the "validation" namespace)
 * so each app can translate them with its own i18n setup.
 */
const PHONE_REGEX = /^0(3|5|7|8|9)[0-9]{8}$/;

const emailField = z.string().trim().min(1, "emailRequired").email("emailInvalid");
const passwordField = z.string().min(6, "passwordMin").max(100, "passwordMax");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "passwordRequired").pipe(passwordField),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "fullNameMin").max(50, "fullNameMax"),
    // Optional on the backend; accepts spaces/dots/dashes and the +84 prefix
    phoneNumber: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s.-]/g, "").replace(/^\+84/, "0"))
      .refine((value) => value === "" || PHONE_REGEX.test(value), "phoneInvalid"),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "confirmPasswordRequired"),
    agreeTerms: z.boolean().refine((value) => value, "agreeTermsRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "otpInvalid"),
});

export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginFormOutput = z.output<typeof loginSchema>;
export type RegisterFormValues = z.input<typeof registerSchema>;
export type RegisterFormOutput = z.output<typeof registerSchema>;
export type OtpFormValues = z.input<typeof otpSchema>;
