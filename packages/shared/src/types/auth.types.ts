import type { AuthProviderEnum, RoleEnum, UserStatusEnum } from "../enums/user.enum";

export interface AuthUserResponse {
  id?: string;
  _id?: unknown;
  name: string;
  email: string;
  phoneNumber?: string;
  role: RoleEnum;
  authProvider?: AuthProviderEnum;
  status?: UserStatusEnum;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  familyId?: string;
}

export interface AuthLoginResponse {
  user: AuthUserResponse;
  tokens: AuthTokens;
}
