import { BillingUnitEnum, FacilityUnitTypeOfferingStatusEnum } from "../enums";
import { PaginationQuery } from "./common.types";
import { FacilitySnapshot } from "./facility.types";
import { UnitTypeSnapshot } from "./unitType.types";

export interface FacilityUnitTypeOfferingResponse {
  id: string;
  facility: FacilitySnapshot;
  unitType: UnitTypeSnapshot;
  billingUnit: BillingUnitEnum;
  pricePerUnit: number;
  depositMultiplier: number;
  minRentalDays: number;
  status: FacilityUnitTypeOfferingStatusEnum;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferingRequest {
  facilityId: string;
  unitTypeId: string;
  pricePerUnit: number;
  billingUnit?: BillingUnitEnum;
  depositMultiplier?: number;
  minRentalDays?: number;
  status?: FacilityUnitTypeOfferingStatusEnum;
  notes?: string;
}

export interface UpdateOfferingRequest {
  pricePerUnit?: number;
  billingUnit?: BillingUnitEnum;
  depositMultiplier?: number;
  minRentalDays?: number;
  status?: FacilityUnitTypeOfferingStatusEnum;
  notes?: string;
}

export interface OfferingQuery extends PaginationQuery {
  facilityId?: string;
  unitTypeId?: string;
  billingUnit?: BillingUnitEnum;
  status?: FacilityUnitTypeOfferingStatusEnum;
  minPrice?: number;
  maxPrice?: number;
}
