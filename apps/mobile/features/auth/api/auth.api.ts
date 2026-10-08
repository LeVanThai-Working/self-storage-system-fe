import api from "@/lib/api/axios";
import type { ApiResponse } from "@self-storage-system-fe/shared";
import type {
  AuthLoginResponse,
  AuthUserResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginCredentials,
  RegisterRequest,
  ResetPasswordRequest,
  SendOtpRequest,
} from "../types/auth.types";

/**
 * Sign in using email and password credentials.
 */
export async function loginApi(credentials: LoginCredentials): Promise<AuthLoginResponse> {
  const response = await api.post<ApiResponse<AuthLoginResponse> | AuthLoginResponse>(
    "/auth/login",
    credentials
  );

  const resData = response.data;
  if (
    resData &&
    typeof resData === "object" &&
    "data" in resData &&
    (resData as ApiResponse<AuthLoginResponse>).data
  ) {
    return (resData as ApiResponse<AuthLoginResponse>).data;
  }
  return resData as AuthLoginResponse;
}

/**
 * Fetch profile of the currently authenticated user.
 */
export async function getMeApi(): Promise<AuthUserResponse> {
  const response = await api.get<ApiResponse<AuthUserResponse> | AuthUserResponse>("/auth/me");

  const resData = response.data;
  if (
    resData &&
    typeof resData === "object" &&
    "data" in resData &&
    (resData as ApiResponse<AuthUserResponse>).data
  ) {
    return (resData as ApiResponse<AuthUserResponse>).data;
  }
  return resData as AuthUserResponse;
}

/**
 * Sign out on the backend server.
 */
export async function logoutApi(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    // Non-blocking catch to allow client-side session cleanup
    console.warn("Logout request failed on server:", error);
  }
}

/**
 * Request OTP verification code for registration.
 */
export async function sendOtpApi(data: SendOtpRequest): Promise<void> {
  await api.post("/auth/send-otp", data);
}

/**
 * Register a new user account with OTP verification.
 */
export async function registerApi(
  data: RegisterRequest
): Promise<AuthUserResponse | AuthLoginResponse> {
  const response = await api.post<
    ApiResponse<AuthUserResponse | AuthLoginResponse> | AuthUserResponse | AuthLoginResponse
  >("/auth/register", data);

  const resData = response.data;
  if (
    resData &&
    typeof resData === "object" &&
    "data" in resData &&
    (resData as ApiResponse<AuthUserResponse>).data
  ) {
    return (resData as ApiResponse<AuthUserResponse>).data;
  }
  return resData as AuthUserResponse;
}

/**
 * Request OTP verification code for password reset.
 */
export async function forgotPasswordApi(data: ForgotPasswordRequest): Promise<void> {
  await api.post("/auth/forgot-password", data);
}

/**
 * Reset user password with OTP verification.
 */
export async function resetPasswordApi(data: ResetPasswordRequest): Promise<void> {
  await api.post("/auth/reset-password", data);
}

/**
 * Change user password with current password confirmation.
 */
export async function changePasswordApi(data: ChangePasswordRequest): Promise<void> {
  await api.post("/auth/change-password", data);
}
