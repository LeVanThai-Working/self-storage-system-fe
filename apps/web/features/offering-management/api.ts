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

  if (params?.facilityId) queryParams.facilityId = params.facilityId;
  if (params?.unitTypeId) queryParams.unitTypeId = params.unitTypeId;
  if (params?.status) queryParams.status = params.status;

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
