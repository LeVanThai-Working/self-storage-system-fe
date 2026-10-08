import {
  FacilityResponse,
  FacilityStatusEnum,
  IOperatingHours,
  PaginationMeta,
  CreateFacilityRequest,
  UpdateFacilityRequest,
  AssignManagerRequest,
} from "@self-storage-system-fe/shared";

export type {
  FacilityResponse,
  IOperatingHours,
  CreateFacilityRequest,
  UpdateFacilityRequest,
  AssignManagerRequest,
};
export { FacilityStatusEnum };

export interface FacilityQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  city?: string;
  status?: FacilityStatusEnum | string;
}

export interface FacilityListResponse {
  items: FacilityResponse[];
  pagination: PaginationMeta;
}
