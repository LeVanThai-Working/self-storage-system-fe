import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOfferings,
  createOffering,
  updateOffering,
  deleteOffering,
  restoreOffering,
} from "./api";
import type { OfferingQueryParams, CreateOfferingRequest, UpdateOfferingRequest } from "./types";

export const offeringKeys = {
  all: ["facility-unit-type-offerings"] as const,
  lists: () => [...offeringKeys.all, "list"] as const,
  list: (filters: OfferingQueryParams) => [...offeringKeys.lists(), { filters }] as const,
};

export const useOfferings = (params?: OfferingQueryParams) => {
  return useQuery({
    queryKey: offeringKeys.list(params || {}),
    queryFn: () => fetchOfferings(params),
  });
};

export const useCreateOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOfferingRequest) => createOffering(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
    },
  });
};

export const useUpdateOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOfferingRequest }) =>
      updateOffering(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
    },
  });
};

export const useDeleteOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOffering(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
    },
  });
};

export const useRestoreOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreOffering(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
    },
  });
};
