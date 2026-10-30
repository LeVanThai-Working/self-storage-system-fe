import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse,
  type IncidentQuery,
  type IncidentResponse,
  type PaginatedData,
  type ReportIncidentRequest,
} from "@self-storage-system-fe/shared";

/** GET /incidents — BE returns only the incidents the customer reported. */
export async function getIncidentsApi(
  query: Partial<IncidentQuery>
): Promise<PaginatedData<IncidentResponse>> {
  const response = await api.get<ApiResponse<PaginatedData<IncidentResponse>>>("/incidents", {
    params: cleanQueryParams(query),
  });
  return response.data.data;
}

/** GET /incidents/{id} */
export async function getIncidentApi(id: string): Promise<IncidentResponse> {
  const response = await api.get<ApiResponse<IncidentResponse>>(`/incidents/${id}`);
  return response.data.data;
}

/** POST /incidents — `facilityId` comes from the chosen contract; at least one photo. */
export async function reportIncidentApi(payload: ReportIncidentRequest): Promise<IncidentResponse> {
  const response = await api.post<ApiResponse<IncidentResponse>>("/incidents", payload);
  return response.data.data;
}

/** POST /incidents/{id}/close — customer accepts the resolution (only when `resolved`). */
export async function closeIncidentApi(id: string, notes?: string): Promise<IncidentResponse> {
  const response = await api.post<ApiResponse<IncidentResponse>>(`/incidents/${id}/close`, {
    notes,
  });
  return response.data.data;
}

/** POST /incidents/{id}/cancel — customer can cancel only while `reported` (else 706). */
export async function cancelIncidentApi(
  id: string,
  cancellationReason: string
): Promise<IncidentResponse> {
  const response = await api.post<ApiResponse<IncidentResponse>>(`/incidents/${id}/cancel`, {
    cancellationReason,
  });
  return response.data.data;
}
