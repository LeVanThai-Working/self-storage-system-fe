import api from "@/lib/api/axios";
import {
  type ApiResponse as Envelope,
  type StorageRackResponse,
  type StorageUnitInventoryTreeResponse,
} from "@self-storage-system-fe/shared";

const INV = "/customer-inventories";

/* Staff and FM only read customer stock: customers run every stock operation themselves. */

/** GET /storage-racks/unit/{unitId} — racks with tiers (layout source, works for staff). */
export const fetchUnitRacks = async (unitId: string): Promise<StorageRackResponse[]> => {
  const { data } = await api.get<Envelope<StorageRackResponse[]>>(`/storage-racks/unit/${unitId}`);
  return data.data;
};

/** GET /customer-inventories/unit/{unitId}/tree — staff and FM of the unit's facility (403 otherwise). */
export const fetchUnitInventoryTree = async (
  unitId: string
): Promise<StorageUnitInventoryTreeResponse> => {
  const { data } = await api.get<Envelope<StorageUnitInventoryTreeResponse>>(
    `${INV}/unit/${unitId}/tree`
  );
  return data.data;
};
