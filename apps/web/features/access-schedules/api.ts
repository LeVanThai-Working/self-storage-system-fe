import api from "@/lib/api/axios";
import {
  ACCESS_SCHEDULE_ENDPOINTS,
  cleanQueryParams,
  type AccessScheduleDetailResponse,
  type AccessScheduleListItemResponse,
  type AccessScheduleQuery,
  type ApiResponse as Envelope,
  type PaginatedData,
} from "@self-storage-system-fe/shared";

/** GET /access-schedules — BE scopes staff/FM to their facility. */
export const fetchAccessSchedules = async (
  query: Partial<AccessScheduleQuery>
): Promise<PaginatedData<AccessScheduleListItemResponse>> => {
  const { data } = await api.get<Envelope<PaginatedData<AccessScheduleListItemResponse>>>(
    ACCESS_SCHEDULE_ENDPOINTS.LIST,
    { params: cleanQueryParams(query) }
  );
  return data.data;
};

/** GET /access-schedules/{id} */
export const fetchAccessSchedule = async (id: string): Promise<AccessScheduleDetailResponse> => {
  const { data } = await api.get<Envelope<AccessScheduleDetailResponse>>(
    ACCESS_SCHEDULE_ENDPOINTS.DETAIL(id)
  );
  return data.data;
};
