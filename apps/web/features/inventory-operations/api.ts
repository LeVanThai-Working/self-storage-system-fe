import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse as Envelope,
  type BatchMigrateRackRequest,
  type BatchMigrateRackResponse,
  type CompleteOutboundHandoverRequest,
  type CreateCustomerSkuRequest,
  type CreateInboundRequest,
  type CustomerInventoryResponse,
  type CustomerSkuResponse,
  type EvacuateRackToHoldingRequest,
  type EvacuateRackToHoldingResponse,
  type InventoryRequestQuery,
  type InventoryRequestResponse,
  type PaginatedData,
  type PutawayInboundRequest,
  type StockAdjustRequest,
  type StockMoveRequest,
  type StorageRackResponse,
  type StorageUnitInventoryTreeResponse,
  type UpdateInventoryStatusRequest,
  type VerifiedHandoverDetailsResponse,
} from "@self-storage-system-fe/shared";

const INV = "/customer-inventories";

/* ── Inventory requests (7D) ─────────────────────────────────────────── */

/** GET /customer-inventories/requests — BE scopes staff/FM to their facility. */
export const fetchInventoryRequests = async (
  query: Partial<InventoryRequestQuery>
): Promise<PaginatedData<InventoryRequestResponse>> => {
  const { data } = await api.get<Envelope<PaginatedData<InventoryRequestResponse>>>(
    `${INV}/requests`,
    { params: cleanQueryParams(query) }
  );
  return data.data;
};

/** GET /customer-inventories/requests/{id} */
export const fetchInventoryRequest = async (id: string): Promise<InventoryRequestResponse> => {
  const { data } = await api.get<Envelope<InventoryRequestResponse>>(`${INV}/requests/${id}`);
  return data.data;
};

/** POST /customer-inventories/verify-pickup-code — QR payload, raw token or 6-digit OTP. */
export const verifyPickupCode = async (payload: {
  pickupCode: string;
  requestCode?: string;
}): Promise<VerifiedHandoverDetailsResponse> => {
  const { data } = await api.post<Envelope<VerifiedHandoverDetailsResponse>>(
    `${INV}/verify-pickup-code`,
    payload
  );
  return data.data;
};

/** POST /customer-inventories/outbound-requests/{id}/complete */
export const completeOutboundHandover = async (
  id: string,
  payload: CompleteOutboundHandoverRequest
): Promise<InventoryRequestResponse> => {
  const { data } = await api.post<Envelope<InventoryRequestResponse>>(
    `${INV}/outbound-requests/${id}/complete`,
    payload
  );
  return data.data;
};

/** POST /customer-inventories/inbound-requests (staff receive goods, ≥3 evidence photos) */
export const createInboundRequest = async (
  payload: CreateInboundRequest
): Promise<InventoryRequestResponse> => {
  const { data } = await api.post<Envelope<InventoryRequestResponse>>(
    `${INV}/inbound-requests`,
    payload
  );
  return data.data;
};

/** POST /customer-inventories/inbound-requests/{id}/putaway */
export const putawayInboundRequest = async (
  id: string,
  payload: PutawayInboundRequest
): Promise<InventoryRequestResponse> => {
  const { data } = await api.post<Envelope<InventoryRequestResponse>>(
    `${INV}/inbound-requests/${id}/putaway`,
    payload
  );
  return data.data;
};

/* ── Rack layout & inventory tree ────────────────────────────────────── */

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

/* ── Staff stock operations (7G) ─────────────────────────────────────── */

/** POST /customer-inventories/move (reason ≥ 5 chars; null tier = holding area) */
export const stockMove = async (payload: StockMoveRequest): Promise<CustomerInventoryResponse> => {
  const { data } = await api.post<Envelope<CustomerInventoryResponse>>(`${INV}/move`, payload);
  return data.data;
};

/** POST /customer-inventories/adjust — staff/FM stock count of their facility (reason ≥ 5 chars). */
export const stockAdjust = async (
  payload: StockAdjustRequest
): Promise<CustomerInventoryResponse> => {
  const { data } = await api.post<Envelope<CustomerInventoryResponse>>(`${INV}/adjust`, payload);
  return data.data;
};

/** PATCH /customer-inventories/{id}/status */
export const updateInventoryStatus = async (
  inventoryId: string,
  payload: UpdateInventoryStatusRequest
): Promise<CustomerInventoryResponse> => {
  const { data } = await api.patch<Envelope<CustomerInventoryResponse>>(
    `${INV}/${inventoryId}/status`,
    payload
  );
  return data.data;
};

/** POST /customer-inventories/racks/batch-migrate */
export const batchMigrateRack = async (
  payload: BatchMigrateRackRequest
): Promise<BatchMigrateRackResponse> => {
  const { data } = await api.post<Envelope<BatchMigrateRackResponse>>(
    `${INV}/racks/batch-migrate`,
    payload
  );
  return data.data;
};

/** POST /customer-inventories/racks/evacuate-to-holding */
export const evacuateRackToHolding = async (
  payload: EvacuateRackToHoldingRequest
): Promise<EvacuateRackToHoldingResponse> => {
  const { data } = await api.post<Envelope<EvacuateRackToHoldingResponse>>(
    `${INV}/racks/evacuate-to-holding`,
    payload
  );
  return data.data;
};

/* ── Customer SKUs (staff create on behalf of a customer) ────────────── */

/** GET /customer-skus?customerId= — staff need an active contract with that customer. */
export const fetchCustomerSkus = async (
  customerId: string,
  search?: string
): Promise<PaginatedData<CustomerSkuResponse>> => {
  const { data } = await api.get<Envelope<PaginatedData<CustomerSkuResponse>>>("/customer-skus", {
    params: cleanQueryParams({ customerId, search, status: "active", limit: 100 }),
  });
  return data.data;
};

/** POST /customer-skus (customerId required for staff) */
export const createCustomerSku = async (
  payload: CreateCustomerSkuRequest
): Promise<CustomerSkuResponse> => {
  const { data } = await api.post<Envelope<CustomerSkuResponse>>("/customer-skus", payload);
  return data.data;
};
