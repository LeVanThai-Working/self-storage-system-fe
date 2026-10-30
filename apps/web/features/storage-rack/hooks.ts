import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateStorageRackRequest,
  UpdateRackTierRequest,
  UpdateStorageRackRequest,
} from "@self-storage-system-fe/shared";
import { inventoryOpsKeys } from "@/features/inventory-operations/hooks";
import { createRack, provisionRacks, updateRack, updateRackTier } from "./api";

/** Rack layout queries live under the inventory-operations keys (shared with the goods tab). */
function useRackMutation<T, R>(fn: (payload: T) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryOpsKeys.all }),
  });
}

export const useProvisionRacks = (unitId: string) =>
  useRackMutation<void, Awaited<ReturnType<typeof provisionRacks>>>(() => provisionRacks(unitId));

export const useCreateRack = () =>
  useRackMutation((payload: CreateStorageRackRequest) => createRack(payload));

export const useUpdateRack = (id: string) =>
  useRackMutation((payload: UpdateStorageRackRequest) => updateRack(id, payload));

export const useUpdateRackTier = () =>
  useRackMutation(({ id, ...payload }: UpdateRackTierRequest & { id: string }) =>
    updateRackTier(id, payload)
  );
