import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  API_BASE_URL,
  type ApiErrorResponse,
  type ApiResponse,
  type MessageCode,
} from "@self-storage-system-fe/shared";

export type { ApiErrorResponse, ApiResponse, MessageCode };

/**
 * Custom error class that gives React Query and UI layers direct access
 * to the message, messageCode, and validation errors from the backend.
 */
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

// 1. Create the Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // 20s timeout to avoid hanging connections
  withCredentials: true, // Automatically attach HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 2. Queue management for concurrent requests that encounter a 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

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

/**
 * Safely redirect to the login page — SSR-safe, preserves the current URL,
 * and avoids infinite redirect loops if already on the login page.
 */
const redirectToLogin = () => {
  if (typeof window === "undefined") return;

  const pathname = window.location.pathname;
  // Detect locale from URL (next-intl format: /vi or /en)
  const isEn = pathname.startsWith("/en");
  const loginPath = isEn ? "/en/login" : "/vi/login";

  // Guard against infinite redirect if already on the login page
  if (pathname.includes("/login")) return;

  const searchParams = new URLSearchParams();
  searchParams.set("redirect", pathname + window.location.search);

  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `${loginPath}?${searchParams.toString()}`;
};

// 3. Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Additional dynamic headers (Accept-Language, Trace-Id, etc.) can be added here
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Network error or no response received from the server
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

    // Skip token refresh for auth endpoints to avoid infinite loops
    const isAuthEndpoint =
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register");

    // Handle expired access token (401 Unauthorized)
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
        await api.post("/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);
        redirectToLogin();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract the error message from the backend payload
    const serverMessage =
      errorData?.message || error.message || "An error occurred. Please try again.";

    return Promise.reject(new AppApiError(serverMessage, status, error.response, errorData));
  }
);

export default api;
