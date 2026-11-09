"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  PlayCircle,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { useMyFacility } from "@/features/storage-unit-management/hooks";
import { RoleEnum } from "@self-storage-system-fe/shared";
import {
  useInvoices,
  useTriggerOverdueScan,
  useTriggerRecurringScan,
  useTriggerRemindersScan,
} from "../hooks";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceTypeBadge } from "./InvoiceTypeBadge";
import { InvoiceDetailModal } from "./InvoiceDetailModal";
import { CreateManualInvoiceModal } from "./CreateManualInvoiceModal";
import { ConfirmManualPaymentModal } from "./ConfirmManualPaymentModal";
import { CancelInvoiceModal } from "./CancelInvoiceModal";
import { InvoicePaymentQrModal } from "./InvoicePaymentQrModal";
import { InvoicePdfViewModal } from "./InvoicePdfViewModal";
import {
  InvoiceStatusEnum,
  InvoiceTypeEnum,
  type EntitySummary,
  type InvoiceQuery,
  type InvoiceQuickTab,
  type InvoiceResponse,
} from "../types";

interface InvoicesListViewProps {
  portalBase?: "facility-manager" | "facility-staff" | "business-ops" | "system-admin";
  pageTitle?: string;
  pageSubtitle?: string;
}

const formatVND = (num: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

const formatDate = (isoString?: string | null) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

const formatDateOnly = (isoString?: string | null) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
};

const getEntityName = (entity?: EntitySummary | null) => {
  if (!entity) return "—";
  return entity.name || entity.email || entity.code || entity.id;
};

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  portalBase = "facility-manager",
  pageTitle = "Quản lý Hóa đơn & Thu phí",
  pageSubtitle = "Theo dõi kỳ thanh toán, hóa đơn phụ phí và đối soát thu tiền định kỳ",
}) => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isManager =
    portalBase === "facility-manager" || currentUser?.role === RoleEnum.FACILITY_MANAGER;
  const isStaff = portalBase === "facility-staff" || currentUser?.role === RoleEnum.FACILITY_STAFF;
  const isOpsOrAdmin =
    portalBase === "business-ops" ||
    portalBase === "system-admin" ||
    currentUser?.role === RoleEnum.BUSINESS_OPS_MANAGER ||
    currentUser?.role === RoleEnum.SYSTEM_ADMIN;

  const userRecord = currentUser as unknown as Record<string, unknown> | null;
  const userFacilityId =
    (typeof userRecord?.facilityId === "string" && userRecord.facilityId) ||
    (typeof userRecord?.assignedFacilityId === "string" && userRecord.assignedFacilityId) ||
    ((userRecord?.facility as Record<string, unknown>)?.id as string | undefined);

  const { data: myFacility } = useMyFacility({ enabled: isManager });
  const facilityId = isManager ? myFacility?.id : isStaff ? userFacilityId : undefined;

  // Filters state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState<InvoiceQuickTab>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [dueAfter, setDueAfter] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "dueDate" | "totalAmount" | "status">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Job scan mutations
  const recurringScanMutation = useTriggerRecurringScan();
  const overdueScanMutation = useTriggerOverdueScan();
  const remindersScanMutation = useTriggerRemindersScan();
  const [jobFeedback, setJobFeedback] = useState<string | null>(null);

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPaymentQrOpen, setIsPaymentQrOpen] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  const queryParams: Partial<InvoiceQuery> = useMemo(() => {
    const q: Partial<InvoiceQuery> = {
      page,
      limit,
      facilityId,
      sortBy,
      sortOrder,
    };

    if (activeTab === "ISSUED") q.status = InvoiceStatusEnum.ISSUED;
    if (activeTab === "PAID") q.status = InvoiceStatusEnum.PAID;
    if (activeTab === "OVERDUE") q.status = InvoiceStatusEnum.OVERDUE;
    if (activeTab === "CANCELLED") q.status = InvoiceStatusEnum.CANCELLED;

    if (selectedType !== "ALL") q.type = selectedType as InvoiceTypeEnum;
    if (dueAfter) q.dueAfter = new Date(dueAfter).toISOString();
    if (searchInput.trim()) {
      (q as Record<string, unknown>).search = searchInput.trim();
    }

    return q;
  }, [page, limit, facilityId, activeTab, selectedType, dueAfter, searchInput, sortBy, sortOrder]);

  const { data: invoicesData, isLoading } = useInvoices(queryParams);

  const items = invoicesData?.items ?? [];
  const pagination = invoicesData?.pagination ?? {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const handleTriggerRecurringScan = async () => {
    try {
      const res = await recurringScanMutation.mutateAsync();
      setJobFeedback(
        `Đã kiểm tra ${res.scannedCount} hợp đồng, tạo mới ${res.generatedCount} hóa đơn kỳ tới.`
      );
      setTimeout(() => setJobFeedback(null), 5000);
    } catch {
      setJobFeedback("Không tạo được hóa đơn kỳ tới, vui lòng thử lại.");
      setTimeout(() => setJobFeedback(null), 4000);
    }
  };

  const handleTriggerOverdueScan = async () => {
    try {
      const res = await overdueScanMutation.mutateAsync();
      setJobFeedback(
        `Quét quá hạn hoàn tất: Đã quét ${res.scannedCount}, đánh dấu quá hạn ${res.markedOverdueCount}, khóa nợ ${res.contractsLockedCount} hợp đồng.`
      );
      setTimeout(() => setJobFeedback(null), 5000);
    } catch {
      setJobFeedback("Kích hoạt quét quá hạn thất bại.");
      setTimeout(() => setJobFeedback(null), 4000);
    }
  };

  const handleTriggerRemindersScan = async () => {
    try {
      const res = await remindersScanMutation.mutateAsync();
      setJobFeedback(
        `Gửi nhắc hạn hoàn tất: Tổng ${res.totalRemindedCount} nhắc hạn (T-3: ${res.remindedT3Count}, T-1: ${res.remindedT1Count}, T-0: ${res.remindedT0Count}).`
      );
      setTimeout(() => setJobFeedback(null), 5000);
    } catch {
      setJobFeedback("Kích hoạt quét nhắc nợ thất bại.");
      setTimeout(() => setJobFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">{pageSubtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isOpsOrAdmin && (
            <>
              <button
                type="button"
                onClick={handleTriggerRecurringScan}
                disabled={recurringScanMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-800 disabled:opacity-50 shadow-sm"
                title="Tạo hóa đơn cho các hợp đồng có kỳ thuê mới bắt đầu trong 7 ngày tới. Hệ thống cũng tự chạy việc này hằng ngày."
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Tạo hóa đơn kỳ tới
              </button>

              <button
                type="button"
                onClick={handleTriggerOverdueScan}
                disabled={overdueScanMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-800 disabled:opacity-50 shadow-sm"
                title="Kích hoạt job quét quá hạn sau 3 ngày ân hạn và khóa hợp đồng"
              >
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                Quét quá hạn
              </button>

              <button
                type="button"
                onClick={handleTriggerRemindersScan}
                disabled={remindersScanMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-800 disabled:opacity-50 shadow-sm"
                title="Kích hoạt mẻ gửi thông báo nhắc hạn thanh toán T-3, T-1, T-0"
              >
                <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
                Gửi nhắc nợ
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Tạo HĐ phụ phí
          </button>
        </div>
      </div>

      {/* Job Feedback Banner */}
      {jobFeedback && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{jobFeedback}</span>
        </div>
      )}

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: "ALL", label: "Tất cả" },
          { key: "ISSUED", label: "Chờ thanh toán" },
          { key: "PAID", label: "Đã thanh toán" },
          { key: "OVERDUE", label: "Quá hạn" },
          { key: "CANCELLED", label: "Đã hủy" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key as InvoiceQuickTab);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Mã HĐ, mã HĐồng, khách hàng..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
            />
          </div>

          {/* Type Select */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
            >
              <option value="ALL">Tất cả loại hóa đơn</option>
              <option value={InvoiceTypeEnum.FIRST_PERIOD}>Kỳ đầu</option>
              <option value={InvoiceTypeEnum.RECURRING}>Định kỳ</option>
              <option value={InvoiceTypeEnum.INCIDENTAL}>Phụ phí phát sinh</option>
              <option value={InvoiceTypeEnum.CHECK_OUT_SETTLEMENT}>Quyết toán trả kho</option>
            </select>
          </div>

          {/* Due After */}
          <div>
            <input
              type="date"
              value={dueAfter}
              onChange={(e) => {
                setDueAfter(e.target.value);
                setPage(1);
              }}
              title="Hạn thanh toán từ ngày"
              className="w-full py-2 px-3 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-slate-700"
            />
          </div>

          {/* Sort By & Order */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as typeof sortBy);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
            >
              <option value="createdAt">Xếp theo: Ngày tạo</option>
              <option value="dueDate">Xếp theo: Hạn thanh toán</option>
              <option value="totalAmount">Xếp theo: Tổng tiền</option>
              <option value="status">Xếp theo: Trạng thái</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
              title="Đảo chiều sắp xếp"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Đang tải danh sách hóa đơn...
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-extrabold text-slate-700">Chưa có hóa đơn nào</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Không tìm thấy hóa đơn phù hợp với điều kiện lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[1020px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 whitespace-nowrap">Mã HĐ & Ngày lập</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Hợp đồng & Khách hàng</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Loại & Kỳ</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Hạn thanh toán</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Tổng tiền & Đã thu</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((inv) => {
                  const isUnpaid =
                    inv.status === InvoiceStatusEnum.ISSUED ||
                    inv.status === InvoiceStatusEnum.OVERDUE;
                  const isCancellable = isUnpaid;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Code & Created */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsDetailOpen(true);
                          }}
                          className="font-mono font-extrabold text-teal-700 hover:text-teal-900 hover:underline block text-xs"
                        >
                          {inv.invoiceCode}
                        </button>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {formatDate(inv.createdAt)}
                        </span>
                      </td>

                      {/* Contract & Customer */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {getEntityName(inv.customer)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          HĐ: {inv.contract?.code || inv.contractId}
                        </div>
                      </td>

                      {/* Type & Period */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <InvoiceTypeBadge type={inv.type} />
                        <span className="text-[11px] text-slate-500 block mt-1">
                          Kỳ #{inv.billingPeriodIndex} ({formatDateOnly(inv.periodStartDate)} →{" "}
                          {formatDateOnly(inv.periodEndDate)})
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold block ${
                            inv.status === InvoiceStatusEnum.OVERDUE
                              ? "text-rose-600 font-bold"
                              : "text-slate-800"
                          }`}
                        >
                          {formatDateOnly(inv.dueDate)}
                        </span>
                        {inv.status === InvoiceStatusEnum.OVERDUE && (
                          <span className="text-[10px] text-rose-500 font-bold block">
                            Quá hạn sau 3 ngày ân hạn
                          </span>
                        )}
                      </td>

                      {/* Financials */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {formatVND(inv.totalAmount)}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          Đã thu: {formatVND(inv.paidAmount)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Row 1: Primary Text Actions */}
                          {isUnpaid && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setIsPaymentQrOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center gap-1 transition-colors"
                              >
                                <QrCode className="w-3 h-3" />
                                VietQR
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setIsConfirmModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 shadow-sm flex items-center gap-1 transition-colors"
                              >
                                <Banknote className="w-3 h-3" />
                                Thu quầy
                              </button>
                            </div>
                          )}

                          {/* Row 2: Secondary Icon Actions */}
                          <div className="flex items-center justify-end gap-1">
                            {/* PDF View / Print */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsPdfOpen(true);
                              }}
                              className="w-7 h-7 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                              title="Xem và In PDF A4"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Cancel */}
                            {isCancellable && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setIsCancelModalOpen(true);
                                }}
                                className="w-7 h-7 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                title="Hủy hóa đơn"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Detail */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsDetailOpen(true);
                              }}
                              className="w-7 h-7 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalItems > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị{" "}
              <strong className="text-slate-800">
                {(pagination.page - 1) * pagination.limit + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </strong>{" "}
              trên <strong className="text-slate-800">{pagination.totalItems}</strong> hóa đơn
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Trang trước
              </button>
              <span className="font-bold text-slate-700 px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-1.5 rounded-xl font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <InvoiceDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onOpenPaymentQr={(inv) => {
          setSelectedInvoice(inv);
          setIsPaymentQrOpen(true);
        }}
        onOpenConfirmManual={(inv) => {
          setSelectedInvoice(inv);
          setIsConfirmModalOpen(true);
        }}
        onOpenCancel={(inv) => {
          setSelectedInvoice(inv);
          setIsCancelModalOpen(true);
        }}
        onOpenPdf={(inv) => {
          setSelectedInvoice(inv);
          setIsPdfOpen(true);
        }}
      />

      <CreateManualInvoiceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />

      <ConfirmManualPaymentModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      <CancelInvoiceModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      <InvoicePaymentQrModal
        isOpen={isPaymentQrOpen}
        onClose={() => {
          setIsPaymentQrOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      <InvoicePdfViewModal
        isOpen={isPdfOpen}
        onClose={() => {
          setIsPdfOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />
    </div>
  );
};
