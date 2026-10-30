import type { AuthProviderEnum, RoleEnum, USER_ROLE, UserStatusEnum } from "../enums/user.enum";
import type { FacilitySnapshot } from "./facility.types";
import type {
  LoginRequest,
  RegisterRequest,
  SendOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from "../schemas/request/auth.request.schema";

export type {
  LoginRequest,
  RegisterRequest,
  SendOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
};

export interface AuthUserResponse {
  id?: string;
  _id?: unknown;
  name: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: RoleEnum | USER_ROLE;
  facilityId?: string | null;
  assignedFacilityId?: string | null;
  facility?: FacilitySnapshot | null;
  authProvider?: AuthProviderEnum | "local" | "google";
  status?: UserStatusEnum | "inactive" | "active" | "banned" | "deleted";
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type AuthUser = AuthUserResponse;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  familyId?: string;
}

export interface AuthLoginResponse {
  user: AuthUserResponse;
  tokens: AuthTokens;
}
