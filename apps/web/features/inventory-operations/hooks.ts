import { useQuery } from "@tanstack/react-query";
import { fetchUnitInventoryTree, fetchUnitRacks } from "./api";

export const inventoryOpsKeys = {
  all: ["inventory-ops"] as const,
  unitRacks: (unitId?: string) => [...inventoryOpsKeys.all, "unit-racks", unitId] as const,
  unitTree: (unitId?: string) => [...inventoryOpsKeys.all, "unit-tree", unitId] as const,
};

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
