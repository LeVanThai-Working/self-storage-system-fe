import { BillingUnitEnum, FacilityAmenityOfferingStatusEnum } from "../enums";
import { PaginationQuery } from "./common.types";
import { FacilitySnapshot } from "./facility.types";
import { AmenitySnapshot } from "./amenity.types";

export interface FacilityAmenityOfferingResponse {
  id: string;
  facility: FacilitySnapshot;
  amenity: AmenitySnapshot;
  pricePerUnit: number;
  billingUnit: BillingUnitEnum;
  totalQuantity: number;
  inUseQuantity: number;
  availableQuantity: number;
  status: FacilityAmenityOfferingStatusEnum;
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
}

export interface UpdateFacilityAmenityOfferingRequest {
  pricePerUnit?: number;
  billingUnit?: BillingUnitEnum;
  totalQuantity?: number;
  status?: FacilityAmenityOfferingStatusEnum;
}

export interface FacilityAmenityOfferingQuery extends PaginationQuery {
  facilityId?: string;
  amenityId?: string;
  status?: FacilityAmenityOfferingStatusEnum;
}
