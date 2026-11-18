import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, ShieldCheck, Timer, X } from "lucide-react-native";
import {
  PaymentStatusEnum,
  type InvoiceResponse,
  type MessageLocale,
  type PaymentResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { getPaymentByIdApi } from "@/features/reservations/api/payments.api";
import { createInvoicePaymentApi } from "../api/invoices.api";
import { INVOICE_QUERY_KEYS } from "../hooks/useInvoices";
import {
  formatVnd,
  getCountdownRemaining,
  resolveReservationErrorMessage,
} from "../utils/invoiceFormat";

interface InvoicePaymentQrModalProps {
  visible: boolean;
  invoice?: InvoiceResponse | null;
  payment?: PaymentResponse | null;
  title?: string;
  onClose: () => void;
  onPaidSuccess?: (payment: PaymentResponse) => void;
}

const InvoicePaymentQrModalBody: React.FC<Omit<InvoicePaymentQrModalProps, "visible">> = ({
  invoice,
  payment: initialPaymentProp,
  title,
  onClose,
  onPaidSuccess,
}) => {
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const isEn = currentLocale === "en";
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isAppActive, setIsAppActive] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const handledPaidIdRef = useRef<string | null>(null);

  const sessionQuery = useQuery({
    queryKey: ["invoice-payment-session", invoice?.id ?? ""],
    queryFn: () => createInvoicePaymentApi(invoice!.id),
    enabled: !initialPaymentProp && Boolean(invoice?.id),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  const basePayment = initialPaymentProp ?? sessionQuery.data ?? null;

  const pollingQuery = useQuery({
    queryKey: ["invoice-payment-polling", basePayment?.id ?? ""],
    queryFn: () => getPaymentByIdApi(basePayment!.id),
    enabled:
      isAppActive && Boolean(basePayment?.id) && basePayment?.status === PaymentStatusEnum.PENDING,
    refetchInterval: (query) => {
      if (!isAppActive) return false;
      const status = query.state.data?.status ?? basePayment?.status;
      return status === PaymentStatusEnum.PENDING ? 2500 : false;
    },
    refetchIntervalInBackground: false,
  });

  const activePayment = pollingQuery.data ?? basePayment;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      setIsAppActive(nextState === "active");
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!activePayment?.expiresAt) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activePayment?.expiresAt]);

  const handlePaymentConfirmed = useCallback(
    async (latest: PaymentResponse) => {
      toast.success(
        isEn
          ? "Payment confirmed successfully! Updating records..."
          : "Đã xác nhận thanh toán thành công! Đang cập nhật dữ liệu..."
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: ["my-payments"] }),
        queryClient.invalidateQueries({ queryKey: ["my-contracts"] }),
      ]);
      onPaidSuccess?.(latest);
      onClose();
    },
    [isEn, onClose, onPaidSuccess, queryClient, toast]
  );

  useEffect(() => {
    if (!activePayment || activePayment.status !== PaymentStatusEnum.PAID) {
      return;
    }
    if (handledPaidIdRef.current === activePayment.id) return;
    handledPaidIdRef.current = activePayment.id;
    void handlePaymentConfirmed(activePayment);
  }, [activePayment, handlePaymentConfirmed]);

  const handleManualCheck = async () => {
    if (!activePayment?.id) return;
    setIsCheckingPayment(true);
    try {
      const latest = await getPaymentByIdApi(activePayment.id);
      if (latest.status === PaymentStatusEnum.PAID) {
        if (handledPaidIdRef.current !== latest.id) {
          handledPaidIdRef.current = latest.id;
          await handlePaymentConfirmed(latest);
        }
      } else {
        await pollingQuery.refetch();
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

  const isInitializing =
    !initialPaymentProp && (sessionQuery.isPending || sessionQuery.isFetching) && !activePayment;
  const initError =
    !initialPaymentProp && sessionQuery.isError
      ? resolveReservationErrorMessage(sessionQuery.error, currentLocale, "payment").message
      : null;

  const bankCode = activePayment?.bankInfo?.bankCode || activePayment?.bankAccount?.bankName || "—";
  const accountNumber =
    activePayment?.bankInfo?.accountNumber || activePayment?.bankAccount?.accountNumber || "—";
  const accountName =
    activePayment?.bankInfo?.accountName ||
    activePayment?.bankAccount?.accountHolder ||
    activePayment?.bankAccount?.accountName ||
    "—";
  const remainingAmount = activePayment
    ? Math.max(0, activePayment.amount - (activePayment.paidAmount ?? 0))
    : invoice
      ? Math.max(0, invoice.totalAmount - (invoice.paidAmount ?? 0))
      : 0;
  const countdown = getCountdownRemaining(activePayment?.expiresAt, nowMs);

  const headerTitle =
    title ||
    (invoice
      ? `${t("invoices.qrModalTitle")} • #${invoice.invoiceCode}`
      : t("invoices.qrModalTitle"));

  return (
    <View className="flex-1 justify-end bg-black/50">
      <View className="rounded-t-3xl bg-white dark:bg-neutral-900 p-5 gap-4 max-h-[90%]">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            className="text-base font-extrabold text-neutral-dark dark:text-neutral-100 flex-1 pr-2"
          >
            {headerTitle}
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <X size={20} color="#647B80" />
          </Pressable>
        </View>

        {isInitializing ? (
          <View className="py-12 items-center justify-center gap-3">
            <ActivityIndicator size="large" color="#0B927E" />
            <Text variant="muted" className="text-xs text-center">
              {t("invoices.qrLoading")}
            </Text>
          </View>
        ) : initError ? (
          <View className="gap-3 py-4">
            <View className="flex-row items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4">
              <AlertCircle size={18} color="#DC2626" className="mt-0.5 shrink-0" />
              <Text className="flex-1 text-xs font-medium text-red-700 dark:text-red-300">
                {initError}
              </Text>
            </View>
            {invoice?.id ? (
              <Pressable
                onPress={() => void sessionQuery.refetch()}
                className="flex-row items-center justify-center gap-2 rounded-xl bg-brand py-3 active:opacity-90"
              >
                <RefreshCw size={15} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">{t("invoices.qrRetry")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : activePayment ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5 pb-2">
            {activePayment.expiresAt ? (
              <View className="flex-row items-center justify-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 py-2 px-3">
                <Timer size={14} color={countdown.isExpired ? "#DC2626" : "#D97706"} />
                <Text
                  className={`text-xs font-bold ${
                    countdown.isExpired
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {countdown.isExpired
                    ? t("invoices.qrExpired")
                    : t("invoices.qrExpiresIn", { time: countdown.formatted })}
                </Text>
              </View>
            ) : null}

            {activePayment.qrUrl ? (
              <View className="items-center rounded-2xl border border-neutral-border dark:border-neutral-800 bg-white p-4 gap-2">
                <Image
                  source={{ uri: activePayment.qrUrl }}
                  style={{ width: 220, height: 220 }}
                  resizeMode="contain"
                />
                <View className="flex-row items-center gap-1">
                  <ShieldCheck size={13} color="#0B927E" />
                  <Text className="text-[11px] font-semibold text-brand">
                    {t("invoices.qrAutoChecking")}
                  </Text>
                </View>
              </View>
            ) : null}

            <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-3.5 gap-2">
              <View className="flex-row justify-between items-center">
                <Text variant="muted" className="text-xs">
                  {t("invoices.qrAmount")}
                </Text>
                <Text className="text-sm font-extrabold text-brand">
                  {formatVnd(remainingAmount)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text variant="muted" className="text-xs">
                  {t("invoices.qrBank")}
                </Text>
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {bankCode}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text variant="muted" className="text-xs">
                  {t("invoices.qrAccountNumber")}
                </Text>
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {accountNumber}
                </Text>
              </View>

              <View className="flex-row justify-between items-center gap-2">
                <Text variant="muted" className="text-xs shrink-0">
                  {t("invoices.qrAccountHolder")}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-xs font-bold text-neutral-dark dark:text-neutral-100 flex-1 text-right"
                >
                  {accountName}
                </Text>
              </View>

              <View className="flex-row justify-between items-center border-t border-neutral-200 dark:border-neutral-700 pt-2">
                <Text variant="muted" className="text-xs">
                  {t("invoices.qrPaymentCode")}
                </Text>
                <Text className="text-xs font-extrabold text-brand">
                  {activePayment.paymentCode}
                </Text>
              </View>
            </View>

            {activePayment.status === PaymentStatusEnum.PENDING ? (
              <Pressable
                onPress={handleManualCheck}
                disabled={isCheckingPayment}
                className="flex-row items-center justify-center gap-2 rounded-xl bg-brand py-3 active:opacity-90"
              >
                {isCheckingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <RefreshCw size={15} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">
                      {t("invoices.qrCheckStatus")}
                    </Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
};

export const InvoicePaymentQrModal: React.FC<InvoicePaymentQrModalProps> = ({
  visible,
  invoice,
  payment,
  title,
  onClose,
  onPaidSuccess,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <InvoicePaymentQrModalBody
          key={invoice?.id ?? payment?.id ?? "empty"}
          invoice={invoice}
          payment={payment}
          title={title}
          onClose={onClose}
          onPaidSuccess={onPaidSuccess}
        />
      ) : null}
    </Modal>
  );
};
