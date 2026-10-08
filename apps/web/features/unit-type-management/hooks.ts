import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUnitTypes,
  fetchUnitTypeById,
  createUnitType,
  updateUnitType,
  deleteUnitType,
  restoreUnitType,
} from "./api";
import type { UnitTypeQueryParams, CreateUnitTypeRequest, UpdateUnitTypeRequest } from "./types";

export const unitTypeKeys = {
  all: ["unit-types"] as const,
  lists: () => [...unitTypeKeys.all, "list"] as const,
  list: (filters: UnitTypeQueryParams) => [...unitTypeKeys.lists(), { filters }] as const,
  details: () => [...unitTypeKeys.all, "detail"] as const,
  detail: (id: string) => [...unitTypeKeys.details(), id] as const,
};

export const useUnitTypes = (params?: UnitTypeQueryParams) => {
  return useQuery({
    queryKey: unitTypeKeys.list(params || {}),
    queryFn: () => fetchUnitTypes(params),
  });
};

export const useUnitType = (id: string | null, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: unitTypeKeys.detail(id || ""),
    queryFn: () => fetchUnitTypeById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
};

export const useCreateUnitType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUnitTypeRequest) => createUnitType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitTypeKeys.lists() });
    },
  });
};

export const useUpdateUnitType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUnitTypeRequest }) =>
      updateUnitType(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: unitTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: unitTypeKeys.detail(variables.id) });
    },
  });
};

export const useDeleteUnitType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUnitType(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: unitTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: unitTypeKeys.detail(id) });
    },
  });
};

export const useRestoreUnitType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreUnitType(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: unitTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: unitTypeKeys.detail(id) });
    },
  });
};
