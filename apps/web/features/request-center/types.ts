import {
  type FacilityAmenityOfferingResponse,
  type PaginationMeta,
} from "@self-storage-system-fe/shared";

export type { FacilityAmenityOfferingResponse };

/** Loại đối tượng mà đề xuất muốn tạo mới / chỉnh sửa. Khớp BE: common/enums/approvalRequest.enum.ts */
export enum ApprovalRequestTargetTypeEnum {
  UNIT_TYPE = "unit_type",
  FACILITY_UNIT_TYPE_OFFERING = "facility_unit_type_offering",
  AMENITY = "amenity",
  FACILITY_AMENITY_OFFERING = "facility_amenity_offering",
}

export enum ApprovalRequestActionEnum {
  CREATE = "create",
  UPDATE = "update",
}

export enum ApprovalRequestStatusEnum {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

interface SummaryRef {
  id: string;
  name: string;
}

export interface ApprovalRequestResponse {
  id: string;
  requesterId: string;
  requester?: SummaryRef;
  facilityId: string;
  facility?: SummaryRef;
  targetType: ApprovalRequestTargetTypeEnum;
  action: ApprovalRequestActionEnum;
  targetId?: string | null;
  payload: Record<string, unknown>;
  reason: string;
  status: ApprovalRequestStatusEnum;
  approverId?: string | null;
  approver?: SummaryRef | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  reviewNotes?: string | null;
  targetCurrentData?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateApprovalRequest {
  facilityId?: string;
  targetType: ApprovalRequestTargetTypeEnum;
  action: ApprovalRequestActionEnum;
  targetId?: string;
  payload: Record<string, unknown>;
  reason: string;
}

export interface ApprovalRequestQueryParams {
  page?: number;
  limit?: number;
  status?: ApprovalRequestStatusEnum;
  sortBy?: "createdAt" | "status" | "targetType";
  sortOrder?: "asc" | "desc";
}

export interface ApprovalRequestListResponse {
  items: ApprovalRequestResponse[];
  pagination: PaginationMeta;
}
