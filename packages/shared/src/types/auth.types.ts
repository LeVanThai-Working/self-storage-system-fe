import type { AuthProviderEnum, RoleEnum, USER_ROLE, UserStatusEnum } from "../enums/user.enum";
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
  role: RoleEnum | USER_ROLE;
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
