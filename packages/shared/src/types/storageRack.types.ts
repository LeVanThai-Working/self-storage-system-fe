import type { RackStatusEnum, RackTierStatusEnum, RackZoneEnum } from "../enums/storageRack.enum";
import type { InventoryDimensions } from "./customerInventory.types";

export interface RackTierResponse {
  id: string;
  facilityId: string;
  storageUnitId: string;
  storageRackId: string;
  tierNumber: number;
  tierCode: string; // e.g. "RK-01-T1"
  maxWeightKg?: number | null;
  dimensions?: InventoryDimensions | null;
  volume?: number | null;
  status: RackTierStatusEnum | "available" | "occupied" | "maintenance" | "inactive";
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
  rackCode: string; // e.g. "RK-01"
  aisle?: string | null; // e.g. "A"
  bay?: number | null; // e.g. 1
  zone?: RackZoneEnum | null;
  customPrice?: number | null; // Đơn giá thuê riêng theo tháng nếu có
  currentContractId?: string | null;
  /** Hidden (null) for customers; they get `isMine` instead. */
  currentCustomerId?: string | null;
  isMine?: boolean | null;
  name?: string | null;
  tierCount: number;
  status:
    RackStatusEnum | "available" | "reserved" | "rented" | "active" | "maintenance" | "inactive";
  notes?: string | null;
  tiers?: RackTierResponse[] | null;
  facility?: StorageRackFacilityRef | null;
  storageUnit?: StorageRackUnitRef | null;
  createdAt: string;
  updatedAt: string;
}

export type StorageRackListResponse = StorageRackResponse[];
