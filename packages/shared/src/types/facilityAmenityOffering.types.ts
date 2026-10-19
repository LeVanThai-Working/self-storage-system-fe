import { BillingUnitEnum, FacilityAmenityOfferingStatusEnum } from "../enums";
import { PaginationQuery } from "./common.types";
import { FacilitySnapshot } from "./facility.types";
import { AmenitySnapshot } from "./amenity.types";

export interface FacilityAmenityOfferingResponse {
  id: string;
  facilityId?: string;
  amenityId?: string;
  facility: FacilitySnapshot;
  amenity: AmenitySnapshot;
  pricePerUnit: number;
  billingUnit: BillingUnitEnum;
  totalQuantity: number;
  inUseQuantity: number;
  availableQuantity: number;
  status: FacilityAmenityOfferingStatusEnum;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacilityAmenityOfferingRequest {
  facilityId: string;
  amenityId: string;
  pricePerUnit: number;
  billingUnit?: BillingUnitEnum;
  totalQuantity: number;
  status?: FacilityAmenityOfferingStatusEnum;
  notes?: string;
}

export interface UpdateFacilityAmenityOfferingRequest {
  pricePerUnit?: number;
  billingUnit?: BillingUnitEnum;
  totalQuantity?: number;
  status?: FacilityAmenityOfferingStatusEnum;
  notes?: string;
}

export interface FacilityAmenityOfferingQuery extends PaginationQuery {
  facilityId?: string;
  amenityId?: string;
  billingUnit?: BillingUnitEnum;
  status?: FacilityAmenityOfferingStatusEnum;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}
