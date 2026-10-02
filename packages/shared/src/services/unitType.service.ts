import { httpClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { cleanQueryParams } from "../utils/query.util";
import type { ApiResponse, PaginatedData } from "../types/common.types";
import type {
  UnitTypeResponse,
  CreateUnitTypeRequest,
  UpdateUnitTypeRequest,
  UnitTypeQuery,
} from "../types/unitType.types";

export const unitTypeService = {
  getAll: (query?: UnitTypeQuery): Promise<ApiResponse<PaginatedData<UnitTypeResponse>>> => {
    return httpClient.get<PaginatedData<UnitTypeResponse>>(ENDPOINTS.UNIT_TYPES.BASE, {
      params: cleanQueryParams(query),
    });
  },

  getById: (id: string): Promise<ApiResponse<UnitTypeResponse>> => {
    return httpClient.get<UnitTypeResponse>(ENDPOINTS.UNIT_TYPES.BY_ID(id));
  },

  create: (data: CreateUnitTypeRequest): Promise<ApiResponse<UnitTypeResponse>> => {
    return httpClient.post<UnitTypeResponse>(ENDPOINTS.UNIT_TYPES.BASE, data);
  },

  update: (id: string, data: UpdateUnitTypeRequest): Promise<ApiResponse<UnitTypeResponse>> => {
    return httpClient.patch<UnitTypeResponse>(ENDPOINTS.UNIT_TYPES.BY_ID(id), data);
  },

  delete: (id: string): Promise<ApiResponse<null>> => {
    return httpClient.delete<null>(ENDPOINTS.UNIT_TYPES.BY_ID(id));
  },

  restore: (id: string): Promise<ApiResponse<UnitTypeResponse>> => {
    return httpClient.post<UnitTypeResponse>(ENDPOINTS.UNIT_TYPES.RESTORE(id));
  },
};
