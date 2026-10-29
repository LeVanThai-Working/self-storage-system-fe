import { useQuery } from "@tanstack/react-query";
import {
  getAvailableTimeSlotsApi,
  getAvailableUnitsApi,
  getFacilityMapLayoutApi,
  getOfferingApi,
  getUnitRacksApi,
} from "../api/seatMap.api";

export const seatMapKeys = {
  units: (facilityId?: string, unitTypeId?: string) =>
    ["booking-seat-map", "units", facilityId, unitTypeId] as const,
  racks: (unitId?: string) => ["booking-seat-map", "racks", unitId] as const,
  offering: (offeringId?: string) => ["booking-seat-map", "offering", offeringId] as const,
  slots: (facilityId?: string, date?: string) =>
    ["booking-seat-map", "slots", facilityId, date] as const,
};

/**
 * Units of one unit type for the seat map. Uses map-layout (all statuses) and falls back to the
 * available-only list if map-layout is not reachable for customers.
 */
export function useBookableUnits(facilityId?: string, unitTypeId?: string) {
  return useQuery({
    queryKey: seatMapKeys.units(facilityId, unitTypeId),
    queryFn: async () => {
      try {
        const all = await getFacilityMapLayoutApi(facilityId!);
        return all.filter((unit) => !unitTypeId || unit.unitTypeId === unitTypeId);
      } catch {
        return getAvailableUnitsApi(facilityId!, unitTypeId);
      }
    },
    enabled: Boolean(facilityId),
  });
}

export function useBookableRacks(unitId?: string, enabled = true) {
  return useQuery({
    queryKey: seatMapKeys.racks(unitId),
    queryFn: () => getUnitRacksApi(unitId!),
    enabled: Boolean(unitId) && enabled,
  });
}

/** Zone prices of a rack-warehouse offering (`rackZonePricing`). */
export function useOfferingZonePricing(offeringId?: string, enabled = true) {
  return useQuery({
    queryKey: seatMapKeys.offering(offeringId),
    queryFn: () => getOfferingApi(offeringId!),
    enabled: Boolean(offeringId) && enabled,
    select: (offering) => offering.rackZonePricing ?? null,
  });
}

export function useCheckInSlots(facilityId?: string, date?: string) {
  return useQuery({
    queryKey: seatMapKeys.slots(facilityId, date),
    queryFn: () => getAvailableTimeSlotsApi(facilityId!, date!),
    enabled: Boolean(facilityId && date),
  });
}
