import { httpClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { cleanQueryParams } from "../utils/query.util";
import type { ApiResponse, PaginatedData } from "../types/common.types";
import type {
  AmenityResponse,
  CreateAmenityRequest,
  UpdateAmenityRequest,
  AmenityQuery,
} from "../types/amenity.types";

export const amenityService = {
  getAll: (query?: AmenityQuery): Promise<ApiResponse<PaginatedData<AmenityResponse>>> => {
    return httpClient.get<PaginatedData<AmenityResponse>>(ENDPOINTS.AMENITIES.BASE, {
      params: cleanQueryParams(query),
    });
  },

  getById: (id: string): Promise<ApiResponse<AmenityResponse>> => {
    return httpClient.get<AmenityResponse>(ENDPOINTS.AMENITIES.BY_ID(id));
  },

  create: (data: CreateAmenityRequest): Promise<ApiResponse<AmenityResponse>> => {
    return httpClient.post<AmenityResponse>(ENDPOINTS.AMENITIES.BASE, data);
  },

  update: (id: string, data: UpdateAmenityRequest): Promise<ApiResponse<AmenityResponse>> => {
    return httpClient.patch<AmenityResponse>(ENDPOINTS.AMENITIES.BY_ID(id), data);
  },

  delete: (id: string): Promise<ApiResponse<null>> => {
    return httpClient.delete<null>(ENDPOINTS.AMENITIES.BY_ID(id));
  },

  restore: (id: string): Promise<ApiResponse<AmenityResponse>> => {
    return httpClient.post<AmenityResponse>(ENDPOINTS.AMENITIES.RESTORE(id));
  },
};
