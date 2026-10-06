import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse, AuthLoginResponse } from "@self-storage-system-fe/shared";
import { authApi } from "./api";
import { useAuthStore } from "./store";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

/** Fetches /auth/me and keeps the auth store in sync with the result. */
export const useCurrentUser = () => {
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => (await authApi.getMe()).data,
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess) setCurrentUser(query.data);
    else if (query.isError) clearAuth();
  }, [query.isSuccess, query.isError, query.data, setCurrentUser, clearAuth]);

  return query;
};

/** Login and register both sign the user in and return the user in the response body. */
const useSignedInHandler = () => {
  const queryClient = useQueryClient();
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  return ({ data }: ApiResponse<AuthLoginResponse>) => {
    setCurrentUser(data.user);
    queryClient.setQueryData(authKeys.me(), data.user);
  };
};

export const useLogin = () => {
  const onSignedIn = useSignedInHandler();
  return useMutation({ mutationFn: authApi.login, onSuccess: onSignedIn });
};

export const useSendOtp = () => useMutation({ mutationFn: authApi.sendOtp });

export const useRegister = () => {
  const onSignedIn = useSignedInHandler();
  return useMutation({ mutationFn: authApi.register, onSuccess: onSignedIn });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
};
