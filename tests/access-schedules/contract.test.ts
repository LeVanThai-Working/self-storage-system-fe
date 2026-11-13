import { describe, expect, it } from "vitest";
import { AccessScheduleStatusEnum } from "../../packages/shared/src/enums/customerInventory.enum";
import { RoleEnum } from "../../packages/shared/src/enums/user.enum";
import { NotificationTypeEnum } from "../../packages/shared/src/enums/notification.enum";
import {
  getAccessScheduleNotificationId,
  getAccessScheduleOtp,
  getAccessSchedulePermissions,
} from "../../packages/shared/src/utils/accessSchedule.util";
import {
  accessScheduleQuerySchema,
  assignAccessScheduleSchema,
  checkInAccessScheduleSchema,
  unassignAccessScheduleSchema,
} from "../../packages/shared/src/schemas/request/accessSchedule.request.schema";
import {
  getSlotStart,
  getCheckInWindow,
  canCancelAccessSchedule,
} from "../../apps/mobile/features/access-schedules/utils/accessScheduleFormat";

const pending = {
  status: AccessScheduleStatusEnum.PENDING,
  facilityId: "facility-a",
  assignedStaffId: null,
  assignedStaffName: null,
  assignedAt: null,
  assignmentVersion: 7,
};
const staff = { id: "staff-a", role: RoleEnum.FACILITY_STAFF, facilityId: "facility-a" };
const manager = { ...staff, id: "manager", role: RoleEnum.FACILITY_MANAGER };

describe("Access schedule permissions", () => {
  it("allows a staff member to check in an unassigned visit directly", () => {
    expect(getAccessSchedulePermissions(pending, staff)).toMatchObject({
      canClaim: true,
      canCheckIn: true,
      canAssign: false,
      canUnassign: false,
    });
  });
  it("restricts an assigned pending visit to the responsible staff", () => {
    const assigned = { ...pending, assignedStaffId: staff.id };
    expect(getAccessSchedulePermissions(assigned, staff)).toMatchObject({
      canClaim: false,
      canCheckIn: true,
      canUnassign: false,
    });
    expect(getAccessSchedulePermissions(assigned, { ...staff, id: "other-staff" }).canCheckIn).toBe(
      false
    );
  });
  it("allows manager assignment only after the previous assignment is removed", () => {
    expect(getAccessSchedulePermissions(pending, manager)).toMatchObject({
      canAssign: true,
      canUnassign: false,
      canCheckIn: false,
    });
    expect(
      getAccessSchedulePermissions({ ...pending, assignedStaffId: staff.id }, manager)
    ).toMatchObject({ canAssign: false, canUnassign: true });
  });
  it.each([
    RoleEnum.FACILITY_MANAGER,
    RoleEnum.BUSINESS_OPS_MANAGER,
    RoleEnum.SYSTEM_ADMIN,
    RoleEnum.CUSTOMER,
  ])("never lets %s check in or out on behalf of staff", (role) => {
    const caller = { ...staff, role };
    expect(getAccessSchedulePermissions(pending, caller).canCheckIn).toBe(false);
    expect(
      getAccessSchedulePermissions(
        { ...pending, status: AccessScheduleStatusEnum.CHECKED_IN, assignedStaffId: staff.id },
        caller
      ).canCheckOut
    ).toBe(false);
  });
  it("allows checkout only for the staff responsible for the active visit", () => {
    const inside = {
      ...pending,
      status: AccessScheduleStatusEnum.CHECKED_IN,
      assignedStaffId: staff.id,
    };
    expect(getAccessSchedulePermissions(inside, staff)).toMatchObject({
      canCheckOut: true,
      canClaim: false,
      canCheckIn: false,
      canUnassign: false,
      canAssign: false,
    });
    expect(getAccessSchedulePermissions(inside, { ...staff, id: "another" }).canCheckOut).toBe(
      false
    );
    expect(getAccessSchedulePermissions(inside, manager).canUnassign).toBe(false);
  });
  it.each([
    AccessScheduleStatusEnum.COMPLETED,
    AccessScheduleStatusEnum.CANCELLED,
    AccessScheduleStatusEnum.NO_SHOW,
    AccessScheduleStatusEnum.EXPIRED,
  ])("offers no visit actions for %s", (status) => {
    expect(
      Object.values(getAccessSchedulePermissions({ ...pending, status }, staff))
    ).not.toContain(true);
    expect(
      Object.values(getAccessSchedulePermissions({ ...pending, status }, manager))
    ).not.toContain(true);
  });
  it("denies cross-facility actions and does not infer a missing caller facility", () => {
    for (const caller of [staff, manager]) {
      expect(
        Object.values(
          getAccessSchedulePermissions(pending, { ...caller, facilityId: "other-facility" })
        )
      ).not.toContain(true);
      expect(
        Object.values(getAccessSchedulePermissions(pending, { ...caller, facilityId: undefined }))
      ).not.toContain(true);
    }
  });
});

describe("OTP lifecycle", () => {
  it("shows a current OTP, including leading zeroes, in a reopened pending detail", () => {
    expect(getAccessScheduleOtp({ ...pending, rawOtpCode: "012345" })).toBe("012345");
  });
  it.each([null, undefined, "", "12345", "1234567", "qr-token", "abcdef"])(
    "does not show a revoked, absent or malformed OTP: %s",
    (rawOtpCode) => {
      expect(getAccessScheduleOtp({ ...pending, rawOtpCode })).toBe(null);
    }
  );
  it.each([
    AccessScheduleStatusEnum.CHECKED_IN,
    AccessScheduleStatusEnum.COMPLETED,
    AccessScheduleStatusEnum.CANCELLED,
    AccessScheduleStatusEnum.NO_SHOW,
    AccessScheduleStatusEnum.EXPIRED,
  ])("hides the OTP when the visit is %s", (status) => {
    expect(getAccessScheduleOtp({ status, rawOtpCode: "012345" })).toBe(null);
  });
  it("keeps OTP access independent of assignment changes", () => {
    const assigned = { ...pending, assignedStaffId: "staff-a", rawOtpCode: "012345" };
    const unassigned = { ...assigned, assignedStaffId: null, assignmentVersion: 8 };
    expect(getAccessScheduleOtp(assigned)).toBe("012345");
    expect(getAccessScheduleOtp(unassigned)).toBe("012345");
  });
});

describe("Access schedule request contract", () => {
  it("accepts exactly six digits in code, with leading zeros and trimmed whitespace", () => {
    expect(checkInAccessScheduleSchema.parse({ code: " 012345 " }).code).toBe("012345");
  });
  it.each(["12345", "1234567", "qr-payload", "12a345", "", "SUP-0001"])(
    "rejects code %s",
    (code) => {
      expect(checkInAccessScheduleSchema.safeParse({ code }).success).toBe(false);
    }
  );
  it("keeps sortBy open and validates assignment scopes", () => {
    expect(
      accessScheduleQuerySchema.parse({ assignmentScope: "mine", sortBy: "scheduledDate" })
    ).toMatchObject({ assignmentScope: "mine", sortBy: "scheduledDate", page: 1, limit: 10 });
    expect(accessScheduleQuerySchema.safeParse({ assignmentScope: "customer" }).success).toBe(
      false
    );
  });
  it("requires the server's assignment version and a nonblank removal reason", () => {
    expect(assignAccessScheduleSchema.safeParse({ staffId: "a".repeat(24) }).success).toBe(false);
    expect(
      assignAccessScheduleSchema.parse({ staffId: "a".repeat(24), assignmentVersion: 7 })
        .assignmentVersion
    ).toBe(7);
    expect(
      unassignAccessScheduleSchema.safeParse({ reason: "  ", assignmentVersion: 7 }).success
    ).toBe(false);
    expect(
      unassignAccessScheduleSchema.safeParse({ reason: "x".repeat(501), assignmentVersion: 7 })
        .success
    ).toBe(false);
    expect(
      unassignAccessScheduleSchema.parse({ reason: " Staff unavailable ", assignmentVersion: 7 })
    ).toEqual({ reason: "Staff unavailable", assignmentVersion: 7 });
  });
});

describe("Access schedule notification navigation", () => {
  it("uses accessScheduleId rather than the display code", () => {
    const id = "a".repeat(24);
    expect(
      getAccessScheduleNotificationId({
        type: NotificationTypeEnum.ACCESS_SCHEDULE,
        metadata: { accessScheduleId: id, scheduleCode: "AS-01" },
      })
    ).toBe(id);
  });
  it("does not navigate with a missing or invalid id, or another notification type", () => {
    for (const metadata of [
      undefined,
      {},
      { accessScheduleId: "../contracts/1" },
      { scheduleCode: "AS-01" },
    ]) {
      expect(
        getAccessScheduleNotificationId({ type: NotificationTypeEnum.ACCESS_SCHEDULE, metadata })
      ).toBe(null);
    }
    expect(
      getAccessScheduleNotificationId({
        type: NotificationTypeEnum.CONTRACT,
        metadata: { accessScheduleId: "a".repeat(24) },
      })
    ).toBe(null);
  });
});

describe("Facility dates use Vietnam time", () => {
  it("interprets the scheduled date and slot independently of the phone timezone", () => {
    expect(getSlotStart("2026-11-13", "08:00").toISOString()).toBe("2026-11-13T01:00:00.000Z");
    expect(getCheckInWindow("2026-11-13", "08:00")).toEqual({ from: "07:30", to: "08:45" });
  });
  it("preserves the existing one-hour customer cancellation deadline", () => {
    const before = new Date("2026-11-13T06:59:59+07:00").getTime();
    const deadline = new Date("2026-11-13T07:00:00+07:00").getTime();
    expect(
      canCancelAccessSchedule(AccessScheduleStatusEnum.PENDING, "2026-11-13", "08:00", before)
    ).toBe(true);
    expect(
      canCancelAccessSchedule(AccessScheduleStatusEnum.PENDING, "2026-11-13", "08:00", deadline)
    ).toBe(false);
  });
});
