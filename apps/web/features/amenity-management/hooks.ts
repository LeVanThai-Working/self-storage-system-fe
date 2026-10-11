import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAmenities,
  fetchAmenityById,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  restoreAmenity,
} from "./api";
import type { AmenityQueryParams, CreateAmenityRequest, UpdateAmenityRequest } from "./types";

export const amenityKeys = {
  all: ["amenities"] as const,
  lists: () => [...amenityKeys.all, "list"] as const,
  list: (filters: AmenityQueryParams) => [...amenityKeys.lists(), { filters }] as const,
  details: () => [...amenityKeys.all, "detail"] as const,
  detail: (id: string) => [...amenityKeys.details(), id] as const,
};

export const useAmenities = (params?: AmenityQueryParams) => {
  return useQuery({
    queryKey: amenityKeys.list(params || {}),
    queryFn: () => fetchAmenities(params),
  });
};

export const useAmenity = (id: string | null, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: amenityKeys.detail(id || ""),
    queryFn: () => fetchAmenityById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
};

export const useCreateAmenity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAmenityRequest) => createAmenity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: amenityKeys.lists() });
    },
  });
};

export const useUpdateAmenity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAmenityRequest }) =>
      updateAmenity(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: amenityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: amenityKeys.detail(variables.id) });
    },
  });
};

export const useDeleteAmenity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAmenity(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: amenityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: amenityKeys.detail(id) });
    },
  });
};

export const useRestoreAmenity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreAmenity(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: amenityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: amenityKeys.detail(id) });
    },
  });
};
