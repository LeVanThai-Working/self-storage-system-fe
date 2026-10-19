import api from "@/lib/api/axios";
import type { ApiResponse as Envelope } from "@self-storage-system-fe/shared";
import type {
  ApprovalCenterListResponse,
  ApprovalCenterQueryParams,
  ApprovalRequestDetail,
  ReviewApprovalRequestPayload,
} from "./types";

/**
 * 1. Bảng tiếp nhận đề xuất: Lấy danh sách các đề xuất gửi từ các chi nhánh (Ops Manager & Admin).
 * Endpoint: GET /approval-requests
 */
export const getApprovalRequests = async (
  params?: ApprovalCenterQueryParams
): Promise<ApprovalCenterListResponse> => {
  const queryParams: Record<string, unknown> = {
    page: params?.page || 1,
    limit: params?.limit || 10,
    sortBy: params?.sortBy || "createdAt",
    sortOrder: params?.sortOrder || "desc",
  };

  if (params?.status && (params.status as string) !== "ALL") {
    queryParams.status = params.status;
  }
  if (params?.targetType && (params.targetType as string) !== "ALL") {
    queryParams.targetType = params.targetType;
  }
  if (params?.facilityId && (params.facilityId as string) !== "ALL") {
    queryParams.facilityId = params.facilityId;
  }
  if (params?.search?.trim()) {
    queryParams.search = params.search.trim();
  }

  const { data } = await api.get<Envelope<ApprovalCenterListResponse>>("/approval-requests", {
    params: queryParams,
  });

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

/**
 * 2. Modal xem chi tiết thay đổi / Diff view: Lấy toàn bộ payload chi tiết của đề xuất,
 * bao gồm dữ liệu cũ và dữ liệu mới đề xuất (giá cũ vs giá mới, thông tin tiện ích xin mở thêm...).
 * Endpoint: GET /approval-requests/{id}
 */
export const getApprovalRequestById = async (id: string): Promise<ApprovalRequestDetail> => {
  const { data } = await api.get<Envelope<ApprovalRequestDetail>>(`/approval-requests/${id}`);
  return data.data;
};

/**
 * 3. Nút Duyệt / Từ chối: Gửi quyết định phê duyệt hoặc từ chối đề xuất.
 * BE sẽ tự động cập nhật cơ sở dữ liệu nếu được duyệt.
 * Endpoint: PATCH /approval-requests/{id}/review
 * - Duyệt:   { action: "approve", notes?: "..." }
 * - Từ chối: { action: "reject", rejectionReason: "...", notes?: "..." }
 */
export const reviewApprovalRequest = async (
  id: string,
  payload: ReviewApprovalRequestPayload
): Promise<ApprovalRequestDetail> => {
  const body: Record<string, unknown> = {
    action: payload.action,
  };

  if (payload.action === "approve") {
    if (payload.notes?.trim()) {
      body.notes = payload.notes.trim();
    }
  } else {
    // Với reject, gửi cả rejectionReason và notes để đảm bảo tương thích 100% Swagger schema & backend
    const reason = payload.rejectionReason?.trim() || payload.notes?.trim() || "";
    body.rejectionReason = reason;
    body.notes = reason;
  }

  const { data } = await api.patch<Envelope<ApprovalRequestDetail>>(
    `/approval-requests/${id}/review`,
    body
  );
  return data.data;
};
