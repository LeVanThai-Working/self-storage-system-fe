import React, { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Info, ShieldCheck } from "lucide-react-native";
import {
  InventoryItemStatusEnum,
  type CustomerInventoryResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { useContractDetail } from "@/features/contracts/hooks/useContracts";
import { useCustomerInventoryRecords } from "@/features/customer-inventory/hooks/useCustomerInventory";
import { SkuThumb } from "@/features/customer-inventory/components/SkuThumb";
import { ItemStatusBadge } from "@/features/customer-inventory/components/ItemStatusBadge";

const GROUP_ORDER = [
  InventoryItemStatusEnum.TEMPORARY_HOLDING,
  InventoryItemStatusEnum.DAMAGED,
  InventoryItemStatusEnum.DISPUTED,
] as const;

const GROUP_BORDER: Record<(typeof GROUP_ORDER)[number], string> = {
  [InventoryItemStatusEnum.TEMPORARY_HOLDING]: "border-l-cta",
  [InventoryItemStatusEnum.DAMAGED]: "border-l-red-500",
  [InventoryItemStatusEnum.DISPUTED]: "border-l-neutral-400",
};

/** C3 — items of a contract that are in the holding area, damaged or disputed. */
export default function ContractAttentionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id: contractId = "" } = useLocalSearchParams<{ id?: string }>();
  const contractQuery = useContractDetail(contractId);
  const recordsQuery = useCustomerInventoryRecords(
    { contractId, minQuantity: 1, limit: 100 },
    Boolean(contractId)
  );

  const groups = useMemo(() => {
    const items = recordsQuery.data?.items ?? [];
    return GROUP_ORDER.map((status) => ({
      status,
      items: items.filter((item) => item.status === status),
    })).filter((group) => group.items.length > 0);
  }, [recordsQuery.data]);

  const renderItem = (item: CustomerInventoryResponse, status: (typeof GROUP_ORDER)[number]) => (
    <View
      key={item.id}
      className={cn(
        "flex-row items-center gap-3 rounded-2xl border border-l-4 border-neutral-border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900",
        GROUP_BORDER[status]
      )}
    >
      <SkuThumb imageUrl={item.sku?.imageUrl} size="sm" />
      <View className="flex-1 gap-0.5">
        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
          {item.sku?.skuCode ?? item.skuId}
        </Text>
        <Text variant="muted" className="text-[11px]">
          {item.sku?.name} · {item.quantity} {item.sku?.uom ?? ""}
        </Text>
        {item.storageRack ? (
          <Text variant="muted" className="text-[10px]">
            {t("rackMap.attention.from", {
              rack: item.storageRack.rackCode,
              tier: item.rackTier?.tierNumber ?? "-",
            })}
          </Text>
        ) : null}
        {item.holdingReason ? (
          <Text numberOfLines={2} className="text-[10px] text-neutral-600 dark:text-neutral-300">
            {item.holdingReason}
          </Text>
        ) : null}
      </View>
      <ItemStatusBadge status={item.status} />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="gap-0.5 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
            <ArrowLeft size={22} color="#0B927E" />
          </Pressable>
          <Text className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
            {t("rackMap.attention.title")}
          </Text>
        </View>
        {contractQuery.data ? (
          <Text variant="muted" className="pl-9 text-[11px]">
            {t("inventoryRequest.unitContract", {
              unit: contractQuery.data.storageUnit?.unitNumber ?? "",
              code: contractQuery.data.contractCode,
            })}
          </Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-32"
        refreshControl={
          <RefreshControl
            refreshing={recordsQuery.isRefetching}
            onRefresh={() => void recordsQuery.refetch()}
            tintColor="#0B927E"
          />
        }
      >
        {recordsQuery.isLoading ? (
          <Skeleton className="h-40 w-full rounded-3xl" />
        ) : groups.length === 0 ? (
          <View className="items-center rounded-3xl border border-neutral-border bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
            <ShieldCheck size={30} color="#0B927E" />
            <Text variant="muted" className="mt-2 text-center text-xs">
              {t("rackMap.attention.empty")}
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.status} className="gap-2">
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {t(`rackMap.attention.group.${group.status}`, { count: group.items.length })}
              </Text>
              {group.items.map((item) => renderItem(item, group.status))}
            </View>
          ))
        )}

        <View className="flex-row items-start gap-2 rounded-2xl border border-brand/20 bg-brand-bg p-3 dark:bg-brand/10">
          <Info size={16} color="#0B927E" />
          <Text className="flex-1 text-[11px] leading-4 text-neutral-700 dark:text-neutral-200">
            {t("rackMap.attention.hint")}
          </Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={() => router.push({ pathname: "/support-tickets/new", params: { contractId } })}
          className="items-center rounded-xl bg-cta py-3 active:opacity-80"
        >
          <Text className="text-sm font-bold text-white">{t("rackMap.attention.contact")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
