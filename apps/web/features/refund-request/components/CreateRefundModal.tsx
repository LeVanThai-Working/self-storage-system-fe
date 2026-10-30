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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import { useCreateRefundRequest } from "../hooks";
import { RefundRequestReasonEnum } from "../types";
import { getRefundReasonLabel } from "./RefundReasonBadge";

interface CreateRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFacilityId?: string;
  defaultCustomerId?: string;
  defaultReservationId?: string;
  defaultContractId?: string;
  defaultAmount?: number;
  onSuccess?: () => void;
}

export const CreateRefundModal: React.FC<CreateRefundModalProps> = ({
  isOpen,
  onClose,
  defaultFacilityId,
  defaultCustomerId,
  defaultReservationId,
  defaultContractId,
  defaultAmount,
  onSuccess,
}) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const userRecord = currentUser as unknown as Record<string, unknown> | null;
  const userFacilityId =
    defaultFacilityId ||
    (typeof userRecord?.facilityId === "string" && userRecord.facilityId) ||
    (typeof userRecord?.assignedFacilityId === "string" && userRecord.assignedFacilityId) ||
    ((userRecord?.facility as Record<string, unknown>)?.id as string | undefined) ||
    "";

  const [linkType, setLinkType] = useState<"reservation" | "contract">(
    defaultContractId ? "contract" : "reservation"
  );
  const [reservationId, setReservationId] = useState(defaultReservationId || "");
  const [contractId, setContractId] = useState(defaultContractId || "");
  const [facilityId, setFacilityId] = useState(userFacilityId);
  const [customerId, setCustomerId] = useState(defaultCustomerId || "");
  const [amount, setAmount] = useState<number | "">(defaultAmount || "");
  const [reason, setReason] = useState<RefundRequestReasonEnum>(
    RefundRequestReasonEnum.CUSTOMER_CANCEL
  );
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [refundAccountHolder, setRefundAccountHolder] = useState("");
  const [note, setNote] = useState("");

  const createMutation = useCreateRefundRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!facilityId.trim()) {
      toast.error("Vui lòng nhập hoặc chọn Cơ sở (Facility ID)");
      return;
    }
    if (!customerId.trim()) {
      toast.error("Vui lòng nhập Mã khách hàng (Customer ID)");
      return;
    }
    if (linkType === "reservation" && !reservationId.trim()) {
      toast.error("Vui lòng nhập Mã đơn đặt chỗ liên kết");
      return;
    }
    if (linkType === "contract" && !contractId.trim()) {
      toast.error("Vui lòng nhập Mã hợp đồng liên kết");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Số tiền hoàn phải là số nguyên dương lớn hơn 0");
      return;
    }

    try {
      await createMutation.mutateAsync({
        facilityId: facilityId.trim(),
        customerId: customerId.trim(),
        reservationId: linkType === "reservation" ? reservationId.trim() : undefined,
        contractId: linkType === "contract" ? contractId.trim() : undefined,
        amount: Math.round(Number(amount)),
        reason,
        refundBankName: refundBankName.trim() || undefined,
        refundAccountNumber: refundAccountNumber.trim() || undefined,
        refundAccountHolder: refundAccountHolder.trim() || undefined,
        note: note.trim() || undefined,
      });

      toast.success("Tạo yêu cầu hoàn tiền thành công (Trạng thái: Chờ duyệt)");
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Không thể tạo yêu cầu hoàn tiền");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600">
            <PlusCircle className="w-5 h-5" />
            <DialogTitle>Tạo yêu cầu hoàn tiền mới (Maker)</DialogTitle>
          </div>
          <DialogDescription>
            Khởi tạo yêu cầu hoàn tiền cho khách hàng. Yêu cầu sẽ được chuyển đến người kiểm duyệt
            (Checker).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Facility ID & Customer ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="facility-id">
                Mã cơ sở <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="facility-id"
                placeholder="24 ký tự hex"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-id">
                Mã khách hàng <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="customer-id"
                placeholder="24 ký tự hex"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Reference Type Toggle */}
          <div className="space-y-1.5">
            <Label>
              Liên kết với <span className="text-rose-500">*</span>
            </Label>
            <div className="flex gap-4 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="linkType"
                  checked={linkType === "reservation"}
                  onChange={() => setLinkType("reservation")}
                />
                <span>Đơn đặt chỗ (Reservation)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="linkType"
                  checked={linkType === "contract"}
                  onChange={() => setLinkType("contract")}
                />
                <span>Hợp đồng (Contract)</span>
              </label>
            </div>
          </div>

          {/* Reservation ID or Contract ID */}
          {linkType === "reservation" ? (
            <div className="space-y-1.5">
              <Label htmlFor="reservation-id">
                Mã đơn đặt chỗ <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="reservation-id"
                placeholder="Mã hex 24 ký tự của Reservation"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="contract-id">
                Mã hợp đồng <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="contract-id"
                placeholder="Mã hex 24 ký tự của Contract"
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                required
              />
            </div>
          )}

          {/* Amount and Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">
                Số tiền hoàn (VND) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min={1000}
                placeholder="VD: 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">
                Lý do hoàn <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={reason}
                onValueChange={(val) => setReason(val as RefundRequestReasonEnum)}
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Chọn lý do" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RefundRequestReasonEnum).map((r) => (
                    <SelectItem key={r} value={r}>
                      {getRefundReasonLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bank Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-slate-700">
              Thông tin tài khoản nhận hoàn tiền
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="bank-name" className="text-xs">
                  Tên ngân hàng
                </Label>
                <Input
                  id="bank-name"
                  placeholder="VD: Vietcombank"
                  className="text-xs h-8"
                  value={refundBankName}
                  onChange={(e) => setRefundBankName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bank-acc" className="text-xs">
                  Số tài khoản
                </Label>
                <Input
                  id="bank-acc"
                  placeholder="VD: 1012345678"
                  className="text-xs h-8"
                  value={refundAccountNumber}
                  onChange={(e) => setRefundAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bank-holder" className="text-xs">
                  Chủ tài khoản
                </Label>
                <Input
                  id="bank-holder"
                  placeholder="VD: NGUYEN VAN A"
                  className="text-xs h-8"
                  value={refundAccountHolder}
                  onChange={(e) => setRefundAccountHolder(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="create-note">Ghi chú nội bộ</Label>
            <Input
              id="create-note"
              placeholder="Ghi chú thêm về trường hợp hoàn tiền này..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-amber-50/70 p-2.5 rounded border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Theo quy tắc Maker-Checker, bạn không được tự duyệt yêu cầu hoàn tiền do chính mình
              tạo ra.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo yêu cầu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
