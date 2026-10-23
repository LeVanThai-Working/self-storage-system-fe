import { USER_ROLE, RoleEnum } from "@self-storage-system-fe/shared";

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: USER_ROLE | RoleEnum | string;
  status: "active" | "inactive" | string;
  authProvider?: string;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UserListResponse {
  data: User[];
  total: number;
  pagination: UserPagination;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  role: USER_ROLE | RoleEnum | string;
}
