import api from "@/lib/api/axios";
import { restoreAmenity } from "@/features/amenity-management/api";
import { restoreFacility } from "@/features/facility-management/api";
import { restoreOffering } from "@/features/offering-management/api";
import { restoreStorageUnit } from "@/features/storage-unit-management/api";
import { restoreUnitType } from "@/features/unit-type-management/api";
import type { AuditLog } from "@/features/audit-logs/types";

const restoreUser = async (id: string) => {
  await api.post(`/users/${id}/restore`);
};

/** One tab per soft-deletable resource; `resourceType` is the value the BE writes to audit logs. */
export const TRASH_TABS = [
  { id: "facility", resourceType: "facility", restore: restoreFacility },
  { id: "unitType", resourceType: "unit_type", restore: restoreUnitType },
  { id: "storageUnit", resourceType: "storage_unit", restore: restoreStorageUnit },
  { id: "amenity", resourceType: "amenity", restore: restoreAmenity },
  { id: "offering", resourceType: "facility_unit_type_offering", restore: restoreOffering },
  { id: "user", resourceType: "user", restore: restoreUser },
] as const;

export type TrashTabId = (typeof TRASH_TABS)[number]["id"];

export interface TrashEntry {
  resourceId: string;
  label: string;
  deletedAt: string;
  deletedBy: string | null;
}

/** Best human label from the snapshot the BE stores in `changes.before` when a record is deleted. */
const labelOf = (log: AuditLog) => {
  const b = log.changes?.before ?? {};
  const pick = (k: string) => (typeof b[k] === "string" && b[k] ? (b[k] as string) : null);
  return pick("name") ?? pick("unitNumber") ?? pick("email") ?? log.resourceId;
};

/**
 * The BE has no "list deleted records" endpoint, so a record counts as trashed while its newest
 * delete/restore audit event is a delete.
 * shortcut: only sees the audit logs passed in (the latest page of each), so very old deletions can be missed; replace with a BE list endpoint.
 */
export function deriveTrashEntries(deleteLogs: AuditLog[], restoreLogs: AuditLog[]): TrashEntry[] {
  const lastRestore = new Map<string, string>();
  for (const r of restoreLogs) {
    if ((lastRestore.get(r.resourceId) ?? "") < r.createdAt) {
      lastRestore.set(r.resourceId, r.createdAt);
    }
  }

  const newestDelete = new Map<string, AuditLog>();
  for (const d of deleteLogs) {
    const cur = newestDelete.get(d.resourceId);
    if (!cur || cur.createdAt < d.createdAt) newestDelete.set(d.resourceId, d);
  }

  return [...newestDelete.values()]
    .filter((d) => (lastRestore.get(d.resourceId) ?? "") < d.createdAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((d) => ({
      resourceId: d.resourceId,
      label: labelOf(d),
      deletedAt: d.createdAt,
      deletedBy: d.actorEmail,
    }));
}
