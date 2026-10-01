"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { otpSchema, type OtpFormValues } from "@self-storage-system-fe/shared/schemas";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField } from "@/components/auth/form-field";

const RESEND_COOLDOWN_SECONDS = 60;

interface RegisterOtpStepProps {
  email: string;
  error: string;
  isSubmitting: boolean;
  isResending: boolean;
  onSubmit: (otp: string) => void;
  onResend: () => Promise<unknown>;
  onBack: () => void;
}

export function RegisterOtpStep({
  email,
  error,
  isSubmitting,
  isResending,
  onSubmit,
  onResend,
  onBack,
}: RegisterOtpStepProps) {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    try {
      await onResend();
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // Error is surfaced by the parent through `error`
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <span className="bg-brand-light text-brand flex size-12 items-center justify-center rounded-2xl">
          <MailCheck className="size-6" />
        </span>
        <div className="space-y-2">
          <h1 className="text-neutral-main text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("otpTitle")}
          </h1>
          <p className="text-neutral-muted text-sm leading-relaxed">
            {t.rich("otpSubtitle", {
              email: () => <span className="text-neutral-main font-semibold">{email}</span>,
            })}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(({ otp }) => onSubmit(otp.trim()))}
        className="space-y-4"
        noValidate
      >
        {error && <FormAlert variant="error" message={error} />}

        <FormField
          label={t("otp")}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          placeholder="••••••"
          className="text-center text-lg font-semibold tracking-[0.5em]"
          error={errors.otp?.message ? tValidation(errors.otp.message) : undefined}
          {...register("otp")}
        />

        <p className="text-neutral-muted text-xs">{t("otpExpiry")}</p>

        <Button
          type="submit"
          variant="cta"
          size="lg"
          className="h-12 w-full rounded-xl text-base font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("registering") : t("verifyAndRegister")}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-neutral-muted hover:text-neutral-main inline-flex cursor-pointer items-center gap-1.5 font-medium"
        >
          <ArrowLeft className="size-4" />
          {t("changeInfo")}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          className="text-brand cursor-pointer font-semibold hover:underline disabled:cursor-not-allowed disabled:text-neutral-muted disabled:no-underline"
        >
          {isResending
            ? t("sendingOtp")
            : cooldown > 0
              ? t("resendOtpIn", { seconds: cooldown })
              : t("resendOtp")}
        </button>
      </div>
    </div>
  );
}
