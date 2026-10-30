import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  BatchMigrateRackRequest,
  CompleteOutboundHandoverRequest,
  CreateCustomerSkuRequest,
  CreateInboundRequest,
  EvacuateRackToHoldingRequest,
  InventoryRequestQuery,
  PutawayInboundRequest,
  StockAdjustRequest,
  StockMoveRequest,
  UpdateInventoryStatusRequest,
} from "@self-storage-system-fe/shared";
import {
  batchMigrateRack,
  completeOutboundHandover,
  createCustomerSku,
  createInboundRequest,
  evacuateRackToHolding,
  fetchCustomerSkus,
  fetchInventoryRequest,
  fetchInventoryRequests,
  fetchUnitInventoryTree,
  fetchUnitRacks,
  putawayInboundRequest,
  stockAdjust,
  stockMove,
  updateInventoryStatus,
  verifyPickupCode,
} from "./api";

export const inventoryOpsKeys = {
  all: ["inventory-ops"] as const,
  requests: (query: Partial<InventoryRequestQuery>) =>
    [...inventoryOpsKeys.all, "requests", query] as const,
  request: (id?: string) => [...inventoryOpsKeys.all, "request", id] as const,
  unitRacks: (unitId?: string) => [...inventoryOpsKeys.all, "unit-racks", unitId] as const,
  unitTree: (unitId?: string) => [...inventoryOpsKeys.all, "unit-tree", unitId] as const,
  customerSkus: (customerId?: string, search?: string) =>
    [...inventoryOpsKeys.all, "customer-skus", customerId, search ?? ""] as const,
};

/** Every stock-changing action can touch requests, racks and trees, so refresh the whole area. */
const invalidateAll = (qc: QueryClient) => qc.invalidateQueries({ queryKey: inventoryOpsKeys.all });

export const useInventoryRequests = (query: Partial<InventoryRequestQuery>, enabled = true) =>
  useQuery({
    queryKey: inventoryOpsKeys.requests(query),
    queryFn: () => fetchInventoryRequests(query),
    enabled,
  });

export const useInventoryRequest = (id?: string) =>
  useQuery({
    queryKey: inventoryOpsKeys.request(id),
    queryFn: () => fetchInventoryRequest(id!),
    enabled: Boolean(id),
  });

export const useUnitRacks = (unitId?: string) =>
  useQuery({
    queryKey: inventoryOpsKeys.unitRacks(unitId),
    queryFn: () => fetchUnitRacks(unitId!),
    enabled: Boolean(unitId),
  });

export const useUnitInventoryTree = (unitId?: string) =>
  useQuery({
    queryKey: inventoryOpsKeys.unitTree(unitId),
    queryFn: () => fetchUnitInventoryTree(unitId!),
    enabled: Boolean(unitId),
    retry: false,
  });

export const useCustomerSkus = (customerId?: string, search?: string) =>
  useQuery({
    queryKey: inventoryOpsKeys.customerSkus(customerId, search),
    queryFn: () => fetchCustomerSkus(customerId!, search),
    enabled: Boolean(customerId),
  });

export const useVerifyPickupCode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verifyPickupCode,
    onSuccess: () => invalidateAll(qc),
  });
};

export const useCompleteOutbound = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompleteOutboundHandoverRequest) => completeOutboundHandover(id, payload),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useCreateInboundRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInboundRequest) => createInboundRequest(payload),
    onSuccess: () => invalidateAll(qc),
  });
};

export const usePutawayInbound = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PutawayInboundRequest) => putawayInboundRequest(id, payload),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useStockMove = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockMoveRequest) => stockMove(payload),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useStockAdjust = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockAdjustRequest) => stockAdjust(payload),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateInventoryStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateInventoryStatusRequest & { id: string }) =>
      updateInventoryStatus(id, payload),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useBatchMigrateRack = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchMigrateRackRequest) => batchMigrateRack(payload),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useEvacuateRack = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EvacuateRackToHoldingRequest) => evacuateRackToHolding(payload),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useCreateCustomerSku = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerSkuRequest) => createCustomerSku(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...inventoryOpsKeys.all, "customer-skus"] }),
  });
};
