import api from "@/lib/api/axios";
import type {
  FacilityAmenityOfferingQueryParams,
  FacilityAmenityOfferingListResponse,
  FacilityAmenityOfferingResponse,
  CreateFacilityAmenityOfferingRequest,
  UpdateFacilityAmenityOfferingRequest,
} from "./types";

/**
 * Lấy danh sách phân bổ tiện ích cho từng cơ sở (Facility Amenity Offerings).
 * Hỗ trợ lọc theo facilityId, amenityId, billingUnit, status, search, minPrice, maxPrice.
 * Endpoint: GET /facility-amenity-offerings
 */
export const fetchFacilityAmenityOfferings = async (
  params?: FacilityAmenityOfferingQueryParams
): Promise<FacilityAmenityOfferingListResponse> => {
  const queryParams: Record<string, unknown> = {
    page: params?.page || 1,
    limit: params?.limit || 10,
    sortBy: params?.sortBy || "createdAt",
    sortOrder: params?.sortOrder || "desc",
  };

  if (params?.search?.trim()) queryParams.search = params.search.trim();
  if (params?.facilityId && params.facilityId !== "ALL") queryParams.facilityId = params.facilityId;
  if (params?.amenityId && params.amenityId !== "ALL") queryParams.amenityId = params.amenityId;
  if (params?.billingUnit && (params.billingUnit as string) !== "ALL") {
    queryParams.billingUnit = params.billingUnit;
  }
  if (params?.status && (params.status as string) !== "ALL") {
    queryParams.status = params.status;
  }
  if (typeof params?.minPrice === "number" && !isNaN(params.minPrice)) {
    queryParams.minPrice = params.minPrice;
  }
  if (typeof params?.maxPrice === "number" && !isNaN(params.maxPrice)) {
    queryParams.maxPrice = params.maxPrice;
  }

  const { data } = await api.get<{ success: boolean; data: FacilityAmenityOfferingListResponse }>(
    "/facility-amenity-offerings",
    { params: queryParams }
  );

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
 * Lấy danh sách các tiện ích còn chỗ trống (availableQuantity > 0) tại một cơ sở cụ thể.
 * Endpoint: GET /facility-amenity-offerings/facility/{facilityId}/available
 */
export const fetchAvailableFacilityAmenities = async (
  facilityId: string
): Promise<FacilityAmenityOfferingResponse[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: FacilityAmenityOfferingResponse[];
  }>(`/facility-amenity-offerings/facility/${facilityId}/available`);

  return data.data || [];
};

/**
 * Lấy chi tiết một gói tiện ích phân bổ tại cơ sở theo ID.
 * Endpoint: GET /facility-amenity-offerings/{id}
 */
export const fetchFacilityAmenityOfferingById = async (
  id: string
): Promise<FacilityAmenityOfferingResponse> => {
  const { data } = await api.get<{
    success: boolean;
    data: FacilityAmenityOfferingResponse;
  }>(`/facility-amenity-offerings/${id}`);

  return data.data;
};

/**
 * Tra cứu kiểm tra tiện ích đã được gán vào cơ sở hay chưa (tránh thêm trùng lặp).
 * Endpoint: GET /facility-amenity-offerings/facility/{facilityId}/amenity/{amenityId}
 * Trả về FacilityAmenityOffering nếu đã tồn tại, hoặc null nếu 404 (chưa gán).
 */
export const fetchFacilityAmenityLookup = async (
  facilityId: string,
  amenityId: string
): Promise<FacilityAmenityOfferingResponse | null> => {
  try {
    const { data } = await api.get<{
      success: boolean;
      data: FacilityAmenityOfferingResponse;
    }>(`/facility-amenity-offerings/facility/${facilityId}/amenity/${amenityId}`);

    return data.data || null;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 404
    ) {
      return null;
    }
    throw error;
  }
};

/**
 * Thêm mới phân bổ tiện ích cho cơ sở & Cấu hình giá ban đầu.
 * Endpoint: POST /facility-amenity-offerings
 */
export const createFacilityAmenityOffering = async (
  payload: CreateFacilityAmenityOfferingRequest
): Promise<FacilityAmenityOfferingResponse> => {
  const { data } = await api.post<{
    success: boolean;
    data: FacilityAmenityOfferingResponse;
  }>("/facility-amenity-offerings", payload);

  return data.data;
};

/**
 * Điều chỉnh số lượng trang bị (totalQuantity) & Đơn giá thuê của tiện ích tại cơ sở.
 * Endpoint: PATCH /facility-amenity-offerings/{id}
 */
export const updateFacilityAmenityOffering = async (
  id: string,
  payload: UpdateFacilityAmenityOfferingRequest
): Promise<FacilityAmenityOfferingResponse> => {
  const { data } = await api.patch<{
    success: boolean;
    data: FacilityAmenityOfferingResponse;
  }>(`/facility-amenity-offerings/${id}`, payload);

  return data.data;
};

/**
 * Xóa mềm / Ngừng cung cấp tiện ích tại cơ sở.
 * Endpoint: DELETE /facility-amenity-offerings/{id}
 */
export const deleteFacilityAmenityOffering = async (id: string): Promise<void> => {
  await api.delete(`/facility-amenity-offerings/${id}`);
};

/**
 * Khôi phục tiện ích đã bị ngừng cung cấp / xóa mềm tại cơ sở.
 * Endpoint: POST /facility-amenity-offerings/{id}/restore
 */
export const restoreFacilityAmenityOffering = async (id: string): Promise<void> => {
  await api.post(`/facility-amenity-offerings/${id}/restore`);
};
