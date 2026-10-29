import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssignIncidentRequest,
  CancelIncidentRequest,
  CloseIncidentRequest,
  IncidentQuery,
  InvestigateIncidentRequest,
  ReportIncidentRequest,
  ResolveIncidentRequest,
} from "@self-storage-system-fe/shared";
import {
  assignIncident,
  cancelIncident,
  closeIncident,
  fetchIncident,
  fetchIncidents,
  investigateIncident,
  reportIncident,
  resolveIncident,
} from "./api";

export const incidentKeys = {
  all: ["incident-management"] as const,
  list: (query: Partial<IncidentQuery>) => [...incidentKeys.all, "list", query] as const,
  detail: (id?: string) => [...incidentKeys.all, "detail", id] as const,
};

export const useIncidents = (query: Partial<IncidentQuery>) =>
  useQuery({
    queryKey: incidentKeys.list(query),
    queryFn: () => fetchIncidents(query),
    placeholderData: keepPreviousData,
  });

export const useIncident = (id?: string) =>
  useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => fetchIncident(id!),
    enabled: Boolean(id),
  });

function useIncidentMutation<T, R>(fn: (payload: T) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: incidentKeys.all }),
  });
}

export const useReportIncident = () =>
  useIncidentMutation((payload: ReportIncidentRequest) => reportIncident(payload));
export const useAssignIncident = (id: string) =>
  useIncidentMutation((payload: AssignIncidentRequest) => assignIncident(id, payload));
export const useInvestigateIncident = (id: string) =>
  useIncidentMutation((payload: InvestigateIncidentRequest) => investigateIncident(id, payload));
export const useResolveIncident = (id: string) =>
  useIncidentMutation((payload: ResolveIncidentRequest) => resolveIncident(id, payload));
export const useCloseIncident = (id: string) =>
  useIncidentMutation((payload: CloseIncidentRequest) => closeIncident(id, payload));
export const useCancelIncident = (id: string) =>
  useIncidentMutation((payload: CancelIncidentRequest) => cancelIncident(id, payload));
