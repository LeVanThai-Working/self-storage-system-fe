import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { sendOtpApi, registerApi } from "../api/auth.api";
import { useTranslation } from "@/stores/language.store";
import { AppApiError } from "@/lib/api/axios";
import { toast } from "@/stores/toast.store";
import type { RegisterRequest } from "../types/auth.types";

export function useRegister() {
  const router = useRouter();
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);

  // Mutation to request registration OTP
  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      await sendOtpApi({ email });
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

  // Mutation to complete registration
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      return await registerApi(data);
    },
    onSuccess: () => {
      const msg = t("auth.registerSuccess");
      setSuccessMessage(msg);
      toast.success(msg);
      // Redirect to sign in page upon successful registration
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
    sendOtp: sendOtpMutation.mutate,
    isSendingOtp: sendOtpMutation.isPending,
    isOtpSent,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    errorMessage,
    successMessage,
    clearMessages: () => {
      setErrorMessage(null);
      setSuccessMessage(null);
    },
  };
}
