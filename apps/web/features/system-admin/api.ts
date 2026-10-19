import api from "@/lib/api/axios";
import { User, UserQueryParams, CreateUserPayload, UserListResponse } from "./types";

export const fetchUsers = async (params?: UserQueryParams): Promise<UserListResponse> => {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  try {
    // Nếu có từ khóa search thì gọi endpoint /users/search, ngược lại gọi /users
    const endpoint = params?.search?.trim() ? "/users/search" : "/users";

    // Đảm bảo truyền đủ các tham số bắt buộc theo yêu cầu của Swagger
    const queryParams: Record<string, unknown> = {
      page,
      limit,
      sortBy: params?.sortBy || "createdAt",
      sortOrder: params?.sortOrder || "desc",
    };

    if (params?.search?.trim()) {
      queryParams.search = params.search.trim();
    }

    const { data } = await api.get(endpoint, { params: queryParams });
    const items: User[] = data.data?.items || [];
    const pagination = data.data?.pagination || {
      page,
      limit,
      totalItems: items.length,
      totalPages: Math.ceil(items.length / limit) || 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    return {
      data: items,
      total: pagination.totalItems ?? items.length,
      pagination: {
        page: pagination.page ?? page,
        limit: pagination.limit ?? limit,
        totalItems: pagination.totalItems ?? items.length,
        totalPages: pagination.totalPages ?? 1,
        hasNextPage: Boolean(pagination.hasNextPage),
        hasPrevPage: Boolean(pagination.hasPrevPage),
      },
    };
  } catch (error) {
    console.warn("API GET /users failed", error);
    return {
      data: [],
      total: 0,
      pagination: {
        page,
        limit,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
};

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  try {
    const { data } = await api.post("/users", payload);
    return data.data || data; // Tùy thuộc vào việc backend bọc trong { data: ... } hay không
  } catch (error) {
    console.error("API POST /users failed", error);
    throw error;
  }
};

export const fetchUserById = async (id: string): Promise<User> => {
  try {
    const { data } = await api.get(`/users/${id}`);
    return data.data || data; // Backend trả về dữ liệu trong data.data
  } catch (error) {
    console.error(`API GET /users/${id} failed`, error);
    throw error;
  }
};

export const updateUser = async ({
  id,
  payload,
}: {
  id: string;
  payload: Partial<User>;
}): Promise<User> => {
  try {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data.data || data; // Trả về dữ liệu được bọc trong data.data nếu có
  } catch (error) {
    console.error(`API PATCH /users/${id} failed`, error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    console.error(`API DELETE /users/${id} failed`, error);
    throw error;
  }
};
