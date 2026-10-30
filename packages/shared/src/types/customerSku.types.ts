import type { CustomerSkuStatusEnum } from "../enums/customerSku.enum";
import type { InventoryDimensions } from "./customerInventory.types";

export interface CustomerSkuCustomerRef {
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
  dimensions?: InventoryDimensions | null;
  /** cm³, computed by BE from dimensions */
  volume?: number | null;
  weightKg?: number | null;
  imageUrl?: string | null;
  status: CustomerSkuStatusEnum;
  notes?: string | null;
  customer?: CustomerSkuCustomerRef | null;
  createdAt: string;
  updatedAt: string;
}
