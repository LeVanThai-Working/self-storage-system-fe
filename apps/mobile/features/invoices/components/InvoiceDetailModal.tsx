import React from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { AlertTriangle, ExternalLink, FileText, QrCode, X, XCircle } from "lucide-react-native";
import { InvoiceStatusEnum, type InvoiceResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useInvoiceDetail } from "../hooks/useInvoices";
import {
  formatDateShort,
  formatDateTime,
  formatVnd,
  getEntityDisplayName,
  getInvoiceItemTypeLabel,
  getInvoiceRemainingAmount,
  getInvoiceStatusMeta,
  getInvoiceTypeMeta,
  isInvoicePayable,
  localizeInvoiceItemDescription,
} from "../utils/invoiceFormat";

interface InvoiceDetailModalProps {
  visible: boolean;
  invoice: InvoiceResponse | null;
  onClose: () => void;
  onPressPayQr?: (invoice: InvoiceResponse) => void;
  hideContractLink?: boolean;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  visible,
  invoice,
  onClose,
  onPressPayQr,
  hideContractLink = false,
}) => {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isEn = locale === "en";

  const detailQuery = useInvoiceDetail(invoice?.id, visible);
  const resolvedInvoice = detailQuery.data ?? invoice;

  if (!resolvedInvoice) return null;

  const statusMeta = getInvoiceStatusMeta(resolvedInvoice.status, isEn);
  const typeMeta = getInvoiceTypeMeta(resolvedInvoice.type, isEn);
  const payable = isInvoicePayable(resolvedInvoice);
  const remainingAmount = getInvoiceRemainingAmount(resolvedInvoice);
  const isOverdue = String(resolvedInvoice.status).toLowerCase() === InvoiceStatusEnum.OVERDUE;
  const isCancelled = String(resolvedInvoice.status).toLowerCase() === InvoiceStatusEnum.CANCELLED;

  const handleOpenContract = () => {
    if (!resolvedInvoice.contractId) return;
    onClose();
    router.push({
      pathname: "/contracts/[id]" as any,
      params: { id: resolvedInvoice.contractId },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white dark:bg-neutral-900 p-5 gap-4 max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 min-w-0 gap-1.5">
              <View className="flex-row items-center gap-2">
                <FileText size={18} color="#0B927E" />
                <Text
                  numberOfLines={1}
                  className="text-base font-extrabold text-neutral-dark dark:text-neutral-100 flex-1"
                >
                  #{resolvedInvoice.invoiceCode}
                </Text>
              </View>

              <View className="flex-row flex-wrap items-center gap-1.5">
                <View
                  className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${statusMeta.badgeClass}`}
                >
                  <View
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: statusMeta.dotColor }}
                  />
                  <Text className={`text-[11px] font-semibold ${statusMeta.textClass}`}>
                    {statusMeta.label}
                  </Text>
                </View>

                <View className={`rounded-lg border px-2 py-0.5 ${typeMeta.badgeClass}`}>
                  <Text className={`text-[11px] font-semibold ${typeMeta.textClass}`}>
                    {typeMeta.label}
                  </Text>
                </View>

                {typeof resolvedInvoice.billingPeriodIndex === "number" ? (
                  <View className="rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5">
                    <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                      {t("invoices.periodLabel", { index: resolvedInvoice.billingPeriodIndex })}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={10} className="p-1">
              <X size={20} color="#647B80" />
            </Pressable>
          </View>

          {detailQuery.isFetching && !detailQuery.data ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#0B927E" />
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5 pb-2">
            {/* Overdue warning */}
            {isOverdue ? (
              <View className="flex-row items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-3.5">
                <AlertTriangle size={18} color="#DC2626" className="mt-0.5 shrink-0" />
                <View className="flex-1 gap-0.5">
                  <Text className="text-xs font-bold text-red-800 dark:text-red-300">
                    {t("invoices.overdueTitle")}
                  </Text>
                  <Text className="text-[11px] text-red-700 dark:text-red-400 leading-4">
                    {t("invoices.overdueDesc")}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Cancellation notice */}
            {isCancelled ? (
              <View className="rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 p-3.5 gap-1">
                <View className="flex-row items-center gap-1.5">
                  <XCircle size={15} color="#DC2626" />
                  <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                    {t("invoices.cancelledTitle")}
                  </Text>
                </View>
                {resolvedInvoice.cancelReason ? (
                  <Text className="text-xs text-neutral-600 dark:text-neutral-300">
                    {t("invoices.cancelReason")}: {resolvedInvoice.cancelReason}
                  </Text>
                ) : null}
                {resolvedInvoice.cancelledAt ? (
                  <Text variant="muted" className="text-[11px]">
                    {formatDateTime(resolvedInvoice.cancelledAt)}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Contract & Billing Schedule Summary */}
            <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3.5 gap-2">
              <View className="flex-row items-center justify-between gap-2">
                <Text variant="muted" className="text-xs">
                  {t("invoices.contractLabel")}:
                </Text>
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {resolvedInvoice.contract?.code || resolvedInvoice.contractId}
                </Text>
              </View>

              <View className="flex-row items-center justify-between gap-2">
                <Text variant="muted" className="text-xs">
                  {t("invoices.facilityLabel")}:
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-xs font-semibold text-neutral-dark dark:text-neutral-100 flex-1 text-right"
                >
                  {getEntityDisplayName(resolvedInvoice.facility)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between gap-2">
                <Text variant="muted" className="text-xs">
                  {t("invoices.billingCycle")}:
                </Text>
                <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-100">
                  {formatDateShort(resolvedInvoice.periodStartDate)} →{" "}
                  {formatDateShort(resolvedInvoice.periodEndDate)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between gap-2">
                <Text variant="muted" className="text-xs">
                  {t("invoices.dueDateLabel")}:
                </Text>
                <Text
                  className={`text-xs font-bold ${
                    isOverdue
                      ? "text-red-600 dark:text-red-400"
                      : payable
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-neutral-dark dark:text-neutral-100"
                  }`}
                >
                  {formatDateShort(resolvedInvoice.dueDate)}
                </Text>
              </View>
            </View>

            {/* Line Items */}
            <View className="gap-2">
              <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t("invoices.itemsSectionTitle")}
              </Text>
              <View className="rounded-2xl border border-neutral-border dark:border-neutral-800 overflow-hidden">
                {(resolvedInvoice.items ?? []).map((item, idx) => (
                  <View
                    key={`${item.name}-${idx}`}
                    className={`p-3 gap-1 ${
                      idx > 0 ? "border-t border-neutral-border/70 dark:border-neutral-800" : ""
                    }`}
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1 min-w-0 gap-0.5">
                        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                          {item.name}
                        </Text>
                        {item.description ? (
                          <Text variant="muted" className="text-[11px]">
                            {localizeInvoiceItemDescription(item.description, isEn)}
                          </Text>
                        ) : null}
                      </View>

                      <Text className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100 shrink-0">
                        {formatVnd(item.amount)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between gap-2 pt-0.5">
                      <View className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                          {getInvoiceItemTypeLabel(item.itemType, isEn)}
                        </Text>
                      </View>
                      <Text variant="muted" className="text-[11px]">
                        {t("invoices.qtyUnitPrice", {
                          qty: item.quantity,
                          price: formatVnd(item.unitPrice),
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Financial Totals */}
            <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3.5 gap-1.5">
              <View className="flex-row justify-between">
                <Text variant="muted" className="text-xs">
                  {t("invoices.subtotal")}:
                </Text>
                <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-100">
                  {formatVnd(resolvedInvoice.subtotal)}
                </Text>
              </View>

              {resolvedInvoice.discountAmount > 0 ? (
                <View className="flex-row justify-between">
                  <Text variant="muted" className="text-xs">
                    {t("invoices.discount")}:
                  </Text>
                  <Text className="text-xs font-semibold text-brand">
                    -{formatVnd(resolvedInvoice.discountAmount)}
                  </Text>
                </View>
              ) : null}

              {resolvedInvoice.taxAmount > 0 ? (
                <View className="flex-row justify-between">
                  <Text variant="muted" className="text-xs">
                    {t("invoices.tax")}:
                  </Text>
                  <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-100">
                    {formatVnd(resolvedInvoice.taxAmount)}
                  </Text>
                </View>
              ) : null}

              <View className="flex-row justify-between border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-1">
                <Text className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
                  {t("invoices.totalAmount")}:
                </Text>
                <Text className="text-sm font-extrabold text-brand">
                  {formatVnd(resolvedInvoice.totalAmount)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text variant="muted" className="text-xs">
                  {t("invoices.paidAmount")}:
                </Text>
                <Text className="text-xs font-bold text-brand">
                  {formatVnd(resolvedInvoice.paidAmount)}
                </Text>
              </View>

              {payable && resolvedInvoice.paidAmount > 0 ? (
                <View className="flex-row justify-between">
                  <Text className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {t("invoices.remainingLabel")}:
                  </Text>
                  <Text className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                    {formatVnd(remainingAmount)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Counter proof image */}
            {resolvedInvoice.proofImageUrl ? (
              <View className="rounded-2xl border border-neutral-border dark:border-neutral-800 p-3 gap-2">
                <Text className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  {t("invoices.proofImageTitle")}
                </Text>
                <Image
                  source={{ uri: resolvedInvoice.proofImageUrl }}
                  className="h-40 w-full rounded-xl bg-neutral-100 dark:bg-neutral-800"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => {
                    if (resolvedInvoice.proofImageUrl) {
                      void Linking.openURL(resolvedInvoice.proofImageUrl);
                    }
                  }}
                  className="flex-row items-center justify-center gap-1.5 py-1"
                >
                  <ExternalLink size={13} color="#0B927E" />
                  <Text className="text-xs font-semibold text-brand">
                    {t("invoices.openProofImage")}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer actions */}
          <View className="gap-2 border-t border-neutral-border/70 dark:border-neutral-800 pt-3">
            {payable && onPressPayQr ? (
              <Pressable
                onPress={() => {
                  onClose();
                  onPressPayQr(resolvedInvoice);
                }}
                className="flex-row items-center justify-center gap-2 rounded-xl bg-cta py-3.5 active:opacity-90"
              >
                <QrCode size={18} color="#FFFFFF" />
                <Text className="text-sm font-bold text-white">{t("invoices.payNowQr")}</Text>
              </Pressable>
            ) : null}

            {!hideContractLink && resolvedInvoice.contractId ? (
              <Pressable
                onPress={handleOpenContract}
                className="flex-row items-center justify-center gap-1.5 rounded-xl border border-neutral-border dark:border-neutral-700 py-2.5 active:opacity-80"
              >
                <Text className="text-xs font-semibold text-brand">
                  {t("invoices.viewContract")}
                </Text>
                <ExternalLink size={13} color="#0B927E" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};
