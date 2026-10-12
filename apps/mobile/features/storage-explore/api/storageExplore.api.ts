import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  FacilityStatusEnum,
  UnitTypeStatusEnum,
  AmenityStatusEnum,
  FacilityUnitTypeOfferingStatusEnum,
  type ApiResponse,
  type PaginatedData,
  type PaginationMeta,
  type FacilityResponse,
  type FacilityPublicDetailResponse,
  type FacilityQuery,
  type SearchByAmenityQuery,
  type UnitTypeResponse,
  type UnitTypeQuery,
  type AmenityResponse,
  type AmenityQuery,
  type FacilityUnitTypeOfferingResponse,
  type OfferingQuery,
} from "@self-storage-system-fe/shared";

const createDefaultPagination = (page = 1, limit = 10): PaginationMeta => ({
  page,
  limit,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});

/**
 * 1. GET /facilities
 * Always enforces status: FacilityStatusEnum.ACTIVE for customers.
 */
export async function getPublicFacilitiesApi(
  params?: FacilityQuery
): Promise<PaginatedData<FacilityResponse>> {
  const query = cleanQueryParams({
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
    search: params?.search,
    city: params?.city,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
    status: FacilityStatusEnum.ACTIVE,
  });

  const response = await api.get<ApiResponse<PaginatedData<FacilityResponse>>>("/facilities", {
    params: query,
  });

  const payload = response.data?.data;
  return {
    items: payload?.items ?? [],
    pagination:
      payload?.pagination ?? createDefaultPagination(params?.page ?? 1, params?.limit ?? 10),
  };
}

/**
 * 2. GET /facilities/search-by-amenity
 * Searches active facilities offering the selected amenities.
 */
export async function searchFacilitiesByAmenityApi(
  params: SearchByAmenityQuery
): Promise<PaginatedData<FacilityResponse>> {
  const query = cleanQueryParams({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    amenityIds: params.amenityIds,
    matchAll: params.matchAll ?? true,
    city: params.city,
    search: params.search,
    sortBy: params.sortBy ?? "createdAt",
    sortOrder: params.sortOrder ?? "desc",
  });

  const response = await api.get<ApiResponse<PaginatedData<FacilityResponse>>>(
    "/facilities/search-by-amenity",
    {
      params: query,
    }
  );

  const payload = response.data?.data;
  return {
    items: payload?.items ?? [],
    pagination:
      payload?.pagination ?? createDefaultPagination(params.page ?? 1, params.limit ?? 10),
  };
}

/**
 * 3. GET /facilities/{id}/public-detail
 * Core API returning facility details, active unit type offerings with availableUnitsCount,
 * and active amenity offerings with availableQuantity.
 */
export async function getFacilityPublicDetailApi(
  id: string
): Promise<FacilityPublicDetailResponse> {
  const response = await api.get<ApiResponse<FacilityPublicDetailResponse>>(
    `/facilities/${id}/public-detail`
  );

  const payload = response.data?.data;
  return {
    facility: payload.facility,
    unitTypeOfferings: payload?.unitTypeOfferings ?? [],
    amenityOfferings: payload?.amenityOfferings ?? [],
  };
}

/**
 * 4. GET /unit-types
 * Fetches active unit types & standard dimensions for the Size Guide.
 */
export async function getPublicUnitTypesApi(
  params?: UnitTypeQuery
): Promise<PaginatedData<UnitTypeResponse>> {
  const query = cleanQueryParams({
    page: params?.page ?? 1,
    limit: params?.limit ?? 100,
    search: params?.search,
    category: params?.category,
    minArea: params?.minArea,
    maxArea: params?.maxArea,
    sortBy: params?.sortBy ?? "area",
    sortOrder: params?.sortOrder ?? "asc",
    status: UnitTypeStatusEnum.ACTIVE,
  });

  const response = await api.get<ApiResponse<PaginatedData<UnitTypeResponse>>>("/unit-types", {
    params: query,
  });

  const payload = response.data?.data;
  return {
    items: payload?.items ?? [],
    pagination:
      payload?.pagination ?? createDefaultPagination(params?.page ?? 1, params?.limit ?? 100),
  };
}

/**
 * 4b. GET /unit-types/{id}
 * Fetches detail of a single standard unit type for the Size Guide Detail screen.
 */
export async function getPublicUnitTypeByIdApi(id: string): Promise<UnitTypeResponse> {
  const response = await api.get<ApiResponse<UnitTypeResponse>>(`/unit-types/${id}`);
  return response.data?.data;
}

/**
 * 5. GET /amenities
 * Fetches active amenities to render multi-criteria facility filters.
 */
export async function getPublicAmenitiesApi(
  params?: AmenityQuery
): Promise<PaginatedData<AmenityResponse>> {
  const query = cleanQueryParams({
    page: params?.page ?? 1,
    limit: params?.limit ?? 100,
    search: params?.search,
    type: params?.type,
    sortBy: params?.sortBy ?? "createdAt",
    sortOrder: params?.sortOrder ?? "desc",
    status: AmenityStatusEnum.ACTIVE,
  });

  const response = await api.get<ApiResponse<PaginatedData<AmenityResponse>>>("/amenities", {
    params: query,
  });

  const payload = response.data?.data;
  return {
    items: payload?.items ?? [],
    pagination:
      payload?.pagination ?? createDefaultPagination(params?.page ?? 1, params?.limit ?? 100),
  };
}

/**
 * 6. GET /facility-unit-type-offerings
 * Fetches paginated facility unit type offerings filtered by facilityId, unitTypeId, and/or price range.
 */
export async function getPublicOfferingsApi(
  params?: OfferingQuery & { onlyAvailable?: boolean; category?: string }
): Promise<PaginatedData<FacilityUnitTypeOfferingResponse>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 6;
  const query = cleanQueryParams({
    page,
    limit,
    facilityId: params?.facilityId,
    unitTypeId: params?.unitTypeId,
    billingUnit: params?.billingUnit,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    sortBy: params?.sortBy ?? "pricePerUnit",
    sortOrder: params?.sortOrder ?? "asc",
    status: FacilityUnitTypeOfferingStatusEnum.ACTIVE,
  });

  const response = await api.get<ApiResponse<PaginatedData<FacilityUnitTypeOfferingResponse>>>(
    "/facility-unit-type-offerings",
    {
      params: query,
    }
  );

  const payload = response.data?.data;
  return {
    items: payload?.items ?? [],
    pagination: payload?.pagination ?? createDefaultPagination(page, limit),
  };
}
