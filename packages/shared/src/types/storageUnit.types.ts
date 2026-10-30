import { StorageUnitStatusEnum } from "../enums";
import { PaginationQuery } from "./common.types";
import { FacilitySnapshot } from "./facility.types";
import { UnitTypeSnapshot } from "./unitType.types";

export interface StorageUnitResponse {
  id: string;
  facilityId: string;
  unitTypeId: string;
  unitNumber: string;
  floor: number;
  zone?: string | null;
  status: StorageUnitStatusEnum;
  images?: string[] | null;
  notes?: string | null;
  facility?: FacilitySnapshot | null;
  unitType?: UnitTypeSnapshot | null;
  createdAt: string;
  updatedAt: string;
}

export type StorageUnitListResponse = StorageUnitResponse[];

export interface ReconcileStorageUnitsResponse {
  reconciledCount: number;
  details: Array<{
    unitId: string;
    unitNumber: string;
    facilityId: string;
  }>;
}

export interface CreateStorageUnitRequest {
  facilityId: string;
  unitTypeId: string;
  unitNumber: string;
  floor?: number;
  zone?: string;
  status?: StorageUnitStatusEnum;
  images?: string[];
  notes?: string;
}

export interface UpdateStorageUnitRequest {
  unitTypeId?: string;
  unitNumber?: string;
  floor?: number;
  zone?: string;
  status?: StorageUnitStatusEnum;
  images?: string[];
  notes?: string;
}

export interface ToggleMaintenanceRequest {
  isUnderMaintenance: boolean;
  notes?: string;
}

export interface StorageUnitQuery extends PaginationQuery {
  facilityId?: string;
  unitTypeId?: string;
  status?: StorageUnitStatusEnum;
  floor?: number;
  zone?: string;
  unitNumber?: string;
}

export interface AvailableStorageUnitQuery {
  unitTypeId?: string;
  floor?: number;
  zone?: string;
}
