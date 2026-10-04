import type {
  SendOtpRequest,
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthUserResponse,
  AuthTokens,
  AuthLoginResponse,
} from "@self-storage-system-fe/shared";

export type {
  SendOtpRequest,
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthUserResponse,
  AuthTokens,
  AuthLoginResponse,
};

export type LoginCredentials = LoginRequest;
export type AuthUser = AuthUserResponse;
export type LoginResponseData = AuthLoginResponse;
