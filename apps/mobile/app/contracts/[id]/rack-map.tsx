import React, { useCallback, useMemo, useState } from "react";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, ArrowLeft, Info, LayoutGrid, ShieldAlert } from "lucide-react-native";
import {
  ContractStatusEnum,
  type MessageLocale,
  type TreeTier,
  type TreeTierItem,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useContractDetail } from "@/features/contracts/hooks/useContracts";
import { useStorageUnitTree } from "@/features/customer-inventory/hooks/useCustomerInventory";
import { RackMapSummaryBar } from "@/features/customer-inventory/components/RackMapSummaryBar";
import { RackStatusLegend } from "@/features/customer-inventory/components/RackStatusLegend";
import { RackCard } from "@/features/customer-inventory/components/RackCard";
import { UnrackedSection } from "@/features/customer-inventory/components/UnrackedSection";
import { TierDetailModal } from "@/features/customer-inventory/components/TierDetailModal";
import { StockInModal } from "@/features/customer-inventory/components/StockInModal";
import { StockOutModal } from "@/features/customer-inventory/components/StockOutModal";
import { StockMoveModal } from "@/features/customer-inventory/components/StockMoveModal";
import { StockAdjustModal } from "@/features/customer-inventory/components/StockAdjustModal";
import type {
  StockActionType,
  StockFormTarget,
} from "@/features/customer-inventory/types/rackMap.types";
import {
  INVENTORY_ERROR,
  resolveInventoryError,
} from "@/features/customer-inventory/utils/rackMapFormat";

/** `undefined` = detail sheet closed, `null` = floor (unracked) items. */
type DetailTarget = string | null | undefined;

export default function ContractRackMapScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";

  const params = useLocalSearchParams<{ id?: string }>();
  const contractId = params.id ?? "";

  const contractQuery = useContractDetail(contractId);
  const contract = contractQuery.data;
  const storageUnitId = contract?.storageUnitId;
  const treeQuery = useStorageUnitTree(storageUnitId);
  const tree = treeQuery.data;

  const [forcedReadOnly, setForcedReadOnly] = useState(false);
  const [detailTarget, setDetailTarget] = useState<DetailTarget>(undefined);
  const [stockForm, setStockForm] = useState<StockFormTarget | null>(null);

  const readOnly = forcedReadOnly || contract?.status !== ContractStatusEnum.ACTIVE;
  const { refetch: refetchContract } = contractQuery;
  const { refetch: refetchTree } = treeQuery;

  useFocusEffect(
    useCallback(() => {
      if (contractId) {
        refetchContract();
      }
    }, [contractId, refetchContract])
  );

  const treeError = useMemo(
    () => (treeQuery.error ? resolveInventoryError(treeQuery.error, currentLocale) : null),
    [treeQuery.error, currentLocale]
  );
  const contractError = useMemo(
    () => (contractQuery.error ? resolveInventoryError(contractQuery.error, currentLocale) : null),
    [contractQuery.error, currentLocale]
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (contractId) {
      router.replace({ pathname: "/contracts/[id]" as any, params: { id: contractId } });
    } else {
      router.replace("/(tabs)/my-storages" as any);
    }
  };

  const handleRefresh = () => {
    refetchContract();
    if (storageUnitId) refetchTree();
  };

  const handleApiError = (messageCode?: string) => {
    if (messageCode === INVENTORY_ERROR.CONTRACT_NOT_ACTIVE) {
      setForcedReadOnly(true);
    }
    if (
      messageCode === INVENTORY_ERROR.TIER_LOCKED ||
      messageCode === INVENTORY_ERROR.TIER_NOT_IN_UNIT ||
      messageCode === INVENTORY_ERROR.CONTRACT_NOT_ACTIVE
    ) {
      refetchTree();
    }
  };

  const handleTierPress = (tier: TreeTier) => setDetailTarget(tier.id);

  const handleAction = (type: StockActionType, item?: TreeTierItem) => {
    if (detailTarget === undefined) return;
    setStockForm({ type, tierId: detailTarget, item });
  };

  const closeStockForm = () => setStockForm(null);

  const isLoading = contractQuery.isLoading || (Boolean(storageUnitId) && treeQuery.isLoading);
  const forbidden = treeError?.messageCode === INVENTORY_ERROR.FORBIDDEN;
  const loadError = contractError ?? treeError;

  const renderHeader = () => (
    <View className="flex-row items-center gap-3 border-b border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3">
      <Pressable
        onPress={handleBack}
        hitSlop={10}
        className="items-center justify-center p-1 active:opacity-70"
      >
        <ArrowLeft size={20} color="#0B927E" />
      </Pressable>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="text-base font-bold text-neutral-dark dark:text-neutral-100"
        >
          {t("rackMap.title")}
        </Text>
        {contract ? (
          <Text numberOfLines={1} variant="muted" className="text-[11px]">
            {t("rackMap.unitSubtitle", {
              facility: contract.facility?.name ?? "",
              unit: tree?.storageUnit.unitNumber ?? contract.storageUnit?.unitNumber ?? "",
            })}
            {" · "}
            {t("rackMap.contractLabel", { code: contract.contractCode })}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View className="p-4 gap-4">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </View>
      );
    }

    if (forbidden) {
      return (
        <View className="m-4 items-center rounded-3xl border border-red-200 dark:border-red-900 bg-white dark:bg-neutral-900 p-8">
          <ShieldAlert size={36} color="#EF4444" />
          <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {t("rackMap.forbidden")}
          </Text>
          <Pressable onPress={handleBack} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
            <Text className="text-xs font-bold text-white">{t("common.back")}</Text>
          </Pressable>
        </View>
      );
    }

    if (loadError || !tree) {
      return (
        <View className="m-4 items-center rounded-3xl border border-red-200 dark:border-red-900 bg-white dark:bg-neutral-900 p-8">
          <AlertCircle size={36} color="#EF4444" />
          <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {t("rackMap.loadError")}
          </Text>
          {loadError?.message ? (
            <Text variant="muted" className="mt-1 text-center text-xs">
              {loadError.message}
            </Text>
          ) : null}
          <Pressable onPress={handleRefresh} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
            <Text className="text-xs font-bold text-white">{t("rackMap.retry")}</Text>
          </Pressable>
        </View>
      );
    }

    const hasRacks = tree.racks.length > 0;

    return (
      <ScrollView
        contentContainerClassName="p-4 pb-16 gap-4"
        refreshControl={
          <RefreshControl
            refreshing={treeQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#0B927E"
          />
        }
      >
        {readOnly ? (
          <View className="flex-row items-start gap-2 rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/80 dark:bg-sky-950/30 p-3">
            <Info size={14} color="#0284C7" />
            <Text className="flex-1 text-xs leading-4 text-sky-800 dark:text-sky-300">
              {t("rackMap.readOnlyBanner")}
            </Text>
          </View>
        ) : null}

        <RackMapSummaryBar summary={tree.summary} showTiers={hasRacks} />

        {hasRacks ? (
          <>
            <RackStatusLegend />
            {tree.racks.map((rack) => (
              <RackCard
                key={rack.id}
                rack={rack}
                unitNumber={tree.storageUnit.unitNumber}
                onTierPress={handleTierPress}
              />
            ))}
          </>
        ) : (
          <View className="items-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
            <LayoutGrid size={28} color="#647B80" />
            <Text variant="muted" className="mt-2 text-center text-xs">
              {t("rackMap.noRacks")}
            </Text>
          </View>
        )}

        <UnrackedSection items={tree.unrackedItems} onPress={() => setDetailTarget(null)} />
      </ScrollView>
    );
  };

  const formProps =
    tree && stockForm && storageUnitId
      ? {
          visible: true,
          onClose: closeStockForm,
          contractId,
          storageUnitId,
          tree,
          target: stockForm,
          onApiError: handleApiError,
        }
      : null;

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {renderHeader()}
      {renderBody()}

      {tree ? (
        <TierDetailModal
          visible={detailTarget !== undefined && !stockForm}
          onClose={() => setDetailTarget(undefined)}
          tree={tree}
          tierId={detailTarget ?? null}
          readOnly={readOnly}
          onAction={handleAction}
        />
      ) : null}

      {formProps && stockForm?.type === "in" ? <StockInModal {...formProps} /> : null}
      {formProps && stockForm?.type === "out" ? <StockOutModal {...formProps} /> : null}
      {formProps && stockForm?.type === "move" ? <StockMoveModal {...formProps} /> : null}
      {formProps && stockForm?.type === "adjust" ? <StockAdjustModal {...formProps} /> : null}
    </SafeAreaView>
  );
}
