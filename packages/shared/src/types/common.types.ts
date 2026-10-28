export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  messageCode: string;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  messageCode: string;
  message: string;
  errors?: unknown;
  path: string;
  timestamp: string;
  stack?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginatedResponse<T> {
  success: boolean;
  statusCode: number;
  messageCode: string;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserSnapshot {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role?: string | null;
}

export interface OfferingSnapshot {
  id: string;
  unitTypeId?: string | null;
  billingUnit: string;
  pricePerUnit: number;
  depositMultiplier?: number | null;
  minRentalDays?: number | null;
  status?: string | null;
}

export interface StorageUnitSnapshot {
  id: string;
  unitNumber: string;
  floor: number;
  zone?: string | null;
  status: string;
}
