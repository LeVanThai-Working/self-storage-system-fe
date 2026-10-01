import {
  API_BASE_URL,
  type ApiResponse,
  type AuthLoginResponse,
  type LoginRequest,
  type RegisterRequest,
  type SendOtpRequest,
} from "@self-storage-system-fe/shared";
import api from "./axios";

// The backend also sets accessToken/refreshToken as HttpOnly cookies on login/register,
// so the tokens in the response body are not stored on the web client.
export const authApi = {
  login: async (payload: LoginRequest) => {
    const { data } = await api.post<ApiResponse<AuthLoginResponse>>("/auth/login", payload);
    return data;
  },

  /** Step 1 of registration: emails a 6-digit OTP (valid for 5 minutes). */
  sendOtp: async (payload: SendOtpRequest) => {
    const { data } = await api.post<ApiResponse<{ message: string }>>("/auth/send-otp", payload);
    return data;
  },

  /** Step 2 of registration: creates the account and signs the user in. */
  register: async (payload: RegisterRequest) => {
    const { data } = await api.post<ApiResponse<AuthLoginResponse>>("/auth/register", payload);
    return data;
  },

  logout: async () => {
    const { data } = await api.post<ApiResponse<null>>("/auth/logout");
    return data;
  },

  /** Full-page redirect URL for Google OAuth (handled by the backend). */
  googleLoginUrl: () => new URL("auth/google", API_BASE_URL).toString(),
};
