import {
  UnitTypeCategoryEnum,
  type FacilityResponse,
  type PublicUnitTypeOfferingResponse,
} from "@self-storage-system-fe/shared";

export interface SearchFilters {
  facilityId: string;
  unitTypeId: string;
  category: string;
  minArea: string;
  maxArea: string;
  minPrice: string;
  maxPrice: string;
  amenityIds: string[];
}

export const EMPTY_FILTERS: SearchFilters = {
  facilityId: "",
  unitTypeId: "",
  category: "",
  minArea: "",
  maxArea: "",
  minPrice: "",
  maxPrice: "",
  amenityIds: [],
};

export type SearchResult = PublicUnitTypeOfferingResponse & { facility: FacilityResponse };

/** Price buckets offered by the landing search panel, as [min, max] in VND. */
const LANDING_PRICE_BUCKETS: Record<string, [string, string]> = {
  under_1m: ["", "1000000"],
  "1m_to_2m5": ["1000000", "2500000"],
  "2m5_to_5m": ["2500000", "5000000"],
  above_5m: ["5000000", ""],
};

/** Turns the landing panel's `?type=&price=` query into filters; unknown values are ignored. */
export function filtersFromLandingParams(params: { type?: string; price?: string }): SearchFilters {
  const [minPrice, maxPrice] = LANDING_PRICE_BUCKETS[params.price ?? ""] ?? ["", ""];
  const isCategory = Object.values<string>(UnitTypeCategoryEnum).includes(params.type ?? "");
  return { ...EMPTY_FILTERS, category: isCategory ? params.type! : "", minPrice, maxPrice };
}

const inRange = (value: number, min: string, max: string) =>
  (min === "" || value >= Number(min)) && (max === "" || value <= Number(max));

/** Only rooms that can actually be booked, narrowed by the user's filters. */
export function matchesFilters(o: PublicUnitTypeOfferingResponse, f: SearchFilters): boolean {
  return (
    o.availableUnitsCount > 0 &&
    (f.unitTypeId === "" || o.unitTypeId === f.unitTypeId) &&
    (f.category === "" || o.unitType.category === f.category) &&
    inRange(o.unitType.area, f.minArea, f.maxArea) &&
    inRange(o.pricePerUnit, f.minPrice, f.maxPrice)
  );
}
