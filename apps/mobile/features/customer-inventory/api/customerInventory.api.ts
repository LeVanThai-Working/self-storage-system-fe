import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse,
  type CustomerInventoryResponse,
  type InventoryMovementQuery,
  type InventoryMovementResponse,
  type PaginatedData,
  type SkuLocationsResponse,
  type StockAdjustRequest,
  type StockInRequest,
  type StockMoveRequest,
  type StockOutRequest,
  type StorageUnitInventoryTreeResponse,
} from "@self-storage-system-fe/shared";

type TierIdKey = "rackTierId" | "fromRackTierId" | "toRackTierId";
const TIER_ID_KEYS: TierIdKey[] = ["rackTierId", "fromRackTierId", "toRackTierId"];

/**
 * BE validates bodies twice: zod accepts `null` tier ids, but the generated tsoa model only
 * accepts strings. A floor position is therefore sent by omitting the field (BE treats a
 * missing tier id as the floor).
 */
function omitNullTierIds<T extends Partial<Record<TierIdKey, string | null>>>(payload: T): T {
  const body = { ...payload };
  TIER_ID_KEYS.forEach((key) => {
    if (body[key] === null) delete body[key];
  });
  return body;
}

/**
 * 1. GET /customer-inventories/unit/{storageUnitId}/tree
 * Fetches the Unit -> Racks -> Tiers -> SKUs tree of a storage unit (2D rack map source).
 */
export async function getStorageUnitTreeApi(
  storageUnitId: string
): Promise<StorageUnitInventoryTreeResponse> {
  const response = await api.get<ApiResponse<StorageUnitInventoryTreeResponse>>(
    `/customer-inventories/unit/${storageUnitId}/tree`
  );
  return response.data.data;
}

/**
 * 2. POST /customer-inventories/in
 * Stocks items into a rack tier (or onto the floor when rackTierId is null).
 */
export async function stockInApi(payload: StockInRequest): Promise<CustomerInventoryResponse> {
  const response = await api.post<ApiResponse<CustomerInventoryResponse>>(
    "/customer-inventories/in",
    omitNullTierIds(payload)
  );
  return response.data.data;
}

/**
 * 3. POST /customer-inventories/out
 * Takes items out of a rack tier (or the floor).
 */
export async function stockOutApi(payload: StockOutRequest): Promise<CustomerInventoryResponse> {
  const response = await api.post<ApiResponse<CustomerInventoryResponse>>(
    "/customer-inventories/out",
    omitNullTierIds(payload)
  );
  return response.data.data;
}

/**
 * 4. POST /customer-inventories/move
 * Moves items between two positions inside the same storage unit.
 */
export async function stockMoveApi(payload: StockMoveRequest): Promise<CustomerInventoryResponse> {
  const response = await api.post<ApiResponse<CustomerInventoryResponse>>(
    "/customer-inventories/move",
    omitNullTierIds(payload)
  );
  return response.data.data;
}

/**
 * 5. POST /customer-inventories/adjust
 * Recounts and overwrites the stock quantity at a position (reason is required).
 */
export async function stockAdjustApi(
  payload: StockAdjustRequest
): Promise<CustomerInventoryResponse> {
  const response = await api.post<ApiResponse<CustomerInventoryResponse>>(
    "/customer-inventories/adjust",
    omitNullTierIds(payload)
  );
  return response.data.data;
}

/**
 * 6. GET /customer-inventories/sku/{skuId}/locations
 * Lists every position where an SKU is currently stored.
 */
export async function getSkuLocationsApi(skuId: string): Promise<SkuLocationsResponse> {
  const response = await api.get<ApiResponse<SkuLocationsResponse>>(
    `/customer-inventories/sku/${skuId}/locations`
  );
  return response.data.data;
}

/**
 * 7. GET /customer-inventories/barcode/{barcode}/locations
 * Same as SKU locations, looked up by the SKU barcode.
 */
export async function getSkuLocationsByBarcodeApi(barcode: string): Promise<SkuLocationsResponse> {
  const response = await api.get<ApiResponse<SkuLocationsResponse>>(
    `/customer-inventories/barcode/${encodeURIComponent(barcode)}/locations`
  );
  return response.data.data;
}

/**
 * 8. GET /customer-inventories/movements
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
