import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ReservationStatusEnum,
  type CancelReservationRequest,
  type CreateReservationRequest,
  type PaginatedData,
  type ReservationResponse,
  type UpdateReservationRequest,
} from "@self-storage-system-fe/shared";
import {
  cancelReservationApi,
  createReservationApi,
  getMyReservationsApi,
  getReservationByIdApi,
  retryReservationPaymentApi,
  updateReservationApi,
} from "../api/reservations.api";

export type ReservationFilterTabKey =
  "ALL" | "PROCESSING" | "PENDING_DEPOSIT" | "PAID_CONFIRMED" | "COMPLETED" | "TERMINATED";

export type ReservationSortBy = "createdAt" | "startDate" | "totalAmount";
export type ReservationSortOrder = "asc" | "desc";

export const RESERVATION_FILTER_TAB_STATUSES: Record<
  ReservationFilterTabKey,
  ReservationStatusEnum[]
> = {
  ALL: [],
  PROCESSING: [ReservationStatusEnum.PENDING, ReservationStatusEnum.RECEIVED],
  PENDING_DEPOSIT: [ReservationStatusEnum.PENDING_PAYMENT, ReservationStatusEnum.PAYMENT_FAILED],
  PAID_CONFIRMED: [ReservationStatusEnum.PAYMENT_SUCCESSFUL, ReservationStatusEnum.CONFIRMED],
  COMPLETED: [ReservationStatusEnum.COMPLETED],
  TERMINATED: [
    ReservationStatusEnum.CANCELLED,
    ReservationStatusEnum.REJECTED,
    ReservationStatusEnum.EXPIRED,
  ],
};

function sortReservations(
  items: ReservationResponse[],
  sortBy: ReservationSortBy,
  sortOrder: ReservationSortOrder
): ReservationResponse[] {
  const dir = sortOrder === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (sortBy === "totalAmount") {
      return ((a.totalAmount ?? 0) - (b.totalAmount ?? 0)) * dir;
    }
    if (sortBy === "startDate") {
      return (new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) * dir;
    }
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
  });
}

export interface UseMyReservationsParams {
  filterTab: ReservationFilterTabKey;
  reservationCode?: string;
  facilityId?: string;
  sortBy?: ReservationSortBy;
  sortOrder?: ReservationSortOrder;
  limit?: number;
  enabled?: boolean;
}

/**
 * Infinite query hook for `MyReservationsScreen` supporting:
 * - Search by `reservationCode`
 * - Sort by `createdAt` | `startDate` | `totalAmount` (`asc` | `desc`)
 * - Status group filter tabs (compatible with single-enum Backend query via parallel fetch & merge)
 * - Pull-to-refresh & Infinite Scroll pagination
 */
export function useMyReservationsInfinite(params: UseMyReservationsParams) {
  const {
    filterTab,
    reservationCode,
    facilityId,
    sortBy = "createdAt",
    sortOrder = "desc",
    limit = 10,
    enabled = true,
  } = params;

  const trimmedCode = reservationCode?.trim() || undefined;
  const statuses = RESERVATION_FILTER_TAB_STATUSES[filterTab];

  const query = useInfiniteQuery<PaginatedData<ReservationResponse>>({
    queryKey: [
      "my-reservations",
      {
        filterTab,
        reservationCode: trimmedCode ?? "",
        facilityId: facilityId ?? "",
        sortBy,
        sortOrder,
        limit,
      },
    ],
    initialPageParam: 1,
    enabled,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam) || 1;

      if (statuses.length === 0) {
        return getMyReservationsApi({
          page,
          limit,
          reservationCode: trimmedCode,
          facilityId,
          sortBy,
          sortOrder,
        });
      }

      if (statuses.length === 1) {
        return getMyReservationsApi({
          page,
          limit,
          status: statuses[0],
          reservationCode: trimmedCode,
          facilityId,
          sortBy,
          sortOrder,
        });
      }

      // Parallel fetch for multi-status tab groups since BE `status` accepts a single enum value
      const results = await Promise.all(
        statuses.map((st) =>
          getMyReservationsApi({
            page,
            limit,
            status: st,
            reservationCode: trimmedCode,
            facilityId,
            sortBy,
            sortOrder,
          })
        )
      );

      const mergedMap = new Map<string, ReservationResponse>();
      for (const res of results) {
        for (const item of res.items) {
          mergedMap.set(item.id, item);
        }
      }

      const sortedItems = sortReservations(Array.from(mergedMap.values()), sortBy, sortOrder);
      const totalItems = results.reduce((sum, r) => sum + (r.pagination?.totalItems ?? 0), 0);
      const maxTotalPages = Math.max(1, ...results.map((r) => r.pagination?.totalPages ?? 1));
      const hasNextPage = results.some((r) => Boolean(r.pagination?.hasNextPage));

      return {
        items: sortedItems,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: maxTotalPages,
          hasNextPage,
          hasPrevPage: page > 1,
        },
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasNextPage) {
        return (lastPage.pagination.page || 1) + 1;
      }
      return undefined;
    },
  });

  const pages = query.data?.pages;

  const items = useMemo(() => {
    if (!pages) return [];
    const seen = new Set<string>();
    const list: ReservationResponse[] = [];
    for (const page of pages) {
      for (const item of page.items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }
    return list;
  }, [pages]);

  const totalItems = pages?.[0]?.pagination?.totalItems ?? items.length;

  return {
    items,
    totalItems,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetches a single reservation detail by ID (`GET /reservations/{id}`).
 */
export function useReservationDetail(reservationId?: string) {
  return useQuery({
    queryKey: ["reservation-detail", reservationId],
    queryFn: () => getReservationByIdApi(reservationId!),
    enabled: Boolean(reservationId),
  });
}

/**
 * Mutation for creating a new reservation (`POST /reservations`).
 */
export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReservationRequest) => createReservationApi(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      if (res.data?.id) {
        queryClient.setQueryData(["reservation-detail", res.data.id], res.data);
      }
    },
  });
}

/**
 * Mutation for editing an existing reservation (`PATCH /reservations/{id}`).
 * Only allowed when `status === ReservationStatusEnum.PENDING`.
 */
export function useUpdateReservation(reservationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateReservationRequest) => updateReservationApi(reservationId, payload),
    onSuccess: (res) => {
      if (res.data) {
        queryClient.setQueryData(["reservation-detail", reservationId], res.data);
      }
      queryClient.invalidateQueries({ queryKey: ["reservation-detail", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
    },
  });
}

/**
 * Mutation for cancelling a reservation (`POST /reservations/{id}/cancel`).
 */
export function useCancelReservation(reservationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CancelReservationRequest) => cancelReservationApi(reservationId, payload),
    onSuccess: (res) => {
      if (res.data) {
        queryClient.setQueryData(["reservation-detail", reservationId], res.data);
      }
      queryClient.invalidateQueries({ queryKey: ["reservation-detail", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
    },
  });
}

/**
 * Mutation for retrying deposit payment (`POST /reservations/{id}/retry-payment`).
 * Transitions reservation from `PAYMENT_FAILED` back to `PENDING_PAYMENT`.
 */
export function useRetryReservationPayment(reservationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => retryReservationPaymentApi(reservationId),
    onSuccess: (res) => {
      if (res.data) {
        queryClient.setQueryData(["reservation-detail", reservationId], res.data);
      }
      queryClient.invalidateQueries({ queryKey: ["reservation-detail", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
    },
  });
}
