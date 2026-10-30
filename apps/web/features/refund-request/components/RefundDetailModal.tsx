"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  ShieldAlert,
  User,
  XCircle,
  Ban,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { RefundStatusBadge } from "./RefundStatusBadge";
import { RefundReasonBadge } from "./RefundReasonBadge";
import {
  ApproveRefundModal,
  CancelRefundModal,
  ConfirmPaidRefundModal,
  RejectRefundModal,
} from "./RefundActionModals";
import {
  OPS_APPROVAL_THRESHOLD,
  RefundRequestStatusEnum,
  type EntitySummary,
  type RefundRequestResponse,
} from "../types";

interface RefundDetailModalProps {
  refund: RefundRequestResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const formatVND = (num: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);

const formatDate = (isoString?: string | null) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
};

const getEntityName = (entity: EntitySummary | string | null | undefined): string => {
  if (!entity) return "—";
  if (typeof entity === "string") return entity;
  return entity.name || entity.email || entity.id;
};

const getEntityRole = (entity: EntitySummary | string | null | undefined): string | null => {
  if (!entity || typeof entity === "string") return null;
  return entity.role || null;
};

export const RefundDetailModal: React.FC<RefundDetailModalProps> = ({
  refund,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [activeActionModal, setActiveActionModal] = useState<
    "approve" | "reject" | "confirm-paid" | "cancel" | null
  >(null);

  if (!refund) return null;

  // Maker-Checker calculation
  const requesterId =
    typeof refund.requestedBy === "object" ? refund.requestedBy?.id : refund.requestedBy;
  const isRequester = Boolean(currentUser?.id && requesterId === currentUser.id);

  // OPS Threshold calculation (10M VND)
  const isOverThreshold = refund.amount > OPS_APPROVAL_THRESHOLD;

  // Role permissions
  const role = currentUser?.role;
  const isFacilityStaff = role === "facility_staff";
  const isFacilityManager = role === "facility_manager";
  const isOpsManager = role === "business_ops_manager";
  const isAdmin = role === "system_admin";

  const isPendingApproval = refund.status === RefundRequestStatusEnum.PENDING_APPROVAL;
  const isApproved = refund.status === RefundRequestStatusEnum.APPROVED;
  const isPaid = refund.status === RefundRequestStatusEnum.PAID;

  // Can approve?
  // Facility Manager can only approve if amount <= 10M and not requester.
  // Ops Manager and Admin can approve if not requester.
  const canApprove =
    isPendingApproval &&
    !isRequester &&
    (isAdmin || isOpsManager || (isFacilityManager && !isOverThreshold));

  // Can reject?
  const canReject = isPendingApproval && (isAdmin || isOpsManager || isFacilityManager);

  // Can confirm paid?
  const canConfirmPaid =
    isApproved && (isAdmin || isOpsManager || isFacilityManager || isFacilityStaff);

  // Can cancel?
  const canCancel = isPendingApproval && (isRequester || isAdmin || isFacilityManager);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Chi tiết yêu cầu hoàn tiền
                </span>
                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  <span>{refund.refundCode}</span>
                  <RefundStatusBadge status={refund.status} />
                </DialogTitle>
              </div>
              <RefundReasonBadge reason={refund.reason} />
            </div>
          </DialogHeader>

          {/* Amount Display & Alerts */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 my-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 font-medium">Số tiền hoàn (VND)</p>
              <p className="text-2xl font-extrabold text-emerald-600">{formatVND(refund.amount)}</p>
            </div>

            {isOverThreshold && (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 py-1 px-3 text-xs flex items-center gap-1.5 self-start md:self-center"
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Cần Quản lý vận hành (Ops) phê duyệt (&gt; 10M VND)</span>
              </Badge>
            )}
          </div>

          {/* Maker-Checker Alert */}
          {isRequester && isPendingApproval && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Cảnh báo Maker-Checker:</strong> Bạn là người tạo yêu cầu hoàn tiền này (
                <span className="font-mono">{getEntityName(refund.requestedBy)}</span>). Theo quy
                định kiểm soát rủi ro tài chính, người tạo không được tự phê duyệt yêu cầu của mình.
              </div>
            </div>
          )}

          {/* Body Sections */}
          <div className="space-y-4 text-sm text-slate-700">
            {/* 1. Customer & Facility & References */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 border border-slate-100 rounded-lg bg-white shadow-xs space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Khách hàng
                </p>
                <div>
                  <p className="font-semibold text-slate-900">{getEntityName(refund.customer)}</p>
                  {typeof refund.customer === "object" && refund.customer?.email && (
                    <p className="text-xs text-slate-500">{refund.customer.email}</p>
                  )}
                </div>
              </div>

              <div className="p-3.5 border border-slate-100 rounded-lg bg-white shadow-xs space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Cơ sở lưu kho
                </p>
                <div>
                  <p className="font-semibold text-slate-900">{getEntityName(refund.facility)}</p>
                </div>
              </div>
            </div>

            {/* Linked reservation or contract */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-wrap gap-4 text-xs">
              {refund.reservationId && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Đơn đặt chỗ liên kết:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {refund.reservationId}
                  </span>
                </div>
              )}
              {refund.contractId && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Hợp đồng liên kết:</span>
                  <span className="font-mono font-medium text-slate-800">{refund.contractId}</span>
                </div>
              )}
              {refund.paymentId && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Giao dịch gốc:</span>
                  <span className="font-mono font-medium text-slate-800">{refund.paymentId}</span>
                </div>
              )}
            </div>

            {/* 2. Bank Information (Secured & Masked) */}
            <div className="p-3.5 border border-slate-200 rounded-lg bg-white space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" /> Thông tin tài khoản thụ hưởng
                (Nghị định 13/2023/NĐ-CP)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-slate-400 block">Ngân hàng:</span>
                  <span className="font-semibold text-slate-800">
                    {refund.refundBankName || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số tài khoản:</span>
                  <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                    {refund.refundAccountNumberMasked || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Chủ tài khoản:</span>
                  <span className="font-semibold text-slate-800 uppercase">
                    {refund.refundAccountHolder || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Rejection / Cancellation / Payment Proof Details */}
            {refund.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-rose-800 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Lý do từ chối:
                </p>
                <p className="text-rose-700">{refund.rejectionReason}</p>
                <p className="text-slate-400 pt-1">
                  Từ chối bởi {getEntityName(refund.rejectedBy)} lúc {formatDate(refund.rejectedAt)}
                </p>
              </div>
            )}

            {refund.cancellationReason && (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5 text-slate-600" /> Lý do hủy đơn:
                </p>
                <p className="text-slate-700">{refund.cancellationReason}</p>
                <p className="text-slate-400 pt-1">
                  Hủy bởi {getEntityName(refund.cancelledBy)} lúc {formatDate(refund.cancelledAt)}
                </p>
              </div>
            )}

            {isPaid && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã hoàn tất chi trả:
                  </p>
                  <span className="text-slate-500">
                    Người chi: {getEntityName(refund.paidBy)} lúc {formatDate(refund.paidAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div>
                    <span className="text-slate-500">Mã giao dịch ngân hàng: </span>
                    <span className="font-mono font-bold text-slate-900">
                      {refund.referenceCode || "—"}
                    </span>
                  </div>
                  {refund.proofImageUrl && (
                    <a
                      href={refund.proofImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-medium underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Xem ảnh chứng từ
                    </a>
                  )}
                </div>
              </div>
            )}

            {refund.note && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <strong className="text-slate-700">Ghi chú:</strong> {refund.note}
              </div>
            )}

            <Separator />

            {/* Workflow Timeline */}
            <div className="space-y-1.5 text-xs text-slate-500">
              <p className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                Lịch sử quy trình
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Khởi tạo bởi: <strong>{getEntityName(refund.requestedBy)}</strong>
                    {getEntityRole(refund.requestedBy) && ` (${getEntityRole(refund.requestedBy)})`}
                  </span>
                </div>
                <div>Ngày yêu cầu: {formatDate(refund.requestedAt || refund.createdAt)}</div>

                {refund.approvedAt && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        Duyệt bởi: <strong>{getEntityName(refund.approvedBy)}</strong>
                      </span>
                    </div>
                    <div>Ngày duyệt: {formatDate(refund.approvedAt)}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>

            {canCancel && (
              <Button
                variant="outline"
                className="text-slate-700 hover:text-slate-900"
                onClick={() => setActiveActionModal("cancel")}
              >
                Hủy yêu cầu
              </Button>
            )}

            {canReject && (
              <Button variant="destructive" onClick={() => setActiveActionModal("reject")}>
                Từ chối
              </Button>
            )}

            {/* Approve Button */}
            {isPendingApproval && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setActiveActionModal("approve")}
                disabled={!canApprove}
                title={
                  isRequester
                    ? "Bạn là người tạo yêu cầu này (Vi phạm Maker-Checker)"
                    : isFacilityManager && isOverThreshold
                      ? "Quản lý cơ sở chỉ được duyệt khoản <= 10.000.000 VND"
                      : undefined
                }
              >
                Phê duyệt
              </Button>
            )}

            {/* Confirm Paid Button */}
            {canConfirmPaid && (
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => setActiveActionModal("confirm-paid")}
              >
                Xác nhận đã chuyển tiền
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Submodals */}
      <ApproveRefundModal
        refund={refund}
        isOpen={activeActionModal === "approve"}
        onClose={() => setActiveActionModal(null)}
        onSuccess={() => {
          setActiveActionModal(null);
          onRefresh?.();
          onClose();
        }}
      />

      <RejectRefundModal
        refund={refund}
        isOpen={activeActionModal === "reject"}
        onClose={() => setActiveActionModal(null)}
        onSuccess={() => {
          setActiveActionModal(null);
          onRefresh?.();
          onClose();
        }}
      />

      <ConfirmPaidRefundModal
        refund={refund}
        isOpen={activeActionModal === "confirm-paid"}
        onClose={() => setActiveActionModal(null)}
        onSuccess={() => {
          setActiveActionModal(null);
          onRefresh?.();
          onClose();
        }}
      />

      <CancelRefundModal
        refund={refund}
        isOpen={activeActionModal === "cancel"}
        onClose={() => setActiveActionModal(null)}
        onSuccess={() => {
          setActiveActionModal(null);
          onRefresh?.();
          onClose();
        }}
      />
    </>
  );
};
