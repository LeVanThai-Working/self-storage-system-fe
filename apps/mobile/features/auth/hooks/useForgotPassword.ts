import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { forgotPasswordApi, resetPasswordApi } from "../api/auth.api";
import { useTranslation } from "@/stores/language.store";
import { AppApiError } from "@/lib/api/axios";
import { toast } from "@/stores/toast.store";
import type { ForgotPasswordRequest, ResetPasswordRequest } from "../types/auth.types";

export function useForgotPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);

  // Request password reset OTP
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      await forgotPasswordApi(data);
    },
    onSuccess: () => {
      const msg = t("auth.otpSentSuccess");
      setIsOtpSent(true);
      setSuccessMessage(msg);
      toast.success(msg);
    },
    onError: (error: unknown) => {
      let msg = t("common.error");
      if (error instanceof AppApiError) {
        if (error.messageCode) {
          const translated = t(`api.${error.messageCode}`);
          if (translated && !translated.startsWith("missing translation")) {
            msg = translated;
          } else {
            msg = error.message || t("common.error");
          }
        } else {
          msg = error.message || t("common.error");
        }
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  // Submit reset password with OTP
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      await resetPasswordApi(data);
    },
    onSuccess: () => {
      const msg = t("auth.resetPasswordSuccess");
      setSuccessMessage(msg);
      toast.success(msg);
      setTimeout(() => {
        router.replace("/(auth)/login" as any);
      }, 1500);
    },
    onError: (error: unknown) => {
      let msg = t("common.error");
      if (error instanceof AppApiError) {
        if (error.messageCode) {
          const translated = t(`api.${error.messageCode}`);
          if (translated && !translated.startsWith("missing translation")) {
            msg = translated;
          } else {
            msg = error.message || t("common.error");
          }
        } else {
          msg = error.message || t("common.error");
        }
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  return {
    sendResetOtp: forgotPasswordMutation.mutate,
    isSendingOtp: forgotPasswordMutation.isPending,
    isOtpSent,
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
    errorMessage,
    successMessage,
    clearMessages: () => {
      setErrorMessage(null);
      setSuccessMessage(null);
    },
  };
}
