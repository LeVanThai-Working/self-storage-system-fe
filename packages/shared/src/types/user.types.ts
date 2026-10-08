import type { RoleEnum, UserStatusEnum, AuthProviderEnum, GenderEnum } from "../enums/user.enum";

export interface UserProfile {
  id?: string;
  _id?: unknown;
  name: string;
  email: string;
  phoneNumber?: string;
  role: RoleEnum;
  status?: UserStatusEnum;
  authProvider?: AuthProviderEnum;
  gender?: GenderEnum;
  avatarUrl?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
