import { IncidentStatusEnum } from "../enums/incident.enum";
import { NotificationTypeEnum } from "../enums/notification.enum";
import type { IncidentResponse } from "../types/incident.types";

export function canCustomerCancelIncident(
  incident: Pick<IncidentResponse, "status" | "reporter">,
  customerId?: string
): boolean {
  const reporterId =
    typeof incident.reporter === "string" ? incident.reporter : incident.reporter.id;
  return Boolean(
    customerId && reporterId === customerId && incident.status === IncidentStatusEnum.REPORTED
  );
}

export function getIncidentNotificationId(notification: {
  type: string;
  metadata?: Record<string, unknown> | null;
}): string | null {
  const id = notification.metadata?.incidentId;
  return notification.type === NotificationTypeEnum.INCIDENT &&
    typeof id === "string" &&
    /^[a-f0-9]{24}$/i.test(id)
    ? id
    : null;
}

/** Status gates shared by customer and facility screens. Authorization stays on the server. */
export function getIncidentActions(
  incident: Pick<
    IncidentResponse,
    | "status"
    | "requiresRelocation"
    | "preEvacuationManifest"
    | "restorationManifestDocUrl"
    | "customerAcknowledgedAt"
    | "locationType"
    | "storageUnit"
    | "storageRack"
  >
) {
  const { status } = incident;
  const terminal = status === IncidentStatusEnum.CLOSED || status === IncidentStatusEnum.CANCELLED;
  const evacuated = Boolean(incident.preEvacuationManifest);
  const closureStatus =
    status === IncidentStatusEnum.RESOLVED ||
    (incident.requiresRelocation && status === IncidentStatusEnum.IN_PROGRESS);
  return {
    terminal,
    evacuated,
    canAssign: [
      IncidentStatusEnum.REPORTED,
      IncidentStatusEnum.ASSIGNED,
      IncidentStatusEnum.INVESTIGATING,
      IncidentStatusEnum.IN_PROGRESS,
    ].includes(status),
    closureStatus,
    canEvacuate:
      !evacuated &&
      incident.locationType !== "common_area" &&
      Boolean(incident.storageUnit?.id && incident.storageRack?.id) &&
      [
        IncidentStatusEnum.REPORTED,
        IncidentStatusEnum.ASSIGNED,
        IncidentStatusEnum.INVESTIGATING,
        IncidentStatusEnum.IN_PROGRESS,
      ].includes(status),
    canUploadManifest: evacuated && closureStatus && !terminal && !incident.customerAcknowledgedAt,
    canAcknowledge:
      evacuated &&
      closureStatus &&
      !terminal &&
      Boolean(incident.restorationManifestDocUrl) &&
      !incident.customerAcknowledgedAt,
    canClose:
      closureStatus &&
      (!evacuated ||
        Boolean(incident.restorationManifestDocUrl && incident.customerAcknowledgedAt)),
    canCustomerClose:
      !evacuated &&
      status === IncidentStatusEnum.RESOLVED &&
      incident.locationType !== "common_area" &&
      Boolean(incident.storageUnit?.id),
  };
}
