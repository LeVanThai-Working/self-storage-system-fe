import { describe, expect, it } from "vitest";
import {
  getIncidentActions,
  getIncidentNotificationId,
  canCustomerCancelIncident,
} from "../../packages/shared/src/utils/incident.util";
import { IncidentStatusEnum } from "../../packages/shared/src/enums/incident.enum";
import {
  customerAcknowledgeIncidentSchema,
  evacuateIncidentRackSchema,
  resolveIncidentSchema,
  reportIncidentSchema,
  uploadRestorationManifestSchema,
} from "../../packages/shared/src/schemas/request/incident.request.schema";
import { IncidentLiablePartyEnum } from "../../packages/shared/src/enums/incident.enum";
import type { IncidentResponse } from "../../packages/shared/src/types/incident.types";

describe("Incident assignment status gates", () => {
  it.each(Object.values(IncidentStatusEnum))("allows assignment only while open: %s", (status) => {
    const incident = { status, requiresRelocation: false };
    expect(getIncidentActions(incident).canAssign).toBe(
      [
        IncidentStatusEnum.REPORTED,
        IncidentStatusEnum.ASSIGNED,
        IncidentStatusEnum.INVESTIGATING,
        IncidentStatusEnum.IN_PROGRESS,
      ].includes(status)
    );
  });
});

const manifest: NonNullable<IncidentResponse["preEvacuationManifest"]> = {
  evacuatedAt: "2026-11-19T00:00:00Z",
  evacuatedBy: "staff",
  evidenceImages: [],
  items: [],
  totalSystemQuantity: 0,
  totalActualQuantity: 0,
  totalDiscrepancy: 0,
};
const standard = {
  status: IncidentStatusEnum.RESOLVED,
  requiresRelocation: false,
  storageUnit: { id: "unit" },
  storageRack: { id: "rack" },
};
const evacuated = { ...standard, preEvacuationManifest: manifest };

describe("Incident acceptance workflow", () => {
  it("allows cancellation only by the customer who reported the incident", () => {
    const report = { status: IncidentStatusEnum.REPORTED, reporter: { id: "customer" } };
    expect(canCustomerCancelIncident(report, "customer")).toBe(true);
    expect(canCustomerCancelIncident({ ...report, reporter: { id: "staff" } }, "customer")).toBe(
      false
    );
    expect(
      canCustomerCancelIncident({ ...report, status: IncidentStatusEnum.ASSIGNED }, "customer")
    ).toBe(false);
    expect(canCustomerCancelIncident(report, undefined)).toBe(false);
  });
  it("routes only valid incident notification IDs", () => {
    const id = "a".repeat(24);
    expect(getIncidentNotificationId({ type: "incident", metadata: { incidentId: id } })).toBe(id);
    for (const input of [
      { type: "contract", metadata: { incidentId: id } },
      { type: "incident", metadata: { incidentId: "../contracts" } },
      { type: "incident" },
    ]) {
      expect(getIncidentNotificationId(input)).toBeNull();
    }
  });
  it("keeps direct customer/manager closure only for the non-evacuation flow", () => {
    expect(getIncidentActions(standard).canCustomerClose).toBe(true);
    expect(getIncidentActions(standard).canClose).toBe(true);
    expect(getIncidentActions(evacuated).canCustomerClose).toBe(false);
    expect(getIncidentActions(evacuated).canClose).toBe(false);
    expect(getIncidentActions(evacuated).canUploadManifest).toBe(true);
  });
  it("requires both paper and customer acknowledgment before closing an evacuated incident", () => {
    const paper = { ...evacuated, restorationManifestDocUrl: "https://example.com/signed.pdf" };
    expect(getIncidentActions(paper).canAcknowledge).toBe(true);
    expect(getIncidentActions(paper).canClose).toBe(false);
    const accepted = { ...paper, customerAcknowledgedAt: "2026-11-19T01:00:00Z" };
    expect(getIncidentActions(accepted).canClose).toBe(true);
    expect(getIncidentActions(accepted).canAcknowledge).toBe(false);
    expect(getIncidentActions(accepted).canUploadManifest).toBe(false);
    expect(
      getIncidentActions({ ...evacuated, customerAcknowledgedAt: accepted.customerAcknowledgedAt })
        .canClose
    ).toBe(false);
  });
  it("supports closing IN_PROGRESS only for relocation after acceptance", () => {
    const pending = {
      ...evacuated,
      status: IncidentStatusEnum.IN_PROGRESS,
      restorationManifestDocUrl: "https://example.com/signed.pdf",
      customerAcknowledgedAt: "2026-11-19T01:00:00Z",
    };
    expect(getIncidentActions(pending).canClose).toBe(false);
    expect(getIncidentActions({ ...pending, requiresRelocation: true }).canClose).toBe(true);
    expect(
      getIncidentActions({ ...evacuated, status: IncidentStatusEnum.IN_PROGRESS }).canUploadManifest
    ).toBe(false);
  });
  it.each([IncidentStatusEnum.CLOSED, IncidentStatusEnum.CANCELLED])(
    "blocks mutations on %s",
    (status) => {
      const actions = getIncidentActions({
        ...evacuated,
        status,
        restorationManifestDocUrl: "https://example.com/signed.pdf",
      });
      expect(
        actions.canEvacuate ||
          actions.canAcknowledge ||
          actions.canClose ||
          actions.canUploadManifest
      ).toBe(false);
    }
  );
  it("accepts old responses without evacuation fields", () => {
    expect(
      getIncidentActions({ ...standard, status: IncidentStatusEnum.INVESTIGATING }).canEvacuate
    ).toBe(true);
    expect(getIncidentActions(evacuated).canEvacuate).toBe(false);
  });
  it("does not offer evacuation for common areas, missing locations, or whole-unit reports", () => {
    for (const scope of [
      { locationType: "common_area" as const },
      { storageUnit: undefined, storageRack: undefined },
      { storageRack: undefined },
    ]) {
      expect(
        getIncidentActions({ ...standard, status: IncidentStatusEnum.REPORTED, ...scope })
          .canEvacuate
      ).toBe(false);
    }
    expect(getIncidentActions({ ...standard, locationType: "common_area" }).canCustomerClose).toBe(
      false
    );
    expect(getIncidentActions({ ...standard, storageUnit: undefined }).canCustomerClose).toBe(
      false
    );
  });
});

describe("Incident location request validation", () => {
  const report = {
    facilityId: "a".repeat(24),
    category: "electrical",
    title: "Electrical issue",
    description: "Exposed wire needs repair",
    images: ["https://example.com/photo.jpg"],
  };
  it("rejects a report with no location rather than defaulting to common area", () => {
    expect(reportIncidentSchema.safeParse(report).success).toBe(false);
  });
  it("requires a deliberate, specific common-area location", () => {
    expect(reportIncidentSchema.safeParse({ ...report, locationType: "common_area" }).success).toBe(
      false
    );
    expect(
      reportIncidentSchema.safeParse({
        ...report,
        locationType: "common_area",
        commonAreaLocation: "   ",
      }).success
    ).toBe(false);
    expect(
      reportIncidentSchema.safeParse({
        ...report,
        locationType: "common_area",
        commonAreaLocation: "Second-floor corridor",
      }).success
    ).toBe(true);
    expect(
      reportIncidentSchema.safeParse({
        ...report,
        locationType: "common_area",
        commonAreaLocation: "Second-floor corridor",
        storageUnitId: "b".repeat(24),
      }).success
    ).toBe(false);
  });
  it("requires unit and rack hierarchy while allowing existing unit-based clients", () => {
    expect(
      reportIncidentSchema.safeParse({ ...report, storageUnitId: "b".repeat(24) }).success
    ).toBe(true);
    expect(
      reportIncidentSchema.safeParse({
        ...report,
        locationType: "storage_rack",
        storageUnitId: "b".repeat(24),
      }).success
    ).toBe(false);
    expect(
      reportIncidentSchema.safeParse({ ...report, storageRackId: "c".repeat(24) }).success
    ).toBe(false);
    expect(
      reportIncidentSchema.safeParse({
        ...report,
        storageUnitId: "b".repeat(24),
        rackTierId: "d".repeat(24),
      }).success
    ).toBe(false);
    expect(
      reportIncidentSchema.safeParse({
        ...report,
        locationType: "storage_rack",
        storageUnitId: "b".repeat(24),
        storageRackId: "c".repeat(24),
        rackTierId: "d".repeat(24),
      }).success
    ).toBe(true);
  });
});

describe("Incident request contracts", () => {
  const request = {
    fromRackId: "a".repeat(24),
    evidenceImages: ["https://example.com/photo.jpg"],
    emergencyReason: "Unsafe rack needs evacuation",
    requiresRelocation: false,
    items: [{ skuId: "b".repeat(24), actualQuantity: 0 }],
  };
  it("allows a confirmed zero count", () =>
    expect(evacuateIncidentRackSchema.safeParse(request).success).toBe(true));
  it.each([-1, 1.5, NaN])("rejects invalid actual count %s", (actualQuantity) => {
    expect(
      evacuateIncidentRackSchema.safeParse({
        ...request,
        items: [{ ...request.items[0], actualQuantity }],
      }).success
    ).toBe(false);
  });
  it("requires evidence, a reason and item counts", () => {
    for (const change of [{ evidenceImages: [] }, { emergencyReason: "short" }, { items: [] }]) {
      expect(evacuateIncidentRackSchema.safeParse({ ...request, ...change }).success).toBe(false);
    }
  });
  it("validates manifest URL and acknowledgment notes", () => {
    expect(
      uploadRestorationManifestSchema.safeParse({ restorationManifestDocUrl: "not-url" }).success
    ).toBe(false);
    expect(customerAcknowledgeIncidentSchema.safeParse({ notes: "x".repeat(1001) }).success).toBe(
      false
    );
  });
  it("preserves facility compensation instead of zeroing it", () => {
    const resolution = resolveIncidentSchema.parse({
      resolutionNotes: "Rack repaired",
      staffEvidenceImages: request.evidenceImages,
      liableParty: IncidentLiablePartyEnum.FACILITY,
      repairCost: 100000,
      damageFee: 250000,
    });
    expect(resolution.damageFee).toBe(250000);
  });
});
