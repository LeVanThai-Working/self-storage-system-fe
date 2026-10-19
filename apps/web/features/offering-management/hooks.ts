import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOfferings,
  fetchOfferingById,
  fetchOfferingByFacilityAndUnitType,
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
  details: () => [...offeringKeys.all, "detail"] as const,
  detail: (id: string) => [...offeringKeys.details(), id] as const,
  byFacilityAndUnitType: (facilityId: string, unitTypeId: string) =>
    [...offeringKeys.all, "lookup", { facilityId, unitTypeId }] as const,
};

export const useOfferings = (params?: OfferingQueryParams) => {
  return useQuery({
    queryKey: offeringKeys.list(params || {}),
    queryFn: () => fetchOfferings(params),
  });
};

export const useOffering = (id: string | null, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: offeringKeys.detail(id || ""),
    queryFn: () => fetchOfferingById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
};

export const useCheckOffering = (
  facilityId?: string,
  unitTypeId?: string,
  options?: { enabled?: boolean }
) => {
  const isEnabled = Boolean(facilityId && unitTypeId) && (options?.enabled ?? true);
  return useQuery({
    queryKey: offeringKeys.byFacilityAndUnitType(facilityId || "", unitTypeId || ""),
    queryFn: () => fetchOfferingByFacilityAndUnitType(facilityId!, unitTypeId!),
    enabled: isEnabled,
    retry: false,
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
    onSuccess: (updated, variables) => {
      // Cập nhật ngay cache chi tiết bằng dữ liệu PATCH trả về, rồi làm mới danh sách
      if (updated) {
        queryClient.setQueryData(offeringKeys.detail(variables.id), updated);
      }
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
      queryClient.invalidateQueries({ queryKey: offeringKeys.detail(variables.id) });
    },
  });
};

export const useDeleteOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOffering(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.all });
    },
  });
};

export const useRestoreOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreOffering(id),
    onSuccess: (restored, id) => {
      if (restored) {
        queryClient.setQueryData(offeringKeys.detail(id), restored);
      }
      queryClient.invalidateQueries({ queryKey: offeringKeys.all });
    },
  });
};
