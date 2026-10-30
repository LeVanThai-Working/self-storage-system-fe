"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, DollarSign, AlertCircle, Ban } from "lucide-react";
import { toast } from "sonner";
import {
  useApproveRefundRequest,
  useRejectRefundRequest,
  useConfirmPaidRefund,
  useCancelRefundRequest,
} from "../hooks";
import type { RefundRequestResponse } from "../types";

// Format currency
const formatVND = (num: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);

// 1. APPROVE MODAL
interface ApproveModalProps {
  refund: RefundRequestResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApproveRefundModal: React.FC<ApproveModalProps> = ({
  refund,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [note, setNote] = useState("");
  const approveMutation = useApproveRefundRequest();

  if (!refund) return null;

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        id: refund.id,
        payload: { note: note.trim() || undefined },
      });
      toast.success(`Đã phê duyệt yêu cầu hoàn tiền ${refund.refundCode}`);
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Không thể phê duyệt yêu cầu hoàn tiền");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
            <DialogTitle>Phê duyệt yêu cầu hoàn tiền</DialogTitle>
          </div>
          <DialogDescription>
            Bạn đang phê duyệt lệnh hoàn tiền <strong>{refund.refundCode}</strong> với số tiền{" "}
            <span className="font-semibold text-emerald-600">{formatVND(refund.amount)}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Quy tắc Maker-Checker:
            </p>
            Chỉ người kiểm duyệt (Checker) khác với người tạo đơn mới có quyền phê duyệt. Sau khi
            duyệt, trạng thái chuyển sang ĐÃ DUYỆT (Chờ kế toán/thủ quỹ chi tiền).
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="approve-note">Ghi chú phê duyệt (Tùy chọn)</Label>
            <Input
              id="approve-note"
              placeholder="VD: Đã đối soát thông tin giao dịch hợp lệ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={approveMutation.isPending}>
            Hủy
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleApprove}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? "Đang phê duyệt..." : "Xác nhận duyệt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 2. REJECT MODAL
interface RejectModalProps {
  refund: RefundRequestResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RejectRefundModal: React.FC<RejectModalProps> = ({
  refund,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const rejectMutation = useRejectRefundRequest();

  if (!refund) return null;

  const handleReject = async () => {
    if (rejectionReason.trim().length < 3) {
      toast.error("Lý do từ chối phải có tối thiểu 3 ký tự");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: refund.id,
        payload: { rejectionReason: rejectionReason.trim() },
      });
      toast.success(`Đã từ chối yêu cầu hoàn tiền ${refund.refundCode}`);
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Không thể từ chối yêu cầu hoàn tiền");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <XCircle className="w-6 h-6" />
            <DialogTitle>Từ chối yêu cầu hoàn tiền</DialogTitle>
          </div>
          <DialogDescription>
            Từ chối lệnh hoàn tiền <strong>{refund.refundCode}</strong> ({formatVND(refund.amount)}
            ).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">
              Lý do từ chối <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="reject-reason"
              placeholder="VD: Thông tin tài khoản thụ hưởng không chính xác..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-slate-500">Tối thiểu 3 ký tự, tối đa 500 ký tự.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={rejectMutation.isPending}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejectMutation.isPending || rejectionReason.trim().length < 3}
          >
            {rejectMutation.isPending ? "Đang xử lý..." : "Từ chối yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 3. CONFIRM PAID MODAL
interface ConfirmPaidModalProps {
  refund: RefundRequestResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ConfirmPaidRefundModal: React.FC<ConfirmPaidModalProps> = ({
  refund,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [referenceCode, setReferenceCode] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [note, setNote] = useState("");
  const confirmPaidMutation = useConfirmPaidRefund();

  if (!refund) return null;

  const handleConfirmPaid = async () => {
    if (referenceCode.trim().length < 3) {
      toast.error("Mã giao dịch ngân hàng phải có tối thiểu 3 ký tự");
      return;
    }

    try {
      await confirmPaidMutation.mutateAsync({
        id: refund.id,
        payload: {
          referenceCode: referenceCode.trim(),
          proofImageUrl: proofImageUrl.trim() || undefined,
          note: note.trim() || undefined,
        },
      });
      toast.success(`Đã xác nhận chuyển tiền thành công cho yêu cầu ${refund.refundCode}`);
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Không thể xác nhận chi trả hoàn tiền");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600">
            <DollarSign className="w-6 h-6" />
            <DialogTitle>Xác nhận đã chuyển tiền hoàn (PAID)</DialogTitle>
          </div>
          <DialogDescription>
            Ghi nhận giao dịch chuyển tiền thành công cho yêu cầu{" "}
            <strong>{refund.refundCode}</strong> ({formatVND(refund.amount)}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
            <p>
              <strong>Ngân hàng thụ hưởng:</strong> {refund.refundBankName || "Chưa cung cấp"}
            </p>
            <p>
              <strong>Số tài khoản:</strong> {refund.refundAccountNumberMasked || "Chưa cung cấp"}
            </p>
            <p>
              <strong>Chủ tài khoản:</strong> {refund.refundAccountHolder || "Chưa cung cấp"}
            </p>
            <p className="text-rose-600 font-semibold pt-1">
              ⚠️ Lưu ý: Sau khi xác nhận PAID, trạng thái là bất biến không thể sửa đổi hoặc hoàn
              tác.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ref-code">
              Mã giao dịch / Mã tham chiếu ngân hàng <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="ref-code"
              placeholder="VD: FT26300998812, MB1234567..."
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proof-url">Link ảnh chụp biên lai giao dịch (URL)</Label>
            <Input
              id="proof-url"
              placeholder="https://..."
              value={proofImageUrl}
              onChange={(e) => setProofImageUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paid-note">Ghi chú đối soát</Label>
            <Input
              id="paid-note"
              placeholder="Ghi chú nội bộ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={confirmPaidMutation.isPending}>
            Hủy
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleConfirmPaid}
            disabled={confirmPaidMutation.isPending || referenceCode.trim().length < 3}
          >
            {confirmPaidMutation.isPending ? "Đang xác nhận..." : "Xác nhận đã chuyển tiền"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 4. CANCEL MODAL
interface CancelModalProps {
  refund: RefundRequestResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CancelRefundModal: React.FC<CancelModalProps> = ({
  refund,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const cancelMutation = useCancelRefundRequest();

  if (!refund) return null;

  const handleCancel = async () => {
    if (cancellationReason.trim().length < 3) {
      toast.error("Lý do hủy phải có tối thiểu 3 ký tự");
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: refund.id,
        payload: { cancellationReason: cancellationReason.trim() },
      });
      toast.success(`Đã hủy yêu cầu hoàn tiền ${refund.refundCode}`);
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Không thể hủy yêu cầu hoàn tiền");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-slate-700">
            <Ban className="w-6 h-6 text-slate-500" />
            <DialogTitle>Hủy yêu cầu hoàn tiền</DialogTitle>
          </div>
          <DialogDescription>
            Hủy lệnh hoàn tiền <strong>{refund.refundCode}</strong> ({formatVND(refund.amount)}).
            Thao tác này chỉ được thực hiện khi yêu cầu chưa được duyệt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">
              Lý do hủy <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="cancel-reason"
              placeholder="VD: Khách hàng đổi ý, tiếp tục sử dụng hợp đồng..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-slate-500">Tối thiểu 3 ký tự.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={cancelMutation.isPending}>
            Đóng
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending || cancellationReason.trim().length < 3}
          >
            {cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
