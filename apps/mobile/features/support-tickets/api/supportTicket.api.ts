import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse,
  type CreateSupportTicketRequest,
  type PaginatedData,
  type SupportTicketQuery,
  type SupportTicketResponse,
} from "@self-storage-system-fe/shared";

/** GET /support-tickets — BE scopes the list to the calling customer. */
export async function getSupportTicketsApi(
  query: Partial<SupportTicketQuery>
): Promise<PaginatedData<SupportTicketResponse>> {
  const response = await api.get<ApiResponse<PaginatedData<SupportTicketResponse>>>(
    "/support-tickets",
    { params: cleanQueryParams(query) }
  );
  return response.data.data;
}

/** GET /support-tickets/{id} */
export async function getSupportTicketApi(id: string): Promise<SupportTicketResponse> {
  const response = await api.get<ApiResponse<SupportTicketResponse>>(`/support-tickets/${id}`);
  return response.data.data;
}

/** POST /support-tickets — always send `contractId` so BE can infer the facility (gap G14). */
export async function createSupportTicketApi(
  payload: CreateSupportTicketRequest
): Promise<SupportTicketResponse> {
  const response = await api.post<ApiResponse<SupportTicketResponse>>("/support-tickets", payload);
  return response.data.data;
}

/** POST /support-tickets/{id}/cancel — only while `pending` (else 722). */
export async function cancelSupportTicketApi(
  id: string,
  cancellationReason?: string
): Promise<SupportTicketResponse> {
  const response = await api.post<ApiResponse<SupportTicketResponse>>(
    `/support-tickets/${id}/cancel`,
    { cancellationReason }
  );
  return response.data.data;
}
