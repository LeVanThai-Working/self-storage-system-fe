import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  CreateCustomerSkuRequest,
  CustomerSkuQuery,
  UpdateCustomerSkuRequest,
} from "@self-storage-system-fe/shared";
import {
  createCustomerSkuApi,
  deleteCustomerSkuApi,
  getCustomerSkuApi,
  getCustomerSkuByBarcodeApi,
  getCustomerSkusApi,
  updateCustomerSkuApi,
} from "../api/customerSku.api";

const SKU_PAGE_SIZE = 20;

export type CustomerSkuListFilters = Pick<CustomerSkuQuery, "status" | "category" | "search">;

export const customerSkuKeys = {
  all: ["customer-skus"] as const,
  list: (filters: Partial<CustomerSkuListFilters>) =>
    [...customerSkuKeys.all, "list", filters] as const,
  detail: (id?: string) => [...customerSkuKeys.all, "detail", id] as const,
  barcode: (barcode?: string) => [...customerSkuKeys.all, "barcode", barcode] as const,
};

function invalidateSkus(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: customerSkuKeys.all });
  // Tree items embed SKU snapshots (name, image, size), so refresh the rack map too.
  qc.invalidateQueries({ queryKey: ["customer-inventory-tree"] });
}

export function useCustomerSkuList(filters: Partial<CustomerSkuListFilters>) {
  return useInfiniteQuery({
    queryKey: customerSkuKeys.list(filters),
    queryFn: ({ pageParam }) =>
      getCustomerSkusApi({
        ...filters,
        page: pageParam,
        limit: SKU_PAGE_SIZE,
        sortBy: "updatedAt",
        sortOrder: "desc",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
  });
}

export function useCustomerSku(id?: string) {
  return useQuery({
    queryKey: customerSkuKeys.detail(id),
    queryFn: () => getCustomerSkuApi(id!),
    enabled: Boolean(id),
  });
}

/** Imperative barcode lookup (scanner, duplicate check); rejects with 610 when not found. */
export function useLookupSkuByBarcode() {
  const qc = useQueryClient();
  return useCallback(
    (barcode: string) =>
      qc.fetchQuery({
        queryKey: customerSkuKeys.barcode(barcode),
        queryFn: () => getCustomerSkuByBarcodeApi(barcode),
        staleTime: 0,
      }),
    [qc]
  );
}

export function useCreateCustomerSku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerSkuRequest) => createCustomerSkuApi(payload),
    onSuccess: (sku) => {
      qc.setQueryData(customerSkuKeys.detail(sku.id), sku);
      invalidateSkus(qc);
    },
  });
}

export function useUpdateCustomerSku(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCustomerSkuRequest) => updateCustomerSkuApi(id, payload),
    onSuccess: (sku) => {
      qc.setQueryData(customerSkuKeys.detail(sku.id), sku);
      invalidateSkus(qc);
    },
  });
}

export function useDeleteCustomerSku() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomerSkuApi(id),
    onSuccess: () => invalidateSkus(qc),
  });
}
