export const ENDPOINTS = {
  FACILITIES: {
    BASE: "/facilities",
    BY_ID: (id: string) => `/facilities/${id}`,
    ASSIGN_MANAGER: (id: string) => `/facilities/${id}/assign-manager`,
    RESTORE: (id: string) => `/facilities/${id}/restore`,
  },
  UNIT_TYPES: {
    BASE: "/unit-types",
    BY_ID: (id: string) => `/unit-types/${id}`,
    RESTORE: (id: string) => `/unit-types/${id}/restore`,
  },
  FACILITY_UNIT_TYPE_OFFERINGS: {
    BASE: "/facility-unit-type-offerings",
    BY_ID: (id: string) => `/facility-unit-type-offerings/${id}`,
    BY_FACILITY_AND_UNIT_TYPE: (facilityId: string, unitTypeId: string) =>
      `/facility-unit-type-offerings/facility/${facilityId}/unit-type/${unitTypeId}`,
    RESTORE: (id: string) => `/facility-unit-type-offerings/${id}/restore`,
  },
  STORAGE_UNITS: {
    BASE: "/storage-units",
    BY_ID: (id: string) => `/storage-units/${id}`,
    AVAILABLE: (facilityId: string) => `/storage-units/facility/${facilityId}/available`,
    MAINTENANCE: (id: string) => `/storage-units/${id}/maintenance`,
    RESTORE: (id: string) => `/storage-units/${id}/restore`,
  },
  AMENITIES: {
    BASE: "/amenities",
    BY_ID: (id: string) => `/amenities/${id}`,
    RESTORE: (id: string) => `/amenities/${id}/restore`,
  },
  FACILITY_AMENITY_OFFERINGS: {
    BASE: "/facility-amenity-offerings",
    BY_ID: (id: string) => `/facility-amenity-offerings/${id}`,
    AVAILABLE: (facilityId: string) =>
      `/facility-amenity-offerings/facility/${facilityId}/available`,
    BY_FACILITY_AND_AMENITY: (facilityId: string, amenityId: string) =>
      `/facility-amenity-offerings/facility/${facilityId}/amenity/${amenityId}`,
    RESTORE: (id: string) => `/facility-amenity-offerings/${id}/restore`,
  },
} as const;
