import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store";
import type {
  AccessScheduleQuery,
  AccessScheduleDetailResponse,
  AssignAccessScheduleRequest,
  UnassignAccessScheduleRequest,
  CheckInAccessScheduleRequest,
  CheckOutAccessScheduleRequest,
} from "@self-storage-system-fe/shared";
import {
  checkInAccessSchedule,
  checkOutAccessSchedule,
  fetchAccessSchedule,
  fetchAccessSchedules,
  claimAccessSchedule,
  assignAccessSchedule,
  unassignAccessSchedule,
} from "./api";

export const accessScheduleKeys = {
  all: ["access-schedules"] as const,
  list: (query: Partial<AccessScheduleQuery>) =>
    [...accessScheduleKeys.all, "list", query] as const,
  detail: (id?: string) => [...accessScheduleKeys.all, "detail", id] as const,
};

export function useAccessScheduleCaller() {
  const user = useAuthStore((state) => state.currentUser);
  return {
    id: user?.id,
    role: user?.role,
    facilityId: user?.assignedFacilityId ?? user?.facilityId ?? user?.facility?.id,
  };
}

export const useAccessSchedules = (query: Partial<AccessScheduleQuery>) =>
  useQuery({
    queryKey: accessScheduleKeys.list(query),
    queryFn: () => fetchAccessSchedules(query),
    placeholderData: keepPreviousData,
  });

export const useAccessSchedule = (id?: string) =>
  useQuery({
    queryKey: accessScheduleKeys.detail(id),
    queryFn: () => fetchAccessSchedule(id!),
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

export const useCheckInAccessSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInAccessScheduleRequest) => checkInAccessSchedule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: accessScheduleKeys.all }),
    onError: () => qc.invalidateQueries({ queryKey: accessScheduleKeys.all }),
  });
};

function useScheduleMutation<T>(mutationFn: (input: T) => Promise<AccessScheduleDetailResponse>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (schedule) => {
      qc.setQueryData(accessScheduleKeys.detail(schedule.id), schedule);
      await qc.invalidateQueries({ queryKey: accessScheduleKeys.all });
    },
    // In particular, 660 requires a fresh server version, never an optimistic retry.
    onError: () => qc.invalidateQueries({ queryKey: accessScheduleKeys.all }),
  });
}

export const useCheckOutAccessSchedule = () =>
  useScheduleMutation(({ id, payload }: { id: string; payload: CheckOutAccessScheduleRequest }) =>
    checkOutAccessSchedule(id, payload)
  );
export const useClaimAccessSchedule = () => useScheduleMutation(claimAccessSchedule);
export const useAssignAccessSchedule = () =>
  useScheduleMutation(({ id, payload }: { id: string; payload: AssignAccessScheduleRequest }) =>
    assignAccessSchedule(id, payload)
  );
export const useUnassignAccessSchedule = () =>
  useScheduleMutation(({ id, payload }: { id: string; payload: UnassignAccessScheduleRequest }) =>
    unassignAccessSchedule(id, payload)
  );
