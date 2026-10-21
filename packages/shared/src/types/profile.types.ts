import { GenderEnum } from "../enums/user.enum";

export interface ProfileResponse {
  id?: string;
  userId: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: GenderEnum;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  avatarUrl?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: GenderEnum;
}
