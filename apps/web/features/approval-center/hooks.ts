import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApprovalRequests, getApprovalRequestById, reviewApprovalRequest } from "./api";
import type { ApprovalCenterQueryParams, ReviewApprovalRequestPayload } from "./types";
import { ApprovalRequestStatusEnum } from "./types";

export const approvalCenterKeys = {
  all: ["approval-requests"] as const,
  list: (filters: ApprovalCenterQueryParams) =>
    [...approvalCenterKeys.all, "ops-list", { filters }] as const,
  detail: (id: string) => [...approvalCenterKeys.all, "detail", id] as const,
};

/** Hook lấy danh sách đề xuất phê duyệt có lọc & phân trang */
export const useApprovalRequests = (params?: ApprovalCenterQueryParams) =>
  useQuery({
    queryKey: approvalCenterKeys.list(params || {}),
    queryFn: () => getApprovalRequests(params),
  });

/** Hook lấy thống kê KPI toàn diện (không bị reset về 0 khi chuyển tab) */
export const useApprovalStats = (facilityId?: string) => {
  const effectiveFacilityId = facilityId && facilityId !== "ALL" ? facilityId : undefined;

  const { data: pendingData } = useApprovalRequests({
    limit: 1,
    page: 1,
    status: ApprovalRequestStatusEnum.PENDING,
    facilityId: effectiveFacilityId,
  });

  const { data: approvedData } = useApprovalRequests({
    limit: 1,
    page: 1,
    status: ApprovalRequestStatusEnum.APPROVED,
    facilityId: effectiveFacilityId,
  });

  const { data: rejectedData } = useApprovalRequests({
    limit: 1,
    page: 1,
    status: ApprovalRequestStatusEnum.REJECTED,
    facilityId: effectiveFacilityId,
  });

  const pending = pendingData?.pagination.totalItems ?? 0;
  const approved = approvedData?.pagination.totalItems ?? 0;
  const rejected = rejectedData?.pagination.totalItems ?? 0;
  const total = pending + approved + rejected;

  return {
    pending,
    approved,
    rejected,
    total,
  };
};

/** Hook lấy chi tiết đề xuất kèm Diff View dữ liệu cũ vs dữ liệu mới */
export const useApprovalRequestDetail = (id: string | null) =>
  useQuery({
    queryKey: approvalCenterKeys.detail(id ?? ""),
    queryFn: () => getApprovalRequestById(id!),
    enabled: Boolean(id),
  });

/** Danh sách các query keys có thể bị ảnh hưởng khi một đề xuất được duyệt */
const AFFECTED_ROOT_KEYS = [
  ["unit-types"],
  ["amenities"],
  ["facility-unit-type-offerings"],
  ["facility-amenity-offerings"],
] as const;

/** Hook gửi quyết định Duyệt hoặc Từ chối đề xuất */
export const useReviewApprovalRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewApprovalRequestPayload }) =>
      reviewApprovalRequest(id, payload),
    onSuccess: (_data, variables) => {
      // Invalidate danh sách và chi tiết đề xuất
      queryClient.invalidateQueries({ queryKey: approvalCenterKeys.all });
      queryClient.invalidateQueries({ queryKey: approvalCenterKeys.detail(variables.id) });

      // Invalidate các catalog liên quan để UI cập nhật ngay bảng giá / tiện ích mới
      AFFECTED_ROOT_KEYS.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
};
