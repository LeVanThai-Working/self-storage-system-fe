import type { PaginationMeta } from "@self-storage-system-fe/shared";
import {
  ApprovalRequestActionEnum,
  ApprovalRequestStatusEnum,
  ApprovalRequestTargetTypeEnum,
} from "@/features/request-center/types";

export { ApprovalRequestActionEnum, ApprovalRequestStatusEnum, ApprovalRequestTargetTypeEnum };

/** Quyết định duyệt — khớp BE ApprovalReviewDecisionEnum */
export enum ApprovalReviewDecisionEnum {
  APPROVE = "approve",
  REJECT = "reject",
}

export interface UserSummaryRef {
  id: string;
  name: string;
  email?: string;
  role?: string;
  phoneNumber?: string;
}

export interface FacilitySummaryRef {
  id: string;
  name: string;
  city?: string;
  address?: string;
  status?: string;
}

/**
 * Model chi tiết đề xuất phê duyệt dùng cho Ops Manager & Admin.
 * GET /approval-requests và GET /approval-requests/{id}
 */
export interface ApprovalRequestDetail {
  id: string;
  requesterId: string;
  requester?: UserSummaryRef;
  facilityId: string;
  facility?: FacilitySummaryRef;
  targetType: ApprovalRequestTargetTypeEnum;
  action: ApprovalRequestActionEnum;
  targetId?: string | null;
  /** Dữ liệu MỚI được đề xuất */
  payload: Record<string, unknown>;
  reason: string;
  status: ApprovalRequestStatusEnum;
  approverId?: string | null;
  approver?: UserSummaryRef | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  reviewNotes?: string | null;
  /** Dữ liệu CŨ hiện tại của đối tượng (dành cho Diff View khi action = update) */
  targetCurrentData?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalCenterQueryParams {
  page?: number;
  limit?: number;
  status?: ApprovalRequestStatusEnum;
  targetType?: ApprovalRequestTargetTypeEnum;
  facilityId?: string;
  search?: string;
  sortBy?: "createdAt" | "status" | "targetType";
  sortOrder?: "asc" | "desc";
}

export interface ApprovalCenterListResponse {
  items: ApprovalRequestDetail[];
  pagination: PaginationMeta;
}

/**
 * Payload gửi lên PATCH /approval-requests/{id}/review:
 * - Khi duyệt: { action: "approve", notes?: string }
 * - Khi từ chối: { action: "reject", rejectionReason: string, notes?: string }
 */
export interface ReviewApprovalRequestPayload {
  action: ApprovalReviewDecisionEnum;
  notes?: string;
  rejectionReason?: string;
}
