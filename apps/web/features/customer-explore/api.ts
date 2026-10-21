import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  AmenityStatusEnum,
  FacilityStatusEnum,
  FacilityUnitTypeOfferingStatusEnum,
  UnitTypeStatusEnum,
  type AmenityResponse,
  type ApiResponse,
  type FacilityPublicDetailResponse,
  type FacilityQuery,
  type FacilityResponse,
  type FacilityUnitTypeOfferingResponse,
  type PaginatedData,
  type UnitTypeResponse,
} from "@self-storage-system-fe/shared";

/** The API also returns `images`, which the shared type does not declare yet. */
export type PublicFacility = FacilityResponse & { images?: string[] | null };

/** GET /facilities — customers only ever see active facilities. */
export async function fetchPublicFacilities(
  params?: FacilityQuery
): Promise<PaginatedData<PublicFacility>> {
  const { data } = await api.get<ApiResponse<PaginatedData<PublicFacility>>>("/facilities", {
    params: cleanQueryParams({ ...params, status: FacilityStatusEnum.ACTIVE }),
  });
  return data.data;
}

/** GET /facilities/:id/public-detail — facility + unit type offerings + amenity offerings. */
export async function fetchFacilityPublicDetail(id: string): Promise<FacilityPublicDetailResponse> {
  const { data } = await api.get<ApiResponse<FacilityPublicDetailResponse>>(
    `/facilities/${id}/public-detail`
  );
  return data.data;
}

/** GET /facilities/search-by-amenity — facilities offering all (or any) of the given amenities. */
export async function searchFacilitiesByAmenity(
  amenityIds: string[]
): Promise<PaginatedData<PublicFacility>> {
  const { data } = await api.get<ApiResponse<PaginatedData<PublicFacility>>>(
    "/facilities/search-by-amenity",
    { params: { amenityIds: amenityIds.join(","), matchAll: true, page: 1, limit: 100 } }
  );
  return data.data;
}

/** GET /amenities — active amenities for the filter checkboxes. */
export async function fetchPublicAmenities(): Promise<AmenityResponse[]> {
  const { data } = await api.get<ApiResponse<PaginatedData<AmenityResponse>>>("/amenities", {
    params: { page: 1, limit: 100, status: AmenityStatusEnum.ACTIVE },
  });
  return data.data.items;
}

/** GET /unit-types — active unit types for the filter select. */
export async function fetchPublicUnitTypes(): Promise<UnitTypeResponse[]> {
  const { data } = await api.get<ApiResponse<PaginatedData<UnitTypeResponse>>>("/unit-types", {
    params: { page: 1, limit: 100, status: UnitTypeStatusEnum.ACTIVE },
  });
  return data.data.items;
}

/**
 * GET /facility-unit-type-offerings — used to show a price range on each facility card.
 * shortcut: one page of 100 offerings, ranges are wrong beyond that; add a BE price-range field or page through.
 */
export async function fetchActiveOfferings(): Promise<FacilityUnitTypeOfferingResponse[]> {
  const { data } = await api.get<ApiResponse<PaginatedData<FacilityUnitTypeOfferingResponse>>>(
    "/facility-unit-type-offerings",
    {
      params: cleanQueryParams({
        page: 1,
        limit: 100,
        status: FacilityUnitTypeOfferingStatusEnum.ACTIVE,
      }),
    }
  );
  return data.data.items;
}
