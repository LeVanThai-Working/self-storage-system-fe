import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import {
  API_BASE_URL,
  type ApiErrorResponse,
  type ApiResponse,
  type MessageCode,
} from "@self-storage-system-fe/shared";

export type { ApiErrorResponse, ApiResponse, MessageCode };

export const TOKEN_KEY = "access_token";
export const REFRESH_KEY = "refresh_token";

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
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
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
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const { data } = await api.post<{
          accessToken: string;
          refreshToken?: string;
        }>("/auth/refresh", { refreshToken });

        await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
        if (data.refreshToken) {
          await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
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
