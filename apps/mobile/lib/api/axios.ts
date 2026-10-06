import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import {
  API_BASE_URL,
  type ApiErrorResponse,
  type ApiResponse,
  type MessageCode,
} from "@self-storage-system-fe/shared";

export type { ApiErrorResponse, ApiResponse, MessageCode };

export class AppApiError extends Error {
  statusCode: number;
  messageCode?: MessageCode | string;
  path?: string;
  timestamp?: string;
  errors?: unknown;
  response?: AxiosError<ApiErrorResponse>["response"];
  raw?: ApiErrorResponse;

  constructor(
    message: string,
    statusCode: number = 500,
    response?: AxiosError<ApiErrorResponse>["response"],
    data?: ApiErrorResponse
  ) {
    super(message);
    this.name = "AppApiError";
    this.statusCode = data?.statusCode ?? statusCode;
    this.messageCode = data?.messageCode;
    this.path = data?.path;
    this.timestamp = data?.timestamp;
    this.errors = data?.errors;
    this.response = response;
    this.raw = data ?? response?.data;
  }
}

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // If SecureStore is not accessible, proceed without Authorization header
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest || !error.response) {
      const isNetworkError = !error.response && Boolean(error.message);
      return Promise.reject(
        new AppApiError(
          isNetworkError
            ? "Unable to connect to the server. Please check your network connection."
            : error.message || "An unknown error occurred.",
          0,
          undefined
        )
      );
    }

    const status = error.response.status;
    const url = originalRequest.url || "";
    const errorData = error.response.data;

    const isAuthEndpoint =
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await api.post<{
          accessToken?: string;
          refreshToken?: string;
          tokens?: { accessToken?: string; refreshToken?: string };
          data?: {
            accessToken?: string;
            refreshToken?: string;
            tokens?: { accessToken?: string; refreshToken?: string };
          };
        }>("/auth/refresh", { refreshToken });

        const newAccessToken =
          res.data.data?.tokens?.accessToken ??
          res.data.data?.accessToken ??
          res.data.tokens?.accessToken ??
          res.data.accessToken;
        const newRefreshToken =
          res.data.data?.tokens?.refreshToken ??
          res.data.data?.refreshToken ??
          res.data.tokens?.refreshToken ??
          res.data.refreshToken;

        if (!newAccessToken) {
          throw new Error("Invalid token refresh response");
        }

        await tokenStorage.setTokens(newAccessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);
        await tokenStorage.clearTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const serverMessage =
      errorData?.message || error.message || "An error occurred. Please try again.";

    return Promise.reject(new AppApiError(serverMessage, status, error.response, errorData));
  }
);

export default api;
