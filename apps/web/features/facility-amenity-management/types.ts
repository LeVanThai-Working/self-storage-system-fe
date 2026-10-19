import {
  BillingUnitEnum,
  FacilityAmenityOfferingStatusEnum,
  type FacilityAmenityOfferingResponse,
  type CreateFacilityAmenityOfferingRequest,
  type UpdateFacilityAmenityOfferingRequest,
  type FacilityAmenityOfferingQuery,
  type PaginationMeta,
} from "@self-storage-system-fe/shared";

export { BillingUnitEnum, FacilityAmenityOfferingStatusEnum };
export type {
  FacilityAmenityOfferingResponse,
  CreateFacilityAmenityOfferingRequest,
  UpdateFacilityAmenityOfferingRequest,
  FacilityAmenityOfferingQuery,
  PaginationMeta,
};

export interface FacilityAmenityOfferingListResponse {
  items: FacilityAmenityOfferingResponse[];
  pagination: PaginationMeta;
}

export interface FacilityAmenityOfferingQueryParams {
  page?: number;
  limit?: number;
  sortBy?:
    "pricePerUnit" | "totalQuantity" | "inUseQuantity" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  facilityId?: string;
  amenityId?: string;
  billingUnit?: BillingUnitEnum;
  status?: FacilityAmenityOfferingStatusEnum;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}
