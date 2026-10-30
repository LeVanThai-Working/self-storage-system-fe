import {
  StorageUnitStatusEnum,
  RackZoneEnum,
  RackStatusEnum,
  RackTierStatusEnum,
  RentalTargetTypeEnum,
  type StorageUnitResponse,
  type StorageUnitQuery,
  type AvailableStorageUnitQuery,
  type CreateStorageUnitRequest,
  type UpdateStorageUnitRequest,
  type ToggleMaintenanceRequest,
  type ReconcileStorageUnitsResponse,
  type StorageRackResponse,
  type RackTierResponse,
  type CreateStorageRackRequest,
  type UpdateStorageRackRequest,
  type UpdateRackTierRequest,
  type StorageRackQuery,
  type FacilityResponse,
  type FacilityUnitTypeOfferingResponse,
  type PaginatedData,
  type PaginationMeta,
} from "@self-storage-system-fe/shared";

export {
  StorageUnitStatusEnum,
  RackZoneEnum,
  RackStatusEnum,
  RackTierStatusEnum,
  RentalTargetTypeEnum,
};

export type {
  StorageUnitResponse,
  StorageUnitQuery,
  AvailableStorageUnitQuery,
  CreateStorageUnitRequest,
  UpdateStorageUnitRequest,
  ToggleMaintenanceRequest,
  ReconcileStorageUnitsResponse,
  StorageRackResponse,
  RackTierResponse,
  CreateStorageRackRequest,
  UpdateStorageRackRequest,
  UpdateRackTierRequest,
  StorageRackQuery,
  FacilityResponse,
  FacilityUnitTypeOfferingResponse,
  PaginatedData,
  PaginationMeta,
};

export type StorageUnitViewMode = "table" | "map";

/** Manager manages the full unit lifecycle; staff only operates maintenance. */
export type StorageUnitPortalMode = "manager" | "staff";

export type StorageUnitSortBy = "createdAt" | "unitNumber" | "floor" | "status";

/** Filters controlled by the table; empty values mean "no filter". */
export interface StorageUnitFilters {
  page: number;
  limit: number;
  sortBy: StorageUnitSortBy;
  unitNumber?: string;
  floor?: number;
  zone?: string;
  unitTypeId?: string;
  status?: StorageUnitStatusEnum;
}

/** Units in these states are held by a reservation/contract or awaiting clearance and must not be deleted or re-typed. */
export const LOCKED_STATUSES: StorageUnitStatusEnum[] = [
  StorageUnitStatusEnum.RESERVED,
  StorageUnitStatusEnum.OCCUPIED,
  StorageUnitStatusEnum.PENDING_CLEARANCE,
];

export const isUnitLocked = (status: StorageUnitStatusEnum): boolean =>
  LOCKED_STATUSES.includes(status);

/** Maintenance can be toggled for AVAILABLE, UNDER_MAINTENANCE, and PENDING_CLEARANCE. */
export const canToggleMaintenance = (status: StorageUnitStatusEnum): boolean =>
  status === StorageUnitStatusEnum.AVAILABLE ||
  status === StorageUnitStatusEnum.UNDER_MAINTENANCE ||
  status === StorageUnitStatusEnum.PENDING_CLEARANCE;
