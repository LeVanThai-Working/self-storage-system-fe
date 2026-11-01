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
  await api.patch("/auth/change-password", data);
}

export interface ProfileResponse {
  id: string;
  userId: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: string;
  idCardLast4?: string;
  idCardFrontPhotoUrl?: string;
  idCardBackPhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch authenticated customer's profile from /profile/me.
 * Profile collection holds avatarUrl, dateOfBirth, address, gender.
 */
export async function getMyProfileApi(): Promise<ProfileResponse> {
  const response = await api.get<ApiResponse<ProfileResponse> | ProfileResponse>("/profile/me");
  const resData = response.data;
  if (
    resData &&
    typeof resData === "object" &&
    "data" in resData &&
    (resData as ApiResponse<ProfileResponse>).data
  ) {
    return (resData as ApiResponse<ProfileResponse>).data;
  }
  return resData as ProfileResponse;
}

/**
 * Update authenticated customer's profile on /profile/me (avatarUrl, address, dateOfBirth, gender).
 */
export async function updateMyProfileApi(data: {
  avatarUrl?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  idCardFrontPhotoUrl?: string;
  idCardBackPhotoUrl?: string;
}): Promise<ProfileResponse> {
  const response = await api.patch<ApiResponse<ProfileResponse> | ProfileResponse>(
    "/profile/me",
    data
  );
  const resData = response.data;
  if (
    resData &&
    typeof resData === "object" &&
    "data" in resData &&
    (resData as ApiResponse<ProfileResponse>).data
  ) {
    return (resData as ApiResponse<ProfileResponse>).data;
  }
  return resData as ProfileResponse;
}

/**
 * Update user entity in users collection on /users/{id} (name, phoneNumber).
 */
export async function updateUserApi(
  userId: string,
  data: {
    name?: string;
    phoneNumber?: string;
  }
): Promise<AuthUserResponse> {
  const response = await api.patch<ApiResponse<AuthUserResponse> | AuthUserResponse>(
    `/users/${userId}`,
    data
  );
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
 * Update user profile across both users and profiles collections.
 */
export async function updateProfileApi(data: {
  userId?: string;
  name?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  idCardFrontPhotoUrl?: string;
  idCardBackPhotoUrl?: string;
}): Promise<{ user?: AuthUserResponse; profile?: ProfileResponse }> {
  let updatedUser: AuthUserResponse | undefined;
  let updatedProfile: ProfileResponse | undefined;

  if (data.userId && (data.name !== undefined || data.phoneNumber !== undefined)) {
    updatedUser = await updateUserApi(data.userId, {
      name: data.name,
      phoneNumber: data.phoneNumber,
    });
  }

  const hasProfileFields =
    data.avatarUrl !== undefined ||
    data.address !== undefined ||
    data.dateOfBirth !== undefined ||
    data.gender !== undefined ||
    data.idCardFrontPhotoUrl !== undefined ||
    data.idCardBackPhotoUrl !== undefined;

  if (hasProfileFields) {
    updatedProfile = await updateMyProfileApi({
      avatarUrl: data.avatarUrl,
      address: data.address,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      idCardFrontPhotoUrl: data.idCardFrontPhotoUrl,
      idCardBackPhotoUrl: data.idCardBackPhotoUrl,
    });
  }

  return { user: updatedUser, profile: updatedProfile };
}
