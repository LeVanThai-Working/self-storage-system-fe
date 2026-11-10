import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse,
  type CustomerInventoryQuery,
  type CustomerInventoryResponse,
  type CustomerInventorySummaryResponse,
  type InventoryMovementQuery,
  type InventoryMovementResponse,
  type PaginatedData,
  type SkuLocationsResponse,
  type SkuLocatorQuery,
  type SkuLocatorResponse,
  type StockAdjustRequest,
  type StockInRequest,
  type StockMoveRequest,
  type StockOutRequest,
  type StorageUnitInventoryTreeResponse,
} from "@self-storage-system-fe/shared";

/**
 * 1. GET /customer-inventories/unit/{storageUnitId}/tree
 * Fetches the Unit -> Racks -> Tiers -> SKUs tree of a storage unit (2D rack map source).
 * `contractId` narrows it to the racks and stock of that contract.
 */
export async function getStorageUnitTreeApi(
  storageUnitId: string,
  contractId?: string
): Promise<StorageUnitInventoryTreeResponse> {
  const response = await api.get<ApiResponse<StorageUnitInventoryTreeResponse>>(
    `/customer-inventories/unit/${storageUnitId}/tree`,
    { params: cleanQueryParams({ contractId }) }
  );
  return response.data.data;
}

/**
 * 2. GET /customer-inventories/sku/{skuId}/locations
 * Lists every position where an SKU is currently stored.
 */
export async function getSkuLocationsApi(skuId: string): Promise<SkuLocationsResponse> {
  const response = await api.get<ApiResponse<SkuLocationsResponse>>(
    `/customer-inventories/sku/${skuId}/locations`
  );
  return response.data.data;
}

/**
 * 3. GET /customer-inventories/barcode/{barcode}/locations
 * Same as SKU locations, looked up by the SKU barcode.
 */
export async function getSkuLocationsByBarcodeApi(barcode: string): Promise<SkuLocationsResponse> {
  const response = await api.get<ApiResponse<SkuLocationsResponse>>(
    `/customer-inventories/barcode/${encodeURIComponent(barcode)}/locations`
  );
  return response.data.data;
}

/**
 * GET /customer-inventories/sku-locator
 * The customer's SKUs with their positions, across all of their contracts.
 */
export async function getSkuLocatorApi(
  query: Partial<SkuLocatorQuery>
): Promise<SkuLocatorResponse> {
  const response = await api.get<ApiResponse<SkuLocatorResponse>>(
    "/customer-inventories/sku-locator",
    { params: cleanQueryParams(query) }
  );
  return response.data.data;
}

/**
 * 4. GET /customer-inventories/movements
 * Inventory movement ledger (filterable by rackTierId).
 */
export async function getInventoryMovementsApi(
  query: Partial<InventoryMovementQuery> = {}
): Promise<PaginatedData<InventoryMovementResponse>> {
  const response = await api.get<ApiResponse<PaginatedData<InventoryMovementResponse>>>(
    "/customer-inventories/movements",
    { params: cleanQueryParams(query) }
  );
  return response.data.data;
}

/**
 * 5. GET /customer-inventories
 * Inventory records (one per SKU × position); BE scopes the list to the calling customer.
 */
export async function getCustomerInventoriesApi(
  query: Partial<CustomerInventoryQuery> = {}
): Promise<PaginatedData<CustomerInventoryResponse>> {
  const response = await api.get<ApiResponse<PaginatedData<CustomerInventoryResponse>>>(
    "/customer-inventories",
    { params: cleanQueryParams(query) }
  );
  return response.data.data;
}

/**
 * 6. GET /customer-inventories/summary
 * Totals for the calling customer (SKU count, quantity, category breakdown).
 */
export async function getCustomerInventorySummaryApi(): Promise<CustomerInventorySummaryResponse> {
  const response = await api.get<ApiResponse<CustomerInventorySummaryResponse>>(
    "/customer-inventories/summary"
  );
  return response.data.data;
}

/**
 * POST /customer-inventories/in
 * The customer puts stock on one of their rack tiers, or in the holding area when `rackTierId` is null.
 */
export async function stockInApi(payload: StockInRequest): Promise<CustomerInventoryResponse> {
  const response = await api.post<ApiResponse<CustomerInventoryResponse>>(
    "/customer-inventories/in",
    payload
  );
  return response.data.data;
}

/** POST /customer-inventories/out: the customer takes stock out of a position. */
export async function stockOutApi(payload: StockOutRequest): Promise<CustomerInventoryResponse> {
  const response = await api.post<ApiResponse<CustomerInventoryResponse>>(
    "/customer-inventories/out",
    payload
  );
  return response.data.data;
}

/** POST /customer-inventories/move: moves stock between two positions of the same contract. */
export async function stockMoveApi(payload: StockMoveRequest): Promise<CustomerInventoryResponse> {
  const response = await api.post<ApiResponse<CustomerInventoryResponse>>(
    "/customer-inventories/move",
    payload
  );
  return response.data.data;
}

/** POST /customer-inventories/adjust: recounts and overwrites the quantity at a position. */
export async function stockAdjustApi(
  payload: StockAdjustRequest
): Promise<CustomerInventoryResponse> {
  const response = await api.post<ApiResponse<CustomerInventoryResponse>>(
    "/customer-inventories/adjust",
    payload
  );
  return response.data.data;
}
