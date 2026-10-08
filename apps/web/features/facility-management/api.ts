import api from "@/lib/api/axios";
import type {
  FacilityQueryParams,
  FacilityListResponse,
  FacilityResponse,
  CreateFacilityRequest,
  UpdateFacilityRequest,
} from "./types";

/**
 * Lấy danh sách toàn bộ cơ sở trong hệ thống kèm phân trang và bộ lọc.
 * Endpoint: GET /facilities
 * Query: page, limit, sortBy, sortOrder, search, city, status
 */
export const fetchFacilities = async (
  params?: FacilityQueryParams
): Promise<FacilityListResponse> => {
  const queryParams: Record<string, unknown> = {
    page: params?.page || 1,
    limit: params?.limit || 10,
    sortBy: params?.sortBy || "createdAt",
    sortOrder: params?.sortOrder || "desc",
  };

  if (params?.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params?.city && params.city !== "ALL") {
    queryParams.city = params.city;
  }
  if (params?.status && params.status !== "ALL") {
    queryParams.status = params.status;
  }

  const { data } = await api.get<{
    success: boolean;
    data: FacilityListResponse;
  }>("/facilities", { params: queryParams });

  return {
    items: data.data?.items || [],
    pagination: data.data?.pagination || {
      page: Number(queryParams.page),
      limit: Number(queryParams.limit),
      totalItems: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};

/**
 * Lấy chi tiết cơ sở theo ID
 * Endpoint: GET /facilities/:id
 */
export const fetchFacilityById = async (id: string): Promise<FacilityResponse> => {
  const { data } = await api.get<{
    success: boolean;
    data: FacilityResponse;
  }>(`/facilities/${id}`);

  return data.data;
};

/**
 * Thêm mới cơ sở vào hệ thống
 * Endpoint: POST /facilities
 */
export const createFacility = async (payload: CreateFacilityRequest): Promise<FacilityResponse> => {
  const { data } = await api.post<{
    success: boolean;
    data: FacilityResponse;
  }>("/facilities", payload);

  return data.data;
};

/**
 * Cập nhật thông tin cơ sở
 * Endpoint: PATCH /facilities/:id
 */
export const updateFacility = async ({
  id,
  payload,
}: {
  id: string;
  payload: UpdateFacilityRequest;
}): Promise<FacilityResponse> => {
  const { data } = await api.patch<{
    success: boolean;
    data: FacilityResponse;
  }>(`/facilities/${id}`, payload);

  return data.data;
};

/**
 * Xóa mềm cơ sở
 * Endpoint: DELETE /facilities/:id
 */
export const deleteFacility = async (id: string): Promise<void> => {
  await api.delete(`/facilities/${id}`);
};

/**
 * Khôi phục cơ sở đã bị xóa mềm
 * Endpoint: POST /facilities/:id/restore
 */
export const restoreFacility = async (id: string): Promise<FacilityResponse> => {
  const { data } = await api.post<{
    success: boolean;
    data: FacilityResponse;
  }>(`/facilities/${id}/restore`);

  return data.data;
};

/**
 * Phân công Quản lý (Facility Manager) cho cơ sở
 * Endpoint: PATCH /facilities/:id/assign-manager
 */
export const assignFacilityManager = async ({
  id,
  managerId,
}: {
  id: string;
  managerId: string;
}): Promise<FacilityResponse> => {
  const { data } = await api.patch<{
    success: boolean;
    data: FacilityResponse;
  }>(`/facilities/${id}/assign-manager`, { managerId });

  return data.data;
};

/**
 * Lấy danh sách các người dùng có vai trò Facility Manager
 * Endpoint: GET /users?role=facility_manager
 */
export const fetchFacilityManagers = async (): Promise<
  Array<{ id: string; name: string; email: string }>
> => {
  try {
    const { data } = await api.get<{
      success: boolean;
      data: {
        items: Array<{
          id: string;
          name: string;
          email: string;
          role: string;
        }>;
      };
    }>("/users", {
      params: {
        role: "facility_manager",
        limit: 100,
      },
    });

    return (data.data?.items || []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
    }));
  } catch (error) {
    console.warn("fetchFacilityManagers failed", error);
    return [];
  }
};
