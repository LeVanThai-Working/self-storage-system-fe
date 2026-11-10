import api from "@/lib/api/axios";
import {
  ACCESS_SCHEDULE_ENDPOINTS,
  cleanQueryParams,
  type AccessScheduleDetailResponse,
  type AccessScheduleListItemResponse,
  type AccessScheduleQuery,
  type ApiResponse,
  type AvailableAccessSlotResponse,
  type AvailableAccessSlotsQuery,
  type CancelAccessScheduleRequest,
  type CreateAccessScheduleRequest,
  type PaginatedData,
} from "@self-storage-system-fe/shared";

/** Books a warehouse visit; the response carries the QR payload and the one-time OTP. */
export async function createAccessScheduleApi(
  payload: CreateAccessScheduleRequest
): Promise<AccessScheduleDetailResponse> {
  const response = await api.post<ApiResponse<AccessScheduleDetailResponse>>(
    ACCESS_SCHEDULE_ENDPOINTS.CREATE,
    payload
  );
  return response.data.data;
}

/** Time slots of a facility on one day, with how many visits each can still take. */
export async function getAvailableAccessSlotsApi(
  query: AvailableAccessSlotsQuery
): Promise<AvailableAccessSlotResponse[]> {
  const response = await api.get<ApiResponse<AvailableAccessSlotResponse[]>>(
    ACCESS_SCHEDULE_ENDPOINTS.AVAILABLE_SLOTS,
    { params: query }
  );
  return response.data.data;
}

/** The customer's own visits; BE scopes the list to the caller. */
export async function getAccessSchedulesApi(
  query: Partial<AccessScheduleQuery>
): Promise<PaginatedData<AccessScheduleListItemResponse>> {
  const response = await api.get<ApiResponse<PaginatedData<AccessScheduleListItemResponse>>>(
    ACCESS_SCHEDULE_ENDPOINTS.LIST,
    { params: cleanQueryParams(query) }
  );
  return response.data.data;
}

export async function getAccessScheduleApi(id: string): Promise<AccessScheduleDetailResponse> {
  const response = await api.get<ApiResponse<AccessScheduleDetailResponse>>(
    ACCESS_SCHEDULE_ENDPOINTS.DETAIL(id)
  );
  return response.data.data;
}

/** Allowed only while pending and at least one hour before the slot starts. */
export async function cancelAccessScheduleApi(
  id: string,
  payload: CancelAccessScheduleRequest = {}
): Promise<AccessScheduleDetailResponse> {
  const response = await api.post<ApiResponse<AccessScheduleDetailResponse>>(
    ACCESS_SCHEDULE_ENDPOINTS.CANCEL(id),
    payload
  );
  return response.data.data;
}
