import {
  StorageUnitStatusEnum,
  type StorageUnitResponse,
  type StorageUnitQuery,
  type CreateStorageUnitRequest,
  type UpdateStorageUnitRequest,
  type FacilityResponse,
  type FacilityUnitTypeOfferingResponse,
  type PaginatedData,
  type PaginationMeta,
} from "@self-storage-system-fe/shared";

export { StorageUnitStatusEnum };
export type {
  StorageUnitResponse,
  StorageUnitQuery,
  CreateStorageUnitRequest,
  UpdateStorageUnitRequest,
  FacilityResponse,
  FacilityUnitTypeOfferingResponse,
  PaginatedData,
  PaginationMeta,
};

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

/** Units in these states are held by a reservation/contract and must not be deleted or re-typed. */
export const LOCKED_STATUSES: StorageUnitStatusEnum[] = [
  StorageUnitStatusEnum.RESERVED,
  StorageUnitStatusEnum.OCCUPIED,
];

export const isUnitLocked = (status: StorageUnitStatusEnum): boolean =>
  LOCKED_STATUSES.includes(status);
