import type { AccessScheduleStatusEnum } from "../enums/customerInventory.enum";

export interface TimeSlotSnapshotResponse {
  slotName: string;
  /** "HH:mm" */
  startTime: string;
  endTime: string;
}

export interface AvailableAccessSlotResponse {
  timeSlotId: string;
  slotName: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
  availableCapacity: number;
  isAvailable: boolean;
}

export interface RentedRackItemResponse {
  rackId: string;
  rackCode: string;
  aisle?: string | null;
  bay?: string | number | null;
  zone?: string | null;
}

export interface AccessScheduleAssignmentFields {
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  assignedAt: string | null;
  assignmentVersion: number;
}

export interface AccessScheduleDetailResponse extends AccessScheduleAssignmentFields {
  id: string;
  scheduleCode: string;
  status: AccessScheduleStatusEnum;
  customerId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  contractId: string;
  contractCode?: string | null;
  facilityId: string;
  facilityName?: string | null;
  facilityCode?: string | null;
  timeSlotId: string;
  timeSlotSnapshot: TimeSlotSnapshotResponse;
  /** "YYYY-MM-DD" */
  scheduledDate: string;
  numberOfPeople: number;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  purpose?: string | null;
  /** Current six-digit OTP, returned only when the customer is allowed to view it. */
  rawOtpCode?: string | null;
  expiresAt: string;
  checkedInAt?: string | null;
  checkedInByName?: string | null;
  checkedOutAt?: string | null;
  checkedOutByName?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  staffNotes?: string | null;
  rentedRacks?: RentedRackItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AccessScheduleListItemResponse extends AccessScheduleAssignmentFields {
  id: string;
  scheduleCode: string;
  status: AccessScheduleStatusEnum;
  customerId: string;
  customerName?: string | null;
  contractId: string;
  contractCode?: string | null;
  facilityId: string;
  facilityName?: string | null;
  slotName: string;
  startTime: string;
  endTime: string;
  scheduledDate: string;
  numberOfPeople: number;
  vehiclePlate?: string | null;
  expiresAt: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  createdAt: string;
}

export interface AccessScheduleCheckInResponse {
  schedule: AccessScheduleDetailResponse;
  rentedRacks: RentedRackItemResponse[];
  message: string;
}

export interface ProcessNoShowResponse {
  processedCount: number;
}
