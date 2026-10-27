import { useMemo } from "react";
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import type { FacilityQuery } from "@self-storage-system-fe/shared";
import {
  fetchActiveOfferings,
  fetchFacilityPublicDetail,
  fetchPublicAmenities,
  fetchPublicFacilities,
  fetchPublicUnitTypes,
  searchFacilitiesByAmenity,
} from "./api";
import { matchesFilters, type SearchFilters, type SearchResult } from "./search";

export const exploreKeys = {
  facilities: (params: FacilityQuery) => ["explore", "facilities", params] as const,
  detail: (id: string) => ["explore", "facility", id] as const,
  offerings: ["explore", "offerings"] as const,
};

export const usePublicFacilities = (params: FacilityQuery) =>
  useQuery({
    queryKey: exploreKeys.facilities(params),
    queryFn: () => fetchPublicFacilities(params),
    placeholderData: keepPreviousData,
  });

export const useFacilityPublicDetail = (id: string) =>
  useQuery({
    queryKey: exploreKeys.detail(id),
    queryFn: () => fetchFacilityPublicDetail(id),
  });

/** Lowest/highest active offering price per facility id. */
export const useFacilityPriceRanges = () => {
  const query = useQuery({
    queryKey: exploreKeys.offerings,
    queryFn: fetchActiveOfferings,
    staleTime: 5 * 60 * 1000,
  });

  const ranges = useMemo(() => {
    const map = new Map<string, { min: number; max: number }>();
    for (const o of query.data ?? []) {
      const cur = map.get(o.facility.id);
      map.set(o.facility.id, {
        min: Math.min(cur?.min ?? o.pricePerUnit, o.pricePerUnit),
        max: Math.max(cur?.max ?? o.pricePerUnit, o.pricePerUnit),
      });
    }
    return map;
  }, [query.data]);

  return ranges;
};

export const usePublicAmenities = () =>
  useQuery({
    queryKey: ["explore", "amenities"],
    queryFn: fetchPublicAmenities,
    staleTime: 5 * 60 * 1000,
  });

export const usePublicUnitTypes = () =>
  useQuery({
    queryKey: ["explore", "unit-types"],
    queryFn: fetchPublicUnitTypes,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Bookable rooms across facilities. The API has no cross-facility room search, so this loads each
 * candidate facility's public detail and filters in the browser.
 * shortcut: one request per facility (up to 100), fine for a handful of sites; add a BE search endpoint when it grows.
 */
export const useUnitSearch = (filters: SearchFilters) => {
  const facilitiesQuery = useQuery({
    queryKey: ["explore", "search-facilities", filters.amenityIds],
    queryFn: () =>
      filters.amenityIds.length
        ? searchFacilitiesByAmenity(filters.amenityIds)
        : fetchPublicFacilities({ page: 1, limit: 100 }),
  });

  const facilities = (facilitiesQuery.data?.items ?? []).filter(
    (f) => !filters.facilityId || f.id === filters.facilityId
  );

  const details = useQueries({
    queries: facilities.map((f) => ({
      queryKey: exploreKeys.detail(f.id),
      queryFn: () => fetchFacilityPublicDetail(f.id),
    })),
    combine: (results) => ({
      data: results.map((r) => r.data),
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  });

  const results = useMemo<SearchResult[]>(
    () =>
      details.data.flatMap((d) =>
        (d?.unitTypeOfferings ?? [])
          .filter((o) => matchesFilters(o, filters))
          .map((o) => ({ ...o, facility: d!.facility }))
      ),
    [details.data, filters]
  );

  return {
    results,
    isLoading: facilitiesQuery.isLoading || details.isLoading,
    isError: facilitiesQuery.isError || details.isError,
  };
};
