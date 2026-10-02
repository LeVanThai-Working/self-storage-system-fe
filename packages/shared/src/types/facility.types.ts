import { FacilityStatusEnum } from "../enums";
import { PaginationQuery } from "./common.types";

export interface IOperatingHours {
  open: string;
  close: string;
}

export interface FacilitySnapshot {
  id: string;
  name: string;
  city: string;
  address: string;
  status: FacilityStatusEnum;
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
  operatingHours?: IOperatingHours | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicOfferingUnitType {
  id: string;
  name: string;
  category: string;
  length: number;
  width: number;
  height: number;
  area: number;
  volume: number;
  description?: string | null;
  images: string[];
}

export interface PublicOfferingItem {
  offeringId: string;
  pricePerUnit: number;
  depositMultiplier: number;
  billingUnit: string;
  minRentalDays: number;
  unitType?: PublicOfferingUnitType | null;
  availableUnitsCount: number;
}

export interface PublicAmenityItem {
  offeringId: string;
  amenityId: string;
  name: string;
  type: string;
  description?: string | null;
  images: string[];
  tags: string[];
  pricePerUnit: number;
  billingUnit: string;
  totalQuantity: number;
  inUseQuantity: number;
  availableQuantity: number;
}

export interface FacilityPublicDetailResponse extends FacilityResponse {
  offerings: PublicOfferingItem[];
  amenities: PublicAmenityItem[];
}

export interface CreateFacilityRequest {
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  description?: string;
  operatingHours?: IOperatingHours;
}

export interface UpdateFacilityRequest {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  description?: string;
  status?: FacilityStatusEnum;
  operatingHours?: IOperatingHours;
}

export interface FacilityQuery extends PaginationQuery {
  search?: string;
  status?: FacilityStatusEnum;
}

export interface AssignManagerRequest {
  managerId: string;
}
