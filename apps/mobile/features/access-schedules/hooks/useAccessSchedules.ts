import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  AccessScheduleQuery,
  CancelAccessScheduleRequest,
  CreateAccessScheduleRequest,
} from "@self-storage-system-fe/shared";
import {
  cancelAccessScheduleApi,
  createAccessScheduleApi,
  getAccessScheduleApi,
  getAccessSchedulesApi,
  getAvailableAccessSlotsApi,
} from "../api/accessSchedule.api";

const ACCESS_SCHEDULE_PAGE_SIZE = 20;

export type AccessScheduleFilters = Pick<AccessScheduleQuery, "status" | "contractId">;

export const accessScheduleKeys = {
  all: ["access-schedules"] as const,
  list: (filters: Partial<AccessScheduleFilters>) =>
    [...accessScheduleKeys.all, "list", filters] as const,
  detail: (id?: string) => [...accessScheduleKeys.all, "detail", id] as const,
  slots: (facilityId?: string, date?: string) =>
    [...accessScheduleKeys.all, "slots", facilityId, date] as const,
};

export function useAccessSchedules(filters: Partial<AccessScheduleFilters>, enabled = true) {
  return useInfiniteQuery({
    queryKey: accessScheduleKeys.list(filters),
    queryFn: ({ pageParam }) =>
      getAccessSchedulesApi({
        ...filters,
        page: pageParam,
        limit: ACCESS_SCHEDULE_PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAccessSchedule(id?: string) {
  return useQuery({
    queryKey: accessScheduleKeys.detail(id),
    queryFn: () => getAccessScheduleApi(id!),
    enabled: Boolean(id),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
}

export function useAvailableAccessSlots(facilityId?: string, date?: string) {
  return useQuery({
    queryKey: accessScheduleKeys.slots(facilityId, date),
    queryFn: () => getAvailableAccessSlotsApi({ facilityId: facilityId!, date: date! }),
    enabled: Boolean(facilityId && date),
  });
}

export function useCreateAccessSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccessScheduleRequest) => createAccessScheduleApi(payload),
    onSuccess: (schedule) => {
      qc.setQueryData(accessScheduleKeys.detail(schedule.id), schedule);
      qc.invalidateQueries({ queryKey: [...accessScheduleKeys.all, "list"] });
      qc.invalidateQueries({ queryKey: [...accessScheduleKeys.all, "slots"] });
    },
  });
}

export function useCancelAccessSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: CancelAccessScheduleRequest }) =>
      cancelAccessScheduleApi(id, payload),
    onSuccess: (schedule) => {
      qc.setQueryData(accessScheduleKeys.detail(schedule.id), schedule);
      qc.invalidateQueries({ queryKey: [...accessScheduleKeys.all, "list"] });
      qc.invalidateQueries({ queryKey: [...accessScheduleKeys.all, "slots"] });
    },
  });
}
