"use client";

import React, { useRef } from "react";
import { Download, Printer, RefreshCw, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInvoicePdf } from "../hooks";
import type { InvoiceResponse } from "../types";

interface InvoicePdfViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceResponse | null;
}

export const InvoicePdfViewModal: React.FC<InvoicePdfViewModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pdfQuery = useInvoicePdf(invoice?.id, isOpen);

  if (!invoice) return null;

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] h-[85vh] p-0 rounded-3xl border-slate-100 shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="p-4 px-6 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              Bản in Hóa đơn ISO A4 • {invoice.invoiceCode}
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Hóa đơn điện tử hợp chuẩn pháp lý kèm mã QR thanh toán
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={pdfQuery.isLoading || !pdfQuery.data?.html}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-xs font-bold text-teal-800 disabled:opacity-40 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              In ấn / Lưu PDF
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-slate-200/50 p-4 overflow-hidden relative">
          {pdfQuery.isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <RefreshCw className="w-7 h-7 text-teal-600 animate-spin" />
              <p className="text-xs font-semibold">Đang tải và kết xuất mẫu hóa đơn ISO A4...</p>
            </div>
          ) : pdfQuery.isError ? (
            <div className="h-full flex flex-col items-center justify-center text-rose-600 p-6 text-center">
              <p className="text-xs font-bold">Không thể tải bản in hóa đơn.</p>
              <p className="text-xs text-slate-500 mt-1">Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              title={`Invoice ${invoice.invoiceCode}`}
              srcDoc={pdfQuery.data?.html || ""}
              className="w-full h-full rounded-2xl bg-white shadow-md border border-slate-300"
            />
          )}
        </div>

        <DialogFooter className="p-3 px-6 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70"
          >
            Đóng
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
