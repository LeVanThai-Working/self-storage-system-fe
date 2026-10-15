import { RackStatusEnum, RackTierStatusEnum } from "../enums/storageRack.enum";
import { PaginationQuery } from "./common.types";

export interface RackDimensions {
  length: number;
  width: number;
  height: number;
}

export interface RackTierResponse {
  id: string;
  facilityId: string;
  storageUnitId: string;
  storageRackId: string;
  tierNumber: number;
  tierCode: string;
  maxWeightKg?: number | null;
  dimensions?: RackDimensions | null;
  volume?: number | null;
  status: RackTierStatusEnum;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageRackFacilitySummary {
  id: string;
  name: string;
  city?: string;
  address?: string;
  status?: string;
}

export interface StorageRackUnitSummary {
  id: string;
  unitNumber: string;
  floor?: number;
  zone?: string;
  status?: string;
}

export interface StorageRackResponse {
  id: string;
  facilityId: string;
  storageUnitId: string;
  rackCode: string;
  name?: string | null;
  tierCount: number;
  status: RackStatusEnum;
  notes?: string | null;
  tiers?: RackTierResponse[] | null;
  facility?: StorageRackFacilitySummary | null;
  storageUnit?: StorageRackUnitSummary | null;
  createdAt: string;
  updatedAt: string;
}

export type StorageRackListResponse = StorageRackResponse[];

export interface CreateStorageRackRequest {
  storageUnitId: string;
  rackCode: string;
  name?: string;
  tierCount?: number;
  status?: RackStatusEnum;
  notes?: string;
  defaultTierMaxWeightKg?: number;
  defaultTierDimensions?: RackDimensions;
}

export interface UpdateStorageRackRequest {
  name?: string;
  status?: RackStatusEnum;
  notes?: string;
}

export interface UpdateRackTierRequest {
  maxWeightKg?: number;
  dimensions?: RackDimensions;
  status?: RackTierStatusEnum;
  notes?: string;
}

export interface StorageRackQuery extends PaginationQuery {
  facilityId?: string;
  storageUnitId?: string;
  status?: RackStatusEnum;
  rackCode?: string;
  sortBy?: "rackCode" | "tierCount" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
