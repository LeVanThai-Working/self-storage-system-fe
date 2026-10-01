import type { USER_ROLE } from "../constants/role";

// Request/response contracts mirror the backend auth module (src/modules/auth/schemas)

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SendOtpRequest {
  email: string;
}

export interface RegisterRequest {
  email: string;
  otp: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

export interface AuthUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: USER_ROLE;
  authProvider?: "local" | "google";
  status?: "inactive" | "active" | "banned" | "deleted";
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  familyId?: string;
}

export interface AuthLoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
