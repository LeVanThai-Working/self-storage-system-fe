"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Plus, Trash2, Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfoTooltip } from "@/components/ui/tooltip";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useContracts } from "@/features/contract-management/hooks";
import { useMyFacility } from "@/features/storage-unit-management/hooks";
import { useCreateManualInvoice } from "../hooks";
import {
  InvoiceItemTypeEnum,
  createManualInvoiceSchema,
  type CreateManualInvoiceRequest,
  type InvoiceItemInput,
} from "../types";

interface CreateManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContractId?: string;
}

const formatVND = (num: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

export const CreateManualInvoiceModal: React.FC<CreateManualInvoiceModalProps> = ({
  isOpen,
  onClose,
  defaultContractId = "",
}) => {
  const getErrorMessage = useApiErrorMessage();
  const createMutation = useCreateManualInvoice();

  const [contractId, setContractId] = useState(defaultContractId);
  // Facility roles only see their facility's contracts; ops/admin have no facility and see all.
  const myFacilityQuery = useMyFacility();
  const contractsQuery = useContracts(
    {
      facilityId: myFacilityQuery.data?.id,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    isOpen && !myFacilityQuery.isLoading
  );
  const contracts = contractsQuery.data?.items ?? [];
  const [periodStartDate, setPeriodStartDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [periodEndDate, setPeriodEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });

  const [items, setItems] = useState<InvoiceItemInput[]>([
    {
      name: "Phụ phí phát sinh / Bồi thường hư hại",
      description: "",
      quantity: 1,
      unitPrice: 100000,
      itemType: InvoiceItemTypeEnum.DAMAGE_FEE,
    },
  ]);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const subtotal = items.reduce((acc, it) => acc + (it.unitPrice || 0) * (it.quantity || 1), 0);
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        itemType: InvoiceItemTypeEnum.OTHER,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, patch: Partial<InvoiceItemInput>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload: CreateManualInvoiceRequest = {
      contractId: contractId.trim(),
      periodStartDate: new Date(periodStartDate).toISOString(),
      periodEndDate: new Date(periodEndDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      items: items.map((it) => ({
        ...it,
        amount: Math.round(it.quantity * it.unitPrice),
      })),
      discountAmount: Number(discountAmount) || 0,
      taxAmount: Number(taxAmount) || 0,
      notes: notes.trim() || undefined,
    };

    const parsed = createManualInvoiceSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errList = Object.values(fieldErrors).flat();
      const firstError = typeof errList[0] === "string" ? errList[0] : null;
      setErrorMsg(firstError || "Dữ liệu hóa đơn không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    try {
      await createMutation.mutateAsync(parsed.data);
      setSuccessMsg("Tạo hóa đơn phụ phí phát sinh thành công!");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !createMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-slate-100 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-1.5 text-lg font-extrabold text-slate-900">
                Lập hóa đơn phụ phí phát sinh
                <InfoTooltip content="Thu tiền bồi thường, phạt quá hạn hoặc tiện ích phát sinh ngoài chu kỳ thuê" />
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Contract */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Hợp đồng *
            </label>
            <select
              required
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              disabled={contractsQuery.isLoading}
              className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
            >
              <option value="">
                {contractsQuery.isLoading ? "Đang tải hợp đồng..." : "Chọn hợp đồng"}
              </option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {[c.contractCode, c.customer?.name, c.storageUnit?.unitNumber]
                    .filter(Boolean)
                    .join(" · ")}
                </option>
              ))}
            </select>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Ngày bắt đầu kỳ *
              </label>
              <input
                type="date"
                required
                value={periodStartDate}
                onChange={(e) => setPeriodStartDate(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Ngày kết thúc kỳ *
              </label>
              <input
                type="date"
                required
                value={periodEndDate}
                onChange={(e) => setPeriodEndDate(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 whitespace-nowrap">
                Hạn thanh toán *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Dynamic Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Danh sách khoản mục phụ phí ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm khoản mục
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 relative group"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Tên khoản mục *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => handleUpdateItem(idx, { name: e.target.value })}
                        placeholder="VD: Phí sửa chữa cánh cửa, phí vệ sinh..."
                        className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Loại khoản
                      </label>
                      <select
                        value={item.itemType}
                        onChange={(e) =>
                          handleUpdateItem(idx, {
                            itemType: e.target.value as InvoiceItemTypeEnum,
                          })
                        }
                        className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                      >
                        <option value={InvoiceItemTypeEnum.DAMAGE_FEE}>Phí hư hại</option>
                        <option value={InvoiceItemTypeEnum.OVERDUE_FEE}>Phí trễ hạn</option>
                        <option value={InvoiceItemTypeEnum.AMENITY}>Tiện ích</option>
                        <option value={InvoiceItemTypeEnum.RENT}>Thuê kho</option>
                        <option value={InvoiceItemTypeEnum.OTHER}>Khoản khác</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-center justify-end">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="mt-4 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(idx, { quantity: parseInt(e.target.value, 10) || 1 })
                        }
                        className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Đơn giá (VND)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        required
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleUpdateItem(idx, { unitPrice: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-full text-xs text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4 flex flex-col justify-end">
                      <span className="text-[10px] text-slate-400">Thành tiền:</span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatVND(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Tax */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Số tiền giảm trừ (VND)
              </label>
              <input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tiền thuế (VND)
              </label>
              <input
                type="number"
                min={0}
                value={taxAmount}
                onChange={(e) => setTaxAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Ghi chú hóa đơn (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Chi phí sửa chữa theo biên bản hiện trường sự cố INC-001..."
              className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-200 outline-none resize-none"
            />
          </div>

          {/* Total calculation card */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-900 block font-medium">
                Tổng số tiền hóa đơn:
              </span>
              <span className="text-[11px] text-amber-700">Đã trừ chiết khấu và cộng thuế</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-amber-900">{formatVND(totalAmount)}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending ? "Đang tạo hóa đơn..." : "Tạo hóa đơn phụ phí"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
