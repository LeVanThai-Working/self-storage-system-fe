import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AccessScheduleQuery } from "@self-storage-system-fe/shared";
import { fetchAccessSchedule, fetchAccessSchedules } from "./api";

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
