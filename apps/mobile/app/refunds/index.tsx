import React, { useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { ArrowLeft, RotateCcw, ShieldCheck, Wallet } from "lucide-react-native";
import { useTranslation } from "@/stores/language.store";
import { useCustomerRefunds } from "@/features/refunds/hooks/useRefunds";
import { RefundCard } from "@/features/refunds/components/RefundCard";
import { formatVnd } from "@/features/refunds/utils/refundFormat";
import { RefundRequestStatusEnum } from "@self-storage-system-fe/shared";

type StatusFilter = "ALL" | RefundRequestStatusEnum;

export default function CustomerRefundsListScreen() {
  const router = useRouter();
  const { locale } = useTranslation();
  const isEn = locale === "en";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const queryParams = {
    status: statusFilter === "ALL" ? undefined : statusFilter,
  };

  const { data, isLoading, refetch, isRefetching } = useCustomerRefunds(queryParams);
  const items = data?.items || [];

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: "ALL", label: isEn ? "All" : "Tất cả" },
    {
      key: RefundRequestStatusEnum.PENDING_APPROVAL,
      label: isEn ? "Pending" : "Chờ duyệt",
    },
    {
      key: RefundRequestStatusEnum.APPROVED,
      label: isEn ? "Approved" : "Đã duyệt",
    },
    {
      key: RefundRequestStatusEnum.PAID,
      label: isEn ? "Paid" : "Đã hoàn",
    },
    {
      key: RefundRequestStatusEnum.REJECTED,
      label: isEn ? "Rejected" : "Từ chối",
    },
    {
      key: RefundRequestStatusEnum.CANCELLED,
      label: isEn ? "Cancelled" : "Đã hủy",
    },
  ];

  // Calculate summary stats
  const totalSettledRefunds = items
    .filter((i) => i.status === RefundRequestStatusEnum.PAID)
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="flex-row items-center gap-1.5"
        >
          <ArrowLeft size={20} color="#0B927E" />
          <Text className="text-sm font-semibold text-brand">{isEn ? "Back" : "Quay lại"}</Text>
        </Pressable>

        <Text className="font-bold text-sm text-foreground">
          {isEn ? "Refund Requests" : "Lịch sử hoàn tiền"}
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerClassName="p-4 pb-20 space-y-4"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0B927E" />
        }
      >
        {/* Banner summary */}
        <View className="p-4 rounded-2xl bg-brand/10 border border-brand/20 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-muted-foreground font-semibold">
              {isEn ? "Total Refunded to You" : "Tổng tiền đã hoàn cho bạn"}
            </Text>
            <Text className="text-2xl font-black text-brand-dark dark:text-brand-light mt-0.5">
              {formatVnd(totalSettledRefunds)}
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-brand/20 items-center justify-center">
            <Wallet size={20} color="#0B927E" />
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row -mx-4 px-4 py-1"
        >
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setStatusFilter(tab.key)}
                className={`mr-2 px-3.5 py-1.5 rounded-full border ${
                  active ? "bg-brand border-brand" : "bg-card border-border active:bg-muted/40"
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

        {/* List of items */}
        {isLoading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#0B927E" />
            <Text className="text-xs text-muted-foreground mt-2">
              {isEn ? "Loading refund requests..." : "Đang tải danh sách hoàn tiền..."}
            </Text>
          </View>
        ) : items.length === 0 ? (
          <View className="py-16 items-center justify-center bg-card rounded-2xl border border-border p-6 text-center">
            <RotateCcw size={40} color="#94A3B8" />
            <Text className="font-bold text-foreground mt-3 text-base">
              {isEn ? "No refund requests" : "Không có yêu cầu hoàn tiền"}
            </Text>
            <Text className="text-xs text-muted-foreground mt-1 text-center leading-relaxed">
              {isEn
                ? "You do not have any refund records in this filter."
                : "Bạn chưa có khoản hoàn tiền nào thuộc bộ lọc này."}
            </Text>
          </View>
        ) : (
          <View>
            {items.map((item) => (
              <RefundCard key={item.id} refund={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
