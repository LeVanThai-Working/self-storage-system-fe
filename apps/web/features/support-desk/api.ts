import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse as Envelope,
  type CompleteSupportTicketRequest,
  type PaginatedData,
  type ProcessSupportTicketRequest,
  type SupportTicketQuery,
  type SupportTicketResponse,
} from "@self-storage-system-fe/shared";

/** GET /support-tickets — BE scopes staff/FM to their facility. */
export const fetchSupportTickets = async (
  query: Partial<SupportTicketQuery>
): Promise<PaginatedData<SupportTicketResponse>> => {
  const { data } = await api.get<Envelope<PaginatedData<SupportTicketResponse>>>(
    "/support-tickets",
    { params: cleanQueryParams(query) }
  );
  return data.data;
};

/** GET /support-tickets/{id} */
export const fetchSupportTicket = async (id: string): Promise<SupportTicketResponse> => {
  const { data } = await api.get<Envelope<SupportTicketResponse>>(`/support-tickets/${id}`);
  return data.data;
};

/** POST /support-tickets/{id}/process — staff self-assign when `assignedStaffId` is omitted. */
export const processSupportTicket = async (
  id: string,
  payload: ProcessSupportTicketRequest
): Promise<SupportTicketResponse> => {
  const { data } = await api.post<Envelope<SupportTicketResponse>>(
    `/support-tickets/${id}/process`,
    payload
  );
  return data.data;
};

/** POST /support-tickets/{id}/complete — one official response (+ up to 5 attachments). */
export const completeSupportTicket = async (
  id: string,
  payload: CompleteSupportTicketRequest
): Promise<SupportTicketResponse> => {
  const { data } = await api.post<Envelope<SupportTicketResponse>>(
    `/support-tickets/${id}/complete`,
    payload
  );
  return data.data;
};
