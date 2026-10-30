import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse,
  type FacilityUnitTypeOfferingResponse,
  type StorageRackResponse,
  type StorageUnitResponse,
} from "@self-storage-system-fe/shared";

/** One check-in slot on a given date (BE `facility-time-slots`, not in shared yet). */
export interface AvailableTimeSlot {
  id: string;
  facilityId: string;
  slotName: string;
  /** HH:mm */
  startTime: string;
  /** HH:mm */
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
  availableCapacity: number;
  isAvailable: boolean;
}

/**
 * GET /storage-units/facility/{facilityId}/map-layout
 * Every unit of the facility in any status (so taken units can be shown greyed out).
 */
export async function getFacilityMapLayoutApi(facilityId: string): Promise<StorageUnitResponse[]> {
  const response = await api.get<ApiResponse<StorageUnitResponse[]>>(
    `/storage-units/facility/${facilityId}/map-layout`
  );
  return response.data.data;
}

/** GET /storage-units/facility/{facilityId}/available — free units only (map-layout fallback). */
export async function getAvailableUnitsApi(
  facilityId: string,
  unitTypeId?: string
): Promise<StorageUnitResponse[]> {
  const response = await api.get<ApiResponse<StorageUnitResponse[]>>(
    `/storage-units/facility/${facilityId}/available`,
    { params: cleanQueryParams({ unitTypeId }) }
  );
  return response.data.data;
}

/** GET /storage-racks/unit/{unitId} — racks (with tiers) inside a WAREHOUSE_RACK unit. */
export async function getUnitRacksApi(unitId: string): Promise<StorageRackResponse[]> {
  const response = await api.get<ApiResponse<StorageRackResponse[]>>(
    `/storage-racks/unit/${unitId}`
  );
  return response.data.data;
}

/** GET /facility-unit-type-offerings/{id} — carries `rackZonePricing` for rack warehouses. */
export async function getOfferingApi(id: string): Promise<FacilityUnitTypeOfferingResponse> {
  const response = await api.get<ApiResponse<FacilityUnitTypeOfferingResponse>>(
    `/facility-unit-type-offerings/${id}`
  );
  return response.data.data;
}

/** GET /facility-time-slots/facility/{facilityId}/available?date= */
export async function getAvailableTimeSlotsApi(
  facilityId: string,
  date: string
): Promise<AvailableTimeSlot[]> {
  const response = await api.get<ApiResponse<AvailableTimeSlot[]>>(
    `/facility-time-slots/facility/${facilityId}/available`,
    { params: { date } }
  );
  return response.data.data;
}
