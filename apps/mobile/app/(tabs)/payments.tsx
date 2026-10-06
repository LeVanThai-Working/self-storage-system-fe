import React, { useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { CreditCard, Receipt, Download, CheckCircle2, Wallet, Building } from "lucide-react-native";

interface InvoiceRecord {
  id: string;
  code: string;
  title: string;
  amount: string;
  numericAmount: number;
  date: string;
  status: "unpaid" | "paid";
}

type PaymentMethod = "vnpay" | "momo" | "vietqr";
type FilterType = "all" | "unpaid" | "paid";

export default function PaymentsScreen() {
  const { t } = useTranslation();
  const toast = useToast();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("vietqr");
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([
    {
      id: "inv-4",
      code: "INV-2026-004",
      title: "Tiền thuê kho A-102 (Tháng 10/2026)",
      amount: "1.800.000",
      numericAmount: 1800000,
      date: "25/10/2026",
      status: "unpaid",
    },
    {
      id: "inv-3",
      code: "INV-2026-003",
      title: "Tiền đặt cọc kho A-102 (Hoàn lại)",
      amount: "1.800.000",
      numericAmount: 1800000,
      date: "15/09/2026",
      status: "paid",
    },
    {
      id: "inv-2",
      code: "INV-2026-002",
      title: "Phí dịch vụ chuyển kho & bốc xếp",
      amount: "250.000",
      numericAmount: 250000,
      date: "15/09/2026",
      status: "paid",
    },
  ]);

  const unpaidInvoices = invoices.filter((i) => i.status === "unpaid");
  const currentTotalDue = unpaidInvoices.reduce((sum, item) => sum + item.numericAmount, 0);

  const handlePayNow = () => {
    if (unpaidInvoices.length === 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const targetInvoice = unpaidInvoices[0];
      setInvoices((prev) =>
        prev.map((item) => (item.id === targetInvoice.id ? { ...item, status: "paid" } : item))
      );
      toast.success(t("payments.paymentSuccess", { code: targetInvoice.code }));
    }, 1200);
  };

  const handleDownloadInvoice = (code: string) => {
    toast.success(t("payments.downloadSuccess", { code }));
  };

  const filteredInvoices = invoices.filter((item) => {
    if (filter === "unpaid") return item.status === "unpaid";
    if (filter === "paid") return item.status === "paid";
    return true;
  });

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <ScrollView contentContainerClassName="p-4 pb-14">
        {/* Header Introduction */}
        <View className="mb-4">
          <Text variant="heading2" className="text-neutral-dark dark:text-neutral-100 font-bold">
            {t("customerTabs.paymentsTitle")}
          </Text>
          <Text variant="muted" className="mt-1 text-sm">
            {t("customerTabs.paymentsDesc")}
          </Text>
        </View>

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
                <Text className="text-xs font-semibold text-brand">{t("payments.statusPaid")}</Text>
              </Badge>
            )}
          </View>

          <Text className="text-3xl font-extrabold text-brand mb-1">
            {currentTotalDue > 0 ? `${currentTotalDue.toLocaleString("vi-VN")} đ` : "0 đ"}
          </Text>
          <Text variant="muted" className="text-xs mb-4">
            {t("payments.dueDate")}
          </Text>

          {currentTotalDue > 0 && (
            <>
              {/* Payment Method Selector */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200 mb-2">
                  {t("payments.paymentMethod")}
                </Text>
                <View className="gap-2">
                  <Pressable
                    onPress={() => setSelectedMethod("vietqr")}
                    className={`flex-row items-center justify-between rounded-xl p-3 border ${
                      selectedMethod === "vietqr"
                        ? "border-brand bg-brand-light dark:bg-brand/20"
                        : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                    }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Building size={16} color="#0B927E" />
                      <Text
                        className={`text-xs font-bold ${
                          selectedMethod === "vietqr"
                            ? "text-brand"
                            : "text-neutral-dark dark:text-neutral-300"
                        }`}
                      >
                        {t("payments.methodVietqr")}
                      </Text>
                    </View>
                    {selectedMethod === "vietqr" && <CheckCircle2 size={16} color="#0B927E" />}
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMethod("vnpay")}
                    className={`flex-row items-center justify-between rounded-xl p-3 border ${
                      selectedMethod === "vnpay"
                        ? "border-brand bg-brand-light dark:bg-brand/20"
                        : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                    }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <CreditCard size={16} color="#0B927E" />
                      <Text
                        className={`text-xs font-bold ${
                          selectedMethod === "vnpay"
                            ? "text-brand"
                            : "text-neutral-dark dark:text-neutral-300"
                        }`}
                      >
                        {t("payments.methodVnpay")}
                      </Text>
                    </View>
                    {selectedMethod === "vnpay" && <CheckCircle2 size={16} color="#0B927E" />}
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMethod("momo")}
                    className={`flex-row items-center justify-between rounded-xl p-3 border ${
                      selectedMethod === "momo"
                        ? "border-brand bg-brand-light dark:bg-brand/20"
                        : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                    }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Wallet size={16} color="#FF702E" />
                      <Text
                        className={`text-xs font-bold ${
                          selectedMethod === "momo"
                            ? "text-brand"
                            : "text-neutral-dark dark:text-neutral-300"
                        }`}
                      >
                        {t("payments.methodMomo")}
                      </Text>
                    </View>
                    {selectedMethod === "momo" && <CheckCircle2 size={16} color="#0B927E" />}
                  </Pressable>
                </View>
              </View>

              {/* Pay Now Button */}
              <Pressable
                onPress={handlePayNow}
                disabled={isProcessing}
                className="flex-row items-center justify-center gap-2 rounded-xl bg-cta py-3.5 shadow-sm active:opacity-90"
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CreditCard size={16} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">{t("payments.payNow")}</Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </View>

        {/* 2. Transaction & Invoices History */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="title" className="font-bold text-neutral-dark dark:text-neutral-100">
              {t("payments.historyTitle")}
            </Text>
          </View>

          {/* Filter Pills */}
          <View className="flex-row gap-2 mb-1">
            <Pressable
              onPress={() => setFilter("all")}
              className={`rounded-full px-3 py-1 border ${
                filter === "all"
                  ? "border-brand bg-brand-light dark:bg-brand/20"
                  : "border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === "all" ? "text-brand" : "text-neutral-main dark:text-neutral-400"
                }`}
              >
                {t("payments.filterAll")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setFilter("unpaid")}
              className={`rounded-full px-3 py-1 border ${
                filter === "unpaid"
                  ? "border-brand bg-brand-light dark:bg-brand/20"
                  : "border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === "unpaid" ? "text-brand" : "text-neutral-main dark:text-neutral-400"
                }`}
              >
                {t("payments.filterPending")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setFilter("paid")}
              className={`rounded-full px-3 py-1 border ${
                filter === "paid"
                  ? "border-brand bg-brand-light dark:bg-brand/20"
                  : "border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === "paid" ? "text-brand" : "text-neutral-main dark:text-neutral-400"
                }`}
              >
                {t("payments.filterPaid")}
              </Text>
            </Pressable>
          </View>

          {/* Invoices List */}
          {filteredInvoices.map((inv) => (
            <View
              key={inv.id}
              className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Receipt size={16} color="#0B927E" />
                  <Text className="text-xs font-semibold text-neutral-400">#{inv.code}</Text>
                </View>
                <Badge
                  variant="outline"
                  className={
                    inv.status === "paid"
                      ? "border-brand/40 bg-brand-light/30"
                      : "border-red-300 bg-red-50 dark:bg-red-950/40"
                  }
                >
                  <Text
                    className={`text-xs font-semibold ${
                      inv.status === "paid" ? "text-brand" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {inv.status === "paid" ? t("payments.statusPaid") : t("payments.statusUnpaid")}
                  </Text>
                </Badge>
              </View>

              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100 mb-1">
                {inv.title}
              </Text>

              <View className="flex-row items-center justify-between border-t border-neutral-border/60 dark:border-neutral-800/80 pt-2.5 mt-2">
                <View>
                  <Text className="text-base font-bold text-brand">{inv.amount} đ</Text>
                  <Text variant="muted" className="text-xs">
                    {inv.date}
                  </Text>
                </View>

                {inv.status === "paid" && (
                  <Pressable
                    onPress={() => handleDownloadInvoice(inv.code)}
                    className="flex-row items-center gap-1.5 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 active:opacity-80"
                  >
                    <Download size={13} color="#647B80" />
                    <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                      {t("payments.downloadReceipt")}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
