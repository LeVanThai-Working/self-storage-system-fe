"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Layers,
  Loader2,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayments, useProcessExpiredPayments } from "../hooks";
import {
  PaymentPurposeEnum,
  PaymentStatusEnum,
  type PaymentFilterState,
  type PaymentResponse,
} from "../types";
import { formatDateTime, formatVnd } from "../utils";
import { CancelPaymentModal } from "./CancelPaymentModal";
import { ConfirmManualPaymentModal } from "./ConfirmManualPaymentModal";
import { PaymentDetailModal } from "./PaymentDetailModal";
import { PaymentMethodBadge } from "./PaymentMethodBadge";
import { PaymentPurposeBadge } from "./PaymentPurposeBadge";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

interface PaymentsListViewProps {
  initialFacilityId?: string;
  isManagerOrAdmin?: boolean;
}

export const PaymentsListView: React.FC<PaymentsListViewProps> = ({
  initialFacilityId,
  isManagerOrAdmin = false,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";

  const [filters, setFilters] = useState<PaymentFilterState>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    facilityId: initialFacilityId,
  });

  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [confirmManualPayment, setConfirmManualPayment] = useState<PaymentResponse | null>(null);
  const [cancelTargetPayment, setCancelTargetPayment] = useState<PaymentResponse | null>(null);

  const paymentsQuery = usePayments({
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy || "createdAt",
    sortOrder: filters.sortOrder || "desc",
    status: filters.status,
    purpose: filters.purpose,
    facilityId: filters.facilityId,
    paymentCode: filters.search ? filters.search.trim() : undefined,
    createdAtFrom: filters.createdAtFrom,
    createdAtTo: filters.createdAtTo,
  });

  const processExpiredMutation = useProcessExpiredPayments();

  const handleProcessExpired = async () => {
    try {
      const res = await processExpiredMutation.mutateAsync();
      toast.success(
        isEn
          ? `Expired payments batch processed! (${res.processedCount ?? 0} updated)`
          : `Đã quét và đóng các đơn thanh toán quá hạn! (${res.processedCount ?? 0} đơn đã cập nhật)`
      );
      paymentsQuery.refetch();
    } catch {
      toast.error(
        isEn ? "Failed to trigger expired batch process." : "Không thể chạy quét đơn quá hạn."
      );
    }
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      facilityId: initialFacilityId,
    });
  };

  const data = paymentsQuery.data;
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isEn ? "Payment Transactions" : "Quản lý Đơn Thanh Toán"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isEn
              ? "Track dynamic VietQR transactions, counter cash/transfers, and settlement status."
              : "Theo dõi các giao dịch thanh toán VietQR động SePay, thu tiền tại quầy và đối soát."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManagerOrAdmin && (
            <button
              type="button"
              onClick={handleProcessExpired}
              disabled={processExpiredMutation.isPending}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all disabled:opacity-50"
              title={
                isEn
                  ? "Scan and close pending orders that have exceeded the expiration deadline"
                  : "Quét và đóng các đơn thanh toán pending đã quá hạn"
              }
            >
              <RotateCcw
                className={`w-3.5 h-3.5 text-slate-500 ${
                  processExpiredMutation.isPending ? "animate-spin" : ""
                }`}
              />
              <span>{isEn ? "Process Expired Batch" : "Quét đơn quá hạn"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => paymentsQuery.refetch()}
            disabled={paymentsQuery.isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${paymentsQuery.isFetching ? "animate-spin text-teal-600" : ""}`}
            />
            <span className="hidden sm:inline">{isEn ? "Refresh" : "Làm mới"}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search by Code */}
          <div className="relative">
            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
              placeholder={isEn ? "Search by payment code..." : "Tìm theo mã thanh toán..."}
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={filters.status || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: (e.target.value as PaymentStatusEnum) || undefined,
                  page: 1,
                }))
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors"
            >
              <option value="">{isEn ? "All Statuses" : "Tất cả trạng thái"}</option>
              <option value={PaymentStatusEnum.PENDING}>
                {isEn ? "Pending Payment" : "Chờ thanh toán"}
              </option>
              <option value={PaymentStatusEnum.PAID}>{isEn ? "Paid" : "Đã thanh toán"}</option>
              <option value={PaymentStatusEnum.EXPIRED}>{isEn ? "Expired" : "Đã hết hạn"}</option>
              <option value={PaymentStatusEnum.CANCELLED}>{isEn ? "Cancelled" : "Đã hủy"}</option>
            </select>
          </div>

          {/* Filter by Purpose */}
          <div>
            <select
              value={filters.purpose || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  purpose: (e.target.value as PaymentPurposeEnum) || undefined,
                  page: 1,
                }))
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors"
            >
              <option value="">{isEn ? "All Purposes" : "Tất cả mục đích"}</option>
              <option value={PaymentPurposeEnum.RESERVATION_DEPOSIT}>
                {isEn ? "Reservation Deposit" : "Cọc giữ chỗ"}
              </option>
              <option value={PaymentPurposeEnum.CONTRACT_DEPOSIT}>
                {isEn ? "Contract Deposit" : "Cọc hợp đồng"}
              </option>
              <option value={PaymentPurposeEnum.RENT_FIRST_PERIOD}>
                {isEn ? "1st Period Rent" : "Tiền thuê kỳ đầu"}
              </option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                setFilters((prev) => ({
                  ...prev,
                  sortBy: sb,
                  sortOrder: so as "asc" | "desc",
                  page: 1,
                }));
              }}
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors"
            >
              <option value="createdAt-desc">{isEn ? "Newest First" : "Mới nhất trước"}</option>
              <option value="createdAt-asc">{isEn ? "Oldest First" : "Cũ nhất trước"}</option>
              <option value="amount-desc">
                {isEn ? "Amount (High to Low)" : "Số tiền (Giảm dần)"}
              </option>
              <option value="amount-asc">
                {isEn ? "Amount (Low to High)" : "Số tiền (Tăng dần)"}
              </option>
              <option value="expiresAt-asc">{isEn ? "Expires Soonest" : "Sắp hết hạn nhất"}</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary & Reset */}
        {(filters.search || filters.status || filters.purpose) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              {isEn ? "Filters are currently applied." : "Đang áp dụng bộ lọc tùy chỉnh."}
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="font-bold text-teal-700 hover:text-teal-800 transition-colors"
            >
              {isEn ? "Reset all filters" : "Đặt lại tất cả"}
            </button>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">
                  {isEn ? "Payment Code / Purpose" : "Mã đơn / Mục đích"}
                </th>
                <th className="px-4 py-3.5">{isEn ? "Customer" : "Khách hàng"}</th>
                <th className="px-4 py-3.5">{isEn ? "Facility" : "Cơ sở"}</th>
                <th className="px-4 py-3.5 text-right">{isEn ? "Amount" : "Số tiền"}</th>
                <th className="px-4 py-3.5">{isEn ? "Method" : "Hình thức"}</th>
                <th className="px-4 py-3.5">{isEn ? "Status" : "Trạng thái"}</th>
                <th className="px-4 py-3.5">{isEn ? "Created / Expires" : "Ngày tạo / Hạn"}</th>
                <th className="px-4 py-3.5 text-right">{isEn ? "Actions" : "Thao tác"}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {paymentsQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-28 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-32 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Skeleton className="h-4 w-20 ml-auto rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-16 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-20 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Skeleton className="h-4 w-16 ml-auto rounded" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold">
                      {isEn ? "No payments found." : "Chưa có đơn thanh toán nào."}
                    </p>
                    <p className="text-[11px] mt-0.5">
                      {isEn
                        ? "Try adjusting your search criteria or filters."
                        : "Thử điều chỉnh điều kiện lọc hoặc từ khóa tìm kiếm."}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedPaymentId(payment.id)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-900">
                        {payment.paymentCode}
                      </div>
                      <div className="mt-1">
                        <PaymentPurposeBadge purpose={payment.purpose} />
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">
                        {payment.customer?.name || isEn ? "Customer" : "Khách hàng"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {payment.customer?.email || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">
                      <div className="font-semibold">{payment.facility?.name || "—"}</div>
                      <div className="text-[11px] text-slate-400">{payment.facility?.city}</div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-black text-slate-900">
                      {formatVnd(payment.amount)}
                    </td>

                    <td className="px-4 py-3.5">
                      <PaymentMethodBadge method={payment.method} />
                    </td>

                    <td className="px-4 py-3.5">
                      <PaymentStatusBadge status={payment.status} />
                    </td>

                    <td className="px-4 py-3.5 text-[11px] text-slate-500">
                      <div>{formatDateTime(payment.createdAt, locale)}</div>
                      {payment.status === PaymentStatusEnum.PENDING && payment.expiresAt && (
                        <div className="text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(payment.expiresAt, locale)}</span>
                        </div>
                      )}
                      {payment.status === PaymentStatusEnum.PAID && payment.paidAt && (
                        <div className="text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{formatDateTime(payment.paidAt, locale)}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentId(payment.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title={isEn ? "View Details" : "Xem chi tiết"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {payment.status === PaymentStatusEnum.PENDING && (
                          <>
                            <button
                              type="button"
                              onClick={() => setConfirmManualPayment(payment)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
                              title={isEn ? "Confirm at counter" : "Thu tiền tại quầy"}
                            >
                              {isEn ? "Collect" : "Thu tiền"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelTargetPayment(payment)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                              title={isEn ? "Cancel order" : "Hủy đơn"}
                            >
                              {isEn ? "Cancel" : "Hủy"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              {isEn
                ? `Showing page ${pagination.page} of ${pagination.totalPages} (${pagination.totalItems} payments)`
                : `Trang ${pagination.page} / ${pagination.totalPages} (Tổng ${pagination.totalItems} đơn thanh toán)`}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <PaymentDetailModal
        isOpen={Boolean(selectedPaymentId)}
        onClose={() => setSelectedPaymentId(null)}
        paymentId={selectedPaymentId}
        onUpdated={() => paymentsQuery.refetch()}
      />

      {/* Confirm Manual Payment Modal */}
      <ConfirmManualPaymentModal
        isOpen={Boolean(confirmManualPayment)}
        onClose={() => setConfirmManualPayment(null)}
        payment={confirmManualPayment}
        onSuccess={() => paymentsQuery.refetch()}
      />

      {/* Cancel Payment Modal */}
      <CancelPaymentModal
        isOpen={Boolean(cancelTargetPayment)}
        onClose={() => setCancelTargetPayment(null)}
        payment={cancelTargetPayment}
        onSuccess={() => paymentsQuery.refetch()}
      />
    </div>
  );
};
