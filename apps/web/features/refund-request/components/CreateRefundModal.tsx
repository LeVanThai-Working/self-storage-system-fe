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
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/ui/tooltip";
import { useAuthStore } from "@/features/auth/store";
import { useContracts } from "@/features/contract-management/hooks";
import { useManagerReservations } from "@/features/reservation-management/hooks";
import { useCreateRefundRequest } from "../hooks";
import { RefundRequestReasonEnum } from "../types";
import { getRefundReasonLabel } from "./RefundReasonBadge";

const REASON_ITEMS: Record<string, string> = Object.fromEntries(
  Object.values(RefundRequestReasonEnum).map((r) => [r, getRefundReasonLabel(r)])
);

const NATIVE_SELECT =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

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
  const [facilityInput, setFacilityInput] = useState("");
  // Read the user facility on every render: the modal mounts before the profile has loaded.
  const facilityId = userFacilityId || facilityInput;
  const [amount, setAmount] = useState<number | "">(defaultAmount || "");
  const [reason, setReason] = useState<RefundRequestReasonEnum>(
    RefundRequestReasonEnum.CUSTOMER_CANCEL
  );
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [refundAccountHolder, setRefundAccountHolder] = useState("");
  const [note, setNote] = useState("");

  const createMutation = useCreateRefundRequest();

  const listParams = facilityId.trim()
    ? { facilityId: facilityId.trim(), limit: 100, sortOrder: "desc" as const }
    : null;
  const reservationsQuery = useManagerReservations(
    isOpen && linkType === "reservation" ? listParams : null
  );
  const contractsQuery = useContracts(
    listParams ? { ...listParams, sortBy: "createdAt" } : null,
    isOpen && linkType === "contract"
  );
  const reservations = reservationsQuery.data?.items ?? [];
  const contracts = contractsQuery.data?.items ?? [];

  // The customer always comes from the linked reservation / contract.
  const linked =
    linkType === "reservation"
      ? reservations.find((r) => r.id === reservationId)
      : contracts.find((c) => c.id === contractId);
  const customerId = linked?.customerId || defaultCustomerId || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!facilityId.trim()) {
      toast.error("Chưa xác định được cơ sở");
      return;
    }
    if (linkType === "reservation" && !reservationId.trim()) {
      toast.error("Vui lòng chọn đơn đặt chỗ");
      return;
    }
    if (linkType === "contract" && !contractId.trim()) {
      toast.error("Vui lòng chọn hợp đồng");
      return;
    }
    if (!customerId) {
      toast.error("Không xác định được khách hàng của đơn đã chọn");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Số tiền hoàn phải là số nguyên dương lớn hơn 0");
      return;
    }

    try {
      await createMutation.mutateAsync({
        facilityId: facilityId.trim(),
        customerId,
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
            <DialogTitle>Tạo yêu cầu hoàn tiền</DialogTitle>
            <InfoTooltip content="Yêu cầu sẽ được chuyển cho người duyệt. Bạn không thể tự duyệt yêu cầu do chính mình tạo." />
          </div>
          <DialogDescription className="sr-only">
            Tạo yêu cầu hoàn tiền cho khách hàng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Facility roles get their facility automatically; ops/admin still type it in */}
          {!userFacilityId && (
            <div className="space-y-1.5">
              <Label htmlFor="facility-id">
                Mã cơ sở <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="facility-id"
                value={facilityInput}
                onChange={(e) => setFacilityInput(e.target.value)}
                required
              />
            </div>
          )}

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
                <span>Đơn đặt chỗ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="linkType"
                  checked={linkType === "contract"}
                  onChange={() => setLinkType("contract")}
                />
                <span>Hợp đồng</span>
              </label>
            </div>
          </div>

          {/* Reservation ID or Contract ID */}
          {linkType === "reservation" ? (
            <div className="space-y-1.5">
              <Label htmlFor="reservation-id">
                Đơn đặt chỗ <span className="text-rose-500">*</span>
              </Label>
              <select
                id="reservation-id"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                required
                className={NATIVE_SELECT}
              >
                <option value="">
                  {reservationsQuery.isLoading ? "Đang tải..." : "Chọn đơn đặt chỗ"}
                </option>
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {[r.reservationCode, r.customer?.name].filter(Boolean).join(" · ")}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="contract-id">
                Hợp đồng <span className="text-rose-500">*</span>
              </Label>
              <select
                id="contract-id"
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                required
                className={NATIVE_SELECT}
              >
                <option value="">
                  {contractsQuery.isLoading ? "Đang tải..." : "Chọn hợp đồng"}
                </option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {[c.contractCode, c.customer?.name].filter(Boolean).join(" · ")}
                  </option>
                ))}
              </select>
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
                items={REASON_ITEMS}
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
