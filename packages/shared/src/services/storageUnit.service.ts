import { httpClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { cleanQueryParams } from "../utils/query.util";
import type { ApiResponse, PaginatedData } from "../types/common.types";
import type {
  StorageUnitResponse,
  CreateStorageUnitRequest,
  UpdateStorageUnitRequest,
  ToggleMaintenanceRequest,
  StorageUnitQuery,
  AvailableStorageUnitQuery,
} from "../types/storageUnit.types";

export const storageUnitService = {
  getAll: (query?: StorageUnitQuery): Promise<ApiResponse<PaginatedData<StorageUnitResponse>>> => {
    return httpClient.get<PaginatedData<StorageUnitResponse>>(ENDPOINTS.STORAGE_UNITS.BASE, {
      params: cleanQueryParams(query),
    });
  },

  getById: (id: string): Promise<ApiResponse<StorageUnitResponse>> => {
    return httpClient.get<StorageUnitResponse>(ENDPOINTS.STORAGE_UNITS.BY_ID(id));
  },

  getAvailableUnits: (
    facilityId: string,
    query?: AvailableStorageUnitQuery
  ): Promise<ApiResponse<StorageUnitResponse[]>> => {
    return httpClient.get<StorageUnitResponse[]>(ENDPOINTS.STORAGE_UNITS.AVAILABLE(facilityId), {
      params: cleanQueryParams(query),
    });
  },

  create: (data: CreateStorageUnitRequest): Promise<ApiResponse<StorageUnitResponse>> => {
    return httpClient.post<StorageUnitResponse>(ENDPOINTS.STORAGE_UNITS.BASE, data);
  },

  update: (
    id: string,
    data: UpdateStorageUnitRequest
  ): Promise<ApiResponse<StorageUnitResponse>> => {
    return httpClient.patch<StorageUnitResponse>(ENDPOINTS.STORAGE_UNITS.BY_ID(id), data);
  },

  toggleMaintenance: (
    id: string,
    data: ToggleMaintenanceRequest
  ): Promise<ApiResponse<StorageUnitResponse>> => {
    return httpClient.patch<StorageUnitResponse>(ENDPOINTS.STORAGE_UNITS.MAINTENANCE(id), data);
  },

  delete: (id: string): Promise<ApiResponse<null>> => {
    return httpClient.delete<null>(ENDPOINTS.STORAGE_UNITS.BY_ID(id));
  },

  restore: (id: string): Promise<ApiResponse<StorageUnitResponse>> => {
    return httpClient.post<StorageUnitResponse>(ENDPOINTS.STORAGE_UNITS.RESTORE(id));
  },
};
