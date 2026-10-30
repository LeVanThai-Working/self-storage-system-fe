import { RackStatusEnum, RackTierStatusEnum, RackZoneEnum } from "../enums/storageRack.enum";
import { PaginationQuery } from "./common.types";

export interface RackTierResponse {
  id: string;
  facilityId: string;
  storageUnitId: string;
  storageRackId: string;
  tierNumber: number;
  tierCode: string; // e.g. "RK-01-T1"
  maxWeightKg?: number | null;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  } | null;
  volume?: number | null;
  status: RackTierStatusEnum | "available" | "occupied" | "maintenance" | "inactive";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageRackResponse {
  id: string;
  facilityId: string;
  storageUnitId: string;
  rackCode: string; // e.g. "RK-01"
  aisle?: string | null; // e.g. "A"
  bay?: number | null; // e.g. 1
  zone?: RackZoneEnum | "PRIME" | "STANDARD" | "ECONOMY" | null;
  customPrice?: number | null; // Đơn giá thuê riêng theo tháng nếu có
  currentContractId?: string | null;
  currentCustomerId?: string | null;
  name?: string | null;
  tierCount: number;
  status:
    RackStatusEnum | "available" | "reserved" | "rented" | "active" | "maintenance" | "inactive";
  notes?: string | null;
  tiers?: RackTierResponse[] | null;
  facility?: {
    id: string;
    name: string;
    city?: string;
    address?: string;
    status?: string;
  } | null;
  storageUnit?: {
    id: string;
    unitNumber: string;
    floor?: number;
    zone?: string;
    status?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export type StorageRackListResponse = StorageRackResponse[];

export interface CreateStorageRackRequest {
  storageUnitId: string;
  rackCode: string;
  aisle?: string;
  bay?: number;
  zone?: RackZoneEnum;
  customPrice?: number | null;
  name?: string;
  tierCount?: number;
  status?: RackStatusEnum;
  notes?: string;
  defaultTierMaxWeightKg?: number;
  defaultTierDimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface UpdateStorageRackRequest {
  name?: string;
  aisle?: string;
  bay?: number;
  zone?: RackZoneEnum;
  customPrice?: number | null;
  status?: RackStatusEnum;
  notes?: string;
}

export interface UpdateRackTierRequest {
  maxWeightKg?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  status?: RackTierStatusEnum;
  notes?: string;
}

export interface StorageRackQuery extends PaginationQuery {
  facilityId?: string;
  storageUnitId?: string;
  status?: RackStatusEnum;
  rackCode?: string;
  aisle?: string;
  zone?: RackZoneEnum;
}
