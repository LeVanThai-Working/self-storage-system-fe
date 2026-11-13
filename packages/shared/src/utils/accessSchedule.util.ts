import { AccessScheduleStatusEnum } from "../enums/customerInventory.enum";
import { RoleEnum } from "../enums/user.enum";
import { NotificationTypeEnum } from "../enums/notification.enum";
import type { AccessScheduleAssignmentFields } from "../types/accessSchedule.types";

type ScheduleAssignment = AccessScheduleAssignmentFields & {
  status: AccessScheduleStatusEnum;
  facilityId: string;
};

/** UI permissions only. The backend decides time-window, capacity and workload eligibility. */
export function getAccessSchedulePermissions(
  schedule: ScheduleAssignment,
  caller: { id?: string; role?: string; facilityId?: string | null }
) {
  const sameFacility = Boolean(caller.facilityId && caller.facilityId === schedule.facilityId);
  const staff = sameFacility && caller.role === RoleEnum.FACILITY_STAFF;
  const manager = sameFacility && caller.role === RoleEnum.FACILITY_MANAGER;
  const pending = schedule.status === AccessScheduleStatusEnum.PENDING;
  const unassigned = schedule.assignedStaffId === null;
  const assigned =
    typeof schedule.assignedStaffId === "string" && schedule.assignedStaffId.length > 0;
  const responsible = Boolean(caller.id && schedule.assignedStaffId === caller.id);
  return {
    canClaim: staff && pending && unassigned,
    canAssign: manager && pending && unassigned,
    canUnassign: manager && pending && assigned,
    canCheckIn: staff && pending && (unassigned || responsible),
    canCheckOut: staff && schedule.status === AccessScheduleStatusEnum.CHECKED_IN && responsible,
  };
}

/** Never fall back to a previous OTP when the latest detail omits or revokes it. */
export function getAccessScheduleOtp(schedule?: {
  status: AccessScheduleStatusEnum;
  rawOtpCode?: string | null;
}): string | null {
  return schedule?.status === AccessScheduleStatusEnum.PENDING &&
    /^\d{6}$/.test(schedule.rawOtpCode ?? "")
    ? schedule.rawOtpCode!
    : null;
}

export function getAccessScheduleNotificationId(notification: {
  type?: string;
  metadata?: Record<string, unknown>;
}): string | null {
  const id = notification.metadata?.accessScheduleId;
  return notification.type === NotificationTypeEnum.ACCESS_SCHEDULE &&
    typeof id === "string" &&
    /^[a-f\d]{24}$/i.test(id)
    ? id
    : null;
}
