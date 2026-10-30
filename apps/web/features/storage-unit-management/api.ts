import api from "@/lib/api/axios";
import type { ApiResponse as Envelope } from "@self-storage-system-fe/shared";
import type {
  AvailableStorageUnitQuery,
  CreateStorageRackRequest,
  CreateStorageUnitRequest,
  FacilityResponse,
  FacilityUnitTypeOfferingResponse,
  PaginatedData,
  RackTierResponse,
  ReconcileStorageUnitsResponse,
  StorageRackQuery,
  StorageRackResponse,
  StorageUnitFilters,
  StorageUnitQuery,
  StorageUnitResponse,
  ToggleMaintenanceRequest,
  UpdateRackTierRequest,
  UpdateStorageRackRequest,
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
 * Chi tiết phòng kho theo ID.
 * Endpoint: GET /storage-units/:id
 */
export const fetchStorageUnitById = async (id: string): Promise<StorageUnitResponse> => {
  const { data } = await api.get<Envelope<StorageUnitResponse>>(`/storage-units/${id}`);
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

/**
 * Toàn bộ phòng kho của cơ sở (không phân trang) để vẽ sơ đồ mặt bằng.
 * Endpoint: GET /storage-units/facility/:facilityId/map-layout
 */
export const fetchFacilityMapLayout = async (
  facilityId: string
): Promise<StorageUnitResponse[]> => {
  const { data } = await api.get<Envelope<StorageUnitResponse[]>>(
    `/storage-units/facility/${facilityId}/map-layout`
  );
  return data.data ?? [];
};

/**
 * Lấy danh sách kho trống đang mở bán.
 * Endpoint: GET /storage-units/facility/:facilityId/available
 */
export const fetchAvailableStorageUnits = async (
  facilityId: string,
  query?: AvailableStorageUnitQuery
): Promise<StorageUnitResponse[]> => {
  const { data } = await api.get<Envelope<StorageUnitResponse[]>>(
    `/storage-units/facility/${facilityId}/available`,
    { params: query }
  );
  return data.data ?? [];
};

/**
 * Bật/Tắt bảo trì (AVAILABLE <-> UNDER_MAINTENANCE / PENDING_CLEARANCE -> UNDER_MAINTENANCE).
 * Endpoint: PATCH /storage-units/:id/maintenance
 */
export const toggleStorageUnitMaintenance = async (
  id: string,
  payload: ToggleMaintenanceRequest
): Promise<StorageUnitResponse> => {
  const { data } = await api.patch<Envelope<StorageUnitResponse>>(
    `/storage-units/${id}/maintenance`,
    payload
  );
  return data.data;
};

/**
 * Đối soát & giải phóng các kho RESERVED mồ côi (Ops / Admin).
 * Endpoint: POST /storage-units/reconcile
 */
export const reconcileStorageUnits = async (): Promise<ReconcileStorageUnitsResponse> => {
  const { data } = await api.post<Envelope<ReconcileStorageUnitsResponse>>(
    "/storage-units/reconcile"
  );
  return data.data;
};

/* =====================================================================
 * STORAGE RACKS & TIERS APIS
 * ===================================================================== */

/**
 * Danh sách kệ kho có phân trang & lọc.
 * Endpoint: GET /storage-racks
 */
export const fetchStorageRacks = async (
  query?: StorageRackQuery
): Promise<PaginatedData<StorageRackResponse>> => {
  const { data } = await api.get<Envelope<PaginatedData<StorageRackResponse>>>("/storage-racks", {
    params: query,
  });
  return data.data;
};

/**
 * Lấy tất cả kệ & tầng kệ của 1 phòng kho (dùng cho Booking và Quản lý Kệ).
 * Endpoint: GET /storage-racks/unit/:unitId
 */
export const fetchUnitStorageRacks = async (unitId: string): Promise<StorageRackResponse[]> => {
  const { data } = await api.get<Envelope<StorageRackResponse[]>>(`/storage-racks/unit/${unitId}`);
  return data.data ?? [];
};

/**
 * Chi tiết kệ kho (kèm tiers).
 * Endpoint: GET /storage-racks/:id
 */
export const fetchStorageRackById = async (id: string): Promise<StorageRackResponse> => {
  const { data } = await api.get<Envelope<StorageRackResponse>>(`/storage-racks/${id}`);
  return data.data;
};

/**
 * Tạo mới kệ kho kèm số tầng tự động.
 * Endpoint: POST /storage-racks
 */
export const createStorageRack = async (
  payload: CreateStorageRackRequest
): Promise<StorageRackResponse> => {
  const { data } = await api.post<Envelope<StorageRackResponse>>("/storage-racks", payload);
  return data.data;
};

/**
 * Cập nhật thông tin kệ (dãy aisle, vị trí bay, zone, đơn giá, trạng thái).
 * Endpoint: PATCH /storage-racks/:id
 */
export const updateStorageRack = async (
  id: string,
  payload: UpdateStorageRackRequest
): Promise<StorageRackResponse> => {
  const { data } = await api.patch<Envelope<StorageRackResponse>>(`/storage-racks/${id}`, payload);
  return data.data;
};

/**
 * Cập nhật thông số tầng kệ (tải trọng tối đa, kích thước, trạng thái).
 * Endpoint: PATCH /storage-racks/tiers/:tierId
 */
export const updateRackTier = async (
  tierId: string,
  payload: UpdateRackTierRequest
): Promise<RackTierResponse> => {
  const { data } = await api.patch<Envelope<RackTierResponse>>(
    `/storage-racks/tiers/${tierId}`,
    payload
  );
  return data.data;
};

/**
 * Xóa kệ kho.
 * Endpoint: DELETE /storage-racks/:id
 */
export const deleteStorageRack = async (id: string): Promise<null> => {
  const { data } = await api.delete<Envelope<null>>(`/storage-racks/${id}`);
  return data.data;
};
