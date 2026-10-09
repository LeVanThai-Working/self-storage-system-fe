export enum AmenityTypeEnum {
  PHYSICAL = "physical",
  SERVICE = "service",
}

export enum AmenityStatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface AmenityItem {
  id: string;
  name: string;
  description?: string;
  type: AmenityTypeEnum | string;
  status: AmenityStatusEnum | string;
  images?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AmenityPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AmenityListResponse {
  items: AmenityItem[];
  pagination: AmenityPagination;
}

export interface AmenityQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "type" | "name" | "status" | "createdAt";
  sortOrder?: "asc" | "desc";
  search?: string;
  type?: string;
  status?: string;
}

export interface CreateAmenityRequest {
  name: string;
  type: AmenityTypeEnum | string;
  status: AmenityStatusEnum | string;
  description?: string;
  tags: string[];
  images: string[];
}

export interface CreateAmenityResponse {
  success: boolean;
  statusCode: number;
  messageCode?: string;
  message: string;
  data: AmenityItem;
}

export interface UpdateAmenityRequest {
  name?: string;
  type?: AmenityTypeEnum | string;
  status?: AmenityStatusEnum | string;
  description?: string;
  tags?: string[];
  images?: string[];
}

export interface AmenitySingleResponse {
  success: boolean;
  statusCode: number;
  messageCode?: string;
  message: string;
  data: AmenityItem;
}
