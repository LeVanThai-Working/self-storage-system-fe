export interface FacilityTimeSlotResponse {
  id: string;
  facilityId: string;
  slotName: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableTimeSlotItemResponse {
  id: string;
  facilityId: string;
  slotName: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
  availableCapacity: number;
  isAvailable: boolean;
}

export interface CreateFacilityTimeSlotRequest {
  facilityId: string;
  slotName: string;
  startTime: string;
  endTime: string;
  maxCapacity?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateFacilityTimeSlotRequest {
  slotName?: string;
  startTime?: string;
  endTime?: string;
  maxCapacity?: number;
  isActive?: boolean;
  notes?: string;
}

export interface AvailableTimeSlotsQuery {
  date: string;
}
