import { httpClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { cleanQueryParams } from "../utils/query.util";
import type { ApiResponse, PaginatedData } from "../types/common.types";
import type {
  FacilityResponse,
  CreateFacilityRequest,
  UpdateFacilityRequest,
  FacilityQuery,
  AssignManagerRequest,
} from "../types/facility.types";

export const facilityService = {
  getAll: (query?: FacilityQuery): Promise<ApiResponse<PaginatedData<FacilityResponse>>> => {
    return httpClient.get<PaginatedData<FacilityResponse>>(ENDPOINTS.FACILITIES.BASE, {
      params: cleanQueryParams(query),
    });
  },

  getById: (id: string): Promise<ApiResponse<FacilityResponse>> => {
    return httpClient.get<FacilityResponse>(ENDPOINTS.FACILITIES.BY_ID(id));
  },

  create: (data: CreateFacilityRequest): Promise<ApiResponse<FacilityResponse>> => {
    return httpClient.post<FacilityResponse>(ENDPOINTS.FACILITIES.BASE, data);
  },

  update: (id: string, data: UpdateFacilityRequest): Promise<ApiResponse<FacilityResponse>> => {
    return httpClient.patch<FacilityResponse>(ENDPOINTS.FACILITIES.BY_ID(id), data);
  },

  delete: (id: string): Promise<ApiResponse<null>> => {
    return httpClient.delete<null>(ENDPOINTS.FACILITIES.BY_ID(id));
  },

  assignManager: (
    id: string,
    data: AssignManagerRequest
  ): Promise<ApiResponse<FacilityResponse>> => {
    return httpClient.patch<FacilityResponse>(ENDPOINTS.FACILITIES.ASSIGN_MANAGER(id), data);
  },

  restore: (id: string): Promise<ApiResponse<FacilityResponse>> => {
    return httpClient.post<FacilityResponse>(ENDPOINTS.FACILITIES.RESTORE(id));
  },
};
