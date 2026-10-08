export enum UnitTypeCategoryEnum {
  LOCKER = "locker",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  CLIMATE_CONTROLLED = "climate_controlled",
}

export enum UnitTypeStatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface UnitTypeDimensions {
  length: number;
  width: number;
  height: number;
}

export interface UnitTypeItem {
  id: string;
  name: string;
  description?: string;
  dimensions: UnitTypeDimensions;
  area: number;
  volume: number;
  category: UnitTypeCategoryEnum | string;
  status: UnitTypeStatusEnum | string;
  images?: string[];
  features?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UnitTypePagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UnitTypeListResponse {
  items: UnitTypeItem[];
  pagination: UnitTypePagination;
}

export interface UnitTypeQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "updatedAt" | "area" | "volume";
  sortOrder?: "asc" | "desc";
  search?: string;
  category?: string;
  status?: string;
  minArea?: number;
  maxArea?: number;
}

export interface CreateUnitTypeRequest {
  name: string;
  description?: string;
  category?: UnitTypeCategoryEnum | string;
  status?: UnitTypeStatusEnum | string;
  dimensions: UnitTypeDimensions;
  features?: string[];
  images?: string[];
}

export interface UpdateUnitTypeRequest {
  name?: string;
  description?: string;
  category?: UnitTypeCategoryEnum | string;
  status?: UnitTypeStatusEnum | string;
  dimensions?: Partial<UnitTypeDimensions>;
  features?: string[];
  images?: string[];
}
