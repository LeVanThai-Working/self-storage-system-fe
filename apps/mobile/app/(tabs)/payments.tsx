import React, { useCallback, useMemo, useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/stores/language.store";
import {
  AlertCircle,
  ExternalLink,
  QrCode,
  Receipt,
  RotateCcw,
  ShieldCheck,
} from "lucide-react-native";
import { useCustomerRefunds } from "@/features/refunds/hooks/useRefunds";
import { RefundCard } from "@/features/refunds/components/RefundCard";
import { formatVnd } from "@/features/refunds/utils/refundFormat";
import { formatDateTime } from "@/features/contracts/utils/contractFormat";
import { useMyPayments } from "@/features/reservations/hooks/usePayments";
import { useMyInvoices } from "@/features/invoices/hooks/useInvoices";
import { InvoiceCard } from "@/features/invoices/components/InvoiceCard";
import { InvoiceDetailModal } from "@/features/invoices/components/InvoiceDetailModal";
import { InvoicePaymentQrModal } from "@/features/invoices/components/InvoicePaymentQrModal";
import {
  getInvoiceRemainingAmount,
  isInvoicePayable,
} from "@/features/invoices/utils/invoiceFormat";
import {
  ESTIMATED_SLA_DAYS,
  InvoiceStatusEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  RefundRequestStatusEnum,
  type InvoiceResponse,
  type PaymentResponse,
} from "@self-storage-system-fe/shared";

type FilterType = "all" | "unpaid" | "paid";
type MainTabType = "invoices" | "refunds";

function getPaymentPurposeLabel(purpose: PaymentPurposeEnum | string, isEn: boolean): string {
  switch (purpose) {
    case PaymentPurposeEnum.RESERVATION_DEPOSIT:
      return isEn ? "Reservation Deposit" : "Tiền đặt cọc giữ chỗ";
    case PaymentPurposeEnum.CONTRACT_DEPOSIT:
      return isEn ? "Contract Security Deposit" : "Tiền đặt cọc hợp đồng";
    case PaymentPurposeEnum.RENT_FIRST_PERIOD:
      return isEn ? "First Period Rent" : "Tiền thuê kỳ đầu";
    default:
      return isEn ? "Storage Payment" : "Thanh toán dịch vụ kho";
  }
}

function getPaymentStatusMeta(status: PaymentStatusEnum | string, isEn: boolean) {
  switch (status) {
    case PaymentStatusEnum.PAID:
      return {
        label: isEn ? "Paid" : "Đã thanh toán",
        badgeClass: "border-brand/40 bg-brand-light/30",
        textClass: "text-brand",
      };
    case PaymentStatusEnum.PENDING:
      return {
        label: isEn ? "Pending" : "Chờ thanh toán",
        badgeClass: "border-amber-300 bg-amber-50 dark:bg-amber-950/40",
        textClass: "text-amber-700 dark:text-amber-400",
      };
    case PaymentStatusEnum.EXPIRED:
      return {
        label: isEn ? "Expired" : "Đã hết hạn",
        badgeClass: "border-neutral-300 bg-neutral-100 dark:bg-neutral-800",
        textClass: "text-neutral-500",
      };
    case PaymentStatusEnum.CANCELLED:
      return {
        label: isEn ? "Cancelled" : "Đã hủy",
        badgeClass: "border-red-300 bg-red-50 dark:bg-red-950/40",
        textClass: "text-red-600 dark:text-red-400",
      };
    default:
      return {
        label: status,
        badgeClass: "border-neutral-300 bg-neutral-100",
        textClass: "text-neutral-500",
      };
  }
}

export default function PaymentsScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isEn = locale === "en";

  const [mainTab, setMainTab] = useState<MainTabType>("invoices");
  const [filter, setFilter] = useState<FilterType>("all");

  // Invoice detail & VietQR modal state
  const [detailInvoice, setDetailInvoice] = useState<InvoiceResponse | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrInvoice, setQrInvoice] = useState<InvoiceResponse | null>(null);
  const [qrPayment, setQrPayment] = useState<PaymentResponse | null>(null);

  // Refund status filter
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>("ALL");

  // Customer invoices query (recurring, first_period, incidental, check_out_settlement)
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    isRefetching: isInvoicesRefetching,
    isError: isInvoicesError,
    refetch: refetchInvoices,
  } = useMyInvoices({ limit: 50 });

  // Customer standalone payments query (reservation_deposit, contract_deposit, etc.)
  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isRefetching: isPaymentsRefetching,
    refetch: refetchPayments,
  } = useMyPayments({ limit: 50 });

  // Refunds query
  const {
    data: refundData,
    isLoading: isRefundsLoading,
    isRefetching: isRefundsRefetching,
    refetch: refetchRefunds,
  } = useCustomerRefunds({
    status:
      refundStatusFilter === "ALL" ? undefined : (refundStatusFilter as RefundRequestStatusEnum),
  });

  useFocusEffect(
    useCallback(() => {
      void refetchInvoices();
      void refetchPayments();
      void refetchRefunds();
    }, [refetchInvoices, refetchPayments, refetchRefunds])
  );

  const invoiceItems = useMemo(() => invoicesData?.items ?? [], [invoicesData?.items]);
  const paymentItems = useMemo(() => paymentsData?.items ?? [], [paymentsData?.items]);

  // Avoid double-counting payments that are already represented by an Invoice record
  const standalonePayments = useMemo(() => {
    const invoicePaymentIds = new Set(
      invoiceItems.map((inv) => inv.paymentId).filter((id): id is string => Boolean(id))
    );
    return paymentItems.filter((p) => !invoicePaymentIds.has(p.id));
  }, [invoiceItems, paymentItems]);

  const unpaidInvoices = useMemo(
    () =>
      invoiceItems
        .filter(isInvoicePayable)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [invoiceItems]
  );

  const overdueInvoicesCount = useMemo(
    () =>
      unpaidInvoices.filter((inv) => String(inv.status).toLowerCase() === InvoiceStatusEnum.OVERDUE)
        .length,
    [unpaidInvoices]
  );

  const pendingPayments = useMemo(
    () => standalonePayments.filter((p) => p.status === PaymentStatusEnum.PENDING),
    [standalonePayments]
  );

  const currentTotalDue = useMemo(() => {
    const invoicesDue = unpaidInvoices.reduce(
      (sum, inv) => sum + getInvoiceRemainingAmount(inv),
      0
    );
    const paymentsDue = pendingPayments.reduce(
      (sum, p) => sum + Math.max(0, p.amount - (p.paidAmount ?? 0)),
      0
    );
    return invoicesDue + paymentsDue;
  }, [unpaidInvoices, pendingPayments]);

  const pendingItemsCount = unpaidInvoices.length + pendingPayments.length;

  const filteredInvoices = useMemo(
    () =>
      invoiceItems.filter((inv) => {
        if (filter === "unpaid") return isInvoicePayable(inv);
        if (filter === "paid") {
          return String(inv.status).toLowerCase() === InvoiceStatusEnum.PAID;
        }
        return true;
      }),
    [invoiceItems, filter]
  );

  const filteredPayments = useMemo(
    () =>
      standalonePayments.filter((item) => {
        if (filter === "unpaid") return item.status === PaymentStatusEnum.PENDING;
        if (filter === "paid") return item.status === PaymentStatusEnum.PAID;
        return true;
      }),
    [standalonePayments, filter]
  );

  const totalFilteredCount = filteredInvoices.length + filteredPayments.length;
  const isBillingLoading = isInvoicesLoading || isPaymentsLoading;

  const handleOpenInvoiceQr = (invoice: InvoiceResponse) => {
    setQrPayment(null);
    setQrInvoice(invoice);
    setQrModalOpen(true);
  };

  const handleOpenPaymentQr = (payment: PaymentResponse) => {
    setQrInvoice(null);
    setQrPayment(payment);
    setQrModalOpen(true);
  };

  const handlePayEarliestDue = () => {
    if (unpaidInvoices.length > 0) {
      handleOpenInvoiceQr(unpaidInvoices[0]);
      return;
    }
    if (pendingPayments.length > 0) {
      handleOpenPaymentQr(pendingPayments[0]);
    }
  };

  const refundItems = refundData?.items || [];
  const totalPaidRefunds = refundItems
    .filter((r) => r.status === RefundRequestStatusEnum.PAID)
    .reduce((sum, item) => sum + item.amount, 0);

  const refundFilterTabs = [
    { key: "ALL", label: isEn ? "All" : "Tất cả" },
    { key: RefundRequestStatusEnum.PENDING_APPROVAL, label: isEn ? "Pending" : "Chờ duyệt" },
    { key: RefundRequestStatusEnum.APPROVED, label: isEn ? "Approved" : "Đã duyệt" },
    { key: RefundRequestStatusEnum.PAID, label: isEn ? "Paid" : "Đã hoàn" },
    { key: RefundRequestStatusEnum.REJECTED, label: isEn ? "Rejected" : "Từ chối" },
    { key: RefundRequestStatusEnum.CANCELLED, label: isEn ? "Cancelled" : "Đã hủy" },
  ];

  const isRefreshing = isInvoicesRefetching || isPaymentsRefetching || isRefundsRefetching;
  const onRefresh = async () => {
    await Promise.all([refetchInvoices(), refetchPayments(), refetchRefunds()]);
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <ScrollView
        contentContainerClassName="p-4 pb-16"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0B927E" />
        }
      >
        {/* Header Introduction */}
        <View className="mb-4">
          <Text variant="heading2" className="text-neutral-dark dark:text-neutral-100 font-bold">
            {t("customerTabs.paymentsTitle")}
          </Text>
          <Text variant="muted" className="mt-1 text-sm">
            {t("customerTabs.paymentsDesc")}
          </Text>
        </View>

        {/* Main Tab Segmented Control */}
        <View className="flex-row rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1 mb-5">
          <Pressable
            onPress={() => setMainTab("invoices")}
            className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row gap-1.5 ${
              mainTab === "invoices" ? "bg-white dark:bg-neutral-900 shadow-xs" : "bg-transparent"
            }`}
          >
            <Receipt size={15} color={mainTab === "invoices" ? "#0B927E" : "#647B80"} />
            <Text
              className={`text-xs font-bold ${
                mainTab === "invoices" ? "text-brand" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {isEn ? "Invoices & Due" : "Hóa đơn & Nợ phí"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMainTab("refunds")}
            className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row gap-1.5 ${
              mainTab === "refunds" ? "bg-white dark:bg-neutral-900 shadow-xs" : "bg-transparent"
            }`}
          >
            <RotateCcw size={15} color={mainTab === "refunds" ? "#0B927E" : "#647B80"} />
            <Text
              className={`text-xs font-bold ${
                mainTab === "refunds" ? "text-brand" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {isEn ? "Refund Requests" : "Lịch sử hoàn tiền"}
            </Text>
          </Pressable>
        </View>

        {/* -------------------- INVOICES TAB -------------------- */}
        {mainTab === "invoices" && (
          <>
            {/* 1. Outstanding Due Balance Card */}
            <View className="mb-6 rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
              <View className="flex-row items-center justify-between mb-2 gap-2">
                <Text
                  numberOfLines={1}
                  className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex-1 min-w-0"
                >
                  {t("payments.dueCardTitle")}
                </Text>
                {currentTotalDue > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-red-300 bg-red-50 dark:bg-red-950/40 shrink-0"
                  >
                    <Text
                      numberOfLines={1}
                      className="text-xs font-semibold text-red-600 dark:text-red-400"
                    >
                      {t("payments.statusUnpaid")}
                    </Text>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-brand/40 bg-brand-light/30 shrink-0">
                    <Text numberOfLines={1} className="text-xs font-semibold text-brand">
                      {t("payments.statusPaid")}
                    </Text>
                  </Badge>
                )}
              </View>

              <Text className="text-3xl font-extrabold text-brand mb-1">
                {currentTotalDue > 0 ? `${formatVnd(currentTotalDue)}` : "0 đ"}
              </Text>
              <Text variant="muted" className="text-xs mb-4">
                {currentTotalDue > 0
                  ? isEn
                    ? `You have ${pendingItemsCount} pending bill(s) to settle${
                        overdueInvoicesCount > 0 ? ` (${overdueInvoicesCount} overdue)` : ""
                      }.`
                    : `Bạn có ${pendingItemsCount} hóa đơn / khoản cần thanh toán${
                        overdueInvoicesCount > 0 ? ` (${overdueInvoicesCount} quá hạn)` : ""
                      }.`
                  : isEn
                    ? "All payments are up to date. No pending due balances."
                    : "Tất cả các khoản phí đã được thanh toán đầy đủ."}
              </Text>

              {currentTotalDue > 0 && pendingItemsCount > 0 && (
                <Pressable
                  onPress={handlePayEarliestDue}
                  className="flex-row items-center justify-center gap-2 rounded-xl bg-cta py-3.5 shadow-sm active:opacity-90"
                >
                  <QrCode size={18} color="#ffffff" />
                  <Text className="font-bold text-white text-sm">
                    {isEn ? "Pay Now (VietQR)" : "Quét mã VietQR thanh toán ngay"}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Invoices History Header & Filter */}
            <View className="gap-3 mb-6">
              <View className="flex-row items-center justify-between gap-2">
                <Text
                  variant="heading3"
                  className="flex-1 min-w-0 text-neutral-dark dark:text-neutral-100 font-bold"
                >
                  {t("payments.historyTitle")}
                </Text>
                <Text variant="muted" className="text-xs shrink-0">
                  {totalFilteredCount} {t("payments.itemsCount")}
                </Text>
              </View>

              {/* Filter Pills */}
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setFilter("all")}
                  className={`rounded-full px-3.5 py-1.5 border ${
                    filter === "all"
                      ? "bg-brand border-brand"
                      : "bg-white dark:bg-neutral-900 border-neutral-border dark:border-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      filter === "all" ? "text-white" : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    {t("payments.filterAll")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilter("unpaid")}
                  className={`rounded-full px-3.5 py-1.5 border ${
                    filter === "unpaid"
                      ? "bg-brand border-brand"
                      : "bg-white dark:bg-neutral-900 border-neutral-border dark:border-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      filter === "unpaid" ? "text-white" : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    {t("payments.filterUnpaid")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilter("paid")}
                  className={`rounded-full px-3.5 py-1.5 border ${
                    filter === "paid"
                      ? "bg-brand border-brand"
                      : "bg-white dark:bg-neutral-900 border-neutral-border dark:border-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      filter === "paid" ? "text-white" : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    {t("payments.filterPaid")}
                  </Text>
                </Pressable>
              </View>

              {isInvoicesError ? (
                <View className="flex-row items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3.5">
                  <AlertCircle size={16} color="#D97706" className="mt-0.5 shrink-0" />
                  <Text className="flex-1 text-xs text-amber-800 dark:text-amber-300">
                    {t("invoices.loadErrorNotice")}
                  </Text>
                </View>
              ) : null}

              {/* Loading State */}
              {isBillingLoading ? (
                <View className="py-12 items-center justify-center">
                  <ActivityIndicator size="large" color="#0B927E" />
                  <Text className="text-xs text-muted-foreground mt-2">
                    {isEn ? "Loading payments..." : "Đang tải danh sách thanh toán..."}
                  </Text>
                </View>
              ) : totalFilteredCount === 0 ? (
                <View className="py-14 items-center justify-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-border dark:border-neutral-800 p-6 text-center">
                  <Receipt size={36} color="#94A3B8" />
                  <Text className="font-bold text-foreground mt-3 text-sm">
                    {isEn ? "No payment records found" : "Không tìm thấy hóa đơn thanh toán nào"}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1 text-center">
                    {isEn
                      ? "Your recurring invoices, incidental fees, deposits, and rental payments will be listed here."
                      : "Các hóa đơn định kỳ, phụ phí, tiền đặt cọc và tiền thuê sẽ xuất hiện tại đây."}
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {/* 1. Invoices (recurring, first_period, incidental, check_out_settlement) */}
                  {filteredInvoices.map((invoice) => (
                    <InvoiceCard
                      key={`invoice-${invoice.id}`}
                      invoice={invoice}
                      onPressDetail={setDetailInvoice}
                      onPressPayQr={handleOpenInvoiceQr}
                    />
                  ))}

                  {/* 2. Standalone Payments (reservation_deposit, contract_deposit, etc.) */}
                  {filteredPayments.map((payment) => {
                    const statusMeta = getPaymentStatusMeta(payment.status, isEn);
                    const purposeTitle = getPaymentPurposeLabel(payment.purpose, isEn);
                    const isPending = payment.status === PaymentStatusEnum.PENDING;

                    return (
                      <View
                        key={`payment-${payment.id}`}
                        className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-2.5"
                      >
                        <View className="flex-row items-center justify-between gap-2">
                          <View className="flex-row items-center gap-1.5 flex-1 min-w-0 pr-2">
                            <Receipt size={16} color="#0B927E" className="shrink-0" />
                            <Text
                              className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100 flex-1"
                              numberOfLines={1}
                            >
                              #{payment.paymentCode}
                            </Text>
                          </View>
                          <Badge variant="outline" className={`${statusMeta.badgeClass} shrink-0`}>
                            <Text
                              numberOfLines={1}
                              className={`text-xs font-semibold ${statusMeta.textClass}`}
                            >
                              {statusMeta.label}
                            </Text>
                          </Badge>
                        </View>

                        <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                          {purposeTitle}
                        </Text>

                        <View className="flex-row items-center justify-between border-t border-neutral-border/60 dark:border-neutral-800/80 pt-2.5">
                          <View>
                            <Text className="text-base font-extrabold text-brand">
                              {formatVnd(payment.amount)}
                            </Text>
                            <Text variant="muted" className="text-[11px]">
                              {payment.paidAt
                                ? `${isEn ? "Paid at:" : "Thanh toán lúc:"} ${formatDateTime(payment.paidAt)}`
                                : payment.createdAt
                                  ? `${isEn ? "Created at:" : "Tạo lúc:"} ${formatDateTime(payment.createdAt)}`
                                  : ""}
                            </Text>
                          </View>

                          {/* If pending, show prominent QR scan button */}
                          {isPending ? (
                            <Pressable
                              onPress={() => handleOpenPaymentQr(payment)}
                              className="flex-row items-center gap-1.5 rounded-xl bg-cta px-3.5 py-2 active:opacity-90"
                            >
                              <QrCode size={14} color="#FFFFFF" />
                              <Text className="text-xs font-bold text-white">
                                {isEn ? "Pay with QR" : "Quét mã QR"}
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>

                        {/* Navigation helper pills to Contract / Reservation */}
                        {payment.contractId ? (
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: "/contracts/[id]" as any,
                                params: { id: payment.contractId },
                              })
                            }
                            className="flex-row items-center justify-end gap-1 pt-1"
                          >
                            <Text className="text-[11px] font-semibold text-brand">
                              {isEn ? "View Contract Details" : "Xem chi tiết Hợp đồng"}
                            </Text>
                            <ExternalLink size={12} color="#0B927E" />
                          </Pressable>
                        ) : payment.reservationId ? (
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: "/reservations/[id]" as any,
                                params: { id: payment.reservationId },
                              })
                            }
                            className="flex-row items-center justify-end gap-1 pt-1"
                          >
                            <Text className="text-[11px] font-semibold text-brand">
                              {isEn ? "View Reservation Details" : "Xem chi tiết Đặt chỗ"}
                            </Text>
                            <ExternalLink size={12} color="#0B927E" />
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}

        {/* -------------------- REFUNDS TAB -------------------- */}
        {mainTab === "refunds" && (
          <View className="gap-4">
            {/* Summary card */}
            <View className="p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-border dark:border-neutral-800 shadow-sm flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-muted-foreground font-semibold">
                  {isEn ? "Total Refunded" : "Tổng tiền đã hoàn cho bạn"}
                </Text>
                <Text className="text-2xl font-black text-brand-dark dark:text-brand-light mt-0.5">
                  {formatVnd(totalPaidRefunds)}
                </Text>
              </View>
              <View className="w-11 h-11 rounded-2xl bg-brand/10 items-center justify-center">
                <RotateCcw size={22} color="#0B927E" />
              </View>
            </View>

            {/* SLA notice banner (Rule 5) */}
            <View className="flex-row items-start gap-2.5 p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900">
              <ShieldCheck size={18} color="#0B927E" className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-teal-900 dark:text-teal-200">
                  {isEn ? "SLA Commitment" : "Cam kết thời gian hoàn tiền"}
                </Text>
                <Text className="text-xs text-teal-800 dark:text-teal-300 mt-0.5 leading-relaxed">
                  {isEn
                    ? `Estimated refund processing time is within ${ESTIMATED_SLA_DAYS} business days after approval.`
                    : `Thời gian hoàn tiền dự kiến trong vòng ${ESTIMATED_SLA_DAYS} ngày làm việc kể từ khi yêu cầu được phê duyệt.`}
                </Text>
              </View>
            </View>

            {/* Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row -mx-4 px-4 py-1"
            >
              {refundFilterTabs.map((tab) => {
                const active = refundStatusFilter === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setRefundStatusFilter(tab.key)}
                    className={`mr-2 px-3.5 py-1.5 rounded-full border ${
                      active
                        ? "bg-brand border-brand"
                        : "bg-white dark:bg-neutral-900 border-neutral-border dark:border-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-muted-foreground"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Refund cards list */}
            {isRefundsLoading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#0B927E" />
                <Text className="text-xs text-muted-foreground mt-2">
                  {isEn ? "Loading refund requests..." : "Đang tải danh sách hoàn tiền..."}
                </Text>
              </View>
            ) : refundItems.length === 0 ? (
              <View className="py-14 items-center justify-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-border dark:border-neutral-800 p-6 text-center">
                <RotateCcw size={36} color="#94A3B8" />
                <Text className="font-bold text-foreground mt-3 text-sm">
                  {isEn ? "No refund requests found" : "Không có yêu cầu hoàn tiền"}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1 text-center">
                  {isEn
                    ? "Refunds initiated from cancelled reservations or deposit settlements will appear here."
                    : "Các yêu cầu hoàn cọc từ việc hủy đơn hoặc quyết toán hợp đồng sẽ hiển thị ở đây."}
                </Text>
              </View>
            ) : (
              <View>
                {refundItems.map((item) => (
                  <RefundCard key={item.id} refund={item} />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        visible={Boolean(detailInvoice)}
        invoice={detailInvoice}
        onClose={() => setDetailInvoice(null)}
        onPressPayQr={handleOpenInvoiceQr}
      />

      {/* VietQR Payment Modal (supports both InvoiceResponse and standalone PaymentResponse) */}
      <InvoicePaymentQrModal
        visible={qrModalOpen}
        invoice={qrInvoice}
        payment={qrPayment}
        title={qrPayment ? getPaymentPurposeLabel(qrPayment.purpose, isEn) : undefined}
        onClose={() => {
          setQrModalOpen(false);
          setQrInvoice(null);
          setQrPayment(null);
        }}
        onPaidSuccess={() => {
          void refetchInvoices();
          void refetchPayments();
        }}
      />
    </SafeAreaView>
  );
}
