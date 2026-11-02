import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLegalEntities,
  fetchLegalEntityById,
  createLegalEntity,
  updateLegalEntity,
  deleteLegalEntity,
} from "./api";
import type { LegalEntityQuery, CreateLegalEntityRequest, UpdateLegalEntityRequest } from "./types";

export const legalEntityKeys = {
  all: ["legal-entities"] as const,
  lists: () => [...legalEntityKeys.all, "list"] as const,
  list: (query?: LegalEntityQuery) => [...legalEntityKeys.lists(), { query }] as const,
  details: () => [...legalEntityKeys.all, "detail"] as const,
  detail: (id: string) => [...legalEntityKeys.details(), id] as const,
};

export function useLegalEntities(query?: LegalEntityQuery) {
  return useQuery({
    queryKey: legalEntityKeys.list(query),
    queryFn: () => fetchLegalEntities(query),
  });
}

export function useLegalEntity(id: string) {
  return useQuery({
    queryKey: legalEntityKeys.detail(id),
    queryFn: () => fetchLegalEntityById(id),
    enabled: Boolean(id),
  });
}

export function useCreateLegalEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLegalEntityRequest) => createLegalEntity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalEntityKeys.lists() });
    },
  });
}

export function useUpdateLegalEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLegalEntityRequest }) =>
      updateLegalEntity(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: legalEntityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: legalEntityKeys.detail(id) });
    },
  });
}

export function useDeleteLegalEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLegalEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: legalEntityKeys.lists() });
    },
  });
}
