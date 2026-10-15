import {
  ApprovalRequestActionEnum,
  ApprovalRequestStatusEnum,
  ApprovalRequestTargetTypeEnum,
} from "../enums/approvalRequest.enum";
import { PaginationQuery } from "./common.types";

export interface ApprovalRequestUserSummary {
  id: string;
  name: string;
  email: string;
  role?: string;
  phoneNumber?: string;
}

export interface ApprovalRequestFacilitySummary {
  id: string;
  name: string;
  city: string;
  address: string;
  status: string;
}

export interface ApprovalRequestResponse {
  id: string;
  requesterId: string;
  requester?: ApprovalRequestUserSummary;
  facilityId: string;
  facility?: ApprovalRequestFacilitySummary;
  targetType: ApprovalRequestTargetTypeEnum;
  action: ApprovalRequestActionEnum;
  targetId?: string | null;
  payload: Record<string, unknown>;
  reason: string;
  status: ApprovalRequestStatusEnum;
  approverId?: string | null;
  approver?: ApprovalRequestUserSummary | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  reviewNotes?: string | null;
  targetCurrentData?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ApprovalRequestListResponse = ApprovalRequestResponse[];

export interface CreateApprovalRequest {
  facilityId?: string;
  targetType: ApprovalRequestTargetTypeEnum;
  action: ApprovalRequestActionEnum;
  targetId?: string;
  payload: Record<string, unknown>;
  reason: string;
}

export type ReviewApprovalRequest =
  | {
      action: "approve";
      notes?: string;
    }
  | {
      action: "reject";
      rejectionReason: string;
    };

export interface ApprovalRequestQuery extends PaginationQuery {
  facilityId?: string;
  targetType?: ApprovalRequestTargetTypeEnum;
  status?: ApprovalRequestStatusEnum;
  sortBy?: "createdAt" | "status" | "targetType";
}
