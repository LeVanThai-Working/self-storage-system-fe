import api from "@/lib/api/axios";
import type { ApiResponse as Envelope, PaginatedData } from "@self-storage-system-fe/shared";
import type {
  ApprovalRequestListResponse,
  ApprovalRequestQueryParams,
  ApprovalRequestResponse,
  CreateApprovalRequest,
  FacilityAmenityOfferingResponse,
} from "./types";

/**
 * Các đề xuất đã gửi bởi manager hiện tại.
 * Endpoint: GET /approval-requests/my-requests
 */
export const fetchMyRequests = async (
  params?: ApprovalRequestQueryParams
): Promise<ApprovalRequestListResponse> => {
  const queryParams: Record<string, unknown> = {
    page: params?.page || 1,
    limit: params?.limit || 10,
    sortBy: params?.sortBy || "createdAt",
    sortOrder: params?.sortOrder || "desc",
  };
  if (params?.status) queryParams.status = params.status;

  const { data } = await api.get<Envelope<ApprovalRequestListResponse>>(
    "/approval-requests/my-requests",
    { params: queryParams }
  );
  return {
    items: data.data?.items || [],
    pagination: data.data?.pagination || {
      page: Number(queryParams.page),
      limit: Number(queryParams.limit),
      totalItems: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};

/** Endpoint: POST /approval-requests */
export const createApprovalRequest = async (
  payload: CreateApprovalRequest
): Promise<ApprovalRequestResponse> => {
  const { data } = await api.post<Envelope<ApprovalRequestResponse>>("/approval-requests", payload);
  return data.data;
};

/** Endpoint: PATCH /approval-requests/:id/cancel */
export const cancelApprovalRequest = async (id: string): Promise<ApprovalRequestResponse> => {
  const { data } = await api.patch<Envelope<ApprovalRequestResponse>>(
    `/approval-requests/${id}/cancel`
  );
  return data.data;
};

/**
 * Tiện ích đang được mở bán (offering ACTIVE) tại cơ sở - cho màn hình tra cứu danh mục.
 * Endpoint: GET /facility-amenity-offerings
 */
export const fetchFacilityAmenityOfferings = async (
  facilityId: string
): Promise<FacilityAmenityOfferingResponse[]> => {
  const { data } = await api.get<Envelope<PaginatedData<FacilityAmenityOfferingResponse>>>(
    "/facility-amenity-offerings",
    { params: { facilityId, status: "active", page: 1, limit: 100 } }
  );
  return data.data?.items ?? [];
};
