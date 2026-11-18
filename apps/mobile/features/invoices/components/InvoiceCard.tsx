import React from "react";
import { Pressable, View } from "react-native";
import { Calendar, ChevronRight, Clock, FileText, QrCode } from "lucide-react-native";
import type { InvoiceResponse } from "@self-storage-system-fe/shared";
import { InvoiceStatusEnum } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import {
  formatDateShort,
  formatVnd,
  getEntityDisplayName,
  getInvoiceRemainingAmount,
  getInvoiceStatusMeta,
  getInvoiceTypeMeta,
  isInvoicePayable,
} from "../utils/invoiceFormat";

interface InvoiceCardProps {
  invoice: InvoiceResponse;
  onPressDetail: (invoice: InvoiceResponse) => void;
  onPressPayQr?: (invoice: InvoiceResponse) => void;
  hideContractMeta?: boolean;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onPressDetail,
  onPressPayQr,
  hideContractMeta = false,
}) => {
  const { t, locale } = useTranslation();
  const isEn = locale === "en";

  const statusMeta = getInvoiceStatusMeta(invoice.status, isEn);
  const typeMeta = getInvoiceTypeMeta(invoice.type, isEn);
  const payable = isInvoicePayable(invoice);
  const remainingAmount = getInvoiceRemainingAmount(invoice);
  const isOverdue = String(invoice.status).toLowerCase() === InvoiceStatusEnum.OVERDUE;
  const isIssued = String(invoice.status).toLowerCase() === InvoiceStatusEnum.ISSUED;

  const contractLabel = invoice.contract?.code || invoice.contract?.name;
  const facilityLabel = getEntityDisplayName(invoice.facility);
  const firstItemName = invoice.items?.[0]?.name;

  return (
    <Pressable
      onPress={() => onPressDetail(invoice)}
      className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-2.5 active:opacity-95"
    >
      {/* Top row: Invoice Code + Status Badge */}
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1.5 flex-1 min-w-0 pr-1">
          <FileText size={16} color="#0B927E" className="shrink-0" />
          <Text
            numberOfLines={1}
            className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100 flex-1"
          >
            #{invoice.invoiceCode}
          </Text>
        </View>

        <View
          className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-0.5 shrink-0 ${statusMeta.badgeClass}`}
        >
          <View
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusMeta.dotColor }}
          />
          <Text numberOfLines={1} className={`text-[11px] font-semibold ${statusMeta.textClass}`}>
            {statusMeta.label}
          </Text>
        </View>
      </View>

      {/* Type badge + Billing cycle index + Contract code */}
      <View className="flex-row flex-wrap items-center gap-1.5">
        <View className={`rounded-lg border px-2 py-0.5 ${typeMeta.badgeClass}`}>
          <Text numberOfLines={1} className={`text-[11px] font-semibold ${typeMeta.textClass}`}>
            {typeMeta.label}
          </Text>
        </View>

        {typeof invoice.billingPeriodIndex === "number" ? (
          <View className="rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
              {t("invoices.periodLabel", { index: invoice.billingPeriodIndex })}
            </Text>
          </View>
        ) : null}

        {!hideContractMeta && contractLabel ? (
          <Text
            numberOfLines={1}
            className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400"
          >
            • {contractLabel}
          </Text>
        ) : null}
      </View>

      {/* Primary item summary & facility */}
      {firstItemName ? (
        <Text
          numberOfLines={2}
          className="text-sm font-bold text-neutral-dark dark:text-neutral-100"
        >
          {firstItemName}
          {invoice.items.length > 1 ? ` (+${invoice.items.length - 1})` : ""}
        </Text>
      ) : null}

      {!hideContractMeta && facilityLabel !== "—" ? (
        <Text numberOfLines={1} variant="muted" className="text-[11px]">
          {t("invoices.facilityLabel")}: {facilityLabel}
        </Text>
      ) : null}

      {/* Billing period & due date */}
      <View className="rounded-xl bg-neutral-50 dark:bg-neutral-800/70 px-3 py-2 gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-1.5 shrink-0">
            <Calendar size={12} color="#647B80" />
            <Text variant="muted" className="text-[11px]">
              {t("invoices.billingCycle")}:
            </Text>
          </View>
          <Text
            numberOfLines={1}
            className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 flex-1 text-right"
          >
            {formatDateShort(invoice.periodStartDate)} → {formatDateShort(invoice.periodEndDate)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-1.5 shrink-0">
            <Clock size={12} color={isOverdue ? "#EF4444" : isIssued ? "#D97706" : "#647B80"} />
            <Text variant="muted" className="text-[11px]">
              {t("invoices.dueDateLabel")}:
            </Text>
          </View>
          <Text
            numberOfLines={1}
            className={`text-[11px] font-bold flex-1 text-right ${
              isOverdue
                ? "text-red-600 dark:text-red-400"
                : isIssued
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-neutral-700 dark:text-neutral-200"
            }`}
          >
            {formatDateShort(invoice.dueDate)}
          </Text>
        </View>
      </View>

      {/* Bottom row: Amount + QR / Details actions */}
      <View className="flex-row items-center justify-between gap-2 border-t border-neutral-border/60 dark:border-neutral-800/80 pt-2.5">
        <View className="flex-1 min-w-0">
          <Text className="text-base font-extrabold text-brand">
            {formatVnd(payable ? remainingAmount : invoice.totalAmount)}
          </Text>
          {invoice.paidAmount > 0 && payable ? (
            <Text variant="muted" className="text-[11px]">
              {t("invoices.paidLabel")}: {formatVnd(invoice.paidAmount)} /{" "}
              {formatVnd(invoice.totalAmount)}
            </Text>
          ) : (
            <Text variant="muted" className="text-[11px]">
              {t("invoices.totalAmount")}: {formatVnd(invoice.totalAmount)}
            </Text>
          )}
        </View>

        <View className="flex-row items-center gap-2 shrink-0">
          {payable && onPressPayQr ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onPressPayQr(invoice);
              }}
              className="flex-row items-center gap-1.5 rounded-xl bg-cta px-3 py-2 active:opacity-90"
            >
              <QrCode size={14} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">{t("invoices.payWithQr")}</Text>
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-0.5 py-1">
              <Text className="text-xs font-semibold text-brand">{t("invoices.viewDetail")}</Text>
              <ChevronRight size={14} color="#0B927E" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};
