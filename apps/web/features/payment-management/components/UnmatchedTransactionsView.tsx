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
  Filter,
  Link2,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnmatchedTransactions } from "../hooks";
import {
  PaymentTransactionResultEnum,
  type PaymentTransactionResponse,
  type UnmatchedTransactionFilterState,
} from "../types";
import { formatDateTime, formatVnd, getTransactionResultConfig } from "../utils";
import { AssignTransactionModal } from "./AssignTransactionModal";

export const UnmatchedTransactionsView: React.FC = () => {
  const locale = useLocale();
  const isEn = locale === "en";

  const [filters, setFilters] = useState<UnmatchedTransactionFilterState>({
    page: 1,
    limit: 10,
    result: PaymentTransactionResultEnum.UNMATCHED,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [targetTransaction, setTargetTransaction] = useState<PaymentTransactionResponse | null>(
    null
  );

  const transactionsQuery = useUnmatchedTransactions({
    page: filters.page,
    limit: filters.limit,
    result: filters.result,
    gateway: filters.gateway,
    accountNumber: filters.accountNumber,
    code: filters.code,
    sortBy: filters.sortBy || "createdAt",
    sortOrder: filters.sortOrder || "desc",
  });

  const data = transactionsQuery.data;
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isEn ? "Bank Reconciliation" : "Đối Soát Giao Dịch Ngân Hàng"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isEn
              ? "Identify and reconcile unmatched, late, or amount-mismatch SePay bank transfers."
              : "Tra cứu và gán giao dịch ngân hàng mồ côi (chưa khớp mã, sai tiền hoặc chuyển trễ)."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => transactionsQuery.refetch()}
          disabled={transactionsQuery.isFetching}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              transactionsQuery.isFetching ? "animate-spin text-teal-600" : ""
            }`}
          />
          <span>{isEn ? "Refresh Statement" : "Làm mới sao kê"}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Result Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isEn ? "Transaction Outcome" : "Kết quả đối soát"}
            </label>
            <select
              value={filters.result || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  result: (e.target.value as PaymentTransactionResultEnum) || undefined,
                  page: 1,
                }))
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors"
            >
              <option value="">{isEn ? "All Outcomes" : "Tất cả kết quả"}</option>
              <option value={PaymentTransactionResultEnum.UNMATCHED}>
                {isEn ? "Unmatched (Missing/Wrong Code)" : "Chưa khớp mã (Thiếu/sai mã)"}
              </option>
              <option value={PaymentTransactionResultEnum.AMOUNT_MISMATCH}>
                {isEn ? "Amount Mismatch (Refund Pending)" : "Sai số tiền (Chờ hoàn cọc)"}
              </option>
              <option value={PaymentTransactionResultEnum.LATE}>
                {isEn ? "Late Transaction (Exceeded Grace Period)" : "Giao dịch trễ hạn"}
              </option>
              <option value={PaymentTransactionResultEnum.MATCHED}>
                {isEn ? "Matched / Settled" : "Đã khớp thành công"}
              </option>
              <option value={PaymentTransactionResultEnum.RECEIVED}>
                {isEn ? "Received (In Process)" : "Đã tiếp nhận"}
              </option>
            </select>
          </div>

          {/* Search by Code/Content */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isEn ? "Transaction Code / Content" : "Mã giao dịch / Nội dung"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.code || ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, code: e.target.value, page: 1 }))}
                placeholder={isEn ? "Search bank content..." : "Tìm theo nội dung..."}
                className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isEn ? "Account Number" : "Số tài khoản nhận"}
            </label>
            <input
              type="text"
              value={filters.accountNumber || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, accountNumber: e.target.value, page: 1 }))
              }
              placeholder={isEn ? "Bank account no..." : "Số TK thụ hưởng..."}
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors"
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isEn ? "Sort Order" : "Sắp xếp theo"}
            </label>
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
              <option value="createdAt-desc">{isEn ? "Newest Bank Date" : "Mới nhất trước"}</option>
              <option value="createdAt-asc">{isEn ? "Oldest First" : "Cũ nhất trước"}</option>
              <option value="transferAmount-desc">
                {isEn ? "Amount (High to Low)" : "Số tiền (Giảm dần)"}
              </option>
              <option value="transferAmount-asc">
                {isEn ? "Amount (Low to High)" : "Số tiền (Tăng dần)"}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">{isEn ? "SePay ID / Gateway" : "ID SePay / Cổng"}</th>
                <th className="px-4 py-3.5">{isEn ? "Outcome" : "Kết quả đối soát"}</th>
                <th className="px-4 py-3.5 text-right">
                  {isEn ? "Transfer Amount" : "Số tiền chuyển"}
                </th>
                <th className="px-4 py-3.5">
                  {isEn ? "Transfer Content / Description" : "Nội dung chuyển khoản"}
                </th>
                <th className="px-4 py-3.5">{isEn ? "Account" : "Tài khoản nhận"}</th>
                <th className="px-4 py-3.5">{isEn ? "Transaction Date" : "Thời gian ngân hàng"}</th>
                <th className="px-4 py-3.5 text-right">{isEn ? "Actions" : "Thao tác"}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {transactionsQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-28 rounded" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Skeleton className="h-4 w-20 ml-auto rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-48 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-28 rounded" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Skeleton className="h-4 w-16 ml-auto rounded" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold">
                      {isEn ? "No bank transactions found." : "Không có giao dịch ngân hàng nào."}
                    </p>
                    <p className="text-[11px] mt-0.5">
                      {isEn
                        ? "All bank transfers match the payment codes."
                        : "Tất cả các giao dịch đã được khớp mã hợp lệ."}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((tx) => {
                  const resultConfig = getTransactionResultConfig(tx.result, locale);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900 block">
                          #{tx.sepayId}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {tx.gateway || "VietQR"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${resultConfig.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${resultConfig.dotClass}`}
                          />
                          <span>{resultConfig.label}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-slate-900">
                        {formatVnd(tx.transferAmount)}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="font-mono text-slate-800 break-words line-clamp-2">
                          {tx.content || tx.description || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 font-mono text-[11px]">
                        {tx.accountNumber || "—"}
                      </td>

                      <td className="px-4 py-3.5 text-[11px] text-slate-500">
                        {formatDateTime(tx.transactionDate, locale)}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {tx.result === PaymentTransactionResultEnum.UNMATCHED ? (
                          <button
                            type="button"
                            onClick={() => setTargetTransaction(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>{isEn ? "Assign Payment" : "Gán đơn"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {tx.matchedPaymentId ? (isEn ? "Assigned" : "Đã gán") : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              {isEn
                ? `Showing page ${pagination.page} of ${pagination.totalPages} (${pagination.totalItems} transactions)`
                : `Trang ${pagination.page} / ${pagination.totalPages} (Tổng ${pagination.totalItems} giao dịch)`}
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

      {/* Assign Modal */}
      <AssignTransactionModal
        isOpen={Boolean(targetTransaction)}
        onClose={() => setTargetTransaction(null)}
        transaction={targetTransaction}
        onSuccess={() => transactionsQuery.refetch()}
      />
    </div>
  );
};
