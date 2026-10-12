import { useEffect, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStorageUnit,
  deleteStorageUnit,
  fetchActiveOfferings,
  fetchMyFacility,
  fetchStorageUnitCount,
  fetchStorageUnits,
  restoreStorageUnit,
  updateStorageUnit,
} from "./api";
import {
  StorageUnitStatusEnum,
  type CreateStorageUnitRequest,
  type StorageUnitFilters,
  type UpdateStorageUnitRequest,
} from "./types";

export const storageUnitKeys = {
  all: ["storage-units"] as const,
  lists: () => [...storageUnitKeys.all, "list"] as const,
  list: (facilityId: string, filters: StorageUnitFilters) =>
    [...storageUnitKeys.lists(), facilityId, { filters }] as const,
  stats: (facilityId: string) => [...storageUnitKeys.all, "stats", facilityId] as const,
  offerings: (facilityId: string) => ["storage-units", "offerings", facilityId] as const,
  myFacility: ["my-facility"] as const,
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

export const useMyFacility = () =>
  useQuery({
    queryKey: storageUnitKeys.myFacility,
    queryFn: fetchMyFacility,
    retry: false,
  });

export const useStorageUnits = (facilityId: string | undefined, filters: StorageUnitFilters) =>
  useQuery({
    queryKey: storageUnitKeys.list(facilityId ?? "", filters),
    queryFn: () => fetchStorageUnits(facilityId!, filters),
    enabled: Boolean(facilityId),
    placeholderData: (previous) => previous,
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
  ];

  const results = useQueries({
    queries: statuses.map((status) => ({
      queryKey: [...storageUnitKeys.stats(facilityId ?? ""), status ?? "all"],
      queryFn: () => fetchStorageUnitCount(facilityId!, status),
      enabled: Boolean(facilityId),
    })),
  });

  const [total, available, reserved, occupied, maintenance] = results.map((r) => r.data ?? 0);
  return {
    total,
    available,
    inUse: reserved + occupied,
    maintenance,
    isLoading: results.some((r) => r.isLoading),
  };
};

export const useCreateStorageUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStorageUnitRequest) => createStorageUnit(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storageUnitKeys.all }),
  });
};

export const useUpdateStorageUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStorageUnitRequest }) =>
      updateStorageUnit(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storageUnitKeys.all }),
  });
};

export const useDeleteStorageUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStorageUnit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storageUnitKeys.all }),
  });
};

export const useRestoreStorageUnit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreStorageUnit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storageUnitKeys.all }),
  });
};
