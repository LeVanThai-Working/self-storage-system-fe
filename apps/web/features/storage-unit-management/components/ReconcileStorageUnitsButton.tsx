"use client";

import React, { useState } from "react";
import { CheckCircle2, RefreshCw, ShieldAlert, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useReconcileStorageUnits } from "../hooks";
import type { ReconcileStorageUnitsResponse } from "../types";

export const ReconcileStorageUnitsButton: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const getErrorMessage = useApiErrorMessage();
  const reconcileMutation = useReconcileStorageUnits();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [result, setResult] = useState<ReconcileStorageUnitsResponse | null>(null);

  const handleReconcile = async () => {
    try {
      const data = await reconcileMutation.mutateAsync();
      setResult(data);
      setIsConfirmOpen(false);
      toast.success(`Đối soát hoàn tất! Đã giải phóng ${data.reconciledCount} phòng kho mồ côi.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        disabled={reconcileMutation.isPending}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 ${className}`}
      >
        <RefreshCw className={`w-4 h-4 ${reconcileMutation.isPending ? "animate-spin" : ""}`} />
        {reconcileMutation.isPending ? "Đang đối soát..." : "Đối soát kho mồ côi"}
      </button>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={(open) => !open && setIsConfirmOpen(false)}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl border-slate-100 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Đối soát & Giải phóng kho mồ côi
                </DialogTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quét tự động toàn chuỗi (POST /storage-units/reconcile)
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="text-xs text-slate-600 leading-relaxed space-y-2 py-2">
            <p>
              Hệ thống sẽ rà soát tất cả các phòng kho đang ở trạng thái{" "}
              <strong className="text-amber-600 font-mono">RESERVED</strong> nhưng không có bất kỳ
              đơn đặt chỗ (Reservation) hoặc hợp đồng (Contract) nào đang có hiệu lực liên kết tương
              ứng.
            </p>
            <p className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-indigo-900">
              Các phòng kho mồ côi được phát hiện sẽ tự động chuyển hoàn về trạng thái{" "}
              <strong className="text-emerald-700">AVAILABLE</strong> để tiếp tục mở bán.
            </p>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={reconcileMutation.isPending}
              onClick={handleReconcile}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
            >
              {reconcileMutation.isPending ? "Đang quét..." : "Tiến hành đối soát"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      {result && (
        <Dialog open={Boolean(result)} onOpenChange={(open) => !open && setResult(null)}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl border-slate-100 shadow-2xl">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Kết quả đối soát kho mồ côi
                  </DialogTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Đã giải phóng {result.reconciledCount} phòng kho
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="py-2 space-y-3 text-xs">
              {result.reconciledCount === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-center">
                  Không tìm thấy phòng kho mồ côi nào. Toàn bộ các kho RESERVED đều có đơn đặt chỗ
                  hoặc hợp đồng hợp lệ.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-700">
                    Danh sách các phòng đã được trả về AVAILABLE:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-1">
                    {result.details.map((item) => (
                      <div
                        key={item.unitId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <span className="font-mono font-bold text-slate-800">
                          #{item.unitNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Unit ID: {item.unitId.slice(-6)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Đóng
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
