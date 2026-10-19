/**
 * Service file for Approval Requests (FE-13)
 * Re-exports core API functions for Operations Manager approval center.
 */
export {
  getApprovalRequests,
  getApprovalRequestById,
  reviewApprovalRequest,
} from "@/features/approval-center/api";

export * from "@/features/approval-center/types";
