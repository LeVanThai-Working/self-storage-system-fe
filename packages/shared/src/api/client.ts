import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { ApiResponse, ApiErrorResponse } from "../types/common.types";
import { getAccessToken, getBaseUrl } from "./tokenAdapter";

export const axiosInstance: AxiosInstance = axios.create({
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Inject token tự động và set dynamic baseURL
axiosInstance.interceptors.request.use(async (config) => {
  config.baseURL = getBaseUrl();
  const token = await getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Trích xuất response.data & Format ApiErrorResponse
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiErrorResponse>) => {
    const errorData: ApiErrorResponse = error.response?.data || {
      success: false,
      statusCode: error.response?.status || 500,
      messageCode: "INTERNAL_SERVER_ERROR",
      message: error.message || "Lỗi kết nối máy chủ",
    };
    return Promise.reject(errorData);
  }
);

// Type-safe HTTP Methods Helper (Unwrap hoàn toàn AxiosResponse)
export const httpClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    axiosInstance.get(url, config) as unknown as Promise<ApiResponse<T>>,

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    axiosInstance.post(url, data, config) as unknown as Promise<ApiResponse<T>>,

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    axiosInstance.patch(url, data, config) as unknown as Promise<ApiResponse<T>>,

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    axiosInstance.delete(url, config) as unknown as Promise<ApiResponse<T>>,
};
