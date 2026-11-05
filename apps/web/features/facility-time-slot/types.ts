/**
 * Check-in time slots of a facility (BE module `facility-time-slots`).
 * Declared here because `@self-storage-system-fe/shared` has no time-slot types yet.
 */

export type DayOfWeek =
  "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY" | "ALL";

export interface FacilityTimeSlot {
  id: string;
  facilityId: string;
  slotName: string;
  /** HH:mm */
  startTime: string;
  /** HH:mm */
  endTime: string;
  maxCapacity: number;
  slotCapacity?: number;
  isActive: boolean;
  notes: string | null;
  dayOfWeek?: DayOfWeek | string;
  createdAt: string;
  updatedAt: string;
}

/** A slot on one specific date, with how many check-ins are already booked. */
export interface AvailableTimeSlot {
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
  slotName?: string;
  startTime: string;
  endTime: string;
  maxCapacity?: number;
  slotCapacity?: number;
  isActive?: boolean;
  notes?: string | null;
  dayOfWeek?: DayOfWeek | string;
}

export type UpdateFacilityTimeSlotRequest = Partial<
  Omit<CreateFacilityTimeSlotRequest, "facilityId">
>;
