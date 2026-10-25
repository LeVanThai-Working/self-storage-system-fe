import { useQuery } from "@tanstack/react-query";
import { fetchAvailableTimeSlots, fetchFacilityTimeSlots } from "./api";

export const timeSlotKeys = {
  all: ["facility-time-slots"] as const,
  byFacility: (facilityId: string) => [...timeSlotKeys.all, "facility", facilityId] as const,
  available: (facilityId: string, date: string) =>
    [...timeSlotKeys.all, "available", facilityId, date] as const,
};

/** Slots a customer can still book on `date` (YYYY-MM-DD). Stays idle until both inputs exist. */
export const useAvailableTimeSlots = (facilityId: string | undefined, date: string) =>
  useQuery({
    queryKey: timeSlotKeys.available(facilityId ?? "", date),
    queryFn: () => fetchAvailableTimeSlots(facilityId!, date),
    enabled: Boolean(facilityId) && Boolean(date),
  });

export const useFacilityTimeSlots = (facilityId: string | undefined) =>
  useQuery({
    queryKey: timeSlotKeys.byFacility(facilityId ?? ""),
    queryFn: () => fetchFacilityTimeSlots(facilityId!),
    enabled: Boolean(facilityId),
  });
