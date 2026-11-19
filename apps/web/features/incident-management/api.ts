import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse as Envelope,
  type AssignIncidentRequest,
  type CancelIncidentRequest,
  type CloseIncidentRequest,
  type IncidentQuery,
  type IncidentResponse,
  type InvestigateIncidentRequest,
  type PaginatedData,
  type ReportIncidentRequest,
  type ResolveIncidentRequest,
  type EvacuateIncidentRackRequest,
  type UploadRestorationManifestRequest,
  RoleEnum,
  UserStatusEnum,
  type FacilityStaffItem,
} from "@self-storage-system-fe/shared";

/** Ops selects staff from the incident's facility, across every result page. */
export async function fetchIncidentStaffs(facilityId: string): Promise<FacilityStaffItem[]> {
  const items: FacilityStaffItem[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { data } = await api.get<Envelope<PaginatedData<FacilityStaffItem>>>("/users", {
      params: {
        assignedFacilityId: facilityId,
        role: RoleEnum.FACILITY_STAFF,
        page,
        limit: 100,
        sortBy: "name",
        sortOrder: "asc",
      },
    });
    items.push(...data.data.items.filter((staff) => staff.status === UserStatusEnum.ACTIVE));
    totalPages = data.data.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);
  return items;
}

/** GET /incidents — BE scopes staff/FM to their facility. */
export const fetchIncidents = async (
  query: Partial<IncidentQuery>
): Promise<PaginatedData<IncidentResponse>> => {
  const { data } = await api.get<Envelope<PaginatedData<IncidentResponse>>>("/incidents", {
    params: cleanQueryParams(query),
  });
  return data.data;
};

/** GET /incidents/{id} */
export const fetchIncident = async (id: string): Promise<IncidentResponse> => {
  const { data } = await api.get<Envelope<IncidentResponse>>(`/incidents/${id}`);
  return data.data;
};

/** POST /incidents — staff / FM report an issue inside their facility. */
export const reportIncident = async (payload: ReportIncidentRequest): Promise<IncidentResponse> => {
  const { data } = await api.post<Envelope<IncidentResponse>>("/incidents", payload);
  return data.data;
};

const action =
  <T>(path: string) =>
  async (id: string, payload: T): Promise<IncidentResponse> => {
    const { data } = await api.post<Envelope<IncidentResponse>>(
      `/incidents/${id}/${path}`,
      payload
    );
    return data.data;
  };

/** POST /incidents/{id}/assign (FM) */
export const assignIncident = action<AssignIncidentRequest>("assign");
/** POST /incidents/{id}/investigate (assignee or FM) */
export const investigateIncident = action<InvestigateIncidentRequest>("investigate");
/** POST /incidents/{id}/resolve (assignee or FM) */
export const resolveIncident = action<ResolveIncidentRequest>("resolve");
/** POST /incidents/{id}/close (FM; staff are not allowed) */
export const closeIncident = action<CloseIncidentRequest>("close");
/** POST /incidents/{id}/cancel (FM while reported / assigned) */
export const cancelIncident = action<CancelIncidentRequest>("cancel");
export const evacuateIncidentRack = action<EvacuateIncidentRackRequest>("evacuate-rack");
export const uploadRestorationManifest =
  action<UploadRestorationManifestRequest>("restoration-manifest");
