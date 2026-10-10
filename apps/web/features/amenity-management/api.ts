import api from "@/lib/api/axios";
import type {
  AmenityQueryParams,
  AmenityListResponse,
  CreateAmenityRequest,
  CreateAmenityResponse,
  UpdateAmenityRequest,
  AmenitySingleResponse,
  AmenityItem,
} from "./types";

/**
 * Lấy danh sách toàn bộ tiện ích & dịch vụ chuẩn (Amenities) kèm phân trang, tìm kiếm và bộ lọc.
 * Endpoint: GET /amenities
 * Query: page, limit, sortBy, sortOrder, search, type, status
 */
export const fetchAmenities = async (params?: AmenityQueryParams): Promise<AmenityListResponse> => {
  const queryParams: Record<string, unknown> = {
    page: params?.page || 1,
    limit: params?.limit || 10,
    sortBy: params?.sortBy || "createdAt",
    sortOrder: params?.sortOrder || "desc",
  };

  if (params?.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params?.type && params.type !== "ALL") {
    queryParams.type = params.type;
  }
  if (params?.status && params.status !== "ALL") {
    queryParams.status = params.status;
  }

  const { data } = await api.get<{
    success: boolean;
    data: AmenityListResponse;
  }>("/amenities", { params: queryParams });

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
 * Tạo mới tiện ích & dịch vụ chuẩn toàn hệ thống.
 * Endpoint: POST /amenities
 */
export const createAmenity = async (payload: CreateAmenityRequest): Promise<AmenityItem> => {
  const { data } = await api.post<CreateAmenityResponse>("/amenities", payload);
  return data.data;
};

/**
 * Lấy chi tiết thông tin một tiện ích theo ID.
 * Endpoint: GET /amenities/{id}
 */
export const fetchAmenityById = async (id: string): Promise<AmenityItem> => {
  const { data } = await api.get<AmenitySingleResponse>(`/amenities/${id}`);
  return data.data;
};

/**
 * Cập nhật thông tin tiện ích theo ID.
 * Endpoint: PATCH /amenities/{id}
 */
export const updateAmenity = async (
  id: string,
  payload: UpdateAmenityRequest
): Promise<AmenityItem> => {
  const { data } = await api.patch<AmenitySingleResponse>(`/amenities/${id}`, payload);
  return data.data;
};

/**
 * Vô hiệu hóa / Xóa mềm một tiện ích theo ID.
 * Endpoint: DELETE /amenities/{id}
 */
export const deleteAmenity = async (id: string): Promise<void> => {
  await api.delete<{ success: boolean; data: null }>(`/amenities/${id}`);
};

/**
 * Khôi phục tiện ích đã bị vô hiệu hóa / xóa theo ID.
 * Endpoint: POST /amenities/{id}/restore
 */
export const restoreAmenity = async (id: string): Promise<AmenityItem> => {
  const { data } = await api.post<AmenitySingleResponse>(`/amenities/${id}/restore`);
  return data.data;
};
