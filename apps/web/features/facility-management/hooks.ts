import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFacilities,
  fetchFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  restoreFacility,
  assignFacilityManager,
  fetchFacilityManagers,
} from "./api";
import type { FacilityQueryParams } from "./types";

export const facilityKeys = {
  all: ["facilities"] as const,
  lists: () => [...facilityKeys.all, "list"] as const,
  list: (filters: FacilityQueryParams) => [...facilityKeys.lists(), { filters }] as const,
  details: () => [...facilityKeys.all, "detail"] as const,
  detail: (id: string) => [...facilityKeys.details(), id] as const,
};

export const useFacilities = (params?: FacilityQueryParams) => {
  return useQuery({
    queryKey: facilityKeys.list(params || {}),
    queryFn: () => fetchFacilities(params),
  });
};

export const useFacility = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: facilityKeys.detail(id),
    queryFn: () => fetchFacilityById(id),
    enabled: !!id && (options?.enabled ?? true),
  });
};

export const useCreateFacility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilityKeys.lists() });
    },
  });
};

export const useUpdateFacility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFacility,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: facilityKeys.lists() });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: facilityKeys.detail(data.id) });
      }
    },
  });
};

export const useDeleteFacility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilityKeys.lists() });
    },
  });
};

export const useRestoreFacility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreFacility,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: facilityKeys.lists() });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: facilityKeys.detail(data.id) });
      }
    },
  });
};

export const useFacilityManagers = () => {
  return useQuery({
    queryKey: ["users", "facility-managers"] as const,
    queryFn: fetchFacilityManagers,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAssignFacilityManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignFacilityManager,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: facilityKeys.lists() });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: facilityKeys.detail(data.id) });
      }
    },
  });
};
