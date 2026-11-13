import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../apps/web/lib/api/axios";
import {
  assignAccessSchedule,
  checkInAccessSchedule,
  claimAccessSchedule,
  fetchAccessSchedules,
  unassignAccessSchedule,
} from "../../apps/web/features/access-schedules/api";

vi.mock("../../apps/web/lib/api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
const detail = { id: "schedule", assignmentVersion: 7 };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.post).mockResolvedValue({ data: { data: detail } });
});

describe("Access schedule API requests", () => {
  it("unwraps paginated items inside data and forwards assignmentScope", async () => {
    const paginated = { items: [], pagination: { totalItems: 0 } };
    vi.mocked(api.get).mockResolvedValue({ data: { data: paginated } });
    expect(await fetchAccessSchedules({ assignmentScope: "mine", page: 1 })).toBe(paginated);
    expect(api.get).toHaveBeenCalledWith("/access-schedules", {
      params: { assignmentScope: "mine", page: 1 },
    });
  });
  it("claims a visit without a body", async () => {
    await claimAccessSchedule("schedule");
    expect(api.post).toHaveBeenCalledWith("/access-schedules/schedule/claim");
  });
  it("checks in directly with code and never sends a claim first", async () => {
    await checkInAccessSchedule({ code: "012345" });
    expect(api.post).toHaveBeenCalledExactlyOnceWith("/access-schedules/check-in", {
      code: "012345",
    });
  });
  it("forwards the exact server version for assignment and removal", async () => {
    await assignAccessSchedule("schedule", { staffId: "a".repeat(24), assignmentVersion: 7 });
    expect(api.post).toHaveBeenLastCalledWith("/access-schedules/schedule/assign", {
      staffId: "a".repeat(24),
      assignmentVersion: 7,
    });
    await unassignAccessSchedule("schedule", { reason: "Unavailable", assignmentVersion: 8 });
    expect(api.post).toHaveBeenLastCalledWith("/access-schedules/schedule/unassign", {
      reason: "Unavailable",
      assignmentVersion: 8,
    });
  });
  it("propagates stale-assignment failures without retrying or guessing a version", async () => {
    const error = { messageCode: "MESSAGE_CODE_660" };
    vi.mocked(api.post).mockRejectedValue(error);
    await expect(
      assignAccessSchedule("schedule", { staffId: "a".repeat(24), assignmentVersion: 7 })
    ).rejects.toBe(error);
    expect(api.post).toHaveBeenCalledTimes(1);
  });
});
