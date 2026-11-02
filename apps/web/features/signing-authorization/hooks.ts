import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSigningAuthorizations,
  fetchSigningAuthorizationById,
  createSigningAuthorization,
  updateSigningAuthorization,
  revokeSigningAuthorization,
  fetchLegalEntities,
  fetchFacilityManagersList,
  fetchFacilitiesList,
} from "./api";
import type {
  CreateSigningAuthorizationRequest,
  UpdateSigningAuthorizationRequest,
  SigningAuthorizationFilterParams,
} from "./types";

export const signingAuthorizationKeys = {
  all: ["signing-authorizations"] as const,
  lists: () => [...signingAuthorizationKeys.all, "list"] as const,
  list: (filters: SigningAuthorizationFilterParams) =>
    [...signingAuthorizationKeys.lists(), { filters }] as const,
  details: () => [...signingAuthorizationKeys.all, "detail"] as const,
  detail: (id: string) => [...signingAuthorizationKeys.details(), id] as const,
  legalEntities: () => ["legal-entities"] as const,
  facilityManagers: () => ["users", "facility-managers"] as const,
  facilities: () => ["facilities", "list-all"] as const,
};

export const useSigningAuthorizations = (
  params?: SigningAuthorizationFilterParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: signingAuthorizationKeys.list(params || {}),
    queryFn: () => fetchSigningAuthorizations(params),
    enabled: options?.enabled ?? true,
  });
};

export const useSigningAuthorization = (id: string | null, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: signingAuthorizationKeys.detail(id || ""),
    queryFn: () => fetchSigningAuthorizationById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
};

export const useCreateSigningAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSigningAuthorizationRequest) => createSigningAuthorization(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signingAuthorizationKeys.all });
    },
  });
};

export const useUpdateSigningAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSigningAuthorizationRequest }) =>
      updateSigningAuthorization(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: signingAuthorizationKeys.all });
      queryClient.invalidateQueries({
        queryKey: signingAuthorizationKeys.detail(variables.id),
      });
    },
  });
};

export const useRevokeSigningAuthorization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeSigningAuthorization(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: signingAuthorizationKeys.all });
      queryClient.invalidateQueries({
        queryKey: signingAuthorizationKeys.detail(id),
      });
    },
  });
};

export const useLegalEntities = () => {
  return useQuery({
    queryKey: signingAuthorizationKeys.legalEntities(),
    queryFn: fetchLegalEntities,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFacilityManagers = () => {
  return useQuery({
    queryKey: signingAuthorizationKeys.facilityManagers(),
    queryFn: fetchFacilityManagersList,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFacilitiesList = () => {
  return useQuery({
    queryKey: signingAuthorizationKeys.facilities(),
    queryFn: fetchFacilitiesList,
    staleTime: 5 * 60 * 1000,
  });
};
