import api from "@/lib/api/axios";
import { User, UserQueryParams, CreateUserPayload } from "./types";

export const fetchUsers = async (
  params?: UserQueryParams
): Promise<{ data: User[]; total: number }> => {
  try {
    // Nếu có từ khóa search thì gọi endpoint /users/search, ngược lại gọi /users
    const endpoint = params?.search ? "/users/search" : "/users";

    // Đảm bảo truyền đủ các tham số bắt buộc theo yêu cầu của Swagger
    const queryParams = {
      page: params?.page || 1,
      limit: params?.limit || 10,
      sortBy: params?.sortBy || "createdAt",
      sortOrder: params?.sortOrder || "desc",
      ...params,
    };

    const { data } = await api.get(endpoint, { params: queryParams });
    // Dữ liệu trả về từ backend nằm trong data.data.items
    return {
      data: data.data?.items || [],
      total: data.data?.pagination?.totalItems || 0,
    };
  } catch (error) {
    console.warn("API GET /users failed", error);
    // Trả về mảng rỗng nếu gọi API thất bại (tránh vỡ giao diện)
    return { data: [], total: 0 };
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
