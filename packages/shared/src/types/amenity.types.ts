import { AmenityStatusEnum, AmenityTypeEnum } from "../enums";
import { PaginationQuery } from "./common.types";

export interface AmenitySnapshot {
  id: string;
  name: string;
  type: AmenityTypeEnum;
  status: AmenityStatusEnum;
}

export interface AmenityResponse {
  id: string;
  name: string;
  description?: string | null;
  type: AmenityTypeEnum;
  status: AmenityStatusEnum;
  images: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAmenityRequest {
  name: string;
  description?: string;
  type: AmenityTypeEnum;
  status?: AmenityStatusEnum;
  images?: string[];
  tags?: string[];
}

export interface UpdateAmenityRequest {
  name?: string;
  description?: string;
  type?: AmenityTypeEnum;
  status?: AmenityStatusEnum;
  images?: string[];
  tags?: string[];
}

export interface AmenityQuery extends PaginationQuery {
  search?: string;
  type?: AmenityTypeEnum;
  status?: AmenityStatusEnum;
}
