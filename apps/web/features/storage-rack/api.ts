import api from "@/lib/api/axios";
import type {
  ApiResponse as Envelope,
  CreateStorageRackRequest,
  RackTierResponse,
  StorageRackResponse,
  UpdateRackTierRequest,
  UpdateStorageRackRequest,
} from "@self-storage-system-fe/shared";

/** POST /storage-racks/unit/{unitId}/provision — generate racks from the unit type's rack config. */
export const provisionRacks = async (unitId: string): Promise<StorageRackResponse[]> => {
  const { data } = await api.post<Envelope<StorageRackResponse[]>>(
    `/storage-racks/unit/${unitId}/provision`
  );
  return data.data;
};

/** POST /storage-racks — create one rack (and its tiers) by hand. */
export const createRack = async (
  payload: CreateStorageRackRequest
): Promise<StorageRackResponse> => {
  const { data } = await api.post<Envelope<StorageRackResponse>>("/storage-racks", payload);
  return data.data;
};

/** PATCH /storage-racks/{id} */
export const updateRack = async (
  id: string,
  payload: UpdateStorageRackRequest
): Promise<StorageRackResponse> => {
  const { data } = await api.patch<Envelope<StorageRackResponse>>(`/storage-racks/${id}`, payload);
  return data.data;
};

/** PATCH /storage-racks/tiers/{id} — max weight, dimensions (volume is recomputed), status. */
export const updateRackTier = async (
  id: string,
  payload: UpdateRackTierRequest
): Promise<RackTierResponse> => {
  const { data } = await api.patch<Envelope<RackTierResponse>>(
    `/storage-racks/tiers/${id}`,
    payload
  );
  return data.data;
};
