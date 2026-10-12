import {
  BillingUnitEnum,
  FacilityUnitTypeOfferingStatusEnum,
  type FacilityUnitTypeOfferingResponse,
  type CreateOfferingRequest,
  type UpdateOfferingRequest,
  type OfferingQuery,
  type PaginationMeta,
} from "@self-storage-system-fe/shared";

export { BillingUnitEnum, FacilityUnitTypeOfferingStatusEnum };
export type { FacilityUnitTypeOfferingResponse, CreateOfferingRequest, UpdateOfferingRequest };

export interface OfferingQueryParams extends OfferingQuery {
  sortBy?: "pricePerUnit" | "minRentalDays" | "createdAt" | "updatedAt";
}

export interface OfferingListResponse {
  items: FacilityUnitTypeOfferingResponse[];
  pagination: PaginationMeta;
}
