import React, { useState } from "react";
import { View, ScrollView, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { Headphones, PhoneCall, Send } from "lucide-react-native";

type IssueCategory = "catLock" | "catBilling" | "catFacility" | "catOther";

interface SupportTicket {
  id: string;
  code: string;
  category: IssueCategory;
  unitCode: string;
  details: string;
  createdAt: string;
  status: "open" | "inProgress" | "resolved";
}

export default function SupportScreen() {
  const { t } = useTranslation();
  const toast = useToast();

  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>("catLock");
  const [selectedUnit, setSelectedUnit] = useState("SHUB-HN-A102");
  const [issueDetails, setIssueDetails] = useState("");

  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: "tk-1",
      code: "TK-2026-881",
      category: "catLock",
      unitCode: "SHUB-HN-A102",
      details: "Khóa thông minh báo đèn vàng, cần kiểm tra kết nối gateway.",
      createdAt: "04/10/2026 09:30",
      status: "inProgress",
    },
    {
      id: "tk-2",
      code: "TK-2026-724",
      category: "catBilling",
      unitCode: "SHUB-HN-A102",
      details: "Yêu cầu cung cấp hóa đơn điện tử VAT cho công ty.",
      createdAt: "01/10/2026 14:15",
      status: "resolved",
    },
  ]);

  const handleCallHotline = () => {
    toast.info(t("support.hotlineToast"));
  };

  const handleSubmitTicket = () => {
    if (!issueDetails.trim()) {
      toast.warning(t("support.detailPlaceholder"));
      return;
    }

    const newTicket: SupportTicket = {
      id: `tk-${Date.now()}`,
      code: `TK-2026-${Math.floor(100 + Math.random() * 900)}`,
      category: selectedCategory,
      unitCode: selectedUnit,
      details: issueDetails.trim(),
      createdAt: "Hôm nay",
      status: "open",
    };

    setTickets((prev) => [newTicket, ...prev]);
    setIssueDetails("");
    toast.success(t("support.submitSuccess"));
  };

  const categoryOptions: { id: IssueCategory; labelKey: string }[] = [
    { id: "catLock", labelKey: "support.catLock" },
    { id: "catBilling", labelKey: "support.catBilling" },
    { id: "catFacility", labelKey: "support.catFacility" },
    { id: "catOther", labelKey: "support.catOther" },
  ];

  const getStatusBadge = (status: SupportTicket["status"]) => {
    if (status === "resolved") {
      return (
        <Badge variant="outline" className="border-brand/40 bg-brand-light/30">
          <Text className="text-xs font-semibold text-brand">{t("support.statusResolved")}</Text>
        </Badge>
      );
    }
    if (status === "inProgress") {
      return (
        <Badge variant="outline" className="border-cta/40 bg-cta-light/30">
          <Text className="text-xs font-semibold text-cta">{t("support.statusInProgress")}</Text>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-neutral-400 bg-neutral-100 dark:bg-neutral-800">
        <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          {t("support.statusOpen")}
        </Text>
      </Badge>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <ScrollView contentContainerClassName="p-4 pb-14" keyboardShouldPersistTaps="handled">
        {/* Header Introduction */}
        <View className="mb-4">
          <Text variant="heading2" className="text-neutral-dark dark:text-neutral-100 font-bold">
            {t("customerTabs.supportTitle")}
          </Text>
          <Text variant="muted" className="mt-1 text-sm">
            {t("customerTabs.supportDesc")}
          </Text>
        </View>

        {/* 1. Emergency 24/7 Hotline Banner */}
        <View className="mb-6 rounded-3xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-5 shadow-sm">
          <View className="flex-row items-center gap-2 mb-2">
            <PhoneCall size={20} color="#EF4444" />
            <Text className="text-sm font-bold text-red-600 dark:text-red-400">
              {t("support.hotlineCardTitle")}
            </Text>
          </View>

          <Text className="text-xs text-neutral-main dark:text-neutral-300 mb-4 leading-5">
            {t("support.hotlineCardDesc")}
          </Text>

          <Pressable
            onPress={handleCallHotline}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-red-600 py-3 shadow-sm active:opacity-90"
          >
            <PhoneCall size={16} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">{t("support.hotlineButton")}</Text>
          </Pressable>
        </View>

        {/* 2. Create Ticket Form */}
        <View className="mb-6 rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <View className="flex-row items-center gap-2 mb-4">
            <Headphones size={20} color="#0B927E" />
            <Text variant="title" className="font-bold text-neutral-dark dark:text-neutral-100">
              {t("support.createTicketTitle")}
            </Text>
          </View>

          {/* Issue Category Chips */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200 mb-2">
              {t("support.categoryLabel")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {categoryOptions.map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => setSelectedCategory(opt.id)}
                  className={`rounded-xl px-3 py-2 border ${
                    selectedCategory === opt.id
                      ? "border-brand bg-brand-light dark:bg-brand/20"
                      : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedCategory === opt.id
                        ? "text-brand"
                        : "text-neutral-dark dark:text-neutral-300"
                    }`}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Related Unit Selector */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200 mb-2">
              {t("support.unitLabel")}
            </Text>
            <View className="flex-row gap-2">
              {["SHUB-HN-A102", "SHUB-HN-A108"].map((code) => (
                <Pressable
                  key={code}
                  onPress={() => setSelectedUnit(code)}
                  className={`rounded-xl px-3.5 py-2 border ${
                    selectedUnit === code
                      ? "border-brand bg-brand-light dark:bg-brand/20"
                      : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedUnit === code
                        ? "text-brand"
                        : "text-neutral-dark dark:text-neutral-300"
                    }`}
                  >
                    #{code}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description Text Input */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200 mb-2">
              {t("support.detailLabel")}
            </Text>
            <TextInput
              value={issueDetails}
              onChangeText={setIssueDetails}
              placeholder={t("support.detailPlaceholder")}
              placeholderTextColor="#8C9E9E"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[100px] rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 p-3.5 text-xs text-neutral-dark dark:text-neutral-100"
            />
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmitTicket}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-brand py-3.5 shadow-sm active:opacity-90"
          >
            <Send size={16} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">{t("support.submitButton")}</Text>
          </Pressable>
        </View>

        {/* 3. Recent Tickets Tracker */}
        <View className="gap-3">
          <Text variant="title" className="font-bold text-neutral-dark dark:text-neutral-100">
            {t("support.recentTicketsTitle")}
          </Text>

          {tickets.map((tk) => (
            <View
              key={tk.id}
              className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs font-bold text-brand">#{tk.code}</Text>
                  <Text className="text-xs text-neutral-400">•</Text>
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                    #{tk.unitCode}
                  </Text>
                </View>
                {getStatusBadge(tk.status)}
              </View>

              <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200 mb-2 leading-5">
                {tk.details}
              </Text>

              <View className="flex-row items-center justify-between border-t border-neutral-border/60 dark:border-neutral-800/80 pt-2 mt-1">
                <Text variant="muted" className="text-xs">
                  {t(`support.${tk.category}`)}
                </Text>
                <Text variant="muted" className="text-xs">
                  {tk.createdAt}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
