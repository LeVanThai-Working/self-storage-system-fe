import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Image,
  AppState,
  type AppStateStatus,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import {
  MESSAGE_CODE,
  PaymentStatusEnum,
  type MessageLocale,
  type PaymentResponse,
} from "@self-storage-system-fe/shared";
import {
  ArrowLeft,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Timer,
  Building,
  ShieldAlert,
  XCircle,
  X,
} from "lucide-react-native";
import {
  useCancelPayment,
  useCreateOrGetDepositPayment,
  usePaymentPolling,
} from "@/features/reservations/hooks/usePayments";
import {
  formatDateTime,
  formatVnd,
  getCountdownRemaining,
  getPaymentStatusMeta,
  resolveReservationErrorMessage,
} from "@/features/reservations/utils/reservationFormat";

async function copyToClipboardSafe(text: string): Promise<void> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // Fallback handled by toast confirmation
  }
}

export default function ReservationPaymentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const isEn = currentLocale === "en";

  const params = useLocalSearchParams<{ id?: string; reservationId?: string }>();
  const reservationId = params.id || params.reservationId;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Track screen focus & foreground AppState so polling stops immediately on blur/background
  const [isScreenFocused, setIsScreenFocused] = useState<boolean>(true);
  const [isAppActive, setIsAppActive] = useState<boolean>(true);

  // Cancel payment modal state
  const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null);

  const hasHandledSuccessRef = useRef<boolean>(false);

  const initPaymentMutation = useCreateOrGetDepositPayment();
  const cancelPaymentMutation = useCancelPayment(reservationId);

  const initialPayment: PaymentResponse | null = initPaymentMutation.data?.data ?? null;
  const initError: string | null = initPaymentMutation.isError
    ? resolveReservationErrorMessage(initPaymentMutation.error, currentLocale, "payment").message
    : null;

  const initSession = useCallback(() => {
    if (!reservationId) return;
    initPaymentMutation.mutate(reservationId, {
      onError: (err) => {
        const resolved = resolveReservationErrorMessage(err, currentLocale, "payment");
        toast.error(resolved.message);
      },
    });
  }, [reservationId, initPaymentMutation, currentLocale, toast]);

  // Initialize or resume active payment session on mount
  useEffect(() => {
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  // Track screen focus
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  // Track AppState foreground/background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      setIsAppActive(nextState === "active");
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Poll `GET /payments/{payment.id}` every 4 seconds while focused & active
  const pollingQuery = usePaymentPolling({
    paymentId: initialPayment?.id,
    initialPayment,
    enabled: Boolean(initialPayment?.id) && isScreenFocused && isAppActive,
    pollingIntervalMs: 4000,
  });
  const { data: polledPayment, refetch: refetchPayment } = pollingQuery;

  const payment = polledPayment ?? initialPayment;
  const paymentStatus = payment?.status;
  const paymentExpiresAt = payment?.expiresAt;

  // Live countdown to `payment.expiresAt`
  const [nowMs, setNowMs] = useState(() => Date.now());
  const hasRefetchedOnExpiryRef = useRef<string | null>(null);

  const shouldTickCountdown =
    (paymentStatus === PaymentStatusEnum.PENDING ||
      paymentStatus === PaymentStatusEnum.PARTIALLY_PAID) &&
    Boolean(paymentExpiresAt);

  const countdown = shouldTickCountdown
    ? getCountdownRemaining(paymentExpiresAt, nowMs)
    : { isExpired: false, totalSeconds: 0, formatted: "" };

  useEffect(() => {
    if (!shouldTickCountdown || !paymentExpiresAt) {
      return;
    }

    const checkAndHandleExpiry = (currentNow: number) => {
      const next = getCountdownRemaining(paymentExpiresAt, currentNow);
      if (next.isExpired && hasRefetchedOnExpiryRef.current !== paymentExpiresAt) {
        hasRefetchedOnExpiryRef.current = paymentExpiresAt;
        void refetchPayment();
      }
      return next.isExpired;
    };

    if (checkAndHandleExpiry(Date.now())) {
      return;
    }

    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNowMs(currentNow);
      if (checkAndHandleExpiry(currentNow)) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [shouldTickCountdown, paymentExpiresAt, refetchPayment]);

  // React to payment status becoming PAID (Section 4.2)
  useEffect(() => {
    if (!paymentStatus) return;

    if (paymentStatus === PaymentStatusEnum.PAID && !hasHandledSuccessRef.current) {
      hasHandledSuccessRef.current = true;

      if (reservationId) {
        queryClient.invalidateQueries({
          queryKey: ["reservation-detail", reservationId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });

      toast.success(
        isEn
          ? "Deposit payment confirmed! Redirecting to reservation details..."
          : "Thanh toán tiền cọc thành công! Đang quay về chi tiết đơn đặt chỗ..."
      );

      const redirectTimer = setTimeout(() => {
        if (reservationId) {
          router.replace({
            pathname: "/reservations/[id]" as any,
            params: { id: reservationId },
          });
        } else if (router.canGoBack()) {
          router.back();
        }
      }, 2200);

      return () => clearTimeout(redirectTimer);
    }
  }, [paymentStatus, reservationId, queryClient, toast, isEn, router]);

  const handleBackToReservation = () => {
    if (reservationId) {
      queryClient.invalidateQueries({
        queryKey: ["reservation-detail", reservationId],
      });
    }
    if (router.canGoBack()) {
      router.back();
    } else if (reservationId) {
      router.replace({
        pathname: "/reservations/[id]" as any,
        params: { id: reservationId },
      });
    } else {
      router.replace("/(tabs)/reservations" as any);
    }
  };

  const handleCopy = async (key: string, value: string, label: string) => {
    await copyToClipboardSafe(value);
    setCopiedKey(key);
    toast.success(isEn ? `Copied ${label}: ${value}` : `Đã sao chép ${label}: ${value}`);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleManualCheck = async () => {
    if (!payment?.id) return;
    const result = await refetchPayment();
    const updated = result.data;
    if (updated?.status === PaymentStatusEnum.PAID) {
      toast.success(isEn ? "Deposit transfer verified!" : "Hệ thống đã ghi nhận đủ tiền đặt cọc!");
    } else if (updated?.status === PaymentStatusEnum.PARTIALLY_PAID) {
      toast.info(
        isEn
          ? `Received ${formatVnd(updated.paidAmount)}. Please transfer the remaining ${formatVnd(
              Math.max(0, updated.amount - updated.paidAmount)
            )}.`
          : `Đã nhận ${formatVnd(updated.paidAmount)}. Vui lòng chuyển thêm ${formatVnd(
              Math.max(0, updated.amount - updated.paidAmount)
            )}.`
      );
    } else {
      toast.info(
        isEn
          ? "Still waiting for SePay bank confirmation. We check automatically every 4 seconds."
          : "Hệ thống đang chờ ngân hàng xác nhận qua SePay (tự động kiểm tra mỗi 4 giây)."
      );
    }
  };

  const handleCancelPaymentSession = async () => {
    if (!payment?.id) return;
    const trimmed = cancelReason.trim();
    if (trimmed.length < 3) {
      setCancelReasonError(
        isEn
          ? "Please enter a reason (at least 3 characters)."
          : "Vui lòng nhập lý do hủy phiên thanh toán (tối thiểu 3 ký tự)."
      );
      return;
    }

    try {
      await cancelPaymentMutation.mutateAsync({
        paymentId: payment.id,
        payload: { cancellationReason: trimmed },
      });
      setCancelModalVisible(false);
      toast.info(isEn ? "Payment session cancelled." : "Đã hủy phiên thanh toán QR.");
      handleBackToReservation();
    } catch (err) {
      const resolved = resolveReservationErrorMessage(err, currentLocale, "payment");
      toast.error(resolved.message);
      if (resolved.messageCode === MESSAGE_CODE.MESSAGE_CODE_507) {
        setCancelModalVisible(false);
        pollingQuery.refetch();
      }
    }
  };

  if (initPaymentMutation.isPending && !payment) {
    return (
      <SafeAreaView key="payment-loading" className="flex-1 bg-neutral-bg dark:bg-neutral-950">
        <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-border dark:border-neutral-800">
          <Pressable onPress={handleBackToReservation} hitSlop={10} className="p-1">
            <ArrowLeft size={22} color="#0F172A" />
          </Pressable>
          <Skeleton className="h-6 w-52 rounded-lg" />
        </View>
        <View className="p-4 gap-4">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-52 w-full rounded-3xl" />
        </View>
      </SafeAreaView>
    );
  }

  if (initError || !payment) {
    return (
      <SafeAreaView key="payment-error" className="flex-1 bg-neutral-bg dark:bg-neutral-950">
        <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-border dark:border-neutral-800">
          <Pressable onPress={handleBackToReservation} hitSlop={10} className="p-1">
            <ArrowLeft size={22} color="#0F172A" />
          </Pressable>
          <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
            {isEn ? "VietQR Deposit Payment" : "Thanh toán tiền cọc VietQR"}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center p-6">
          <AlertTriangle size={42} color="#EF4444" />
          <Text className="mt-3 text-base font-bold text-neutral-dark dark:text-neutral-100 text-center">
            {initError ||
              (isEn
                ? "Unable to initialize payment session."
                : "Không thể khởi tạo phiên thanh toán.")}
          </Text>
          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={handleBackToReservation}
              className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5"
            >
              <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                {isEn ? "Back" : "Quay lại"}
              </Text>
            </Pressable>
            <Pressable onPress={initSession} className="rounded-xl bg-brand px-5 py-2.5">
              <Text className="text-xs font-bold text-white">{isEn ? "Retry" : "Thử lại"}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const statusMeta = getPaymentStatusMeta(payment.status, currentLocale);
  const remainingAmount = Math.max(0, (payment.amount ?? 0) - (payment.paidAmount ?? 0));
  const isPendingOrPartial =
    payment.status === PaymentStatusEnum.PENDING ||
    payment.status === PaymentStatusEnum.PARTIALLY_PAID;

  return (
    <SafeAreaView key="payment-loaded" className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Header with Borderless ArrowLeft Back Button */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-border dark:border-neutral-800">
        <View className="flex-row items-center gap-3 flex-1">
          <Pressable
            onPress={handleBackToReservation}
            hitSlop={10}
            className="p-1 active:opacity-70"
          >
            <ArrowLeft size={22} color="#0F172A" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100">
              {isEn ? "Deposit Payment (VietQR)" : "Thanh toán tiền cọc (VietQR)"}
            </Text>
            <Text variant="muted" className="text-[11px]">
              #{payment.paymentCode}
            </Text>
          </View>
        </View>

        <Badge
          variant="outline"
          className={`${statusMeta.badgeBorderClass} ${statusMeta.badgeBgClass} px-2.5 py-1`}
        >
          <Text className={`text-[11px] font-bold ${statusMeta.badgeTextClass}`}>
            {statusMeta.label}
          </Text>
        </Badge>
      </View>

      <ScrollView contentContainerClassName="p-4 pb-16 gap-4" showsVerticalScrollIndicator={false}>
        {/* ── Status Banner: PAID ── */}
        {payment.status === PaymentStatusEnum.PAID ? (
          <View className="rounded-3xl border border-brand bg-brand-light/35 dark:bg-brand/20 p-5 items-center gap-2">
            <CheckCircle2 size={44} color="#0B927E" />
            <Text className="text-base font-extrabold text-brand text-center">
              {isEn ? "100% Deposit Paid Successfully!" : "Đã thanh toán đủ 100% tiền cọc!"}
            </Text>
            <Text className="text-xs text-neutral-700 dark:text-neutral-200 text-center">
              {isEn
                ? `Paid Amount: ${formatVnd(payment.paidAmount)}`
                : `Số tiền hệ thống đã nhận: ${formatVnd(payment.paidAmount)}`}
            </Text>

            {payment.overpaidAmount > 0 ? (
              <View className="mt-2 w-full rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3">
                <Text className="text-xs font-bold text-amber-800 dark:text-amber-300 text-center">
                  {isEn
                    ? `You transferred an extra ${formatVnd(payment.overpaidAmount)}. This overpaid amount has been recorded on your payment profile.`
                    : `Bạn đã chuyển dư ${formatVnd(payment.overpaidAmount)}. Số tiền dư đã được hệ thống ghi nhận vào hồ sơ thanh toán.`}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleBackToReservation}
              className="mt-3 rounded-xl bg-brand px-6 py-3"
            >
              <Text className="text-xs font-bold text-white">
                {isEn ? "Return to Reservation Detail" : "Quay về chi tiết đơn đặt chỗ"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* ── Status Banner: PARTIALLY_PAID (Section 4.2) ── */}
        {payment.status === PaymentStatusEnum.PARTIALLY_PAID ? (
          <View className="rounded-3xl border border-cta bg-cta-light/30 dark:bg-cta/20 p-4 gap-1.5">
            <View className="flex-row items-center gap-2">
              <AlertTriangle size={18} color="#FF702E" />
              <Text className="text-xs font-extrabold text-cta flex-1">
                {isEn
                  ? "Partial Payment Received — Action Required"
                  : "Đã nhận một phần tiền cọc — Cần chuyển bổ sung"}
              </Text>
            </View>
            <Text className="text-xs text-neutral-700 dark:text-neutral-200 leading-4">
              {isEn
                ? `System has received ${formatVnd(payment.paidAmount)}. Please transfer the remaining ${formatVnd(remainingAmount)} with the exact same content "${payment.paymentCode}" to complete your deposit.`
                : `Hệ thống đã nhận được ${formatVnd(payment.paidAmount)}. Vui lòng chuyển thêm ${formatVnd(remainingAmount)} với cùng nội dung "${payment.paymentCode}" để hoàn tất đặt cọc.`}
            </Text>
          </View>
        ) : null}

        {/* ── Status Banner: EXPIRED or CANCELLED ── */}
        {payment.status === PaymentStatusEnum.EXPIRED ||
        payment.status === PaymentStatusEnum.CANCELLED ? (
          <View className="rounded-3xl border border-red-300 bg-red-50 dark:bg-red-950/40 p-5 items-center gap-2">
            <XCircle size={40} color="#EF4444" />
            <Text className="text-sm font-extrabold text-red-700 dark:text-red-300 text-center">
              {payment.status === PaymentStatusEnum.EXPIRED
                ? isEn
                  ? "Payment Session Expired"
                  : "Phiên thanh toán đã hết hạn"
                : isEn
                  ? "Payment Session Cancelled"
                  : "Phiên thanh toán đã bị hủy"}
            </Text>
            <Pressable
              onPress={handleBackToReservation}
              className="mt-2 rounded-xl bg-brand px-5 py-2.5"
            >
              <Text className="text-xs font-bold text-white">
                {isEn ? "Back to Reservation Detail" : "Quay lại chi tiết đơn đặt chỗ"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* ── Section 4.1: Dynamic SePay VietQR Card ── */}
        {isPendingOrPartial ? (
          <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm items-center">
            <View className="w-full flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <QrCode size={18} color="#0B927E" />
                <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                  {isEn ? "Scan VietQR Code" : "Quét mã VietQR tự động"}
                </Text>
              </View>

              {countdown.formatted && !countdown.isExpired ? (
                <Badge variant="outline" className="border-cta/50 bg-cta-light/30 px-2.5 py-1">
                  <View className="flex-row items-center gap-1">
                    <Timer size={12} color="#FF702E" />
                    <Text className="text-[11px] font-bold text-cta">{countdown.formatted}</Text>
                  </View>
                </Badge>
              ) : null}
            </View>

            {payment.qrUrl ? (
              <View
                key="qr-image-container"
                className="rounded-2xl border-2 border-brand/30 bg-white p-3 shadow-sm"
              >
                <Image
                  key={`${payment.qrUrl}-${payment.paidAmount}`}
                  source={{ uri: payment.qrUrl }}
                  style={{ width: 230, height: 230 }}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View
                key="qr-fallback-container"
                className="h-52 w-52 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50"
              >
                <QrCode size={42} color="#94A3B8" />
                <Text variant="muted" className="mt-2 text-xs text-center px-3">
                  {isEn
                    ? "QR image unavailable. Please use manual transfer details below."
                    : "Không tải được ảnh QR. Vui lòng chuyển khoản theo thông tin bên dưới."}
                </Text>
              </View>
            )}

            <View className="mt-3 items-center">
              <Text variant="muted" className="text-xs">
                {isEn ? "Amount to Transfer:" : "Số tiền cần chuyển:"}
              </Text>
              <Text className="text-2xl font-extrabold text-brand mt-0.5">
                {formatVnd(remainingAmount)}
              </Text>
              {payment.expiresAt ? (
                <Text variant="muted" className="text-[11px] mt-1">
                  {isEn ? "Valid until:" : "Hạn thanh toán:"} {formatDateTime(payment.expiresAt)}
                </Text>
              ) : null}
            </View>

            {/* Real-time Polling Status Indicator */}
            <View className="mt-3 w-full flex-row items-center justify-center gap-2 rounded-xl bg-brand-light/30 dark:bg-brand/15 py-2 px-3">
              <ActivityIndicator size="small" color="#0B927E" />
              <Text className="text-[11px] font-semibold text-brand">
                {isEn
                  ? "Auto-checking payment status every 4 seconds..."
                  : "Hệ thống đang tự động kiểm tra giao dịch mỗi 4 giây..."}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Manual Bank Transfer Details + Copy Buttons (Section 4.1) ── */}
        {isPendingOrPartial ? (
          <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
            <View className="flex-row items-center gap-2">
              <Building size={18} color="#0B927E" />
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Manual Bank Transfer Details" : "Thông tin chuyển khoản thủ công"}
              </Text>
            </View>

            <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3.5 gap-3">
              {/* Bank Code */}
              <View className="flex-row items-center justify-between">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Bank:" : "Ngân hàng:"}
                </Text>
                <Text className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
                  {payment.bankInfo?.bankCode || "VietQR / SePay"}
                </Text>
              </View>

              {/* Account Name */}
              <View className="flex-row items-center justify-between">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Account Holder:" : "Chủ tài khoản:"}
                </Text>
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {payment.bankInfo?.accountName || "—"}
                </Text>
              </View>

              {/* Account Number + Copy */}
              {payment.bankInfo?.accountNumber ? (
                <View className="flex-row items-center justify-between border-t border-neutral-200/70 dark:border-neutral-700/70 pt-2.5">
                  <View>
                    <Text variant="muted" className="text-[11px]">
                      {isEn ? "Account Number:" : "Số tài khoản:"}
                    </Text>
                    <Text className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100">
                      {payment.bankInfo.accountNumber}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      handleCopy(
                        "accountNumber",
                        payment.bankInfo!.accountNumber,
                        isEn ? "account number" : "số tài khoản"
                      )
                    }
                    className="flex-row items-center gap-1 rounded-xl border border-brand/40 bg-brand-light/30 px-3 py-1.5 active:opacity-80"
                  >
                    {copiedKey === "accountNumber" ? (
                      <Check size={13} color="#0B927E" />
                    ) : (
                      <Copy size={13} color="#0B927E" />
                    )}
                    <Text className="text-xs font-bold text-brand">
                      {copiedKey === "accountNumber"
                        ? isEn
                          ? "Copied"
                          : "Đã chép"
                        : isEn
                          ? "Copy"
                          : "Sao chép"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Amount + Copy */}
              <View className="flex-row items-center justify-between border-t border-neutral-200/70 dark:border-neutral-700/70 pt-2.5">
                <View>
                  <Text variant="muted" className="text-[11px]">
                    {isEn ? "Exact Amount:" : "Số tiền cần chuyển:"}
                  </Text>
                  <Text className="text-sm font-extrabold text-brand">
                    {formatVnd(remainingAmount)}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    handleCopy("amount", String(remainingAmount), isEn ? "amount" : "số tiền")
                  }
                  className="flex-row items-center gap-1 rounded-xl border border-brand/40 bg-brand-light/30 px-3 py-1.5 active:opacity-80"
                >
                  {copiedKey === "amount" ? (
                    <Check size={13} color="#0B927E" />
                  ) : (
                    <Copy size={13} color="#0B927E" />
                  )}
                  <Text className="text-xs font-bold text-brand">
                    {copiedKey === "amount"
                      ? isEn
                        ? "Copied"
                        : "Đã chép"
                      : isEn
                        ? "Copy"
                        : "Sao chép"}
                  </Text>
                </Pressable>
              </View>

              {/* Transfer Content (paymentCode) + Copy */}
              <View className="flex-row items-center justify-between border-t border-neutral-200/70 dark:border-neutral-700/70 pt-2.5">
                <View className="flex-1 pr-2">
                  <Text variant="muted" className="text-[11px]">
                    {isEn ? "Transfer Content (Required):" : "Nội dung chuyển khoản (Bắt buộc):"}
                  </Text>
                  <Text className="text-sm font-extrabold text-cta">{payment.paymentCode}</Text>
                </View>

                <Pressable
                  onPress={() =>
                    handleCopy(
                      "paymentCode",
                      payment.paymentCode,
                      isEn ? "transfer content" : "nội dung chuyển khoản"
                    )
                  }
                  className="flex-row items-center gap-1 rounded-xl border border-cta/50 bg-cta-light/30 px-3 py-1.5 active:opacity-80"
                >
                  {copiedKey === "paymentCode" ? (
                    <Check size={13} color="#FF702E" />
                  ) : (
                    <Copy size={13} color="#FF702E" />
                  )}
                  <Text className="text-xs font-bold text-cta">
                    {copiedKey === "paymentCode"
                      ? isEn
                        ? "Copied"
                        : "Đã chép"
                      : isEn
                        ? "Copy"
                        : "Sao chép"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Mandatory Warning Banner for Transfer Content */}
            <View className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3 flex-row items-start gap-2.5">
              <ShieldAlert size={18} color="#D97706" />
              <Text className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex-1 leading-4">
                {isEn
                  ? `IMPORTANT: You must keep the exact transfer content containing "${payment.paymentCode}" so SePay can automatically verify your deposit.`
                  : `Bắt buộc giữ nguyên nội dung chuyển khoản chứa mã "${payment.paymentCode}" để hệ thống SePay tự động gạch nợ.`}
              </Text>
            </View>

            {/* Manual Check Button & Cancel Session Button */}
            <View className="gap-2.5 pt-1">
              <Pressable
                onPress={handleManualCheck}
                disabled={pollingQuery.isFetching}
                className="flex-row items-center justify-center gap-2 rounded-2xl bg-cta py-3.5 shadow-sm active:opacity-90"
              >
                {pollingQuery.isFetching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <RefreshCw size={17} color="#FFFFFF" />
                )}
                <Text className="text-sm font-bold text-white">
                  {isEn
                    ? "I Have Transferred / Check Transaction"
                    : "Tôi đã chuyển khoản / Kiểm tra giao dịch"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setCancelReason(
                    isEn
                      ? "Customer cancelled QR payment session"
                      : "Khách hàng hủy phiên thanh toán QR"
                  );
                  setCancelReasonError(null);
                  setCancelModalVisible(true);
                }}
                className="flex-row items-center justify-center gap-1.5 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 py-3 active:opacity-85"
              >
                <XCircle size={15} color="#647B80" />
                <Text className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  {isEn ? "Cancel QR Payment Session" : "Hủy phiên thanh toán QR này"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Cancel Payment Session Modal (`POST /payments/{id}/cancel`) */}
      <Modal
        visible={cancelModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 items-center justify-center bg-black/50 p-5"
        >
          <View className="w-full rounded-3xl bg-white dark:bg-neutral-900 p-5 border border-neutral-border dark:border-neutral-800 gap-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Cancel Payment Session" : "Hủy phiên thanh toán QR"}
              </Text>
              <Pressable
                onPress={() => setCancelModalVisible(false)}
                className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
              >
                <X size={15} color="#647B80" />
              </Pressable>
            </View>

            <Text variant="muted" className="text-xs leading-4">
              {isEn
                ? "If you haven't transferred yet, you can cancel this QR session and create a new one later."
                : "Nếu bạn chưa chuyển khoản, bạn có thể đóng phiên QR này và tạo lại phiên mới sau."}
            </Text>

            <TextInput
              value={cancelReason}
              onChangeText={(val) => {
                setCancelReason(val.slice(0, 500));
                setCancelReasonError(null);
              }}
              placeholder={
                isEn
                  ? "Reason for cancelling (min 3 characters)..."
                  : "Lý do hủy phiên thanh toán (tối thiểu 3 ký tự)..."
              }
              placeholderTextColor="#94A3B8"
              className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2.5 text-xs text-neutral-dark dark:text-neutral-100"
            />

            {cancelReasonError ? (
              <Text className="text-xs font-semibold text-red-600 dark:text-red-400">
                {cancelReasonError}
              </Text>
            ) : null}

            <View className="flex-row gap-2.5 pt-1">
              <Pressable
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelPaymentMutation.isPending}
                className="flex-1 items-center justify-center rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 py-3"
              >
                <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {isEn ? "Keep Paying" : "Tiếp tục thanh toán"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCancelPaymentSession}
                disabled={cancelPaymentMutation.isPending}
                className="flex-1 items-center justify-center rounded-xl bg-red-600 py-3"
              >
                {cancelPaymentMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-xs font-bold text-white">
                    {isEn ? "Confirm Cancel" : "Xác nhận hủy"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
