import type { RackStatusEnum, RackTierStatusEnum, RackZoneEnum } from "../enums/storageRack.enum";
import type { InventoryDimensions } from "./customerInventory.types";

export interface RackTierResponse {
  id: string;
  facilityId: string;
  storageUnitId: string;
  storageRackId: string;
  tierNumber: number;
  tierCode: string;
  maxWeightKg?: number | null;
  dimensions?: InventoryDimensions | null;
  volume?: number | null;
  status: RackTierStatusEnum;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageRackFacilityRef {
  id: string;
  name: string;
  city?: string;
  address?: string;
  status?: string;
}

export interface StorageRackUnitRef {
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
  aisle?: string | null;
  bay?: number | null;
  zone?: RackZoneEnum | null;
  customPrice?: number | null;
  currentContractId?: string | null;
  /** Hidden (null) for customers; they get `isMine` instead. */
  currentCustomerId?: string | null;
  isMine?: boolean | null;
  name?: string | null;
  tierCount: number;
  status: RackStatusEnum;
  notes?: string | null;
  tiers?: RackTierResponse[] | null;
  facility?: StorageRackFacilityRef | null;
  storageUnit?: StorageRackUnitRef | null;
  createdAt: string;
  updatedAt: string;
}
