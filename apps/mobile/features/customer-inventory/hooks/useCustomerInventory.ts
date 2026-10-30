import { useCallback } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  CustomerInventoryQuery,
  CustomerInventoryResponse,
} from "@self-storage-system-fe/shared";
import {
  getCustomerInventoriesApi,
  getCustomerInventorySummaryApi,
  getInventoryMovementsApi,
  getSkuLocationsApi,
  getSkuLocationsByBarcodeApi,
  getStorageUnitTreeApi,
} from "../api/customerInventory.api";

export const TIER_HISTORY_LIMIT = 10;

export const customerInventoryKeys = {
  tree: (storageUnitId?: string) => ["customer-inventory-tree", storageUnitId] as const,
  skuLocations: (skuId?: string) => ["customer-inventory-sku-locations", skuId] as const,
  barcodeLocations: (barcode?: string) =>
    ["customer-inventory-barcode-locations", barcode] as const,
  summary: ["customer-inventory-summary"] as const,
  records: (query: Partial<CustomerInventoryQuery>) =>
    ["customer-inventory-records", query] as const,
  skuMovements: (skuId?: string) => ["customer-inventory-movements", { skuId }] as const,
  tierMovements: (rackTierId?: string) =>
    [
      "customer-inventory-movements",
      { rackTierId, limit: TIER_HISTORY_LIMIT, sortBy: "createdAt", sortOrder: "desc" },
    ] as const,
};

/** Refreshes every inventory view after staff-side changes surface (e.g. a request completes). */
export function invalidateInventoryViews(qc: QueryClient, storageUnitId?: string) {
  qc.invalidateQueries({ queryKey: customerInventoryKeys.tree(storageUnitId) });
  qc.invalidateQueries({ queryKey: ["customer-inventory-sku-locations"] });
  qc.invalidateQueries({ queryKey: ["customer-inventory-barcode-locations"] });
  qc.invalidateQueries({ queryKey: ["customer-inventory-movements"] });
  qc.invalidateQueries({ queryKey: ["customer-inventory-summary"] });
  qc.invalidateQueries({ queryKey: ["customer-inventory-records"] });
}

export function useStorageUnitTree(storageUnitId?: string) {
  return useQuery({
    queryKey: customerInventoryKeys.tree(storageUnitId),
    queryFn: () => getStorageUnitTreeApi(storageUnitId!),
    enabled: Boolean(storageUnitId),
  });
}

/** Imperative SKU location lookups (by SKU id or scanned barcode), cached under the shared keys. */
export function useLocateSku() {
  const qc = useQueryClient();

  const locateBySkuId = useCallback(
    (skuId: string) =>
      qc.fetchQuery({
        queryKey: customerInventoryKeys.skuLocations(skuId),
        queryFn: () => getSkuLocationsApi(skuId),
      }),
    [qc]
  );

  const locateByBarcode = useCallback(
    (barcode: string) =>
      qc.fetchQuery({
        queryKey: customerInventoryKeys.barcodeLocations(barcode),
        queryFn: () => getSkuLocationsByBarcodeApi(barcode),
        retry: false,
      }),
    [qc]
  );

  return { locateBySkuId, locateByBarcode };
}

export function useTierMovements(rackTierId?: string) {
  return useQuery({
    queryKey: customerInventoryKeys.tierMovements(rackTierId),
    queryFn: () =>
      getInventoryMovementsApi({
        rackTierId,
        page: 1,
        limit: TIER_HISTORY_LIMIT,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: Boolean(rackTierId),
  });
}

/** Largest page BE allows; enough for one customer's records in practice. */
const STOCK_TOTALS_LIMIT = 100;

export interface SkuStockTotal {
  quantity: number;
  locationCount: number;
}

/** Per-SKU stock totals for the catalog list, aggregated from the customer's inventory records. */
export function useSkuStockTotals() {
  const query: Partial<CustomerInventoryQuery> = {
    page: 1,
    limit: STOCK_TOTALS_LIMIT,
    minQuantity: 1,
    sortBy: "lastMovementAt",
    sortOrder: "desc",
  };
  return useQuery({
    queryKey: customerInventoryKeys.records(query),
    queryFn: () => getCustomerInventoriesApi(query),
    select: (data) => aggregateBySku(data.items),
  });
}

function aggregateBySku(items: CustomerInventoryResponse[]): Map<string, SkuStockTotal> {
  const totals = new Map<string, SkuStockTotal>();
  items.forEach((item) => {
    const current = totals.get(item.skuId) ?? { quantity: 0, locationCount: 0 };
    current.quantity += item.quantity;
    current.locationCount += 1;
    totals.set(item.skuId, current);
  });
  return totals;
}

export function useCustomerInventorySummary() {
  return useQuery({
    queryKey: customerInventoryKeys.summary,
    queryFn: getCustomerInventorySummaryApi,
  });
}

export function useSkuLocations(skuId?: string) {
  return useQuery({
    queryKey: customerInventoryKeys.skuLocations(skuId),
    queryFn: () => getSkuLocationsApi(skuId!),
    enabled: Boolean(skuId),
  });
}

export function useSkuMovements(skuId?: string, limit = 10) {
  return useQuery({
    queryKey: [...customerInventoryKeys.skuMovements(skuId), limit],
    queryFn: () =>
      getInventoryMovementsApi({ skuId, page: 1, limit, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: Boolean(skuId),
  });
}

/** Raw inventory records (e.g. per contract, to find items in holding or damaged). */
export function useCustomerInventoryRecords(
  query: Partial<CustomerInventoryQuery>,
  enabled = true
) {
  return useQuery({
    queryKey: customerInventoryKeys.records(query),
    queryFn: () => getCustomerInventoriesApi(query),
    enabled,
  });
}

/** Latest movements of a contract (activity feed: staff moves, recounts, handovers). */
export function useContractMovements(contractId?: string, limit = 20) {
  return useQuery({
    queryKey: ["customer-inventory-movements", { contractId, limit }],
    queryFn: () =>
      getInventoryMovementsApi({
        contractId,
        page: 1,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: Boolean(contractId),
  });
}
