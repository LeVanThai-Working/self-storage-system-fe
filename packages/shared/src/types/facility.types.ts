import type { FacilityStatusEnum } from "../enums/facility.enum";
import type { BillingUnitEnum } from "../enums/billing.enum";
import type { FacilityUnitTypeOfferingStatusEnum } from "../enums/facilityUnitTypeOffering.enum";
import type { UnitTypeCategoryEnum, UnitTypeStatusEnum } from "../enums/unitType.enum";
import type { AmenityTypeEnum, AmenityStatusEnum } from "../enums/amenity.enum";
import type { FacilityAmenityOfferingStatusEnum } from "../enums/facilityAmenityOffering.enum";
import type { PaginationQuery } from "./common.types";

export interface OperatingHoursResponse {
  open: string;
  close: string;
}

export type IOperatingHours = OperatingHoursResponse;

export interface FacilitySnapshot {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  status?: FacilityStatusEnum | string | null;
}

export interface FacilityResponse {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  status: FacilityStatusEnum;
  managerId?: string | null;
  operatingHours?: OperatingHoursResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUnitTypeDimensions {
  length: number;
  width: number;
  height: number;
}

export interface PublicUnitTypeDetail {
  id: string;
  name: string;
  category: UnitTypeCategoryEnum;
  dimensions: PublicUnitTypeDimensions;
  area: number;
  volume: number;
  description?: string | null;
  status: UnitTypeStatusEnum;
  images?: string[] | null;
  features?: string[] | null;
}

export interface PublicUnitTypeOfferingResponse {
  id: string;
  facilityId: string;
  unitTypeId: string;
  unitType: PublicUnitTypeDetail;
  pricePerUnit: number;
  depositMultiplier: number;
  billingUnit: BillingUnitEnum;
  minRentalDays: number;
  status: FacilityUnitTypeOfferingStatusEnum;
  availableUnitsCount: number;
}

export interface PublicAmenityDetail {
  id: string;
  name: string;
  description?: string | null;
  type: AmenityTypeEnum;
  status: AmenityStatusEnum;
  images?: string[] | null;
  tags?: string[] | null;
}

export interface PublicAmenityOfferingResponse {
  id: string;
  facilityId: string;
  amenityId: string;
  amenity: PublicAmenityDetail;
  pricePerUnit: number;
  billingUnit: BillingUnitEnum;
  totalQuantity: number;
  inUseQuantity: number;
  availableQuantity: number;
  status: FacilityAmenityOfferingStatusEnum;
}

export interface FacilityPublicDetailResponse {
  facility: FacilityResponse;
  unitTypeOfferings: PublicUnitTypeOfferingResponse[];
  amenityOfferings: PublicAmenityOfferingResponse[];
}

export interface CreateFacilityRequest {
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  description?: string;
  operatingHours?: OperatingHoursResponse;
}

export interface UpdateFacilityRequest {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  description?: string;
  status?: FacilityStatusEnum;
  operatingHours?: OperatingHoursResponse;
}

export interface FacilityQuery extends PaginationQuery {
  search?: string;
  city?: string;
  status?: FacilityStatusEnum;
}

export interface SearchByAmenityQuery extends PaginationQuery {
  amenityIds: string;
  matchAll?: boolean;
  city?: string;
  search?: string;
}

export interface AssignManagerRequest {
  managerId: string;
}
