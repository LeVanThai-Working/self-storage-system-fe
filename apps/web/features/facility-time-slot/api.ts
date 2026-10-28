import api from "@/lib/api/axios";
import type { ApiResponse } from "@self-storage-system-fe/shared";
import type {
  AvailableTimeSlot,
  CreateFacilityTimeSlotRequest,
  FacilityTimeSlot,
  UpdateFacilityTimeSlotRequest,
} from "./types";

/** GET /facility-time-slots/facility/:facilityId/available?date= — open slots with remaining capacity. */
export const fetchAvailableTimeSlots = async (
  facilityId: string,
  date: string
): Promise<AvailableTimeSlot[]> => {
  const { data } = await api.get<ApiResponse<AvailableTimeSlot[]>>(
    `/facility-time-slots/facility/${facilityId}/available`,
    { params: { date } }
  );
  return data.data;
};

/** GET /facility-time-slots/facility/:facilityId — every configured slot (manager view). */
export const fetchFacilityTimeSlots = async (facilityId: string): Promise<FacilityTimeSlot[]> => {
  const { data } = await api.get<ApiResponse<FacilityTimeSlot[]>>(
    `/facility-time-slots/facility/${facilityId}`
  );
  return data.data;
};

/** POST /facility-time-slots */
export const createFacilityTimeSlot = async (
  payload: CreateFacilityTimeSlotRequest
): Promise<FacilityTimeSlot> => {
  const { data } = await api.post<ApiResponse<FacilityTimeSlot>>("/facility-time-slots", payload);
  return data.data;
};

/** PATCH /facility-time-slots/:id */
export const updateFacilityTimeSlot = async (
  id: string,
  payload: UpdateFacilityTimeSlotRequest
): Promise<FacilityTimeSlot> => {
  const { data } = await api.patch<ApiResponse<FacilityTimeSlot>>(
    `/facility-time-slots/${id}`,
    payload
  );
  return data.data;
};

/** DELETE /facility-time-slots/:id */
export const deleteFacilityTimeSlot = async (id: string): Promise<void> => {
  await api.delete(`/facility-time-slots/${id}`);
};
