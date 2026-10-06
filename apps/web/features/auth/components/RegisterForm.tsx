"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { MESSAGE_CODE } from "@self-storage-system-fe/shared";
import {
  registerFormSchema as registerSchema,
  type RegisterFormOutput,
  type RegisterFormValues,
} from "@self-storage-system-fe/shared/schemas";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField, PasswordField } from "@/features/auth/components/FormField";
import { AuthDivider, GoogleButton } from "@/features/auth/components/GoogleButton";
import { RegisterOtpStep } from "@/features/auth/components/RegisterOtpStep";
import { useRegister, useSendOtp } from "@/features/auth/hooks";
import { isValidationError, useApiErrorMessage } from "@/features/auth/error-message";

/**
 * Registration is a two-step flow on the backend:
 * 1. POST /auth/send-otp emails a 6-digit code
 * 2. POST /auth/register creates the account with that code and signs the user in
 */
export function RegisterForm() {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();
  const getErrorMessage = useApiErrorMessage();
  const sendOtp = useSendOtp();
  const registerMutation = useRegister();
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<RegisterFormOutput | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  const fieldError = (message?: string) => (message ? tValidation(message) : undefined);

  const sendOtpErrorMessage = (error: unknown) =>
    getErrorMessage(error, { [MESSAGE_CODE.MESSAGE_CODE_105]: t("errors.emailExists") });

  const onSubmitInfo = (values: RegisterFormOutput) => {
    setFormError("");
    sendOtp.mutate(
      { email: values.email },
      {
        onSuccess: () => {
          setPending(values);
          toast.success(t("otpSent", { email: values.email }));
        },
        onError: (error) => setFormError(sendOtpErrorMessage(error)),
      }
    );
  };

  const resendOtp = async () => {
    if (!pending) return;
    setFormError("");
    try {
      await sendOtp.mutateAsync({ email: pending.email });
      toast.success(t("otpSent", { email: pending.email }));
    } catch (error) {
      setFormError(sendOtpErrorMessage(error));
      throw error;
    }
  };

  const onSubmitOtp = (otp: string) => {
    if (!pending) return;
    const { name, phoneNumber, email, password } = pending;
    setFormError("");
    registerMutation.mutate(
      { name, email, password, otp, ...(phoneNumber && { phoneNumber }) },
      {
        onSuccess: () => {
          toast.success(t("registerSuccess"));
          router.replace(`/${locale}`);
          router.refresh();
        },
        onError: (error) =>
          setFormError(
            getErrorMessage(error, {
              [MESSAGE_CODE.MESSAGE_CODE_105]: t("errors.emailExists"),
              // A non-validation 101 on register means the OTP is wrong or expired
              ...(!isValidationError(error) && {
                [MESSAGE_CODE.MESSAGE_CODE_101]: t("errors.invalidOtp"),
              }),
            })
          ),
      }
    );
  };

  if (pending) {
    return (
      <RegisterOtpStep
        email={pending.email}
        error={formError}
        isSubmitting={registerMutation.isPending}
        isResending={sendOtp.isPending}
        onSubmit={onSubmitOtp}
        onResend={resendOtp}
        onBack={() => {
          setFormError("");
          setPending(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-neutral-main text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t("registerTitle")}
        </h1>
        <p className="text-neutral-muted text-sm leading-relaxed">{t("registerSubtitle")}</p>
      </div>

      <div className="space-y-5">
        <GoogleButton />
        <AuthDivider />

        <form onSubmit={handleSubmit(onSubmitInfo)} className="space-y-4" noValidate>
          {formError && <FormAlert variant="error" message={formError} />}

          <FormField
            label={t("fullName")}
            autoComplete="name"
            placeholder={t("fullNamePlaceholder")}
            leftIcon={<User />}
            error={fieldError(errors.name?.message)}
            {...register("name")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={t("email")}
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              leftIcon={<Mail />}
              error={fieldError(errors.email?.message)}
              {...register("email")}
            />
            <FormField
              label={t("phoneOptional")}
              type="tel"
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
              leftIcon={<Phone />}
              error={fieldError(errors.phoneNumber?.message)}
              {...register("phoneNumber")}
            />
          </div>

          <PasswordField
            label={t("password")}
            autoComplete="new-password"
            placeholder={t("newPasswordPlaceholder")}
            leftIcon={<Lock />}
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
            error={fieldError(errors.password?.message)}
            {...register("password")}
          />

          <PasswordField
            label={t("confirmPassword")}
            autoComplete="new-password"
            placeholder={t("confirmPasswordPlaceholder")}
            leftIcon={<Lock />}
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
            error={fieldError(errors.confirmPassword?.message)}
            {...register("confirmPassword")}
          />

          <div className="space-y-1.5 pt-1">
            <label className="text-neutral-muted flex cursor-pointer items-start gap-2.5 text-xs">
              <input
                type="checkbox"
                className="accent-brand mt-0.5 size-4 shrink-0 rounded border-gray-300"
                aria-invalid={Boolean(errors.agreeTerms)}
                {...register("agreeTerms")}
              />
              <span className="leading-snug">
                {t.rich("agreeTerms", {
                  terms: (chunks) => <span className="text-brand underline">{chunks}</span>,
                  privacy: (chunks) => <span className="text-brand underline">{chunks}</span>,
                })}
              </span>
            </label>
            {errors.agreeTerms?.message && (
              <p className="text-destructive text-xs">{fieldError(errors.agreeTerms.message)}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="cta"
            size="lg"
            className="h-12 w-full rounded-xl text-base font-semibold"
            disabled={sendOtp.isPending}
          >
            {sendOtp.isPending ? t("sendingOtp") : t("continue")}
          </Button>
        </form>
      </div>

      <p className="text-neutral-muted text-center text-sm">
        {t("haveAccount")}{" "}
        <Link href={`/${locale}/login`} className="text-brand font-semibold hover:underline">
          {t("loginNow")}
        </Link>
      </p>
    </div>
  );
}
