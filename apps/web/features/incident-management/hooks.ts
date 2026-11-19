import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssignIncidentRequest,
  CancelIncidentRequest,
  CloseIncidentRequest,
  IncidentQuery,
  InvestigateIncidentRequest,
  ReportIncidentRequest,
  ResolveIncidentRequest,
  EvacuateIncidentRackRequest,
  UploadRestorationManifestRequest,
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
  evacuateIncidentRack,
  uploadRestorationManifest,
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
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      ["closed", "cancelled"].includes(query.state.data?.status ?? "") ? false : 30000,
  });

function useIncidentMutation<T, R>(fn: (payload: T) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: incidentKeys.all });
      void qc.invalidateQueries({ queryKey: ["inventory-ops"] });
      void qc.invalidateQueries({ queryKey: ["storage-racks"] });
      void qc.invalidateQueries({ queryKey: ["storage-units"] });
    },
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
export const useEvacuateIncidentRack = (id: string) =>
  useIncidentMutation((payload: EvacuateIncidentRackRequest) => evacuateIncidentRack(id, payload));
export const useUploadRestorationManifest = (id: string) =>
  useIncidentMutation((payload: UploadRestorationManifestRequest) =>
    uploadRestorationManifest(id, payload)
  );
