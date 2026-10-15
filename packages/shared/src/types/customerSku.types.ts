import { CustomerSkuStatusEnum } from "../enums/customerSku.enum";
import { PaginationQuery, PaginatedResponse } from "./common.types";

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface CustomerSkuCustomer {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string | null;
  role?: string;
  status?: string;
}

export interface CustomerSkuResponse {
  id: string;
  customerId: string;
  skuCode: string;
  name: string;
  description?: string | null;
  category?: string | null;
  barcode?: string | null;
  uom: string;
  dimensions?: Dimensions | null;
  volume?: number | null;
  weightKg?: number | null;
  imageUrl?: string | null;
  status: CustomerSkuStatusEnum;
  notes?: string | null;
  customer?: CustomerSkuCustomer | null;
  createdAt: string;
  updatedAt: string;
}

export type PaginatedCustomerSkuResponse = PaginatedResponse<CustomerSkuResponse>;

export interface CreateCustomerSkuRequest {
  skuCode: string;
  name: string;
  description?: string;
  category?: string;
  barcode?: string;
  uom?: string;
  dimensions?: Dimensions;
  weightKg?: number;
  imageUrl?: string;
  status?: CustomerSkuStatusEnum;
  notes?: string;
}

export interface UpdateCustomerSkuRequest {
  skuCode?: string;
  name?: string;
  description?: string;
  category?: string;
  barcode?: string;
  uom?: string;
  dimensions?: Dimensions;
  weightKg?: number;
  imageUrl?: string;
  status?: CustomerSkuStatusEnum;
  notes?: string;
}

export interface CustomerSkuQuery extends PaginationQuery {
  customerId?: string;
  status?: CustomerSkuStatusEnum;
  category?: string;
  search?: string;
  skuCode?: string;
  barcode?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "skuCode";
}
