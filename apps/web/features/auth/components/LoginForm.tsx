"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { MESSAGE_CODE } from "@self-storage-system-fe/shared";
import {
  loginSchema,
  type LoginFormOutput,
  type LoginFormValues,
} from "@self-storage-system-fe/shared/schemas";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField, PasswordField } from "@/features/auth/components/FormField";
import { AuthDivider, GoogleButton } from "@/features/auth/components/GoogleButton";
import { useLogin } from "@/features/auth/hooks";
import { isValidationError, useApiErrorMessage } from "@/features/auth/error-message";

/** Only allow same-origin relative paths to prevent open redirects. */
function getSafeRedirect(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function LoginForm() {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const getErrorMessage = useApiErrorMessage();
  const login = useLogin();
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues, unknown, LoginFormOutput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: searchParams.get("email") ?? "",
      password: "",
    },
  });

  const fieldError = (message?: string) => (message ? tValidation(message) : undefined);

  const onSubmit = (values: LoginFormOutput) => {
    setFormError("");
    login.mutate(values, {
      onSuccess: () => {
        toast.success(t("loginSuccess"));
        router.replace(getSafeRedirect(searchParams.get("redirect"), `/${locale}`));
        router.refresh();
      },
      onError: (error) =>
        setFormError(
          getErrorMessage(error, {
            [MESSAGE_CODE.MESSAGE_CODE_103]: t("errors.accountBanned"),
            // A non-validation 101 on login means the account was created with Google
            ...(!isValidationError(error) && {
              [MESSAGE_CODE.MESSAGE_CODE_101]: t("errors.useGoogleLogin"),
            }),
          })
        ),
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-neutral-main text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t("loginTitle")}
        </h1>
        <p className="text-neutral-muted text-sm leading-relaxed">{t("loginSubtitle")}</p>
      </div>

      <div className="space-y-5">
        <GoogleButton />
        <AuthDivider />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {formError && <FormAlert variant="error" message={formError} />}

          <FormField
            label={t("email")}
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            leftIcon={<Mail />}
            error={fieldError(errors.email?.message)}
            {...register("email")}
          />

          <div className="space-y-2">
            <PasswordField
              label={t("password")}
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              leftIcon={<Lock />}
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
              error={fieldError(errors.password?.message)}
              {...register("password")}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => toast.info(t("forgotPasswordHint"))}
                className="text-brand cursor-pointer text-xs font-medium hover:underline"
              >
                {t("forgotPassword")}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="cta"
            size="lg"
            className="h-12 w-full rounded-xl text-base font-semibold"
            disabled={login.isPending}
          >
            {login.isPending ? t("loggingIn") : t("login")}
          </Button>
        </form>
      </div>

      <p className="text-neutral-muted text-center text-sm">
        {t("noAccount")}{" "}
        <Link href={`/${locale}/register`} className="text-brand font-semibold hover:underline">
          {t("registerNow")}
        </Link>
      </p>
    </div>
  );
}
