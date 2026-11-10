import api from "@/lib/api/axios";
import {
  ACCESS_SCHEDULE_ENDPOINTS,
  cleanQueryParams,
  type AccessScheduleCheckInResponse,
  type AccessScheduleDetailResponse,
  type AccessScheduleListItemResponse,
  type AccessScheduleQuery,
  type ApiResponse as Envelope,
  type CheckInAccessScheduleRequest,
  type CheckOutAccessScheduleRequest,
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

/** POST /access-schedules/check-in — `code` is the scanned QR payload or the 6-digit OTP. */
export const checkInAccessSchedule = async (
  payload: CheckInAccessScheduleRequest
): Promise<AccessScheduleCheckInResponse> => {
  const { data } = await api.post<Envelope<AccessScheduleCheckInResponse>>(
    ACCESS_SCHEDULE_ENDPOINTS.CHECK_IN,
    payload
  );
  return data.data;
};

/** POST /access-schedules/{id}/check-out — closes a visit when the customer leaves. */
export const checkOutAccessSchedule = async (
  id: string,
  payload: CheckOutAccessScheduleRequest
): Promise<AccessScheduleDetailResponse> => {
  const { data } = await api.post<Envelope<AccessScheduleDetailResponse>>(
    ACCESS_SCHEDULE_ENDPOINTS.CHECK_OUT(id),
    payload
  );
  return data.data;
};
