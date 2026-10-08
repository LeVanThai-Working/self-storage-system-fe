import { USER_ROLE } from "@self-storage-system-fe/shared";

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: USER_ROLE | string;
  status: "active" | "inactive";
  authProvider?: string;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: USER_ROLE;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  role: USER_ROLE | string;
}
