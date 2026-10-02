import { httpClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { cleanQueryParams } from "../utils/query.util";
import type { ApiResponse, PaginatedData } from "../types/common.types";
import type {
  FacilityAmenityOfferingResponse,
  CreateFacilityAmenityOfferingRequest,
  UpdateFacilityAmenityOfferingRequest,
  FacilityAmenityOfferingQuery,
} from "../types/facilityAmenityOffering.types";

export const facilityAmenityOfferingService = {
  getAll: (
    query?: FacilityAmenityOfferingQuery
  ): Promise<ApiResponse<PaginatedData<FacilityAmenityOfferingResponse>>> => {
    return httpClient.get<PaginatedData<FacilityAmenityOfferingResponse>>(
      ENDPOINTS.FACILITY_AMENITY_OFFERINGS.BASE,
      {
        params: cleanQueryParams(query),
      }
    );
  },

  getById: (id: string): Promise<ApiResponse<FacilityAmenityOfferingResponse>> => {
    return httpClient.get<FacilityAmenityOfferingResponse>(
      ENDPOINTS.FACILITY_AMENITY_OFFERINGS.BY_ID(id)
    );
  },

  getAvailable: (facilityId: string): Promise<ApiResponse<FacilityAmenityOfferingResponse[]>> => {
    return httpClient.get<FacilityAmenityOfferingResponse[]>(
      ENDPOINTS.FACILITY_AMENITY_OFFERINGS.AVAILABLE(facilityId)
    );
  },

  getByFacilityAndAmenity: (
    facilityId: string,
    amenityId: string
  ): Promise<ApiResponse<FacilityAmenityOfferingResponse>> => {
    return httpClient.get<FacilityAmenityOfferingResponse>(
      ENDPOINTS.FACILITY_AMENITY_OFFERINGS.BY_FACILITY_AND_AMENITY(facilityId, amenityId)
    );
  },

  create: (
    data: CreateFacilityAmenityOfferingRequest
  ): Promise<ApiResponse<FacilityAmenityOfferingResponse>> => {
    return httpClient.post<FacilityAmenityOfferingResponse>(
      ENDPOINTS.FACILITY_AMENITY_OFFERINGS.BASE,
      data
    );
  },

  update: (
    id: string,
    data: UpdateFacilityAmenityOfferingRequest
  ): Promise<ApiResponse<FacilityAmenityOfferingResponse>> => {
    return httpClient.patch<FacilityAmenityOfferingResponse>(
      ENDPOINTS.FACILITY_AMENITY_OFFERINGS.BY_ID(id),
      data
    );
  },

  delete: (id: string): Promise<ApiResponse<null>> => {
    return httpClient.delete<null>(ENDPOINTS.FACILITY_AMENITY_OFFERINGS.BY_ID(id));
  },

  restore: (id: string): Promise<ApiResponse<FacilityAmenityOfferingResponse>> => {
    return httpClient.post<FacilityAmenityOfferingResponse>(
      ENDPOINTS.FACILITY_AMENITY_OFFERINGS.RESTORE(id)
    );
  },
};
