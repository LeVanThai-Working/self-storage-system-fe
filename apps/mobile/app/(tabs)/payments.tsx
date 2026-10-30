import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  QrCode,
  Receipt,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  X,
  AlertCircle,
} from "lucide-react-native";
import { useCustomerRefunds } from "@/features/refunds/hooks/useRefunds";
import { RefundCard } from "@/features/refunds/components/RefundCard";
import { formatVnd } from "@/features/refunds/utils/refundFormat";
import { formatDateTime } from "@/features/contracts/utils/contractFormat";
import { useMyPayments } from "@/features/reservations/hooks/usePayments";
import { getPaymentByIdApi } from "@/features/reservations/api/payments.api";
import {
  ESTIMATED_SLA_DAYS,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  RefundRequestStatusEnum,
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
  const toast = useToast();

  const [mainTab, setMainTab] = useState<MainTabType>("invoices");
  const [filter, setFilter] = useState<FilterType>("all");

  // Payment QR Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<PaymentResponse | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Refund status filter
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>("ALL");

  // Real customer payments query
  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isRefetching: isPaymentsRefetching,
    refetch: refetchPayments,
  } = useMyPayments();

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
      void refetchPayments();
      void refetchRefunds();
    }, [refetchPayments, refetchRefunds])
  );

  // Auto-poll payment status while modal is open and payment is pending
  useEffect(() => {
    if (
      !paymentModalOpen ||
      !activePayment?.id ||
      activePayment.status !== PaymentStatusEnum.PENDING
    ) {
      return;
    }

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const latest = await getPaymentByIdApi(activePayment.id);
        if (!isSubscribed) return;
        if (latest.status === PaymentStatusEnum.PAID) {
          setActivePayment(latest);
          toast.success(
            isEn
              ? "Payment confirmed successfully! Updating records..."
              : "Đã xác nhận thanh toán thành công! Đang cập nhật dữ liệu..."
          );
          await refetchPayments();
          setPaymentModalOpen(false);
        } else if (
          latest.status === PaymentStatusEnum.CANCELLED ||
          latest.status === PaymentStatusEnum.EXPIRED
        ) {
          setActivePayment(latest);
        }
      } catch {
        // Silently swallow polling tick error
      }
    }, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [paymentModalOpen, activePayment?.id, activePayment?.status, isEn, refetchPayments, toast]);

  const paymentItems = paymentsData?.items ?? [];
  const pendingPayments = paymentItems.filter((p) => p.status === PaymentStatusEnum.PENDING);
  const currentTotalDue = pendingPayments.reduce(
    (sum, p) => sum + Math.max(0, p.amount - (p.paidAmount ?? 0)),
    0
  );

  const filteredPayments = paymentItems.filter((item) => {
    if (filter === "unpaid") return item.status === PaymentStatusEnum.PENDING;
    if (filter === "paid") return item.status === PaymentStatusEnum.PAID;
    return true;
  });

  const handleOpenPaymentQr = (payment: PaymentResponse) => {
    setActivePayment(payment);
    setPaymentModalOpen(true);
  };

  const handleCheckPaymentStatus = async () => {
    if (!activePayment?.id) return;
    setIsCheckingPayment(true);
    try {
      const latest = await getPaymentByIdApi(activePayment.id);
      setActivePayment(latest);
      if (latest.status === PaymentStatusEnum.PAID) {
        toast.success(
          isEn ? "Payment confirmed successfully!" : "Đã xác nhận thanh toán thành công!"
        );
        await refetchPayments();
        setPaymentModalOpen(false);
      } else {
        toast.info(
          isEn
            ? "Waiting for bank transfer confirmation..."
            : "Hệ thống đang chờ nhận giao dịch chuyển khoản..."
        );
      }
    } catch {
      toast.error(
        isEn
          ? "Unable to verify payment status right now."
          : "Không thể kiểm tra trạng thái thanh toán lúc này."
      );
    } finally {
      setIsCheckingPayment(false);
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

  const isRefreshing = isPaymentsRefetching || isRefundsRefetching;
  const onRefresh = async () => {
    await Promise.all([refetchPayments(), refetchRefunds()]);
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
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t("payments.dueCardTitle")}
                </Text>
                {currentTotalDue > 0 ? (
                  <Badge variant="outline" className="border-red-300 bg-red-50 dark:bg-red-950/40">
                    <Text className="text-xs font-semibold text-red-600 dark:text-red-400">
                      {t("payments.statusUnpaid")}
                    </Text>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-brand/40 bg-brand-light/30">
                    <Text className="text-xs font-semibold text-brand">
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
                    ? `You have ${pendingPayments.length} pending payment(s) to settle.`
                    : `Bạn có ${pendingPayments.length} khoản cần thanh toán.`
                  : isEn
                    ? "All payments are up to date. No pending due balances."
                    : "Tất cả các khoản phí đã được thanh toán đầy đủ."}
              </Text>

              {currentTotalDue > 0 && pendingPayments.length > 0 && (
                <Pressable
                  onPress={() => handleOpenPaymentQr(pendingPayments[0])}
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
              <View className="flex-row items-center justify-between">
                <Text
                  variant="heading3"
                  className="text-neutral-dark dark:text-neutral-100 font-bold"
                >
                  {t("payments.historyTitle")}
                </Text>
                <Text variant="muted" className="text-xs">
                  {filteredPayments.length} {t("payments.itemsCount")}
                </Text>
              </View>

              {/* Filter Pills */}
              <View className="flex-row gap-2">
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

              {/* Loading State */}
              {isPaymentsLoading ? (
                <View className="py-12 items-center justify-center">
                  <ActivityIndicator size="large" color="#0B927E" />
                  <Text className="text-xs text-muted-foreground mt-2">
                    {isEn ? "Loading payments..." : "Đang tải danh sách thanh toán..."}
                  </Text>
                </View>
              ) : filteredPayments.length === 0 ? (
                <View className="py-14 items-center justify-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-border dark:border-neutral-800 p-6 text-center">
                  <Receipt size={36} color="#94A3B8" />
                  <Text className="font-bold text-foreground mt-3 text-sm">
                    {isEn ? "No payment records found" : "Không tìm thấy hóa đơn thanh toán nào"}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1 text-center">
                    {isEn
                      ? "Your payments for reservations, deposits, and rentals will be listed here."
                      : "Các khoản phí đặt chỗ, tiền cọc và tiền thuê kỳ đầu sẽ xuất hiện tại đây."}
                  </Text>
                </View>
              ) : (
                /* Payments List */
                filteredPayments.map((payment) => {
                  const statusMeta = getPaymentStatusMeta(payment.status, isEn);
                  const purposeTitle = getPaymentPurposeLabel(payment.purpose, isEn);
                  const isPending = payment.status === PaymentStatusEnum.PENDING;

                  return (
                    <View
                      key={payment.id}
                      className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-2.5"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                          <Receipt size={16} color="#0B927E" />
                          <Text
                            className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100"
                            numberOfLines={1}
                          >
                            #{payment.paymentCode}
                          </Text>
                        </View>
                        <Badge variant="outline" className={statusMeta.badgeClass}>
                          <Text className={`text-xs font-semibold ${statusMeta.textClass}`}>
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
                })
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

      {/* VietQR Payment Modal */}
      <Modal
        visible={paymentModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white dark:bg-neutral-900 p-5 gap-4 max-h-[88%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100 flex-1 pr-2">
                {activePayment
                  ? getPaymentPurposeLabel(activePayment.purpose, isEn)
                  : isEn
                    ? "VietQR Payment"
                    : "Thanh toán VietQR"}
              </Text>
              <Pressable onPress={() => setPaymentModalOpen(false)} hitSlop={10}>
                <X size={20} color="#647B80" />
              </Pressable>
            </View>

            {activePayment ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5">
                {activePayment.qrUrl ? (
                  <View className="items-center rounded-2xl border border-neutral-border dark:border-neutral-800 bg-white p-4">
                    <Image
                      source={{ uri: activePayment.qrUrl }}
                      style={{ width: 220, height: 220 }}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}

                <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-3.5 gap-1.5">
                  <View className="flex-row justify-between">
                    <Text variant="muted" className="text-xs">
                      {isEn ? "Amount:" : "Số tiền cần chuyển:"}
                    </Text>
                    <Text className="text-sm font-extrabold text-brand">
                      {formatVnd(
                        Math.max(0, activePayment.amount - (activePayment.paidAmount ?? 0))
                      )}
                    </Text>
                  </View>

                  {activePayment.bankInfo ? (
                    <>
                      <View className="flex-row justify-between">
                        <Text variant="muted" className="text-xs">
                          {isEn ? "Bank:" : "Ngân hàng:"}
                        </Text>
                        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                          {activePayment.bankInfo.bankCode}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text variant="muted" className="text-xs">
                          {isEn ? "Account No:" : "Số tài khoản:"}
                        </Text>
                        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                          {activePayment.bankInfo.accountNumber}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text variant="muted" className="text-xs">
                          {isEn ? "Account Holder:" : "Chủ tài khoản:"}
                        </Text>
                        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                          {activePayment.bankInfo.accountName}
                        </Text>
                      </View>
                    </>
                  ) : null}

                  <View className="flex-row justify-between">
                    <Text variant="muted" className="text-xs">
                      {isEn ? "Payment Code:" : "Nội dung CK (Mã TT):"}
                    </Text>
                    <Text className="text-xs font-extrabold text-brand">
                      {activePayment.paymentCode}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
