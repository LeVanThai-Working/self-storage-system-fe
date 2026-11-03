import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createFacilityTimeSlot,
  deleteFacilityTimeSlot,
  fetchAvailableTimeSlots,
  fetchFacilityTimeSlots,
  updateFacilityTimeSlot,
} from "./api";
import type { CreateFacilityTimeSlotRequest, UpdateFacilityTimeSlotRequest } from "./types";

export const timeSlotKeys = {
  all: ["facility-time-slots"] as const,
  byFacility: (facilityId: string) => [...timeSlotKeys.all, "facility", facilityId] as const,
  available: (facilityId: string, date: string) =>
    [...timeSlotKeys.all, "available", facilityId, date] as const,
};

/** Slots a customer can still book on `date` (YYYY-MM-DD). Stays idle until both inputs exist. */
export const useAvailableTimeSlots = (facilityId: string | undefined, date: string) =>
  useQuery({
    queryKey: timeSlotKeys.available(facilityId ?? "", date),
    queryFn: () => fetchAvailableTimeSlots(facilityId!, date),
    enabled: Boolean(facilityId) && Boolean(date),
  });

export const useFacilityTimeSlots = (facilityId: string | undefined) =>
  useQuery({
    queryKey: timeSlotKeys.byFacility(facilityId ?? ""),
    queryFn: () => fetchFacilityTimeSlots(facilityId!),
    enabled: Boolean(facilityId),
  });

export const useCreateFacilityTimeSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFacilityTimeSlotRequest) => createFacilityTimeSlot(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: timeSlotKeys.all });
      queryClient.invalidateQueries({
        queryKey: timeSlotKeys.byFacility(variables.facilityId),
      });
      toast.success("Thêm mới khung giờ thành công!");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể tạo khung giờ. Vui lòng thử lại!";
      toast.error(message);
    },
  });
};

export const useUpdateFacilityTimeSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFacilityTimeSlotRequest }) =>
      updateFacilityTimeSlot(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeSlotKeys.all });
      toast.success("Cập nhật khung giờ thành công!");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể cập nhật khung giờ. Vui lòng thử lại!";
      toast.error(message);
    },
  });
};

export const useDeleteFacilityTimeSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFacilityTimeSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeSlotKeys.all });
      toast.success("Đã xóa khung giờ làm việc thành công!");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể xóa khung giờ. Vui lòng thử lại!";
      toast.error(message);
    },
  });
};
