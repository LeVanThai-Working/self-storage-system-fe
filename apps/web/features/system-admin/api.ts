import api from "@/lib/api/axios";
import { User, UserQueryParams, CreateUserPayload } from "./types";
import { USER_ROLE } from "@self-storage-system-fe/shared";

// Mock Data as requested if API is failing
const mockUsers: User[] = [
  {
    id: "1",
    name: "Nguyễn Văn Admin",
    email: "admin@storagehub.vn",
    role: USER_ROLE.SYSTEM_ADMIN,
    assignedFacility: "Tất cả cơ sở",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Trần Thị Quản Lý",
    email: "manager.q1@storagehub.vn",
    role: USER_ROLE.FACILITY_MANAGER,
    assignedFacility: "Cơ sở Quận 1",
    status: "active",
    createdAt: "2024-02-15T00:00:00Z",
  },
  {
    id: "3",
    name: "Lê Văn Nhân Viên",
    email: "staff.q1@storagehub.vn",
    role: USER_ROLE.FACILITY_STAFF,
    assignedFacility: "Cơ sở Quận 1",
    status: "inactive",
    createdAt: "2024-03-10T00:00:00Z",
  },
];

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
