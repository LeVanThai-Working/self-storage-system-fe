import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AccessScheduleQuery,
  CheckInAccessScheduleRequest,
  CheckOutAccessScheduleRequest,
} from "@self-storage-system-fe/shared";
import {
  checkInAccessSchedule,
  checkOutAccessSchedule,
  fetchAccessSchedule,
  fetchAccessSchedules,
} from "./api";

export const accessScheduleKeys = {
  all: ["access-schedules"] as const,
  list: (query: Partial<AccessScheduleQuery>) =>
    [...accessScheduleKeys.all, "list", query] as const,
  detail: (id?: string) => [...accessScheduleKeys.all, "detail", id] as const,
};

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
  });

export const useCheckInAccessSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInAccessScheduleRequest) => checkInAccessSchedule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: accessScheduleKeys.all }),
  });
};

export const useCheckOutAccessSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CheckOutAccessScheduleRequest }) =>
      checkOutAccessSchedule(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: accessScheduleKeys.all }),
  });
};
