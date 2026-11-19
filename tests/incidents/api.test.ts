import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../apps/web/lib/api/axios";
import {
  evacuateIncidentRack,
  uploadRestorationManifest,
  fetchIncidentStaffs,
} from "../../apps/web/features/incident-management/api";

vi.mock("../../apps/web/lib/api/axios", () => ({ default: { post: vi.fn(), get: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
describe("Incident facility API", () => {
  it("loads staff from the incident facility across pages and excludes inactive staff", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          data: {
            items: [
              { id: "active-1", status: "active" },
              { id: "inactive", status: "inactive" },
            ],
            pagination: { totalPages: 2 },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: { items: [{ id: "active-2", status: "active" }], pagination: { totalPages: 2 } },
        },
      });
    expect((await fetchIncidentStaffs("facility-a")).map((staff) => staff.id)).toEqual([
      "active-1",
      "active-2",
    ]);
    expect(api.get).toHaveBeenNthCalledWith(2, "/users", {
      params: expect.objectContaining({
        assignedFacilityId: "facility-a",
        role: "facility_staff",
        page: 2,
      }),
    });
  });
  it("surfaces staff lookup failures instead of treating them as an empty list", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("Staff lookup failed"));
    await expect(fetchIncidentStaffs("facility-a")).rejects.toThrow("Staff lookup failed");
  });
  it("sends the full count manifest to the evacuation endpoint", async () => {
    const payload = {
      evidenceImages: ["https://example.com/photo.jpg"],
      emergencyReason: "Rack is unsafe",
      requiresRelocation: true,
      items: [{ skuId: "sku", actualQuantity: 2, condition: "damaged" }],
    };
    vi.mocked(api.post).mockResolvedValue({
      data: { data: { id: "incident", status: "in_progress" } },
    });
    expect(await evacuateIncidentRack("incident", payload)).toEqual({
      id: "incident",
      status: "in_progress",
    });
    expect(api.post).toHaveBeenCalledWith("/incidents/incident/evacuate-rack", payload);
  });
  it("saves the paper manifest independently from closure", async () => {
    const payload = { restorationManifestDocUrl: "https://example.com/signed.pdf" };
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: "incident" } } });
    await uploadRestorationManifest("incident", payload);
    expect(api.post).toHaveBeenCalledWith("/incidents/incident/restoration-manifest", payload);
    expect(api.post).toHaveBeenCalledTimes(1);
  });
});
