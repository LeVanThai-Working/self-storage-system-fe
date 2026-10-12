import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AmenityStatusEnum,
  FacilityStatusEnum,
  FacilityUnitTypeOfferingStatusEnum,
  MESSAGE_CODE,
  UnitTypeCategoryEnum,
  UnitTypeStatusEnum,
  type PaginatedData,
  type PublicUnitTypeOfferingResponse,
  type UnitTypeResponse,
} from "@self-storage-system-fe/shared";
import { AppApiError } from "@/lib/api/axios";
import {
  getFacilityPublicDetailApi,
  getPublicAmenitiesApi,
  getPublicFacilitiesApi,
  getPublicOfferingsApi,
  getPublicUnitTypeByIdApi,
  getPublicUnitTypesApi,
  searchFacilitiesByAmenityApi,
} from "../api/storageExplore.api";

export type FacilitySortBy = "createdAt" | "name" | "city";
export type SortOrder = "asc" | "desc";

export interface FacilityExploreFilterParams {
  search?: string;
  city?: string;
  selectedAmenityIds: string[];
  matchAll: boolean;
  sortBy: FacilitySortBy;
  sortOrder: SortOrder;
  page?: number;
  limit?: number;
}

/**
 * Orchestrates facility search & numbered pagination:
 * - If selectedAmenityIds.length === 0 -> GET /facilities (status = ACTIVE)
 * - If selectedAmenityIds.length > 0  -> GET /facilities/search-by-amenity
 */
export function useFacilitiesExplore(params: FacilityExploreFilterParams) {
  const {
    search,
    city,
    selectedAmenityIds,
    matchAll,
    sortBy,
    sortOrder,
    page = 1,
    limit = 6,
  } = params;

  const amenityIdsKey = useMemo(
    () => [...selectedAmenityIds].sort().join(","),
    [selectedAmenityIds]
  );

  const query = useQuery({
    queryKey: [
      "public-facilities-explore",
      {
        search: search?.trim() || "",
        city: city?.trim() || "",
        amenityIds: amenityIdsKey,
        matchAll,
        sortBy,
        sortOrder,
        page,
        limit,
      },
    ],
    queryFn: async () => {
      if (selectedAmenityIds.length > 0) {
        return searchFacilitiesByAmenityApi({
          page,
          limit,
          amenityIds: selectedAmenityIds.join(","),
          matchAll,
          city: city?.trim() || undefined,
          search: search?.trim() || undefined,
          sortBy,
          sortOrder,
        });
      }

      return getPublicFacilitiesApi({
        page,
        limit,
        search: search?.trim() || undefined,
        city: city?.trim() || undefined,
        status: FacilityStatusEnum.ACTIVE,
        sortBy,
        sortOrder,
      });
    },
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const pagination = query.data?.pagination ?? {
    page,
    limit,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
    hasNextPage: false,
    hasPrevPage: page > 1,
  };
  const totalItems = pagination.totalItems ?? items.length;

  return {
    items,
    totalItems,
    pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
  };
}

/**
 * Fetches active amenities for the multi-criteria filter sheet:
 * GET /amenities?status=active&limit=100
 */
export function usePublicAmenities() {
  return useQuery({
    queryKey: ["public-amenities", { status: AmenityStatusEnum.ACTIVE, limit: 100 }],
    queryFn: () =>
      getPublicAmenitiesApi({
        status: AmenityStatusEnum.ACTIVE,
        limit: 100,
      }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetches active standard unit types for the Size Guide section:
 * GET /unit-types?status=active&limit=100
 */
export function usePublicUnitTypes(filters?: {
  category?: UnitTypeCategoryEnum;
  minArea?: number;
  maxArea?: number;
}) {
  return useQuery({
    queryKey: [
      "public-unit-types",
      {
        status: UnitTypeStatusEnum.ACTIVE,
        category: filters?.category,
        minArea: filters?.minArea,
        maxArea: filters?.maxArea,
      },
    ],
    queryFn: () =>
      getPublicUnitTypesApi({
        status: UnitTypeStatusEnum.ACTIVE,
        limit: 100,
        category: filters?.category,
        minArea: filters?.minArea,
        maxArea: filters?.maxArea,
      }),
  });
}

/**
 * Fetches a single standard unit type detail by ID:
 * GET /unit-types/{id} (with fallback to cached public unit types list)
 */
export function usePublicUnitTypeDetail(unitTypeId?: string) {
  const queryClient = useQueryClient();

  const cachedUnitType = useMemo(() => {
    if (!unitTypeId) return undefined;
    const queries = queryClient.getQueriesData<PaginatedData<UnitTypeResponse>>({
      queryKey: ["public-unit-types"],
    });
    for (const [, data] of queries) {
      const found = data?.items?.find((item) => item.id === unitTypeId);
      if (found) return found;
    }
    return undefined;
  }, [queryClient, unitTypeId]);

  const query = useQuery({
    queryKey: ["public-unit-type-detail", unitTypeId],
    queryFn: async () => {
      try {
        return await getPublicUnitTypeByIdApi(unitTypeId!);
      } catch (err) {
        if (cachedUnitType) return cachedUnitType;
        const list = await getPublicUnitTypesApi({
          status: UnitTypeStatusEnum.ACTIVE,
          limit: 100,
        });
        const match = list.items.find((u) => u.id === unitTypeId);
        if (match) return match;
        throw err;
      }
    },
    initialData: cachedUnitType,
    enabled: Boolean(unitTypeId),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Cross-facility offering lookup by unitTypeId and/or minPrice - maxPrice:
 * GET /facility-unit-type-offerings
 */
export function useCrossFacilityOfferings(params: {
  unitTypeId?: string;
  minPrice?: number;
  maxPrice?: number;
  enabled?: boolean;
}) {
  const { unitTypeId, minPrice, maxPrice, enabled = true } = params;

  return useQuery({
    queryKey: [
      "public-cross-facility-offerings",
      {
        status: FacilityUnitTypeOfferingStatusEnum.ACTIVE,
        unitTypeId,
        minPrice,
        maxPrice,
      },
    ],
    queryFn: () =>
      getPublicOfferingsApi({
        unitTypeId,
        minPrice,
        maxPrice,
        status: FacilityUnitTypeOfferingStatusEnum.ACTIVE,
        limit: 50,
        sortBy: "pricePerUnit",
        sortOrder: "asc",
      }),
    enabled,
  });
}

/**
 * Fetches complete public details for a single facility:
 * GET /facilities/{id}/public-detail
 */
export function useFacilityPublicDetail(facilityId?: string) {
  const query = useQuery({
    queryKey: ["facility-public-detail", facilityId],
    queryFn: () => getFacilityPublicDetailApi(facilityId!),
    enabled: Boolean(facilityId),
    retry: (failureCount, error) => {
      if (
        error instanceof AppApiError &&
        (error.statusCode === 404 || error.messageCode === MESSAGE_CODE.MESSAGE_CODE_104)
      ) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const isNotFoundError = useMemo(() => {
    if (!query.error) return false;
    if (query.error instanceof AppApiError) {
      return (
        query.error.statusCode === 404 || query.error.messageCode === MESSAGE_CODE.MESSAGE_CODE_104
      );
    }
    return false;
  }, [query.error]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    isNotFoundError,
    refetch: query.refetch,
  };
}

export type OfferingSortKey =
  "price_asc" | "price_desc" | "area_asc" | "area_desc" | "available_desc";

/**
 * Fetches paginated available `FacilityUnitTypeOffering` items for a specific `facilityId`.
 * Calls `GET /facility-unit-type-offerings?facilityId=...` and enriches with availability
 * (`availableUnitsCount > 0`) & unitType details from `GET /facilities/{id}/public-detail`.
 */
export function useFacilityAvailableOfferingsPaginated(params: {
  facilityId?: string;
  page: number;
  limit?: number;
  category?: UnitTypeCategoryEnum | "ALL";
  sortKey?: OfferingSortKey;
}) {
  const { facilityId, page = 1, limit = 6, category = "ALL", sortKey = "price_asc" } = params;

  const detailQuery = useFacilityPublicDetail(facilityId);

  const offeringsApiQuery = useQuery({
    queryKey: [
      "facility-offerings-paginated",
      {
        facilityId,
        page,
        limit,
        sortKey,
      },
    ],
    queryFn: () =>
      getPublicOfferingsApi({
        facilityId,
        page,
        limit: 100,
        status: FacilityUnitTypeOfferingStatusEnum.ACTIVE,
        sortBy: "pricePerUnit",
        sortOrder: sortKey === "price_desc" ? "desc" : "asc",
      }),
    enabled: Boolean(facilityId),
  });

  // Merge available offerings with real-time `availableUnitsCount` (> 0)
  const allAvailableOfferings = useMemo<PublicUnitTypeOfferingResponse[]>(() => {
    const publicDetailOfferings = detailQuery.data?.unitTypeOfferings ?? [];
    const apiOfferings = offeringsApiQuery.data?.items ?? [];

    const detailByOfferingId = new Map(publicDetailOfferings.map((o) => [o.id, o]));
    const detailByUnitTypeId = new Map(publicDetailOfferings.map((o) => [o.unitTypeId, o]));

    let combined: PublicUnitTypeOfferingResponse[] = [];

    if (publicDetailOfferings.length > 0) {
      combined = publicDetailOfferings;
    } else if (apiOfferings.length > 0) {
      combined = apiOfferings.map((item) => {
        const matched = detailByOfferingId.get(item.id) ?? detailByUnitTypeId.get(item.unitType.id);
        const rawAvailable = (item as unknown as { availableUnitsCount?: number })
          .availableUnitsCount;
        return {
          id: item.id,
          facilityId: item.facility.id,
          unitTypeId: item.unitType.id,
          unitType: matched?.unitType ?? {
            id: item.unitType.id,
            name: item.unitType.name,
            category: item.unitType.category ?? UnitTypeCategoryEnum.SMALL,
            dimensions: item.unitType.dimensions,
            area: item.unitType.area,
            volume: item.unitType.volume,
            status: item.unitType.status,
            images: (item.unitType as unknown as { images?: string[] }).images ?? null,
            description: (item.unitType as unknown as { description?: string }).description ?? null,
          },
          pricePerUnit: item.pricePerUnit,
          depositMultiplier: item.depositMultiplier,
          billingUnit: item.billingUnit,
          minRentalDays: item.minRentalDays,
          status: item.status,
          availableUnitsCount: matched?.availableUnitsCount ?? rawAvailable ?? 1,
        };
      });
    }

    // Filter only available offerings (availableUnitsCount > 0) and selected category
    const filtered = combined.filter((item) => {
      if (item.availableUnitsCount <= 0) return false;
      if (category !== "ALL" && item.unitType?.category !== category) return false;
      return true;
    });

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "price_asc":
          return a.pricePerUnit - b.pricePerUnit;
        case "price_desc":
          return b.pricePerUnit - a.pricePerUnit;
        case "area_asc":
          return (a.unitType?.area ?? 0) - (b.unitType?.area ?? 0);
        case "area_desc":
          return (b.unitType?.area ?? 0) - (a.unitType?.area ?? 0);
        case "available_desc":
          return b.availableUnitsCount - a.availableUnitsCount;
        default:
          return 0;
      }
    });
  }, [detailQuery.data?.unitTypeOfferings, offeringsApiQuery.data?.items, category, sortKey]);

  const totalItems = allAvailableOfferings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (safePage - 1) * limit;
    return allAvailableOfferings.slice(startIndex, startIndex + limit);
  }, [allAvailableOfferings, safePage, limit]);

  return {
    facility: detailQuery.data?.facility,
    amenityOfferings: detailQuery.data?.amenityOfferings ?? [],
    items: paginatedItems,
    totalItems,
    pagination: {
      page: safePage,
      limit,
      totalItems,
      totalPages,
      hasPrevPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    },
    isLoading: detailQuery.isLoading || offeringsApiQuery.isLoading,
    isRefetching: detailQuery.isRefetching || offeringsApiQuery.isRefetching,
    isError: detailQuery.isError && offeringsApiQuery.isError,
    refetch: () => {
      detailQuery.refetch();
      offeringsApiQuery.refetch();
    },
  };
}
