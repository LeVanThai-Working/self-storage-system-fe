import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { loginApi, getMeApi } from "../api/auth.api";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { useAuthStore } from "../stores/auth.store";
import { useTranslation } from "@/stores/language.store";
import { AppApiError } from "@/lib/api/axios";
import { toast } from "@/stores/toast.store";
import type { AuthUser, LoginCredentials } from "../types/auth.types";

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      setErrorMessage(null);

      // 1. Invoke login API
      const loginData = await loginApi(credentials);

      // 2. Extract access & refresh tokens from response
      const accessToken = loginData.tokens.accessToken;
      const refreshToken = loginData.tokens.refreshToken;

      if (!accessToken) {
        throw new Error("Missing accessToken in server response");
      }

      // 3. Persist tokens into hardware-backed SecureStore
      await tokenStorage.setTokens(accessToken, refreshToken);

      // 4. Retrieve authenticated user profile (fallback to login response user if GET /auth/me fails)
      let user: AuthUser;
      try {
        user = await getMeApi();
      } catch (meError) {
        console.warn("GET /auth/me call failed, using login payload user as fallback:", meError);
        if (loginData.user) {
          user = loginData.user;
        } else {
          throw meError;
        }
      }

      return user;
    },
    onSuccess: (user) => {
      // 5. Store user profile in Zustand auth state
      setAuth(user);
      toast.success(t("auth.loginSuccess") || t("common.confirm"));

      // 6. Navigate to main tabs screen
      router.replace("/(tabs)" as any);
    },
    onError: (error: unknown) => {
      console.error("Sign in failed:", error);
      let msg = t("auth.loginFailed");
      if (error instanceof AppApiError) {
        if (error.messageCode) {
          const translatedMessage = t(`api.${error.messageCode}`);
          if (translatedMessage && !translatedMessage.startsWith("missing translation")) {
            msg = translatedMessage;
          } else {
            msg = error.message || t("auth.loginFailed");
          }
        } else {
          msg = error.message || t("auth.loginFailed");
        }
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    errorMessage,
    clearError: () => setErrorMessage(null),
  };
}
