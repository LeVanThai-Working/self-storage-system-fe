import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CircleAlert, Info, LayoutGrid, Search, ShieldAlert } from "lucide-react-native";
import {
  ContractStatusEnum,
  type MessageLocale,
  type SkuLocationsResponse,
  type TreeTier,
  type TreeTierItem,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useContractDetail } from "@/features/contracts/hooks/useContracts";
import { useStorageUnitTree } from "@/features/customer-inventory/hooks/useCustomerInventory";
import { RackMapSummaryBar } from "@/features/customer-inventory/components/RackMapSummaryBar";
import { RackCard } from "@/features/customer-inventory/components/RackCard";
import { UnrackedSection } from "@/features/customer-inventory/components/UnrackedSection";
import { TierDetailModal } from "@/features/customer-inventory/components/TierDetailModal";
import { StockInModal } from "@/features/customer-inventory/components/StockInModal";
import { StockOutModal } from "@/features/customer-inventory/components/StockOutModal";
import { StockMoveModal } from "@/features/customer-inventory/components/StockMoveModal";
import { StockAdjustModal } from "@/features/customer-inventory/components/StockAdjustModal";
import { LocateSheet } from "@/features/customer-inventory/components/LocateSheet";
import { LocateResultBanner } from "@/features/customer-inventory/components/LocateResultBanner";
import { TierHistoryModal } from "@/features/customer-inventory/components/TierHistoryModal";
import type {
  StockActionType,
  StockFormTarget,
} from "@/features/customer-inventory/types/rackMap.types";
import {
  INVENTORY_ERROR,
  resolveInventoryError,
  sortTiersTopDown,
} from "@/features/customer-inventory/utils/rackMapFormat";

/** `undefined` = detail sheet closed, `null` = floor (unracked) items. */
type DetailTarget = string | null | undefined;

/** Wait for expanded racks to lay out before scrolling to them. */
const SCROLL_AFTER_LAYOUT_MS = 350;
/** Rack card geometry used to scroll a located tier into view (see RackCard: h-14 rows). */
const RACK_BODY_OFFSET = 70;
const TIER_ROW_HEIGHT = 56;
/** Keep some of the map above the located tier visible. */
const SCROLL_CONTEXT_OFFSET = 160;

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
  const [historyTierId, setHistoryTierId] = useState<string | null>(null);
  const [collapsedRackIds, setCollapsedRackIds] = useState<Set<string>>(() => new Set());
  const [locateOpen, setLocateOpen] = useState(false);
  const [locateResult, setLocateResult] = useState<SkuLocationsResponse | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const rackOffsetsRef = useRef<Map<string, number>>(new Map());

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

  const highlightedTierIds = useMemo(() => {
    const ids = new Set<string>();
    if (!locateResult || !tree) return ids;
    locateResult.locations.forEach((location) => {
      if (location.storageUnit?.id === tree.storageUnit.id && location.rackTier) {
        ids.add(location.rackTier.id);
      }
    });
    return ids;
  }, [locateResult, tree]);

  const floorHighlighted = Boolean(
    locateResult &&
    tree &&
    locateResult.locations.some(
      (location) => location.storageUnit?.id === tree.storageUnit.id && !location.rackTier
    )
  );
  const highlightActive = highlightedTierIds.size > 0 || floorHighlighted;

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

  const toggleRack = (rackId: string) => {
    setCollapsedRackIds((prev) => {
      const next = new Set(prev);
      if (next.has(rackId)) {
        next.delete(rackId);
      } else {
        next.add(rackId);
      }
      return next;
    });
  };

  const handleLocated = (result: SkuLocationsResponse, focusTierId?: string | null) => {
    setLocateResult(result);
    setLocateOpen(false);
    if (!tree) return;

    const unitLocations = result.locations.filter(
      (location) => location.storageUnit?.id === tree.storageUnit.id
    );
    if (unitLocations.length === 0) return;

    const unitTierIds = new Set(
      unitLocations
        .map((location) => location.rackTier?.id)
        .filter((id): id is string => Boolean(id))
    );
    const targetRacks = tree.racks.filter((rack) =>
      rack.tiers.some((tier) => unitTierIds.has(tier.id))
    );

    setCollapsedRackIds((prev) => {
      const next = new Set(prev);
      targetRacks.forEach((rack) => next.delete(rack.id));
      return next;
    });

    // Tier to bring into view: the tapped one, else the top-most located tier of the first rack.
    const firstRack = targetRacks[0];
    const scrollTierId =
      focusTierId !== undefined
        ? focusTierId
        : firstRack
          ? (sortTiersTopDown(firstRack.tiers).find((tier) => unitTierIds.has(tier.id))?.id ?? null)
          : null;

    setTimeout(() => {
      if (scrollTierId === null) {
        scrollRef.current?.scrollToEnd({ animated: true });
        return;
      }
      const rack = tree.racks.find((item) => item.tiers.some((tier) => tier.id === scrollTierId));
      const rackOffset = rack ? rackOffsetsRef.current.get(rack.id) : undefined;
      if (!rack || rackOffset === undefined) return;
      const tierIndex = sortTiersTopDown(rack.tiers).findIndex((tier) => tier.id === scrollTierId);
      const y = rackOffset + RACK_BODY_OFFSET + tierIndex * TIER_ROW_HEIGHT - SCROLL_CONTEXT_OFFSET;
      scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }, SCROLL_AFTER_LAYOUT_MS);
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
    <View className="gap-1 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          className="items-center justify-center p-1 active:opacity-70"
        >
          <ArrowLeft size={22} color="#0B927E" />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100"
        >
          {t("rackMap.title")}
        </Text>
        {tree ? (
          <Pressable
            onPress={() => setLocateOpen(true)}
            className="flex-row items-center gap-1.5 rounded-full border border-brand/40 bg-white px-3 py-1.5 active:opacity-70 dark:bg-neutral-900"
          >
            <Search size={14} color="#0B927E" />
            <Text className="text-xs font-bold text-brand">{t("rackMap.locate.button")}</Text>
          </Pressable>
        ) : null}
      </View>
      {contract ? (
        <Text numberOfLines={1} variant="muted" className="pl-9 text-[11px]">
          {t("rackMap.unitSubtitle", {
            facility: contract.facility?.name ?? "",
            unit: tree?.storageUnit.unitNumber ?? contract.storageUnit?.unitNumber ?? "",
          })}
          {" · "}
          {t("rackMap.contractLabel", { code: contract.contractCode })}
        </Text>
      ) : null}
    </View>
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View className="gap-4 p-4">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
        </View>
      );
    }

    if (forbidden) {
      return (
        <View className="m-4 items-center rounded-3xl border border-red-200 bg-white p-8 dark:border-red-900 dark:bg-neutral-900">
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
        <View className="m-4 items-center rounded-3xl border border-red-200 bg-white p-8 dark:border-red-900 dark:bg-neutral-900">
          <CircleAlert size={36} color="#EF4444" />
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
        ref={scrollRef}
        contentContainerClassName={`gap-4 p-4 ${locateResult ? "pb-28" : "pb-16"}`}
        refreshControl={
          <RefreshControl
            refreshing={treeQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#0B927E"
          />
        }
      >
        {readOnly ? (
          <View className="flex-row items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50/80 p-3 dark:border-sky-900 dark:bg-sky-950/30">
            <Info size={14} color="#0284C7" />
            <Text className="flex-1 text-xs leading-4 text-sky-800 dark:text-sky-300">
              {t("rackMap.readOnlyBanner")}
            </Text>
          </View>
        ) : null}

        <RackMapSummaryBar summary={tree.summary} showTiers={hasRacks} />

        {hasRacks ? (
          tree.racks.map((rack) => (
            <RackCard
              key={rack.id}
              rack={rack}
              collapsed={collapsedRackIds.has(rack.id)}
              onToggle={() => toggleRack(rack.id)}
              highlightedTierIds={highlightedTierIds}
              highlightActive={highlightActive}
              onTierPress={handleTierPress}
              onLayout={(event) => {
                rackOffsetsRef.current.set(rack.id, event.nativeEvent.layout.y);
              }}
            />
          ))
        ) : (
          <View className="items-center rounded-3xl border border-neutral-border bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <LayoutGrid size={28} color="#647B80" />
            <Text variant="muted" className="mt-2 text-center text-xs">
              {t("rackMap.noRacks")}
            </Text>
          </View>
        )}

        <UnrackedSection
          items={tree.unrackedItems}
          highlighted={floorHighlighted}
          dimmed={highlightActive && !floorHighlighted}
          onPress={() => setDetailTarget(null)}
        />
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

      {tree && detailTarget !== undefined ? (
        <TierDetailModal
          key={String(detailTarget)}
          visible={!stockForm && !historyTierId}
          onClose={() => setDetailTarget(undefined)}
          tree={tree}
          tierId={detailTarget}
          readOnly={readOnly}
          onAction={handleAction}
          onShowHistory={
            typeof detailTarget === "string" ? () => setHistoryTierId(detailTarget) : undefined
          }
        />
      ) : null}

      {tree && historyTierId ? (
        <TierHistoryModal
          visible
          onClose={() => setHistoryTierId(null)}
          tree={tree}
          tierId={historyTierId}
        />
      ) : null}

      {formProps && stockForm?.type === "in" ? <StockInModal {...formProps} /> : null}
      {formProps && stockForm?.type === "out" ? <StockOutModal {...formProps} /> : null}
      {formProps && stockForm?.type === "move" ? <StockMoveModal {...formProps} /> : null}
      {formProps && stockForm?.type === "adjust" ? <StockAdjustModal {...formProps} /> : null}

      {tree && locateOpen ? (
        <LocateSheet
          visible
          onClose={() => setLocateOpen(false)}
          tree={tree}
          onLocated={handleLocated}
        />
      ) : null}

      {tree && locateResult ? (
        <LocateResultBanner result={locateResult} onClear={() => setLocateResult(null)} />
      ) : null}
    </SafeAreaView>
  );
}
