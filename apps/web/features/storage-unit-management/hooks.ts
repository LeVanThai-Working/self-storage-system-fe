import { useEffect, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleEnum } from "@self-storage-system-fe/shared";
import { useAuthStore } from "@/features/auth/store";
import {
  createStorageRack,
  createStorageUnit,
  deleteStorageRack,
  deleteStorageUnit,
  fetchActiveOfferings,
  fetchAvailableStorageUnits,
  fetchFacilityMapLayout,
  fetchMyFacility,
  fetchStorageRackById,
  fetchStorageRacks,
  fetchStorageUnitById,
  fetchStorageUnitCount,
  fetchStorageUnits,
  fetchUnitStorageRacks,
  reconcileStorageUnits,
  restoreStorageUnit,
  toggleStorageUnitMaintenance,
  updateRackTier,
  updateStorageRack,
  updateStorageUnit,
} from "./api";
import {
  StorageUnitStatusEnum,
  type AvailableStorageUnitQuery,
  type CreateStorageRackRequest,
  type CreateStorageUnitRequest,
  type StorageRackQuery,
  type StorageUnitFilters,
  type ToggleMaintenanceRequest,
  type UpdateRackTierRequest,
  type UpdateStorageRackRequest,
  type UpdateStorageUnitRequest,
} from "./types";

export const storageUnitKeys = {
  all: ["storage-units"] as const,
  lists: () => [...storageUnitKeys.all, "list"] as const,
  list: (facilityId: string, filters: StorageUnitFilters) =>
    [...storageUnitKeys.lists(), facilityId, { filters }] as const,
  detail: (id: string) => [...storageUnitKeys.all, "detail", id] as const,
  stats: (facilityId: string) => [...storageUnitKeys.all, "stats", facilityId] as const,
  mapLayout: (facilityId: string) => [...storageUnitKeys.all, "map-layout", facilityId] as const,
  available: (facilityId: string, query?: AvailableStorageUnitQuery) =>
    [...storageUnitKeys.all, "available", facilityId, query] as const,
  offerings: (facilityId: string) => ["storage-units", "offerings", facilityId] as const,
  myFacility: ["my-facility"] as const,
};

export const storageRackKeys = {
  all: ["storage-racks"] as const,
  lists: () => [...storageRackKeys.all, "list"] as const,
  list: (query?: StorageRackQuery) => [...storageRackKeys.lists(), query] as const,
  unitRacks: (unitId: string) => [...storageRackKeys.all, "unit", unitId] as const,
  detail: (id: string) => [...storageRackKeys.all, "detail", id] as const,
};

/** Returns `value` only after it stopped changing for `delay` ms. */
export const useDebouncedValue = <T>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

export const useMyFacility = (options?: { enabled?: boolean }) => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isFacilityManager = currentUser?.role === RoleEnum.FACILITY_MANAGER;
  const isEnabled = options?.enabled !== undefined ? options.enabled : isFacilityManager;

  return useQuery({
    queryKey: storageUnitKeys.myFacility,
    queryFn: fetchMyFacility,
    retry: false,
    enabled: isEnabled && Boolean(currentUser),
  });
};

export const useStorageUnits = (facilityId: string | undefined, filters: StorageUnitFilters) =>
  useQuery({
    queryKey: storageUnitKeys.list(facilityId ?? "", filters),
    queryFn: () => fetchStorageUnits(facilityId!, filters),
    enabled: Boolean(facilityId),
    placeholderData: (previous) => previous,
  });

export const useStorageUnitDetail = (id: string | undefined) =>
  useQuery({
    queryKey: storageUnitKeys.detail(id ?? ""),
    queryFn: () => fetchStorageUnitById(id!),
    enabled: Boolean(id),
  });

export const useFacilityOfferings = (facilityId: string | undefined) =>
  useQuery({
    queryKey: storageUnitKeys.offerings(facilityId ?? ""),
    queryFn: () => fetchActiveOfferings(facilityId!),
    enabled: Boolean(facilityId),
  });

/** Facility-wide counters for the KPI cards (independent from the table filters). */
export const useStorageUnitStats = (facilityId: string | undefined) => {
  const statuses: Array<StorageUnitStatusEnum | undefined> = [
    undefined,
    StorageUnitStatusEnum.AVAILABLE,
    StorageUnitStatusEnum.RESERVED,
    StorageUnitStatusEnum.OCCUPIED,
    StorageUnitStatusEnum.UNDER_MAINTENANCE,
    StorageUnitStatusEnum.PENDING_CLEARANCE,
  ];

  const results = useQueries({
    queries: statuses.map((status) => ({
      queryKey: [...storageUnitKeys.stats(facilityId ?? ""), status ?? "all"],
      queryFn: () => fetchStorageUnitCount(facilityId!, status),
      enabled: Boolean(facilityId),
    })),
  });

  const [total, available, reserved, occupied, maintenance, pendingClearance] = results.map(
    (r) => r.data ?? 0
  );
  return {
    total,
    available,
    inUse: reserved + occupied,
    maintenance,
    pendingClearance,
    isLoading: results.some((r) => r.isLoading),
  };
};

export const useCreateStorageUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStorageUnitRequest) => createStorageUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageUnitKeys.all });
      queryClient.invalidateQueries({ queryKey: ["availableUnits"] });
      queryClient.invalidateQueries({ queryKey: ["available-storage-units"] });
    },
  });
};

export const useUpdateStorageUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStorageUnitRequest }) =>
      updateStorageUnit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageUnitKeys.all });
      queryClient.invalidateQueries({ queryKey: ["availableUnits"] });
      queryClient.invalidateQueries({ queryKey: ["available-storage-units"] });
    },
  });
};

export const useDeleteStorageUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStorageUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageUnitKeys.all });
      queryClient.invalidateQueries({ queryKey: ["availableUnits"] });
      queryClient.invalidateQueries({ queryKey: ["available-storage-units"] });
    },
  });
};

export const useRestoreStorageUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreStorageUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageUnitKeys.all });
      queryClient.invalidateQueries({ queryKey: ["availableUnits"] });
      queryClient.invalidateQueries({ queryKey: ["available-storage-units"] });
    },
  });
};

/** Every unit of the facility, used by the floor-plan view. Only fetched while the map is shown. */
export const useFacilityMapLayout = (facilityId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: storageUnitKeys.mapLayout(facilityId ?? ""),
    queryFn: () => fetchFacilityMapLayout(facilityId!),
    enabled: Boolean(facilityId) && enabled,
  });

export const useAvailableStorageUnits = (
  facilityId: string | undefined,
  query?: AvailableStorageUnitQuery,
  enabled = true
) =>
  useQuery({
    queryKey: storageUnitKeys.available(facilityId ?? "", query),
    queryFn: () => fetchAvailableStorageUnits(facilityId!, query),
    enabled: Boolean(facilityId) && enabled,
  });

export const useToggleMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ToggleMaintenanceRequest }) =>
      toggleStorageUnitMaintenance(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageUnitKeys.all });
      queryClient.invalidateQueries({ queryKey: ["availableUnits"] });
      queryClient.invalidateQueries({ queryKey: ["available-storage-units"] });
    },
  });
};

export const useReconcileStorageUnits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reconcileStorageUnits(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageUnitKeys.all });
      queryClient.invalidateQueries({ queryKey: storageRackKeys.all });
      queryClient.invalidateQueries({ queryKey: ["availableUnits"] });
      queryClient.invalidateQueries({ queryKey: ["available-storage-units"] });
    },
  });
};

/* =====================================================================
 * STORAGE RACKS & TIERS HOOKS
 * ===================================================================== */

export const useStorageRacks = (query?: StorageRackQuery) =>
  useQuery({
    queryKey: storageRackKeys.list(query),
    queryFn: () => fetchStorageRacks(query),
  });

export const useUnitStorageRacks = (unitId: string | undefined) =>
  useQuery({
    queryKey: storageRackKeys.unitRacks(unitId ?? ""),
    queryFn: () => fetchUnitStorageRacks(unitId!),
    enabled: Boolean(unitId),
  });

export const useStorageRackDetail = (id: string | undefined) =>
  useQuery({
    queryKey: storageRackKeys.detail(id ?? ""),
    queryFn: () => fetchStorageRackById(id!),
    enabled: Boolean(id),
  });

export const useCreateStorageRack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStorageRackRequest) => createStorageRack(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageRackKeys.all });
    },
  });
};

export const useUpdateStorageRack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStorageRackRequest }) =>
      updateStorageRack(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageRackKeys.all });
    },
  });
};

export const useUpdateRackTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, payload }: { tierId: string; payload: UpdateRackTierRequest }) =>
      updateRackTier(tierId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageRackKeys.all });
    },
  });
};

export const useDeleteStorageRack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStorageRack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageRackKeys.all });
    },
  });
};
