import React from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Boxes, ShieldAlert } from "lucide-react-native";
import type { ContractResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";

export interface SelfStorageGuardViewProps {
  contract: ContractResponse;
  title: string;
  reason?: "rack_not_supported" | "inventory_not_supported";
}

export function SelfStorageGuardView({
  contract,
  title,
  reason = "inventory_not_supported",
}: SelfStorageGuardViewProps) {
  const router = useRouter();

  const unitCode = contract.storageUnit?.unitNumber ?? "";
  const contractCode = contract.contractCode;

  const description =
    reason === "rack_not_supported"
      ? `Phòng kho tự quản không hỗ trợ bố trí hệ thống kệ tầng. Hợp đồng #${contractCode}${
          unitCode ? ` (Phòng ${unitCode})` : ""
        } thuộc gói thuê nguyên phòng, quý khách toàn quyền sử dụng bằng mã PIN mở cửa.`
      : `Kho tự quản không áp dụng tính năng quản lý hàng hóa và danh mục SKU. Hợp đồng #${contractCode}${
          unitCode ? ` (Phòng ${unitCode})` : ""
        } thuộc gói thuê nguyên phòng, quý khách toàn quyền sử dụng bằng mã PIN mở cửa.`;

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="items-center justify-center p-1 active:opacity-70"
        >
          <ArrowLeft size={22} color="#0B927E" />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100"
        >
          {title}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center p-6">
        <View className="w-full max-w-sm rounded-3xl border border-neutral-border bg-white p-6 items-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-brand-light/50 dark:bg-brand/20">
            <Boxes size={32} color="#0B927E" />
          </View>
          <Text className="text-center text-base font-extrabold text-neutral-dark dark:text-neutral-100">
            Kho lưu trữ tự quản
          </Text>
          <Text className="mt-2 text-center text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            {description}
          </Text>

          <View className="mt-6 w-full gap-2.5">
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/incidents/new",
                  params: { contractId: contract.id },
                })
              }
              className="w-full flex-row items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50/80 px-4 py-3 active:opacity-80 dark:border-rose-900 dark:bg-rose-950/40"
            >
              <ShieldAlert size={16} color="#E11D48" />
              <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Báo cáo sự cố phòng kho
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.replace({ pathname: "/contracts/[id]", params: { id: contract.id } })
              }
              className="w-full flex-row items-center justify-center gap-1.5 rounded-xl border border-neutral-border bg-neutral-50 px-4 py-3 active:opacity-80 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                Quay lại chi tiết hợp đồng
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
