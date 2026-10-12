import api from "@/lib/api/axios";
import type { ApiResponse as Envelope } from "@self-storage-system-fe/shared";
import type {
  CreateStorageUnitRequest,
  FacilityResponse,
  FacilityUnitTypeOfferingResponse,
  PaginatedData,
  StorageUnitFilters,
  StorageUnitQuery,
  StorageUnitResponse,
  UpdateStorageUnitRequest,
} from "./types";

/**
 * Lấy cơ sở mà Facility Manager hiện tại đang phụ trách.
 * Endpoint: GET /my-facility
 */
export const fetchMyFacility = async (): Promise<FacilityResponse> => {
  const { data } = await api.get<Envelope<FacilityResponse>>("/my-facility");
  return data.data;
};

/**
 * Danh sách phòng kho (luôn giới hạn theo facilityId của manager).
 * Endpoint: GET /storage-units
 */
export const fetchStorageUnits = async (
  facilityId: string,
  filters: StorageUnitFilters
): Promise<PaginatedData<StorageUnitResponse>> => {
  const params: StorageUnitQuery = {
    facilityId,
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy,
    sortOrder: filters.sortBy === "createdAt" ? "desc" : "asc",
  };

  if (filters.unitNumber?.trim()) params.unitNumber = filters.unitNumber.trim();
  if (filters.zone?.trim()) params.zone = filters.zone.trim();
  if (typeof filters.floor === "number") params.floor = filters.floor;
  if (filters.unitTypeId) params.unitTypeId = filters.unitTypeId;
  if (filters.status) params.status = filters.status;

  const { data } = await api.get<Envelope<PaginatedData<StorageUnitResponse>>>("/storage-units", {
    params,
  });
  return data.data;
};

/**
 * Đếm số phòng theo trạng thái (limit = 1, chỉ lấy pagination.totalItems) cho thẻ thống kê.
 */
export const fetchStorageUnitCount = async (
  facilityId: string,
  status?: StorageUnitQuery["status"]
): Promise<number> => {
  const { data } = await api.get<Envelope<PaginatedData<StorageUnitResponse>>>("/storage-units", {
    params: { facilityId, status, page: 1, limit: 1 },
  });
  return data.data?.pagination?.totalItems ?? 0;
};

/**
 * Các loại kho mà cơ sở đang mở bán (offering ACTIVE) - nguồn cho dropdown "Loại kho".
 * Endpoint: GET /facility-unit-type-offerings
 */
export const fetchActiveOfferings = async (
  facilityId: string
): Promise<FacilityUnitTypeOfferingResponse[]> => {
  const { data } = await api.get<Envelope<PaginatedData<FacilityUnitTypeOfferingResponse>>>(
    "/facility-unit-type-offerings",
    { params: { facilityId, status: "active", page: 1, limit: 100 } }
  );
  return data.data?.items ?? [];
};

/** Endpoint: POST /storage-units */
export const createStorageUnit = async (
  payload: CreateStorageUnitRequest
): Promise<StorageUnitResponse> => {
  const { data } = await api.post<Envelope<StorageUnitResponse>>("/storage-units", payload);
  return data.data;
};

/** Endpoint: PATCH /storage-units/:id */
export const updateStorageUnit = async (
  id: string,
  payload: UpdateStorageUnitRequest
): Promise<StorageUnitResponse> => {
  const { data } = await api.patch<Envelope<StorageUnitResponse>>(`/storage-units/${id}`, payload);
  return data.data;
};

/** Xóa mềm. Endpoint: DELETE /storage-units/:id */
export const deleteStorageUnit = async (id: string): Promise<null> => {
  const { data } = await api.delete<Envelope<null>>(`/storage-units/${id}`);
  return data.data;
};

/** Khôi phục phòng đã xóa mềm. Endpoint: POST /storage-units/:id/restore */
export const restoreStorageUnit = async (id: string): Promise<StorageUnitResponse> => {
  const { data } = await api.post<Envelope<StorageUnitResponse>>(`/storage-units/${id}/restore`);
  return data.data;
};
