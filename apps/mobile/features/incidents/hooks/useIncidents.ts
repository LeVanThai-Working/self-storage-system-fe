import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  IncidentQuery,
  IncidentResponse,
  ReportIncidentRequest,
} from "@self-storage-system-fe/shared";
import {
  cancelIncidentApi,
  closeIncidentApi,
  getIncidentApi,
  getIncidentsApi,
  reportIncidentApi,
} from "../api/incident.api";

const INCIDENT_PAGE_SIZE = 15;

export type IncidentFilters = Pick<IncidentQuery, "status">;

export const incidentKeys = {
  all: ["incidents"] as const,
  list: (filters: Partial<IncidentFilters>) => [...incidentKeys.all, "list", filters] as const,
  detail: (id?: string) => [...incidentKeys.all, "detail", id] as const,
};

export function useIncidentList(filters: Partial<IncidentFilters>, enabled = true) {
  return useInfiniteQuery({
    queryKey: incidentKeys.list(filters),
    queryFn: ({ pageParam }) =>
      getIncidentsApi({
        ...filters,
        page: pageParam,
        limit: INCIDENT_PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    enabled,
  });
}

export function useIncident(id?: string) {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => getIncidentApi(id!),
    enabled: Boolean(id),
  });
}

function useOnIncidentChanged() {
  const qc = useQueryClient();
  return (incident: IncidentResponse) => {
    qc.setQueryData(incidentKeys.detail(incident.id), incident);
    qc.invalidateQueries({ queryKey: [...incidentKeys.all, "list"] });
  };
}

export function useReportIncident() {
  const onSuccess = useOnIncidentChanged();
  return useMutation({
    mutationFn: (payload: ReportIncidentRequest) => reportIncidentApi(payload),
    onSuccess,
  });
}

export function useCloseIncident(id: string) {
  const onSuccess = useOnIncidentChanged();
  return useMutation({ mutationFn: (notes?: string) => closeIncidentApi(id, notes), onSuccess });
}

export function useCancelIncident(id: string) {
  const onSuccess = useOnIncidentChanged();
  return useMutation({
    mutationFn: (reason: string) => cancelIncidentApi(id, reason),
    onSuccess,
  });
}
