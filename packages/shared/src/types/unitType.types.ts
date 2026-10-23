import { UnitTypeCategoryEnum, UnitTypeStatusEnum } from "../enums";
import { PaginationQuery } from "./common.types";

export interface IDimensions {
  length: number;
  width: number;
  height: number;
}

export interface UnitTypeSnapshot {
  id: string;
  name: string;
  category?: UnitTypeCategoryEnum | null;
  area: number;
  volume: number;
  status: UnitTypeStatusEnum;
  dimensions: IDimensions;
  imageUrl?: string | null;
}

export interface UnitTypeResponse {
  id: string;
  name: string;
  description?: string | null;
  dimensions: IDimensions;
  area: number;
  volume: number;
  category?: UnitTypeCategoryEnum | null;
  status: UnitTypeStatusEnum;
  imageUrl?: string | null;
  images?: string[] | null;
  features?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitTypeRequest {
  name: string;
  description?: string;
  dimensions: IDimensions;
  category?: UnitTypeCategoryEnum;
  imageUrl?: string;
  images?: string[];
  features?: string[];
}

export interface UpdateUnitTypeRequest {
  name?: string;
  description?: string;
  dimensions?: IDimensions;
  category?: UnitTypeCategoryEnum;
  status?: UnitTypeStatusEnum;
  imageUrl?: string;
  images?: string[];
  features?: string[];
}

export interface UnitTypeQuery extends PaginationQuery {
  search?: string;
  status?: UnitTypeStatusEnum;
  category?: UnitTypeCategoryEnum;
  minArea?: number;
  maxArea?: number;
}
