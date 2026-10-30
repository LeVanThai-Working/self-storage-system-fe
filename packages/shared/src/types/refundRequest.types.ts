import type { PaginatedData } from "./common.types";
import type { RefundRequestReasonEnum, RefundRequestStatusEnum } from "../enums/refundRequest.enum";

export interface EntitySummary {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface RefundRequestResponse {
  id: string;
  refundCode: string;
  reservationId: string | null;
  contractId: string | null;
  paymentId: string | null;
  facility: EntitySummary | string;
  customer: EntitySummary | string;
  amount: number;
  reason: RefundRequestReasonEnum;
  status: RefundRequestStatusEnum;

  // Dữ liệu ngân hàng bảo mật (Luôn được che mặt nạ khi trả về)
  refundBankName: string | null;
  refundAccountNumberMasked: string | null;
  refundAccountHolder: string | null;

  // Đối soát & chứng từ
  referenceCode: string | null;
  proofImageUrl: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  note: string | null;

  // Người thực hiện & Dấu thời gian
  requestedBy: EntitySummary | string;
  requestedAt: string;
  approvedBy: (EntitySummary | string) | null;
  approvedAt: string | null;
  rejectedBy: (EntitySummary | string) | null;
  rejectedAt: string | null;
  paidBy: (EntitySummary | string) | null;
  paidAt: string | null;
  cancelledBy: (EntitySummary | string) | null;
  cancelledAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export type RefundRequestPaginatedData = PaginatedData<RefundRequestResponse>;
