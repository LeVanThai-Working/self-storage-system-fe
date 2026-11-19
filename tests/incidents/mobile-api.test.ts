import { beforeEach, describe, expect, it, vi } from "vitest";
// Vitest's @ alias resolves the HTTP adapter to web; both adapters expose the same post contract.
import api from "../../apps/web/lib/api/axios";
import { acknowledgeIncidentApi } from "../../apps/mobile/features/incidents/api/incident.api";

vi.mock("../../apps/web/lib/api/axios", () => ({ default: { post: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
describe("Customer acceptance API", () => {
  it("acknowledges without closing or changing the incident status", async () => {
    const incident = {
      id: "incident",
      status: "in_progress",
      customerAcknowledgedAt: "2026-11-19T01:00:00Z",
    };
    vi.mocked(api.post).mockResolvedValue({ data: { data: incident } });
    expect(
      await acknowledgeIncidentApi("incident", { notes: "Goods checked and received" })
    ).toEqual(incident);
    expect(api.post).toHaveBeenCalledExactlyOnceWith("/incidents/incident/customer-acknowledge", {
      notes: "Goods checked and received",
    });
  });
  it("propagates rejection so the customer can retry", async () => {
    const error = new Error("manifest missing");
    vi.mocked(api.post).mockRejectedValue(error);
    await expect(acknowledgeIncidentApi("incident", {})).rejects.toBe(error);
  });
});
