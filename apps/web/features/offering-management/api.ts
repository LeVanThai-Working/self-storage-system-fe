import api from "@/lib/api/axios";
import type {
  OfferingQueryParams,
  OfferingListResponse,
  FacilityUnitTypeOfferingResponse,
  CreateOfferingRequest,
  UpdateOfferingRequest,
} from "./types";

/**
 * Lấy danh sách bảng giá (Offerings) đã thiết lập cho từng cơ sở theo loại kho.
 * Endpoint: GET /facility-unit-type-offerings
 */
export const fetchOfferings = async (
  params?: OfferingQueryParams
): Promise<OfferingListResponse> => {
  const queryParams: Record<string, unknown> = {
    page: params?.page || 1,
    limit: params?.limit || 10,
    sortBy: params?.sortBy || "createdAt",
    sortOrder: params?.sortOrder || "desc",
  };

  if (params?.search?.trim()) queryParams.search = params.search.trim();
  if (params?.facilityId && params.facilityId !== "ALL") queryParams.facilityId = params.facilityId;
  if (params?.unitTypeId && params.unitTypeId !== "ALL") queryParams.unitTypeId = params.unitTypeId;
  if (params?.billingUnit && (params.billingUnit as string) !== "ALL")
    queryParams.billingUnit = params.billingUnit;
  if (params?.status && (params.status as string) !== "ALL") queryParams.status = params.status;
  if (typeof params?.minPrice === "number" && !isNaN(params.minPrice))
    queryParams.minPrice = params.minPrice;
  if (typeof params?.maxPrice === "number" && !isNaN(params.maxPrice))
    queryParams.maxPrice = params.maxPrice;

  const { data } = await api.get<{ success: boolean; data: OfferingListResponse }>(
    "/facility-unit-type-offerings",
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
 * Kiểm tra nhanh xem một cơ sở đã thiết lập bảng giá cho loại kho đó hay chưa.
 * Endpoint: GET /facility-unit-type-offerings/facility/{facilityId}/unit-type/{unitTypeId}
 * Trả về Offering nếu đã tồn tại, hoặc null nếu chưa có (404).
 */
export const fetchOfferingByFacilityAndUnitType = async (
  facilityId: string,
  unitTypeId: string
): Promise<FacilityUnitTypeOfferingResponse | null> => {
  try {
    const { data } = await api.get<{
      success: boolean;
      data: FacilityUnitTypeOfferingResponse;
    }>(`/facility-unit-type-offerings/facility/${facilityId}/unit-type/${unitTypeId}`);
    return data.data;
  } catch (err: unknown) {
    const apiErr = err as { response?: { status?: number } };
    if (apiErr.response?.status === 404) {
      return null;
    }
    throw err;
  }
};

/**
 * Lấy chi tiết thông tin bảng giá theo ID.
 * Endpoint: GET /facility-unit-type-offerings/{id}
 */
export const fetchOfferingById = async (id: string): Promise<FacilityUnitTypeOfferingResponse> => {
  const { data } = await api.get<{
    success: boolean;
    data: FacilityUnitTypeOfferingResponse;
  }>(`/facility-unit-type-offerings/${id}`);
  return data.data;
};

/**
 * Mở bán một loại kho (Unit Type) tại một cơ sở, kèm bảng giá.
 * Endpoint: POST /facility-unit-type-offerings
 */
export const createOffering = async (
  payload: CreateOfferingRequest
): Promise<FacilityUnitTypeOfferingResponse> => {
  const { data } = await api.post<{ success: boolean; data: FacilityUnitTypeOfferingResponse }>(
    "/facility-unit-type-offerings",
    payload
  );
  return data.data;
};

/**
 * Cập nhật bảng giá / trạng thái của một offering.
 * Endpoint: PATCH /facility-unit-type-offerings/{id}
 */
export const updateOffering = async (
  id: string,
  payload: UpdateOfferingRequest
): Promise<FacilityUnitTypeOfferingResponse> => {
  const { data } = await api.patch<{ success: boolean; data: FacilityUnitTypeOfferingResponse }>(
    `/facility-unit-type-offerings/${id}`,
    payload
  );
  return data.data;
};

/**
 * Ngừng bán (xóa mềm) một offering.
 * Endpoint: DELETE /facility-unit-type-offerings/{id}
 */
export const deleteOffering = async (id: string): Promise<void> => {
  await api.delete<{ success: boolean; data: null }>(`/facility-unit-type-offerings/${id}`);
};

/**
 * Khôi phục một offering đã bị ngừng bán.
 * Endpoint: POST /facility-unit-type-offerings/{id}/restore
 */
export const restoreOffering = async (id: string): Promise<FacilityUnitTypeOfferingResponse> => {
  const { data } = await api.post<{ success: boolean; data: FacilityUnitTypeOfferingResponse }>(
    `/facility-unit-type-offerings/${id}/restore`
  );
  return data.data;
};
