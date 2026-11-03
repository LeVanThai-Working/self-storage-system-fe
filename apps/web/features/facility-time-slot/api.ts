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
  const maxCapacity = payload.maxCapacity ?? payload.slotCapacity ?? 5;
  const slotName =
    payload.slotName && payload.slotName.trim().length > 0
      ? payload.slotName.trim()
      : `${payload.startTime} - ${payload.endTime}`;

  const body = {
    facilityId: payload.facilityId,
    slotName,
    startTime: payload.startTime,
    endTime: payload.endTime,
    maxCapacity,
    isActive: payload.isActive ?? true,
    ...(payload.notes ? { notes: payload.notes } : {}),
    ...(payload.dayOfWeek ? { dayOfWeek: payload.dayOfWeek } : {}),
  };

  const { data } = await api.post<ApiResponse<FacilityTimeSlot>>("/facility-time-slots", body);
  return data.data;
};

/** PATCH /facility-time-slots/:id */
export const updateFacilityTimeSlot = async (
  id: string,
  payload: UpdateFacilityTimeSlotRequest
): Promise<FacilityTimeSlot> => {
  const body: Record<string, unknown> = { ...payload };

  if (payload.slotCapacity !== undefined && payload.maxCapacity === undefined) {
    body.maxCapacity = payload.slotCapacity;
  }
  if (payload.slotName !== undefined) {
    body.slotName = payload.slotName.trim();
  }

  const { data } = await api.patch<ApiResponse<FacilityTimeSlot>>(
    `/facility-time-slots/${id}`,
    body
  );
  return data.data;
};

/** DELETE /facility-time-slots/:id */
export const deleteFacilityTimeSlot = async (id: string): Promise<void> => {
  await api.delete(`/facility-time-slots/${id}`);
};
