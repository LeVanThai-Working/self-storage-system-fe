import { httpClient } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { cleanQueryParams } from "../utils/query.util";
import type { ApiResponse, PaginatedData } from "../types/common.types";
import type {
  FacilityUnitTypeOfferingResponse,
  CreateOfferingRequest,
  UpdateOfferingRequest,
  OfferingQuery,
} from "../types/facilityUnitTypeOffering.types";

export const facilityUnitTypeOfferingService = {
  getAll: (
    query?: OfferingQuery
  ): Promise<ApiResponse<PaginatedData<FacilityUnitTypeOfferingResponse>>> => {
    return httpClient.get<PaginatedData<FacilityUnitTypeOfferingResponse>>(
      ENDPOINTS.FACILITY_UNIT_TYPE_OFFERINGS.BASE,
      {
        params: cleanQueryParams(query),
      }
    );
  },

  getById: (id: string): Promise<ApiResponse<FacilityUnitTypeOfferingResponse>> => {
    return httpClient.get<FacilityUnitTypeOfferingResponse>(
      ENDPOINTS.FACILITY_UNIT_TYPE_OFFERINGS.BY_ID(id)
    );
  },

  getByFacilityAndUnitType: (
    facilityId: string,
    unitTypeId: string
  ): Promise<ApiResponse<FacilityUnitTypeOfferingResponse>> => {
    return httpClient.get<FacilityUnitTypeOfferingResponse>(
      ENDPOINTS.FACILITY_UNIT_TYPE_OFFERINGS.BY_FACILITY_AND_UNIT_TYPE(facilityId, unitTypeId)
    );
  },

  create: (data: CreateOfferingRequest): Promise<ApiResponse<FacilityUnitTypeOfferingResponse>> => {
    return httpClient.post<FacilityUnitTypeOfferingResponse>(
      ENDPOINTS.FACILITY_UNIT_TYPE_OFFERINGS.BASE,
      data
    );
  },

  update: (
    id: string,
    data: UpdateOfferingRequest
  ): Promise<ApiResponse<FacilityUnitTypeOfferingResponse>> => {
    return httpClient.patch<FacilityUnitTypeOfferingResponse>(
      ENDPOINTS.FACILITY_UNIT_TYPE_OFFERINGS.BY_ID(id),
      data
    );
  },

  delete: (id: string): Promise<ApiResponse<null>> => {
    return httpClient.delete<null>(ENDPOINTS.FACILITY_UNIT_TYPE_OFFERINGS.BY_ID(id));
  },

  restore: (id: string): Promise<ApiResponse<FacilityUnitTypeOfferingResponse>> => {
    return httpClient.post<FacilityUnitTypeOfferingResponse>(
      ENDPOINTS.FACILITY_UNIT_TYPE_OFFERINGS.RESTORE(id)
    );
  },
};
