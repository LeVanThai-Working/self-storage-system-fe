import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse,
  type CancelInboundRequest,
  type CancelOutboundRequest,
  type CreateOutboundRequest,
  type CreatePreAdvisedInboundRequest,
  type DisputeInboundRequest,
  type InventoryRequestQuery,
  type InventoryRequestResponse,
  type PaginatedData,
  type RegenerateOtpResponse,
} from "@self-storage-system-fe/shared";

const BASE = "/customer-inventories";

/** GET /customer-inventories/requests — the customer's inbound and outbound requests. */
export async function getInventoryRequestsApi(
  query: Partial<InventoryRequestQuery>
): Promise<PaginatedData<InventoryRequestResponse>> {
  const response = await api.get<ApiResponse<PaginatedData<InventoryRequestResponse>>>(
    `${BASE}/requests`,
    { params: cleanQueryParams(query) }
  );
  return response.data.data;
}

/** GET /customer-inventories/requests/{id} */
export async function getInventoryRequestApi(id: string): Promise<InventoryRequestResponse> {
  const response = await api.get<ApiResponse<InventoryRequestResponse>>(`${BASE}/requests/${id}`);
  return response.data.data;
}

/**
 * POST /customer-inventories/outbound-requests
 * The response is the only place `rawOtpCode` is returned.
 */
export async function createOutboundRequestApi(
  payload: CreateOutboundRequest
): Promise<InventoryRequestResponse> {
  const response = await api.post<ApiResponse<InventoryRequestResponse>>(
    `${BASE}/outbound-requests`,
    payload
  );
  return response.data.data;
}

/** POST /customer-inventories/outbound-requests/{id}/cancel — only while `pending` (else 634). */
export async function cancelOutboundRequestApi(
  id: string,
  payload: CancelOutboundRequest = {}
): Promise<InventoryRequestResponse> {
  const response = await api.post<ApiResponse<InventoryRequestResponse>>(
    `${BASE}/outbound-requests/${id}/cancel`,
    payload
  );
  return response.data.data;
}

/** POST /customer-inventories/inbound-requests/{id}/confirm */
export async function confirmInboundRequestApi(id: string): Promise<InventoryRequestResponse> {
  const response = await api.post<ApiResponse<InventoryRequestResponse>>(
    `${BASE}/inbound-requests/${id}/confirm`
  );
  return response.data.data;
}

/** POST /customer-inventories/inbound-requests/{id}/dispute */
export async function disputeInboundRequestApi(
  id: string,
  payload: DisputeInboundRequest
): Promise<InventoryRequestResponse> {
  const response = await api.post<ApiResponse<InventoryRequestResponse>>(
    `${BASE}/inbound-requests/${id}/dispute`,
    payload
  );
  return response.data.data;
}

/**
 * POST /customer-inventories/inbound-requests/pre-advised — the customer announces a delivery.
 * Like outbound, the response is the only place `rawOtpCode` is returned.
 */
export async function createPreAdvisedInboundApi(
  payload: CreatePreAdvisedInboundRequest
): Promise<InventoryRequestResponse> {
  const response = await api.post<ApiResponse<InventoryRequestResponse>>(
    `${BASE}/inbound-requests/pre-advised`,
    payload
  );
  return response.data.data;
}

/** POST /customer-inventories/inbound-requests/{id}/cancel — pre-advised, only while `pending`. */
export async function cancelInboundRequestApi(
  id: string,
  payload: CancelInboundRequest = {}
): Promise<InventoryRequestResponse> {
  const response = await api.post<ApiResponse<InventoryRequestResponse>>(
    `${BASE}/inbound-requests/${id}/cancel`,
    payload
  );
  return response.data.data;
}

/** POST /customer-inventories/requests/{id}/regenerate-otp — new OTP for a `pending` request. */
export async function regenerateOtpApi(id: string): Promise<RegenerateOtpResponse> {
  const response = await api.post<ApiResponse<RegenerateOtpResponse>>(
    `${BASE}/requests/${id}/regenerate-otp`
  );
  return response.data.data;
}
