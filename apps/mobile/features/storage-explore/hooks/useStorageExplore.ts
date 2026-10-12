import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AmenityStatusEnum,
  FacilityStatusEnum,
  FacilityUnitTypeOfferingStatusEnum,
  MESSAGE_CODE,
  UnitTypeCategoryEnum,
  UnitTypeStatusEnum,
} from "@self-storage-system-fe/shared";
import { AppApiError } from "@/lib/api/axios";
import {
  getFacilityPublicDetailApi,
  getPublicAmenitiesApi,
  getPublicFacilitiesApi,
  getPublicOfferingsApi,
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
