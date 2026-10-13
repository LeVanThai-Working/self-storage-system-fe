import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ContractStatusEnum,
  PaymentPurposeEnum,
  type CancelContractAddendumRequest,
  type ContractResponse,
  type CreateContractAddendumRequest,
  type CustomerSignContractRequest,
  type PaginatedData,
  type SignContractAddendumRequest,
} from "@self-storage-system-fe/shared";
import {
  cancelContractAddendumApi,
  createContractAddendumApi,
  createContractPaymentApi,
  customerSignContractAddendumApi,
  customerSignContractApi,
  getContractByIdApi,
  getMyContractsApi,
} from "../api/contracts.api";

export type ContractFilterTabKey = "ALL" | "ACTIVE" | "DRAFT" | "OVERDUE" | "COMPLETED" | "CLOSED";

export type ContractSortBy = "createdAt" | "startDate" | "endDate" | "totalRentalAmount";
export type ContractSortOrder = "asc" | "desc";

export const CONTRACT_FILTER_TAB_STATUSES: Record<ContractFilterTabKey, ContractStatusEnum[]> = {
  ALL: [],
  ACTIVE: [ContractStatusEnum.ACTIVE],
  DRAFT: [ContractStatusEnum.DRAFT],
  OVERDUE: [ContractStatusEnum.OVERDUE],
  COMPLETED: [ContractStatusEnum.COMPLETED],
  CLOSED: [ContractStatusEnum.CANCELLED, ContractStatusEnum.TERMINATED],
};

function sortContracts(
  items: ContractResponse[],
  sortBy: ContractSortBy,
  sortOrder: ContractSortOrder
): ContractResponse[] {
  const dir = sortOrder === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (sortBy === "totalRentalAmount") {
      return ((a.totalPeriodicPrice ?? 0) - (b.totalPeriodicPrice ?? 0)) * dir;
    }
    if (sortBy === "startDate") {
      return (new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) * dir;
    }
    if (sortBy === "endDate") {
      return (new Date(a.endDate).getTime() - new Date(b.endDate).getTime()) * dir;
    }
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
  });
}

export interface UseMyContractsParams {
  filterTab: ContractFilterTabKey;
  contractCode?: string;
  facilityId?: string;
  sortBy?: ContractSortBy;
  sortOrder?: ContractSortOrder;
  limit?: number;
  enabled?: boolean;
}

export function useMyContractsInfinite(params: UseMyContractsParams) {
  const {
    filterTab,
    contractCode,
    facilityId,
    sortBy = "createdAt",
    sortOrder = "desc",
    limit = 10,
    enabled = true,
  } = params;

  const trimmedCode = contractCode?.trim() || undefined;
  const statuses = CONTRACT_FILTER_TAB_STATUSES[filterTab];

  const query = useInfiniteQuery<PaginatedData<ContractResponse>>({
    queryKey: [
      "my-contracts",
      {
        filterTab,
        contractCode: trimmedCode ?? "",
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
        if (page === 1) {
          const [allRes, draftRes] = await Promise.all([
            getMyContractsApi({
              page,
              limit,
              contractCode: trimmedCode,
              facilityId,
              sortBy,
              sortOrder,
            }),
            getMyContractsApi({
              page: 1,
              limit: 20,
              status: ContractStatusEnum.DRAFT,
              contractCode: trimmedCode,
              facilityId,
              sortBy,
              sortOrder,
            }).catch(() => null),
          ]);

          const mergedMap = new Map<string, ContractResponse>();
          for (const item of draftRes?.items ?? []) {
            mergedMap.set(item.id, item);
          }
          for (const item of allRes.items) {
            mergedMap.set(item.id, item);
          }

          const combined = sortContracts(Array.from(mergedMap.values()), sortBy, sortOrder);
          return {
            items: combined,
            pagination: {
              ...allRes.pagination,
              totalItems: Math.max(allRes.pagination?.totalItems ?? 0, combined.length),
            },
          };
        }

        return getMyContractsApi({
          page,
          limit,
          contractCode: trimmedCode,
          facilityId,
          sortBy,
          sortOrder,
        });
      }

      if (statuses.length === 1) {
        return getMyContractsApi({
          page,
          limit,
          status: statuses[0],
          contractCode: trimmedCode,
          facilityId,
          sortBy,
          sortOrder,
        });
      }

      const results = await Promise.all(
        statuses.map((st) =>
          getMyContractsApi({
            page,
            limit,
            status: st,
            contractCode: trimmedCode,
            facilityId,
            sortBy,
            sortOrder,
          })
        )
      );

      const mergedMap = new Map<string, ContractResponse>();
      for (const res of results) {
        for (const item of res.items) {
          mergedMap.set(item.id, item);
        }
      }

      const sortedItems = sortContracts(Array.from(mergedMap.values()), sortBy, sortOrder);
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
    const list: ContractResponse[] = [];
    for (const page of pages) {
      for (const item of page.items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }

    if (filterTab === "ALL") {
      return [...list].sort((a, b) => {
        const aIsDraft = a.status === ContractStatusEnum.DRAFT ? 0 : 1;
        const bIsDraft = b.status === ContractStatusEnum.DRAFT ? 0 : 1;
        if (aIsDraft !== bIsDraft) return aIsDraft - bIsDraft;
        return 0;
      });
    }

    return list;
  }, [pages, filterTab]);

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

export function useContractDetail(contractId?: string) {
  return useQuery({
    queryKey: ["contract-detail", contractId],
    queryFn: () => getContractByIdApi(contractId!),
    enabled: Boolean(contractId),
  });
}

/**
 * Fetches the authenticated customer's contracts (including DRAFT contracts awaiting check-in)
 * and builds a lookup map by `reservationId -> ContractResponse`.
 */
export function useCustomerContractsByReservationMap(enabled = true) {
  const query = useQuery({
    queryKey: ["my-contracts-by-reservation"],
    enabled,
    queryFn: async () => {
      const [allRes, draftRes] = await Promise.all([
        getMyContractsApi({
          page: 1,
          limit: 50,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
        getMyContractsApi({
          page: 1,
          limit: 50,
          status: ContractStatusEnum.DRAFT,
          sortBy: "createdAt",
          sortOrder: "desc",
        }).catch(() => null),
      ]);

      const merged: ContractResponse[] = [];
      const seen = new Set<string>();
      for (const item of [...(draftRes?.items ?? []), ...allRes.items]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
      return merged;
    },
  });

  const contractByReservationId = useMemo(() => {
    const map = new Map<string, ContractResponse>();
    for (const c of query.data ?? []) {
      if (c.reservationId && !map.has(c.reservationId)) {
        map.set(c.reservationId, c);
      }
    }
    return map;
  }, [query.data]);

  return {
    contracts: query.data ?? [],
    contractByReservationId,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useCustomerSignContract(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerSignContractRequest) =>
      customerSignContractApi(contractId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(["contract-detail", contractId], updated);
      qc.invalidateQueries({ queryKey: ["my-contracts"] });
      qc.invalidateQueries({ queryKey: ["my-contracts-by-reservation"] });
    },
  });
}

export function useCreateContractAddendum(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContractAddendumRequest) =>
      createContractAddendumApi(contractId, payload),
    onSuccess: (updated) => {
      qc.setQueryData(["contract-detail", contractId], updated);
      qc.invalidateQueries({ queryKey: ["my-contracts"] });
    },
  });
}

export function useCustomerSignContractAddendum(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { addendumId: string; payload: SignContractAddendumRequest }) =>
      customerSignContractAddendumApi(contractId, args.addendumId, args.payload),
    onSuccess: (updated) => {
      qc.setQueryData(["contract-detail", contractId], updated);
      qc.invalidateQueries({ queryKey: ["my-contracts"] });
    },
  });
}

export function useCancelContractAddendum(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { addendumId: string; payload: CancelContractAddendumRequest }) =>
      cancelContractAddendumApi(contractId, args.addendumId, args.payload),
    onSuccess: (updated) => {
      qc.setQueryData(["contract-detail", contractId], updated);
      qc.invalidateQueries({ queryKey: ["my-contracts"] });
    },
  });
}

export function useCreateContractPayment(contractId: string) {
  return useMutation({
    mutationFn: (purpose: PaymentPurposeEnum = PaymentPurposeEnum.CONTRACT_DEPOSIT) =>
      createContractPaymentApi(contractId, purpose),
  });
}
