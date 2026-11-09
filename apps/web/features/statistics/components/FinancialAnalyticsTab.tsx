"use client";

import React from "react";
import {
  Coins,
  CreditCard,
  RotateCcw,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@self-storage-system-fe/shared";
import type { FinancialAnalyticsResponse, OverviewStatisticsResponse } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialAnalyticsTabProps {
  data?: FinancialAnalyticsResponse;
  overviewData?: OverviewStatisticsResponse;
  isLoading: boolean;
}

const SEPAY_RESULT_LABELS: Record<string, string> = {
  matched: "Khớp mã",
  unmatched: "Chưa khớp mã",
  amount_mismatch: "Sai số tiền (Hoàn cọc)",
  late: "Giao dịch trễ (Hoàn cọc)",
  received: "Đã tiếp nhận",
  partially_matched: "Khớp một phần",
  ignored: "Đã bỏ qua",
};

const INVOICE_ITEM_TYPE_LABELS: Record<string, string> = {
  rent: "Tiền thuê kho",
  amenity: "Tiện ích thuê",
  damage_fee: "Phí hư hại",
  overdue_fee: "Phạt trễ hạn",
  discount: "Giảm trừ",
  other: "Khoản khác",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  sepay_qr: "Quét mã VietQR (SePay)",
  qr_code: "Quét mã VietQR (SePay)",
  cash: "Tiền mặt tại quầy",
  bank_transfer: "Chuyển khoản trực tiếp",
};

const REFUND_REASON_LABELS: Record<string, string> = {
  customer_cancel: "Khách hủy đơn",
  facility_cancel: "Cơ sở hủy đơn",
  system_cancel: "Hệ thống hủy đơn",
  late_payment: "Chuyển tiền muộn",
  amount_mismatch: "Chuyển thừa/thiếu tiền",
  deposit_settlement: "Quyết toán cọc dư",
  facility_fault: "Lỗi cơ sở kho",
};

const AR_AGING_BUCKET_LABELS: Record<string, string> = {
  "1_to_3_days": "Từ 1 – 3 ngày",
  "4_to_7_days": "Từ 4 – 7 ngày",
  "8_to_15_days": "Từ 8 – 15 ngày",
  over_15_days: "Trên 15 ngày",
};

function StatTile({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  colorClass = "text-slate-900",
  bgIcon = "bg-teal-50 text-teal-600",
}: {
  title: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; isUp: boolean };
  colorClass?: string;
  bgIcon?: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className={`mt-1.5 text-2xl font-black tracking-tight ${colorClass}`}>{value}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bgIcon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="truncate">{subtext}</span>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-1 font-bold ${
              trend.isUp ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {trend.isUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}

export function FinancialAnalyticsTab({
  data,
  overviewData,
  isLoading,
}: FinancialAnalyticsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    revenueTimeSeries,
    revenueByItemType,
    paymentMethodBreakdown,
    sepayReconciliation,
    overdueAging,
    refundAnalytics,
  } = data;

  const totalCollected = revenueTimeSeries.reduce((sum, t) => sum + t.collectedAmount, 0);
  const totalRefunded = revenueTimeSeries.reduce((sum, t) => sum + t.refundedAmount, 0);
  const totalNet = revenueTimeSeries.reduce((sum, t) => sum + t.netCollectedAmount, 0);
  const financials = overviewData?.financials;
  const contractsAndBookings = overviewData?.contractsAndBookings;

  return (
    <div className="space-y-6">
      {/* 1. Key Financial Highlights */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Chỉ số tài chính chủ chốt trong kỳ
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            title="Thực thu trong kỳ"
            value={formatCurrency(financials ? financials.collectedRevenue : totalCollected)}
            subtext={
              financials
                ? `Kỳ trước: ${formatCurrency(financials.previousPeriodCollectedRevenue)}`
                : undefined
            }
            icon={Coins}
            trend={
              financials
                ? {
                    value: financials.revenueGrowthPercent,
                    isUp: financials.revenueGrowthPercent >= 0,
                  }
                : undefined
            }
            colorClass="text-emerald-700"
            bgIcon="bg-emerald-50 text-emerald-600"
          />

          <StatTile
            title="Doanh thu thuần"
            value={formatCurrency(financials ? financials.netRevenue : totalNet)}
            subtext={`Đã trừ hoàn trả: ${formatCurrency(
              financials ? financials.refundedAmount : totalRefunded
            )}`}
            icon={Wallet}
            colorClass="text-teal-700"
            bgIcon="bg-teal-50 text-teal-600"
          />

          <StatTile
            title="Tiền cọc đang giữ"
            value={formatCurrency(financials?.heldDeposits ?? 0)}
            subtext={`Bồi thường/Phạt: ${formatCurrency(financials?.forfeitedAmount ?? 0)}`}
            icon={ShieldCheck}
            colorClass="text-slate-900"
            bgIcon="bg-blue-50 text-blue-600"
          />

          <StatTile
            title="Công nợ quá hạn"
            value={formatCurrency(
              financials ? financials.overdueReceivables : overdueAging.totalOverdueAmount
            )}
            subtext={`${
              contractsAndBookings
                ? contractsAndBookings.overdueContracts
                : overdueAging.totalOverdueInvoices
            } hợp đồng quá hạn`}
            icon={Scale}
            colorClass="text-rose-600"
            bgIcon="bg-rose-50 text-rose-600"
          />
        </div>
      </div>

      {/* 2. Overdue Aging Buckets & SePay Reconciliation */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Aging */}
        <div className="rounded-2xl border border-rose-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-rose-600" />
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Tuổi nợ quá hạn</h4>
                <p className="text-xs text-slate-500">
                  {overdueAging.totalOverdueInvoices} hóa đơn nợ trễ hạn
                </p>
              </div>
            </div>
            <div className="text-right font-black text-rose-600 text-lg">
              {formatCurrency(overdueAging.totalOverdueAmount)}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {overdueAging.buckets.map((b, idx) => {
              const percent =
                overdueAging.totalOverdueAmount > 0
                  ? Math.round((b.overdueAmount / overdueAging.totalOverdueAmount) * 100)
                  : 0;

              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">
                      {AR_AGING_BUCKET_LABELS[b.bucket] ?? b.label} ({b.invoiceCount} đơn)
                    </span>
                    <span className="font-bold text-rose-700">
                      {formatCurrency(b.overdueAmount)} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SePay Reconciliation */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h4 className="text-base font-extrabold text-slate-900">Đối soát giao dịch SePay</h4>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {sepayReconciliation.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-bold uppercase text-slate-700 text-[10px]">
                    {SEPAY_RESULT_LABELS[item.result.toLowerCase()] ?? item.result}
                  </span>
                  <span className="font-semibold text-slate-800">{item.count} giao dịch</span>
                </div>
                <div className="font-black text-slate-900">
                  {formatCurrency(item.totalTransferAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Revenue Breakdown by Item Type & Payment Methods */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Item Type */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-4">
            Cơ cấu doanh thu theo khoản mục hóa đơn
          </h4>

          <div className="space-y-3">
            {revenueByItemType.map((item, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-slate-800">
                    {INVOICE_ITEM_TYPE_LABELS[item.itemType.toLowerCase()] ?? item.itemType} (
                    {item.itemCount} khoản)
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {formatCurrency(item.paidAmount)}{" "}
                    <span className="text-teal-600">({item.sharePercent}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${item.sharePercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-4">
            Phân bổ kênh thanh toán
          </h4>

          <div className="space-y-3">
            {paymentMethodBreakdown.map((pm, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 text-xs"
              >
                <div>
                  <div className="font-extrabold uppercase text-slate-900">
                    {PAYMENT_METHOD_LABELS[pm.method.toLowerCase()] ?? pm.method}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {pm.count} giao dịch thành công ({pm.sharePercent}%)
                  </div>
                </div>
                <div className="text-right font-black text-slate-900 text-sm">
                  {formatCurrency(pm.totalPaidAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Refund Analytics */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-rose-600" />
            <div>
              <h4 className="text-base font-extrabold text-slate-900">Phân tích hoàn tiền</h4>
              <p className="text-xs text-slate-500">
                Tổng yêu cầu: {refundAnalytics.totalRequests} | Yêu cầu:{" "}
                {formatCurrency(refundAnalytics.totalRequestedAmount)} | Đã chi:{" "}
                {formatCurrency(refundAnalytics.totalPaidAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {refundAnalytics.byReason.map((rf, idx) => (
            <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
              <div className="font-bold uppercase text-slate-800">
                {REFUND_REASON_LABELS[rf.reason.toLowerCase()] ?? rf.reason}
              </div>
              <div className="mt-1 text-slate-500">{rf.count} lệnh hoàn tiền</div>
              <div className="mt-2 text-right font-black text-rose-700">
                {formatCurrency(rf.paidAmount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
