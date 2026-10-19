import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  StockAdjustRequest,
  StockInRequest,
  StockMoveRequest,
  StockOutRequest,
} from "@self-storage-system-fe/shared";
import {
  getStorageUnitTreeApi,
  stockAdjustApi,
  stockInApi,
  stockMoveApi,
  stockOutApi,
} from "../api/customerInventory.api";

export const TIER_HISTORY_LIMIT = 10;

export const customerInventoryKeys = {
  tree: (storageUnitId?: string) => ["customer-inventory-tree", storageUnitId] as const,
  skuLocations: (skuId?: string) => ["customer-inventory-sku-locations", skuId] as const,
  barcodeLocations: (barcode?: string) =>
    ["customer-inventory-barcode-locations", barcode] as const,
  tierMovements: (rackTierId?: string) =>
    [
      "customer-inventory-movements",
      { rackTierId, limit: TIER_HISTORY_LIMIT, sortBy: "createdAt", sortOrder: "desc" },
    ] as const,
};

function invalidateAfterStockChange(qc: QueryClient, storageUnitId?: string) {
  qc.invalidateQueries({ queryKey: customerInventoryKeys.tree(storageUnitId) });
  qc.invalidateQueries({ queryKey: ["customer-inventory-sku-locations"] });
  qc.invalidateQueries({ queryKey: ["customer-inventory-barcode-locations"] });
  qc.invalidateQueries({ queryKey: ["customer-inventory-movements"] });
  qc.invalidateQueries({ queryKey: ["customer-inventory-summary"] });
}

export function useStorageUnitTree(storageUnitId?: string) {
  return useQuery({
    queryKey: customerInventoryKeys.tree(storageUnitId),
    queryFn: () => getStorageUnitTreeApi(storageUnitId!),
    enabled: Boolean(storageUnitId),
  });
}

export function useStockIn(storageUnitId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockInRequest) => stockInApi(payload),
    onSuccess: () => invalidateAfterStockChange(qc, storageUnitId),
  });
}

export function useStockOut(storageUnitId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockOutRequest) => stockOutApi(payload),
    onSuccess: () => invalidateAfterStockChange(qc, storageUnitId),
  });
}

export function useStockMove(storageUnitId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockMoveRequest) => stockMoveApi(payload),
    onSuccess: () => invalidateAfterStockChange(qc, storageUnitId),
  });
}

export function useStockAdjust(storageUnitId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockAdjustRequest) => stockAdjustApi(payload),
    onSuccess: () => invalidateAfterStockChange(qc, storageUnitId),
  });
}
